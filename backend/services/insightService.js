const Transaction = require('../models/Transaction');
const { GoogleGenAI } = require('@google/genai');

const generateRuleBasedInsights = (transactions) => {
    const insights = [];

    // Get current month and previous month transactions
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const categorySpending = {}; // { 'Food': 1500, ... }
    let totalCurrentMonthExpense = 0;
    let totalPrevMonthExpense = 0;

    transactions.forEach(t => {
        const txDate = new Date(t.date);
        const m = txDate.getMonth();
        const y = txDate.getFullYear();
        
        if (t.type === 'expense') {
            if (m === currentMonth && y === currentYear) {
                totalCurrentMonthExpense += Number(t.amount);
                
                if (!categorySpending[t.category_name]) categorySpending[t.category_name] = 0;
                categorySpending[t.category_name] += Number(t.amount);
            } else if ((m === currentMonth - 1 && y === currentYear) || (currentMonth === 0 && m === 11 && y === currentYear - 1)) {
                totalPrevMonthExpense += Number(t.amount);
            }
        }
    });

    // 1. Detect overspending vs last month
    if (totalPrevMonthExpense > 0 && totalCurrentMonthExpense > totalPrevMonthExpense * 1.2) {
        insights.push({
            type: 'warning',
            message: `Your spending this month is 20% higher than last month.`
        });
    }

    // 2. Category-wise spending analysis & Recommendation
    let topCategory = null;
    let topAmount = 0;
    
    for (const [cat, amt] of Object.entries(categorySpending)) {
        if (amt > topAmount) {
            topAmount = amt;
            topCategory = cat;
        }
    }
    
    if (topCategory && totalCurrentMonthExpense > 0) {
        const percentage = ((topAmount / totalCurrentMonthExpense) * 100).toFixed(0);
        insights.push({
            type: 'info',
            message: `You spent ${percentage}% of your expenses on ${topCategory} this month.`
        });
        
        if (percentage > 40) {
            insights.push({
                type: 'recommendation',
                message: `Consider reducing your ${topCategory} spending to save more next month.`
            });
        }
    }

    // 3. Prediction
    if (totalCurrentMonthExpense > 0) {
        const predicted = ((totalCurrentMonthExpense + totalPrevMonthExpense) / 2).toFixed(2);
        if (predicted > 0) {
            insights.push({
                type: 'prediction',
                message: `Based on your habits, you are likely to spend around ${predicted} next month.`
            });
        }
    }

    if (insights.length === 0) {
        insights.push({ type: 'success', message: 'Your finances are looking stable this month!' });
    }

    return insights;
};

exports.generateRuleBasedInsights = async (userId) => {
    try {
        const transactions = await Transaction.findByUserId(userId);
        if (!transactions || transactions.length === 0) {
            return [{ type: 'info', message: 'Not enough data to generate insights. Add more transactions!' }];
        }

        if (process.env.GEMINI_API_KEY) {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                
                // Prepare a simplified summary of transactions for the LLM
                // We only want the last 30-60 days to keep the prompt small
                const recentTransactions = transactions.slice(0, 50).map(t => ({
                    date: t.date.split('T')[0],
                    type: t.type,
                    amount: t.amount,
                    category: t.category_name
                }));

                const prompt = `
You are a friendly personal finance AI assistant. Analyze the user's recent transactions and provide exactly 3 concise insights (e.g. overspending, positive reinforcement, prediction, or category breakdown).
Rules:
1. Return ONLY a valid JSON array of objects. Do not include markdown codeblocks (like \`\`\`json) or any other text.
2. Each object must have exactly two keys: "type" and "message".
3. "type" must be one of: "info", "warning", "success", "prediction", "recommendation".
4. "message" must be a short string (under 100 characters).
Transactions: ${JSON.stringify(recentTransactions)}
                `;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt
                });
                
                const responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
                if (responseText) {
                    let cleanJson = responseText.trim();
                    if (cleanJson.startsWith('\`\`\`json')) {
                        cleanJson = cleanJson.replace(/^\`\`\`json/m, '').replace(/\`\`\`$/m, '').trim();
                    }
                    const llmInsights = JSON.parse(cleanJson);
                    if (Array.isArray(llmInsights) && llmInsights.length > 0) {
                        return llmInsights;
                    }
                }
            } catch (llmError) {
                console.error("Gemini API Error, falling back to rules:", llmError);
            }
        }

        // Fallback to rules if API fails or no key
        return generateRuleBasedInsights(transactions);

    } catch (error) {
        console.error('Error generating insights:', error);
        return [{ type: 'error', message: 'Failed to generate insights.' }];
    }
};
