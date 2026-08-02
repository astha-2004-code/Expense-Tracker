const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const setTokenCookie = (res, token) => {
    const options = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        httpOnly: true,
    };
    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
        options.sameSite = 'none';
    }
    res.cookie('token', token, options);
};

exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
        }

        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const userId = await User.create(name, email, hashedPassword);
        
        // Generate Token
        const token = generateToken(userId);
        setTokenCookie(res, token);

        res.status(201).json({
            success: true,
            token,
            user: { id: userId, name, email }
        });
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(user.id);
        setTokenCookie(res, token);

        res.status(200).json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, monthly_budget: user.monthly_budget, preferred_currency: user.preferred_currency }
        });
    } catch (err) {
        next(err);
    }
};

exports.logout = (req, res) => {
    const options = {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
        options.sameSite = 'none';
    }
    res.cookie('token', 'none', options);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

exports.updateBudget = async (req, res, next) => {
    try {
        const { budget } = req.body;
        await User.updateBudget(req.user.id, budget);
        res.status(200).json({ success: true, message: 'Budget updated successfully' });
    } catch (err) {
        next(err);
    }
};

exports.updateCurrency = async (req, res, next) => {
    try {
        const { preferred_currency } = req.body;
        await User.updateCurrency(req.user.id, preferred_currency);
        res.status(200).json({ success: true, message: 'Currency updated successfully' });
    } catch (err) {
        next(err);
    }
};

exports.updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
             return res.status(400).json({ success: false, message: 'Please provide current and new password' });
        }

        const user = await User.findByEmail((await User.findById(req.user.id)).email);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await User.updatePassword(req.user.id, hashedPassword);

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        next(err);
    }
};
