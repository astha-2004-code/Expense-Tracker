# Full-Stack Expense Tracker

A modern, responsive, full-stack Expense Tracker application built with Node.js, Express.js, MySQL, and Vanilla JavaScript/CSS.

## Features

- **User Authentication:** Secure JWT-based login and registration with bcrypt password hashing.
- **Dashboard:** Comprehensive overview with total income, expenses, and balance.
- **Charts:** Visual representation of income vs expenses and category breakdowns using Chart.js.
- **Transactions Management:** Add, edit, and delete income and expense transactions.
- **Filtering & Sorting:** Filter transactions by type, category, date, and search by description. Sort by amount and date.
- **Budgeting:** Set a monthly budget and receive warnings when expenses exceed it.
- **Export:** Download transaction history as a CSV file.
- **Modern UI:** Clean, responsive design with dark/light mode toggle.

## Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** MySQL, `mysql2` driver
- **Frontend:** HTML5, Vanilla CSS (Custom Design System), Vanilla JS
- **Security:** `bcrypt`, `jsonwebtoken`
- **Libraries:** Chart.js, Font Awesome, Google Fonts (Inter)

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- MySQL Server

### Installation

1. **Clone the repository or unzip the project folder.**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Database Setup:**
   - Ensure your MySQL server is running.
   - Run the provided SQL script to create the database schema and default categories:
     ```bash
     mysql -u your_user -p < database/init.sql
     ```
   - Alternatively, you can copy the contents of `database/init.sql` and run it in your preferred MySQL client (e.g., MySQL Workbench, phpMyAdmin).

4. **Environment Variables:**
   - Open the `.env` file in the root directory.
   - Update the database credentials to match your local setup:
     ```env
     PORT=3000
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=your_mysql_password
     DB_NAME=expense_tracker
     JWT_SECRET=your_super_secret_jwt_key
     JWT_EXPIRES_IN=24h
     ```

5. **Start the Application:**
   ```bash
   npm start
   ```
   Or for development mode (if you install nodemon):
   ```bash
   npx nodemon server.js
   ```

6. **Access the App:**
   - Open your browser and navigate to `http://localhost:3000`.

## Project Structure

- `/config` - Database connection configuration
- `/controllers` - Request handlers for auth, categories, and transactions
- `/database` - SQL initialization script
- `/middleware` - Custom middleware (JWT auth protection)
- `/models` - Database query abstractions (User, Category, Transaction)
- `/public` - Static assets (CSS styles, Vanilla JS logic, images)
- `/routes` - Express API routes definition
- `/views` - HTML templates served by Express
- `server.js` - Application entry point

## License
MIT
