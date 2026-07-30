# Full-Stack Expense Tracker (React + Node.js)

A modern, responsive, full-stack Expense Tracker application. The project is decoupled into a React frontend and a Node.js/Express backend.

## Technology Stack

- **Backend:** Node.js, Express.js, MySQL (in `backend/` folder)
- **Frontend:** React, Vite, Chart.js (in `frontend/` folder)

## Getting Started

### 1. Database Setup

1. Ensure your MySQL server is running.
2. Run the provided SQL script to create the database schema:
   ```bash
   mysql -u your_user -p < backend/database/init.sql
   ```

### 2. Backend Setup

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Configure Environment Variables:
   Open `backend/.env` and ensure your database credentials are correct.
3. Install dependencies and start the server:
   ```bash
   npm install
   npm start
   ```
   The backend will run on `http://localhost:3000`.

### 3. Frontend Setup

1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```
3. Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).

## Features

- **User Authentication:** Secure JWT-based login and registration.
- **Dashboard:** Comprehensive overview with total income, expenses, and balance.
- **Charts:** Visual representation of income vs expenses and category breakdowns.
- **Transactions Management:** Add, edit, and delete transactions.
- **Filtering & Sorting:** Filter by type, category, date, and search by description.
- **Budgeting:** Set a monthly budget and receive warnings.
- **Export:** Download transaction history as a CSV file.
