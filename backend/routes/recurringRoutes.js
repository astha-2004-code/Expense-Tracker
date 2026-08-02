const express = require('express');
const { getRecurringTransactions, createRecurringTransaction, toggleActive, deleteRecurringTransaction } = require('../controllers/recurringController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getRecurringTransactions)
    .post(createRecurringTransaction);

router.route('/:id')
    .patch(toggleActive)
    .delete(deleteRecurringTransaction);

module.exports = router;
