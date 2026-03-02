# Backend (Node.js + Express + Postgres)

Play-money API for the Music Prediction Exchange.

## Features in this scaffold
- JWT auth (`POST /auth/register`, `POST /auth/login`, `GET /auth/me`)
- Markets read endpoints (`GET /markets`, `GET /markets/:id`)
- LMSR-based trading (`POST /markets/:id/trade`) with transactional negative-balance prevention
- Portfolio + transaction history (`GET /me/portfolio`, `GET /me/transactions`)
- Leaderboard (`GET /leaderboard`)
- Admin API key protected endpoints:
  - `POST /admin/markets`
  - `POST /admin/markets/:id/settle`
- SQL migrations for users, wallets, markets, trades, positions, ledger, settlements, admin_actions

## Setup
1. Copy env file:
   - `cp env.example .env` (or PowerShell: `Copy-Item env.example .env`)
2. Update `.env` values (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_API_KEY`).
3. Install dependencies:
   - `npm install`
4. Run migrations:
   - `npm run migrate`
5. Start dev server:
   - `npm run dev`

Default server URL: `http://localhost:4000`

## Scripts
- `npm run dev` - Run server with nodemon
- `npm run test` - Run unit tests (includes LMSR tests)
- `npm run lint` - Lint JavaScript files
- `npm run migrate` - Apply SQL migrations

## API Notes
- Register grants `10,000` starting credits by default (`DEFAULT_STARTING_CREDITS`).
- Trading payload:
  ```json
  {
    "side": "YES",
    "shares": 25
  }
  ```
- Admin routes require `ADMIN_API_KEY` header.

## Settlement behavior
- `YES` / `NO`: winning positions are paid `1 credit` per winning share.
- `CANCELLED`: users are refunded total `cost_credits` spent in that market.

## Development assumptions
- Numeric values use Postgres `NUMERIC` and are converted to JS numbers in responses.
- This scaffold is intentionally minimal and should be extended with stricter validation, rate limiting, and comprehensive integration tests before production use.
