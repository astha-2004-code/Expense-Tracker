const express = require('express');
const { getGoals, createGoal, updateSavedAmount, updateGoal, deleteGoal } = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All goal routes require authentication

router.route('/')
    .get(getGoals)
    .post(createGoal);

router.route('/:id')
    .put(updateGoal)
    .patch(updateSavedAmount)
    .delete(deleteGoal);

module.exports = router;
