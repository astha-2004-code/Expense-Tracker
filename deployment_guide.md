# Full-Stack Expense Tracker Deployment Guide

This guide will walk you through deploying the Expense Tracker to production using **Aiven** for the MySQL Database, **Render** for the Node.js backend, and **Vercel** for the React frontend.

## Step 1: Database Setup on Aiven

1. Log in to your [Aiven Console](https://console.aiven.io/).
2. Click **Create Service** and select **MySQL**.
3. Choose your preferred cloud provider and region, then select a service plan (e.g., Hobbyist).
4. Give your service a name and click **Create Service**.
5. Once the service is running, navigate to its **Overview** page to find your connection details:
   - **Host**
   - **Port**
   - **User**
   - **Password**
   - **Database Name** (default is usually `defaultdb`)
6. Open your local terminal or a MySQL client (like MySQL Workbench, DBeaver, or Aiven's integrated CLI) and execute the `backend/database/init.sql` script to create the necessary tables in your Aiven database.
   - Example using CLI: `mysql -h <host> -P <port> -u <user> -p <database_name> < backend/database/init.sql`

---

## Step 2: Backend Deployment on Render

1. Create a free account or log in to [Render](https://render.com/).
2. Go to the Dashboard and click **New +** > **Web Service**.
3. Connect your GitHub/GitLab repository containing the Expense Tracker project.
4. Fill in the following details for your web service:
   - **Name:** e.g., `expense-tracker-backend`
   - **Language:** `Node`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Node Version:** Render uses Node 20 by default (recommended).
5. Scroll down to the **Environment Variables** section and click **Add Environment Variable**. Add the following keys and values:

   | Key | Value (Example) |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `DB_HOST` | *(from Aiven)* |
   | `DB_PORT` | *(from Aiven, usually 25060)* |
   | `DB_USER` | *(from Aiven)* |
   | `DB_PASSWORD` | *(from Aiven)* |
   | `DB_NAME` | *(from Aiven, usually defaultdb)* |
   | `JWT_SECRET` | *(a strong, random secret string)* |
   | `JWT_EXPIRES_IN` | `24h` |
   | `FRONTEND_URL` | *(leave blank for now, will update in Step 4)* |
   
   *(Note: You do not need to specify `PORT`. Render assigns it automatically and the backend is configured to use `process.env.PORT`)*

6. Click **Create Web Service**. Wait for the build and deployment to finish. 
7. Once deployed, Render will provide a URL (e.g., `https://expense-tracker-backend-xxxxx.onrender.com`). Copy this URL.

---

## Step 3: Frontend Deployment on Vercel

1. Create a free account or log in to [Vercel](https://vercel.com/).
2. Click **Add New** > **Project**.
3. Import the same GitHub/GitLab repository.
4. In the **Configure Project** section:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click "Edit" and select `frontend`.
5. Expand the **Environment Variables** section and add the following:

   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | *(The Render Backend URL copied from Step 2, without a trailing slash)* |

6. Click **Deploy**. Wait for Vercel to build and deploy your frontend.
7. Once finished, Vercel will give you a domain (e.g., `https://expense-tracker-frontend.vercel.app`). Copy this URL.

---

## Step 4: Finalize Configuration

1. Go back to your **Render Dashboard**.
2. Select your `expense-tracker-backend` web service.
3. Go to **Environment** settings.
4. Find the `FRONTEND_URL` variable you left blank earlier and update it with your **Vercel Domain** (e.g., `https://expense-tracker-frontend.vercel.app`).
5. Click **Save Changes**. Render will automatically redeploy the backend with the new environment variable.

## Step 5: Verification

1. Open your Vercel frontend URL in a browser.
2. Attempt to register a new user.
3. Log in with the newly created credentials.
4. Try adding and deleting a transaction.
5. If everything works smoothly, your deployment is successful!

## Notes

- **Cookies in Production:** The backend is configured to use `sameSite: 'none'` and `secure: true` cookies when `NODE_ENV=production`. This is essential because the frontend (Vercel) and backend (Render) are hosted on different domains.
- **SSL Configuration:** The application automatically enables SSL for the database connection (using `rejectUnauthorized: false`), which is required by Aiven.
