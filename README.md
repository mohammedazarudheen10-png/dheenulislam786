# dheenulislam786 — Vue + Node.js + PostgreSQL

Designed for Render Free:
- Vue 3 + Vite
- Node.js + Express
- PostgreSQL
- One admin
- Name + email submissions
- Free `onrender.com` URL
- HTTPS provided by Render

Important: Render Free Postgres currently expires after 30 days. After expiry there is a 14-day grace period to upgrade before the database/data are deleted. The free Node service can spin down after 15 minutes of inactivity and may take about a minute to wake.

## Local
Requirements: Node.js 20+, PostgreSQL.

Backend:
cd backend
npm install
copy .env.example .env
npm run dev

Frontend:
cd frontend
npm install
npm run dev

## Render
Create:
1. Free PostgreSQL database
2. Free Node Web Service

Environment variables for backend:
DATABASE_URL=<Render internal database URL>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<strong password>
SESSION_SECRET=<long random secret>
FRONTEND_URL=<frontend URL>

For one-service deployment, build Vue and serve it from Express. This project includes that setup in the root package.json and server/static configuration.

Run:
npm install
npm run build
npm start

The server listens on PORT.
