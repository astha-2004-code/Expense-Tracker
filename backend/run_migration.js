require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./config/db');

async function run() {
    try {
        const sqlPath = path.join(__dirname, 'database', 'migration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await db.query(sql);
        console.log('Migration executed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

run();
