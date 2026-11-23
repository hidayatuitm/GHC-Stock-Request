# Go Hub Capital Stock Request Management System

Assignment demo — staff website built with HTML, CSS, JavaScript (Vite), Vercel API, and Supabase.

## Features
- Search and filter 8 sample spare parts (live from Supabase after deployment).
- Request one spare part per submission; status recorded as Pending.
- No admin dashboard or full user login.
- Stock numbers represent example data. A request does NOT deduct stock.

## Project structure
- `index.html`, `src/main.js`, `src/style.css`: website frontend.
- `api/_db.js`, `api/items.js`, `api/requests.js`: server API for Vercel.
- `package.json`: Vite build and Supabase client dependency.

## Develop online
Import the public repository with `https://stackblitz.com/github/hidayatuitm/GHC-Stock-Request`. Run `npm install`, then `npm run dev`. Preview uses local demo items and does not save requests.

## Deploy
Import the GitHub repo into Vercel with Framework Preset `Vite`, build `npm run build`, output `dist`. Under project settings -> Environment Variables, set **Production** values:
- `SUPABASE_URL`: base project URL only, `https://project-ref.supabase.co` (no `/rest/v1/`)
- `SUPABASE_SECRET_KEY`: Supabase secret key; never expose in frontend or GitHub
- `STAFF_ACCESS_CODE`: choose a long demo code; share privately with testers only

Deploy/redeploy, then test `/api/items`, the Request form, and the Supabase `stock_request` table.

## Demo-only security notice
No identity authentication, rate limiting, or service report file uploads are included. The access code is only a basic demo gate, not production security. GET `/api/items` returns inventory list publicly. Do not use real staff personal data or operate this as a real business system without authentication, authorization, abuse prevention, appropriate privacy controls, and database policies. Keep Row Level Security enabled and do not grant anonymous clients table access.
