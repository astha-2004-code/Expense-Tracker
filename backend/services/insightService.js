const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');
const RecurringTransaction = require('../models/RecurringTransaction');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

    return {
        summary: "Standard Rule-Based Summary",
        overspending: insights.find(i => i.type === 'warning')?.message || "No overspending detected.",
        tips: insights.filter(i => i.type === 'recommendation' || i.type === 'info').map(i => i.message),
        prediction: insights.find(i => i.type === 'prediction')?.message || "Insufficient data for next month's prediction.",
        riskLevel: insights.some(i => i.type === 'warning') ? "High" : "Low"
    };
};

exports.generateRuleBasedInsights = async (userId) => {
    try {
        const transactions = await Transaction.findAllByUser(userId);
        if (!transactions || transactions.length === 0) {
            return {
                summary: "Not enough data to generate insights. Add more transactions!",
                overspending: "None",
                tips: ["Start logging your daily expenses to get AI-powered insights."],
                prediction: "N/A",
                riskLevel: "Low"
            };
        }

        if (process.env.GEMINI_API_KEY) {
            try {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                
                // Prepare additional context
                const goals = await Goal.findByUserId(userId) || [];
                const recurring = await RecurringTransaction.findByUserId(userId) || [];

                const recentTransactions = transactions.slice(0, 50).map(t => ({
                    date: t.date ? new Date(t.date).toISOString().split('T')[0] : 'Unknown',
                    type: t.type,
                    amount: t.amount,
                    category: t.category_name
                }));

                const activeGoals = goals.map(g => ({
                    name: g.goal_name,
                    target: g.target_amount,
                    saved: g.saved_amount
                }));

                const activeRecurring = recurring.map(r => ({
                    type: r.type,
                    amount: r.amount,
                    frequency: r.frequency
                }));

                const prompt = `
You are a friendly personal finance AI assistant. Analyze the user's finances and provide insights.
Rules:
1. Return ONLY a valid JSON object. Do not include markdown codeblocks (like \`\`\`json).
2. The JSON object must strictly match this format:
{
  "summary": "A 1-2 sentence overview of their financial health.",
  "overspending": "Note any concerning spending trends, or say 'No overspending detected'.",
  "tips": ["Tip 1", "Tip 2"],
  "prediction": "Estimate next month's spending based on their habits and recurring bills.",
  "riskLevel": "Low", "Medium", or "High"
}

Data:
Transactions: ${JSON.stringify(recentTransactions)}
Savings Goals: ${JSON.stringify(activeGoals)}
Recurring Bills: ${JSON.stringify(activeRecurring)}
                `;

                const result = await model.generateContent(prompt);
                const responseText = result.response.text();
                
                if (responseText) {
                    let cleanJson = responseText.trim();
                    if (cleanJson.startsWith('```json')) {
                        cleanJson = cleanJson.replace(/^\`\`\`json/m, '').replace(/\`\`\`$/m, '').trim();
                    } else if (cleanJson.startsWith('```')) {
                        cleanJson = cleanJson.replace(/^\`\`\`/m, '').replace(/\`\`\`$/m, '').trim();
                    }
                    const llmInsights = JSON.parse(cleanJson);
                    if (llmInsights && llmInsights.summary) {
                        return llmInsights;
                    }
                }
            } catch (llmError) {
                console.error("Gemini API Error details:", llmError);
                
                let errorMessage = "Gemini service unavailable";
                if (llmError.status === 400 || (llmError.message && llmError.message.includes("API key not valid"))) {
                    errorMessage = "Invalid Gemini API key";
                } else if (llmError.status === 429 || (llmError.message && llmError.message.includes("quota"))) {
                    errorMessage = "API quota exceeded";
                } else if (llmError.status === 404 || (llmError.message && llmError.message.includes("not found"))) {
                    errorMessage = "Model not found";
                } else if (llmError.message && llmError.message.includes("fetch")) {
                    errorMessage = "Network timeout or connection issue";
                }
                
                // Fallback to rules if API fails, but inform user
                const fallbackInsights = generateRuleBasedInsights(transactions);
                fallbackInsights.error = errorMessage; // Add error to root of JSON
                return fallbackInsights;
            }
        }

        // Fallback to rules if no API key is provided
        return generateRuleBasedInsights(transactions);

    } catch (error) {
        console.error('Error generating insights:', error.message, error.stack);
        return { 
            error: "Failed to generate insights.",
            summary: "Error loading insights.",
            overspending: "N/A",
            tips: [],
            prediction: "N/A",
            riskLevel: "Unknown"
        };
    }
};
