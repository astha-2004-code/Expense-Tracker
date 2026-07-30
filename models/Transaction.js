const db = require('../config/db');

class Transaction {
    static async create(userId, categoryId, type, amount, description, date) {
        const [result] = await db.query(
            'INSERT INTO transactions (user_id, category_id, type, amount, description, date) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, categoryId, type, amount, description, date]
        );
        return result.insertId;
    }

    static async findAllByUser(userId, filters = {}) {
        let query = `
            SELECT t.*, c.name as category_name, c.icon as category_icon 
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ?
        `;
        let params = [userId];

        if (filters.type) {
            query += ` AND t.type = ?`;
            params.push(filters.type);
        }
        if (filters.categoryId) {
            query += ` AND t.category_id = ?`;
            params.push(filters.categoryId);
        }
        if (filters.month && filters.year) {
            query += ` AND MONTH(t.date) = ? AND YEAR(t.date) = ?`;
            params.push(filters.month, filters.year);
        } else if (filters.year) {
            query += ` AND YEAR(t.date) = ?`;
            params.push(filters.year);
        }
        if (filters.search) {
            query += ` AND t.description LIKE ?`;
            params.push(`%${filters.search}%`);
        }

        // Sorting
        if (filters.sortBy) {
            switch (filters.sortBy) {
                case 'oldest':
                    query += ` ORDER BY t.date ASC, t.id ASC`;
                    break;
                case 'highest':
                    query += ` ORDER BY t.amount DESC`;
                    break;
                case 'lowest':
                    query += ` ORDER BY t.amount ASC`;
                    break;
                case 'latest':
                default:
                    query += ` ORDER BY t.date DESC, t.id DESC`;
                    break;
            }
        } else {
            query += ` ORDER BY t.date DESC, t.id DESC`;
        }

        // Pagination
        if (filters.limit && filters.offset !== undefined) {
            query += ` LIMIT ? OFFSET ?`;
            params.push(Number(filters.limit), Number(filters.offset));
        }

        const [rows] = await db.query(query, params);
        return rows;
    }

    static async countByUser(userId, filters = {}) {
        let query = `SELECT COUNT(*) as total FROM transactions WHERE user_id = ?`;
        let params = [userId];

        if (filters.type) {
            query += ` AND type = ?`;
            params.push(filters.type);
        }
        if (filters.categoryId) {
            query += ` AND category_id = ?`;
            params.push(filters.categoryId);
        }
        if (filters.month && filters.year) {
            query += ` AND MONTH(date) = ? AND YEAR(date) = ?`;
            params.push(filters.month, filters.year);
        } else if (filters.year) {
            query += ` AND YEAR(date) = ?`;
            params.push(filters.year);
        }
        if (filters.search) {
            query += ` AND description LIKE ?`;
            params.push(`%${filters.search}%`);
        }

        const [rows] = await db.query(query, params);
        return rows[0].total;
    }

    static async findById(id, userId) {
        const [rows] = await db.query(
            'SELECT t.*, c.name as category_name FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.id = ? AND t.user_id = ?',
            [id, userId]
        );
        return rows[0];
    }

    static async update(id, userId, updates) {
        const { categoryId, type, amount, description, date } = updates;
        const [result] = await db.query(
            'UPDATE transactions SET category_id = ?, type = ?, amount = ?, description = ?, date = ? WHERE id = ? AND user_id = ?',
            [categoryId, type, amount, description, date, id, userId]
        );
        return result.affectedRows;
    }

    static async delete(id, userId) {
        const [result] = await db.query('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, userId]);
        return result.affectedRows;
    }

    static async getSummary(userId, month, year) {
        let query = `
            SELECT type, SUM(amount) as total 
            FROM transactions 
            WHERE user_id = ?
        `;
        let params = [userId];
        
        if (month && year) {
            query += ` AND MONTH(date) = ? AND YEAR(date) = ?`;
            params.push(month, year);
        }

        query += ` GROUP BY type`;
        
        const [rows] = await db.query(query, params);
        
        let income = 0;
        let expense = 0;
        rows.forEach(row => {
            if (row.type === 'income') income = parseFloat(row.total);
            if (row.type === 'expense') expense = parseFloat(row.total);
        });
        
        return { income, expense, balance: income - expense };
    }

    static async getCategoryBreakdown(userId, type, month, year) {
        let query = `
            SELECT c.name as category_name, SUM(t.amount) as total 
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ? AND t.type = ?
        `;
        let params = [userId, type];

        if (month && year) {
            query += ` AND MONTH(t.date) = ? AND YEAR(t.date) = ?`;
            params.push(month, year);
        }

        query += ` GROUP BY t.category_id ORDER BY total DESC`;
        
        const [rows] = await db.query(query, params);
        return rows;
    }
}

module.exports = Transaction;
