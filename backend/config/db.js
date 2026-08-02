const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
console.log("=== MySQL Connection Debug ===");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("==============================");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 25060,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
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
        console.log('Connected to MySQL');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database:');
        console.error(err);
    });

module.exports = promisePool;
