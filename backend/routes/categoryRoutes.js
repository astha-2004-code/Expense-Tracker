const express = require('express');
const { getCategories } = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getCategories);

module.exports = router;
