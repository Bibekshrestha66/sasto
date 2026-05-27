# Sasto Marketplace

Full-stack marketplace application with a separated frontend and backend:

- `frontend/` - React, Vite, Tailwind, tRPC client
- `backend/` - Express, tRPC API, WebSocket server, Drizzle database access
- `drizzle/` - database schema and migrations
- `shared/` - types/constants shared by frontend and backend
- `scripts/` - seeds, maintenance scripts, one-off utilities
- `docs/` - architecture, setup, deployment, and cleanup documentation

---

## 🚀 Key Feature Updates & Migrations

Recently, we rolled out several major production updates:

### 1. ⚡ Cloudflare R2 Storage Migration (S3 API)
* **Replaced Cloudinary with Cloudflare R2** for fast, high-performance, cost-effective image storage with **zero egress bandwidth fees**.
* Powered by standard S3 APIs via `@aws-sdk/client-s3`.
* Randomized cryptographic image key names to prevent filename collisions.
* Supported by customized **Content Security Policy (CSP)** settings to allow loading images securely from `*.r2.cloudflarestorage.com` and `*.r2.dev`.

### 2. 📊 Real-Time Stats (About & Help Pages)
* **Live Database Dashboard Counts**: Replaced static placeholders (`1M+`, `500K+`, `50K+`) with real-time platform statistics queried directly from the Postgres database.
* Exposes **Registered Users**, **Active Listings**, and **Total Transactions** dynamically.

### 3. 🔍 Real-Time Production Lists
* Updated the core **Auction** and **Rental** pages to display active database items instead of mock fallbacks.
* Integrated custom empty states when no listings match the query vs. when the database itself is empty.

---

## 🛠️ Required Environment Variables (R2 Setup)

Add the following credentials to your `.env` configuration:

```ini
# Cloudflare R2 storage credentials
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_r2_bucket_name
R2_PUBLIC_CUSTOM_DOMAIN=https://your-custom-or-r2-subdomain.r2.dev
```

---

## 💻 Local Development

Use **pnpm**. Do not use `npm` or `yarn` for this project.

```bash
pnpm install
pnpm exec drizzle-kit push
pnpm dev
```

Open:
```text
http://localhost:3000/
```

### Running frontend separately

If you prefer to run the frontend dev server separately from the backend, set the backend origin so the frontend can reach the tRPC API. Create a `.env` in the `frontend/` folder or set the env var and start the dev server:

```bash
# backend runs on port 3000
export VITE_APP_URL=http://localhost:3000
cd frontend
pnpm install
pnpm dev
```

Or simply run the backend dev server which serves both frontend and API together:

```bash
pnpm dev
```

## Common Commands

```bash
pnpm run check
pnpm run build
pnpm test
```

## Main Documentation

Start here:

- [Project documentation and cleanup plan](docs/PROJECT_DOCUMENTATION_AND_CLEANUP_PLAN.md)
- [Local hosting guide](docs/LOCAL_HOSTING_GUIDE.md)
- [Setup guide](docs/SETUP_GUIDE.md)
- [Deployment guide](docs/DEPLOYMENT_GUIDE.md)
