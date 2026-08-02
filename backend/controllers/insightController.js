const { generateRuleBasedInsights } = require('../services/insightService');

exports.getInsights = async (req, res, next) => {
    try {
        const insights = await generateRuleBasedInsights(req.user.id);
        res.status(200).json({ success: true, data: insights });
    } catch (err) {
        next(err);
    }
};
