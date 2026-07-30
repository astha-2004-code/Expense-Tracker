const db = require('../config/db');

class Category {
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM categories');
        return rows;
    }

    static async findByType(type) {
        const [rows] = await db.query('SELECT * FROM categories WHERE type = ?', [type]);
        return rows;
    }
}

module.exports = Category;
