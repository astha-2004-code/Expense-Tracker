const db = require('../config/db');

class User {
    static async create(name, email, hashedPassword) {
        const [result] = await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );
        return result.insertId;
    }

    static async findByEmail(email) {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT id, name, email, monthly_budget, created_at FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    static async updateBudget(id, budget) {
        const [result] = await db.query('UPDATE users SET monthly_budget = ? WHERE id = ?', [budget, id]);
        return result.affectedRows;
    }
    
    static async updatePassword(id, hashedPassword) {
        const [result] = await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
        return result.affectedRows;
    }
}

module.exports = User;
