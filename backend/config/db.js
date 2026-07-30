const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true,
    ssl: {
        rejectUnauthorized: true
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
        console.log('Successfully connected to TiDB Cloud.');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database:', err.message);
    });

module.exports = promisePool;
