# Local Hosting Guide - Sasto Marketplace

Follow these steps to host the Sasto Marketplace project on your local machine using the terminal.

## Prerequisites
- **Node.js**: Ensure you have Node.js installed (v18 or higher recommended).
- **pnpm**: This project uses `pnpm`. If you don't have it, install it via npm:
  ```bash
  npm install -g pnpm
  ```

## 1. Project Setup
Open your terminal (PowerShell, Command Prompt, or Git Bash) and navigate to the project folder:
```powershell
cd "c:\Users\Dell\OneDrive\Desktop\Agentic Code\sasto_marketplace_latest"
```

## 2. Install Dependencies
Run the following command to install all necessary packages:
```powershell
pnpm install
```

## 3. Environment Configuration
Check if the `.env` file exists in the root directory. It should contain the following (already configured for local development):
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=mysql://root:password@localhost:3306/sasto_marketplace
# Note: The project is currently configured to use local SQLite (sqlite.db) 
# by default in server/db.ts, so MySQL is not strictly required for local dev.
```

## 4. Database Setup (Optional/If Resetting)
If you need to initialize or reset the database with sample data, run:
```powershell
# To push schema changes to the database
pnpm db:push

# To seed the database with initial sample listings and categories
node seed-sample-data.mjs
```

## 5. Start the Development Server
Run the following command to start both the backend and frontend:
```powershell
pnpm dev
```
Once you see `Server running on http://localhost:3000/`, the project is live!

## 6. Access the Application
Open your web browser and go to:
**[http://localhost:3000/](http://localhost:3000/)**

---

## Troubleshooting
- **Port Conflict**: If port 3000 is in use, the server will automatically try 3001, 3002, etc. Check the terminal output for the exact URL.
- **Node Errors**: Ensure you are in the correct directory where `package.json` is located.
- **SQLite Error**: If you see database errors, ensure `sqlite.db` is not being used by another process.
