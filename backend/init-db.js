const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDb() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });

        const sqlPath = path.join(__dirname, 'database', 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await connection.query(sql);
        console.log('Database initialized successfully.');
        await connection.end();
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

initDb();
