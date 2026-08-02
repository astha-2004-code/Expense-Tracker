const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true,
    ssl: {
        rejectUnauthorized: false
    }
});

const promisePool = pool.promise();

// Initialize Database Function
promisePool.initializeDatabase = async () => {
    try {
        const sqlPath = path.join(__dirname, '..', 'database', 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await promisePool.query(sql);
        console.log('Database tables verified/initialized successfully.');
    } catch (err) {
        console.error('Error initializing database tables:', err.message);
    }
};

// Test the connection
promisePool.getConnection()
    .then(connection => {
        console.log('Successfully connected to the Database.');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database:', err.message);
    });

module.exports = promisePool;
