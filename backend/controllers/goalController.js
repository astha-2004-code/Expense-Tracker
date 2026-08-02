const Goal = require('../models/Goal');

exports.getGoals = async (req, res, next) => {
    try {
        const goals = await Goal.findByUserId(req.user.id);
        res.status(200).json({ success: true, data: goals });
    } catch (err) {
        next(err);
    }
};

exports.createGoal = async (req, res, next) => {
    try {
        const { goal_name, target_amount, deadline, description } = req.body;
        if (!goal_name || !target_amount) {
            return res.status(400).json({ success: false, message: 'Please provide goal name and target amount' });
        }
        
        const goalId = await Goal.create(req.user.id, goal_name, target_amount, deadline, description);
        res.status(201).json({ success: true, data: { id: goalId, goal_name, target_amount, deadline, description, saved_amount: 0 } });
    } catch (err) {
        next(err);
    }
};

exports.updateSavedAmount = async (req, res, next) => {
    try {
        const { saved_amount } = req.body;
        if (saved_amount === undefined) {
            return res.status(400).json({ success: false, message: 'Please provide saved amount' });
        }
        
        const affectedRows = await Goal.updateSavedAmount(req.params.id, req.user.id, saved_amount);
        if (affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Goal not found or unauthorized' });
        }
        
        res.status(200).json({ success: true, message: 'Goal updated successfully' });
    } catch (err) {
        next(err);
    }
};

exports.updateGoal = async (req, res, next) => {
    try {
        const { goal_name, target_amount, deadline, description } = req.body;
        if (!goal_name || !target_amount) {
            return res.status(400).json({ success: false, message: 'Please provide goal name and target amount' });
        }
        
        const affectedRows = await Goal.update(
            req.params.id, req.user.id, goal_name, target_amount, deadline, description
        );
        
        if (affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Goal not found or unauthorized' });
        }
        
        res.status(200).json({ success: true, message: 'Goal updated successfully' });
    } catch (err) {
        next(err);
    }
};

exports.deleteGoal = async (req, res, next) => {
    try {
        const affectedRows = await Goal.delete(req.params.id, req.user.id);
        if (affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Goal not found or unauthorized' });
        }
        
        res.status(200).json({ success: true, message: 'Goal deleted successfully' });
    } catch (err) {
        next(err);
    }
};
