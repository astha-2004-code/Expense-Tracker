const express = require('express');
const { register, login, logout, getProfile, updateBudget, updatePassword, updateCurrency } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);

router.get('/profile', protect, getProfile);
router.put('/budget', protect, updateBudget);
router.put('/currency', protect, updateCurrency);
router.put('/password', protect, updatePassword);

module.exports = router;
