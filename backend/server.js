require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

console.log("Gemini Key Loaded:", !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY) {
    console.log("Gemini Key starts with:", process.env.GEMINI_API_KEY.substring(0, 10));
}

if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ Warning: Missing GEMINI_API_KEY. AI insights will fall back to standard rules. Server will continue starting.");
}

console.log("[Startup] Step 1: Environment Variables Checked.");

const app = express();
const PORT = process.env.PORT || 3000;

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`[Incoming Request] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No Origin'}`);
    next();
});

// Middleware
const allowedOrigins = [
    process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null, // Remove trailing slash if present
    'https://expense-tracker-five-alpha-75.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            console.error(`[CORS Blocked] Origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Explicitly handle OPTIONS requests for preflight
// (Removed app.options('*', cors()) as it crashes on newer Express versions with path-to-regexp error)

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Import Routes
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const insightRoutes = require('./routes/insightRoutes');
const goalRoutes = require('./routes/goalRoutes');
const recurringRoutes = require('./routes/recurringRoutes');
const { startScheduler } = require('./services/scheduler');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/recurring', recurringRoutes);

// Error Handling Middleware
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'API route not found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

const db = require('./config/db');

// Start Server
const startServer = async () => {
    try {
        console.log("[Startup] Step 2: Initializing Database...");
        await db.initializeDatabase();
        console.log("[Startup] Step 2: Database Initialized.");
        
        console.log("[Startup] Step 3: Starting Scheduler...");
        startScheduler();
        console.log("[Startup] Step 3: Scheduler Started.");
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`[Startup] Step 4: Server Successfully Running on port ${PORT}`);
        });
    } catch (error) {
        console.error("[Startup Error] FATAL ERROR during server initialization:");
        console.error(error.stack || error);
        process.exit(1);
    }
};

startServer();
