const express = require('express');
const { getTransactions, getTransaction, addTransaction, updateTransaction, deleteTransaction, getAnalytics } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All transaction routes require authentication

router.route('/')
    .get(getTransactions)
    .post(addTransaction);

router.get('/analytics', getAnalytics);

router.route('/:id')
    .get(getTransaction)
    .put(updateTransaction)
    .delete(deleteTransaction);

module.exports = router;
