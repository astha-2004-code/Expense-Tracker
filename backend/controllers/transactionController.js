const Transaction = require('../models/Transaction');

exports.getTransactions = async (req, res, next) => {
    try {
        const filters = {
            type: req.query.type,
            categoryId: req.query.categoryId,
            month: req.query.month,
            year: req.query.year,
            search: req.query.search,
            sortBy: req.query.sortBy,
            limit: req.query.limit || 50,
            offset: req.query.offset || 0
        };

        const transactions = await Transaction.findAllByUser(req.user.id, filters);
        const total = await Transaction.countByUser(req.user.id, filters);

        res.status(200).json({ success: true, count: transactions.length, total, data: transactions });
    } catch (err) {
        next(err);
    }
};

exports.getTransaction = async (req, res, next) => {
    try {
        const transaction = await Transaction.findById(req.params.id, req.user.id);
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        res.status(200).json({ success: true, data: transaction });
    } catch (err) {
        next(err);
    }
};

exports.addTransaction = async (req, res, next) => {
    try {
        const { categoryId, type, amount, description, date } = req.body;
        
        if (!categoryId || !type || !amount || !date) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const id = await Transaction.create(req.user.id, categoryId, type, amount, description, date);
        const newTransaction = await Transaction.findById(id, req.user.id);

        res.status(201).json({ success: true, data: newTransaction });
    } catch (err) {
        next(err);
    }
};

exports.updateTransaction = async (req, res, next) => {
    try {
        const transaction = await Transaction.findById(req.params.id, req.user.id);
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        await Transaction.update(req.params.id, req.user.id, req.body);
        const updatedTransaction = await Transaction.findById(req.params.id, req.user.id);

        res.status(200).json({ success: true, data: updatedTransaction });
    } catch (err) {
        next(err);
    }
};

exports.deleteTransaction = async (req, res, next) => {
    try {
        const transaction = await Transaction.findById(req.params.id, req.user.id);
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        await Transaction.delete(req.params.id, req.user.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

exports.getAnalytics = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        
        const summary = await Transaction.getSummary(req.user.id, month, year);
        const expenseBreakdown = await Transaction.getCategoryBreakdown(req.user.id, 'expense', month, year);
        const incomeBreakdown = await Transaction.getCategoryBreakdown(req.user.id, 'income', month, year);

        res.status(200).json({
            success: true,
            data: {
                summary,
                expenseBreakdown,
                incomeBreakdown
            }
        });
    } catch (err) {
        next(err);
    }
};
