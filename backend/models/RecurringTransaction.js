const db = require('../config/db');

class RecurringTransaction {
    static async create(userId, categoryId, type, amount, description, frequency, nextExecution) {
        const [result] = await db.query(
            `INSERT INTO recurring_transactions 
            (user_id, category_id, type, amount, description, frequency, next_execution) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, categoryId, type, amount, description, frequency, nextExecution]
        );
        return result.insertId;
    }

    static async findByUserId(userId) {
        const [rows] = await db.query(
            `SELECT r.*, c.name as category_name, c.icon as category_icon 
            FROM recurring_transactions r 
            JOIN categories c ON r.category_id = c.id 
            WHERE r.user_id = ? ORDER BY r.next_execution ASC`,
            [userId]
        );
        return rows;
    }
    
    static async getDueTransactions() {
        // Find all active transactions where next_execution is today or in the past
        const [rows] = await db.query(
            `SELECT * FROM recurring_transactions 
            WHERE is_active = TRUE AND next_execution <= CURRENT_DATE`
        );
        return rows;
    }

    static async updateNextExecution(id, nextExecution) {
        const [result] = await db.query(
            `UPDATE recurring_transactions 
            SET last_execution = CURRENT_DATE, next_execution = ? 
            WHERE id = ?`,
            [nextExecution, id]
        );
        return result.affectedRows;
    }

    static async toggleActive(id, userId, isActive) {
        const [result] = await db.query(
            'UPDATE recurring_transactions SET is_active = ? WHERE id = ? AND user_id = ?',
            [isActive, id, userId]
        );
        return result.affectedRows;
    }

    static async delete(id, userId) {
        const [result] = await db.query('DELETE FROM recurring_transactions WHERE id = ? AND user_id = ?', [id, userId]);
        return result.affectedRows;
    }

    static async update(id, userId, categoryId, type, amount, description, frequency, nextExecution) {
        const [result] = await db.query(
            `UPDATE recurring_transactions 
            SET category_id = ?, type = ?, amount = ?, description = ?, frequency = ?, next_execution = ?
            WHERE id = ? AND user_id = ?`,
            [categoryId, type, amount, description, frequency, nextExecution, id, userId]
        );
        return result.affectedRows;
    }
}

module.exports = RecurringTransaction;
