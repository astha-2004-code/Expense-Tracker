const { generateRuleBasedInsights } = require('../services/insightService');

exports.getInsights = async (req, res, next) => {
    try {
        const insights = await generateRuleBasedInsights(req.user.id);
        res.status(200).json({ success: true, data: insights });
    } catch (err) {
        next(err);
    }
};

exports.testGemini = async (req, res, next) => {
    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
        const result = await model.generateContent("Say hello in one sentence.");
        res.status(200).json({ success: true, text: result.response.text() });
    } catch (err) {
        console.error("Test Gemini Error:", err);
        res.status(500).json({ success: false, error: err.message, status: err.status });
    }
};
