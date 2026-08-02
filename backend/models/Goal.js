const db = require('../config/db');

class Goal {
    static async create(userId, goalName, targetAmount, deadline, description) {
        const [result] = await db.query(
            'INSERT INTO savings_goals (user_id, goal_name, target_amount, deadline, description) VALUES (?, ?, ?, ?, ?)',
            [userId, goalName, targetAmount, deadline || null, description || '']
        );
        return result.insertId;
    }

    static async findByUserId(userId) {
        const [rows] = await db.query('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        return rows;
    }

    static async updateSavedAmount(id, userId, savedAmount) {
        const [result] = await db.query(
            'UPDATE savings_goals SET saved_amount = ? WHERE id = ? AND user_id = ?',
            [savedAmount, id, userId]
        );
        return result.affectedRows;
    }

    static async delete(id, userId) {
        const [result] = await db.query('DELETE FROM savings_goals WHERE id = ? AND user_id = ?', [id, userId]);
        return result.affectedRows;
    }

    static async update(id, userId, goalName, targetAmount, deadline, description) {
        const [result] = await db.query(
            'UPDATE savings_goals SET goal_name = ?, target_amount = ?, deadline = ?, description = ? WHERE id = ? AND user_id = ?',
            [goalName, targetAmount, deadline || null, description || '', id, userId]
        );
        return result.affectedRows;
    }
}

module.exports = Goal;
