const RecurringTransaction = require('../models/RecurringTransaction');

exports.getRecurringTransactions = async (req, res, next) => {
    try {
        const transactions = await RecurringTransaction.findByUserId(req.user.id);
        res.status(200).json({ success: true, data: transactions });
    } catch (err) {
        next(err);
    }
};

exports.createRecurringTransaction = async (req, res, next) => {
    try {
        const { category_id, type, amount, description, frequency, next_execution } = req.body;
        
        if (!category_id || !type || !amount || !frequency || !next_execution) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }
        
        const rtId = await RecurringTransaction.create(
            req.user.id, category_id, type, amount, description, frequency, next_execution
        );
        
        res.status(201).json({ success: true, data: { id: rtId, category_id, type, amount, description, frequency, next_execution } });
    } catch (err) {
        next(err);
    }
};

exports.toggleActive = async (req, res, next) => {
    try {
        const { is_active } = req.body;
        
        if (is_active === undefined) {
            return res.status(400).json({ success: false, message: 'Please provide is_active status' });
        }
        
        const affectedRows = await RecurringTransaction.toggleActive(req.params.id, req.user.id, is_active);
        
        if (affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Recurring transaction not found or unauthorized' });
        }
        
        res.status(200).json({ success: true, message: 'Status updated successfully' });
    } catch (err) {
        next(err);
    }
};

exports.deleteRecurringTransaction = async (req, res, next) => {
    try {
        const affectedRows = await RecurringTransaction.delete(req.params.id, req.user.id);
        
        if (affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Recurring transaction not found or unauthorized' });
        }
        
        res.status(200).json({ success: true, message: 'Recurring transaction deleted successfully' });
    } catch (err) {
        next(err);
    }
};

exports.updateRecurringTransaction = async (req, res, next) => {
    try {
        const { category_id, type, amount, description, frequency, next_execution } = req.body;
        
        if (!category_id || !type || !amount || !frequency || !next_execution) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }
        
        const affectedRows = await RecurringTransaction.update(
            req.params.id, req.user.id, category_id, type, amount, description, frequency, next_execution
        );
        
        if (affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Recurring transaction not found or unauthorized' });
        }
        
        res.status(200).json({ success: true, message: 'Recurring transaction updated successfully' });
    } catch (err) {
        next(err);
    }
};
