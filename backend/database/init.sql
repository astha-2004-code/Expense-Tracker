CREATE DATABASE IF NOT EXISTS expense_tracker;
USE expense_tracker;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    monthly_budget DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    icon VARCHAR(50) DEFAULT 'fas fa-tag'
);

-- Insert Default Categories if they don't exist
INSERT IGNORE INTO categories (id, name, type, icon) VALUES
(1, 'Salary', 'income', 'fas fa-money-bill-wave'),
(2, 'Freelance', 'income', 'fas fa-laptop-code'),
(3, 'Investments', 'income', 'fas fa-chart-line'),
(4, 'Other Income', 'income', 'fas fa-coins'),
(5, 'Food', 'expense', 'fas fa-utensils'),
(6, 'Transport', 'expense', 'fas fa-car'),
(7, 'Shopping', 'expense', 'fas fa-shopping-bag'),
(8, 'Bills', 'expense', 'fas fa-file-invoice-dollar'),
(9, 'Entertainment', 'expense', 'fas fa-film'),
(10, 'Healthcare', 'expense', 'fas fa-notes-medical'),
(11, 'Education', 'expense', 'fas fa-graduation-cap'),
(12, 'Others', 'expense', 'fas fa-ellipsis-h');

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255) DEFAULT '',
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_user_date (user_id, date)
);
