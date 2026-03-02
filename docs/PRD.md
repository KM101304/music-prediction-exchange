# Product Requirements Document (PRD)

## Product
Music Prediction Exchange (MVP)

## Summary
A play-money platform where users trade YES/NO shares on whether a song will reach a defined stream milestone by a settlement date.

## Product Constraints
- No real money deposits
- No withdrawals
- No crypto wallets
- No betting or gambling wording in product copy

## Core UX
- View open music markets
- Buy YES/NO shares using credits
- Track portfolio and transaction ledger
- Admin creates and manually settles markets

## Rules
- New users receive 10,000 credits.
- Trading is allowed only while a market is `OPEN` and before `close_at`.
- Settlement outcomes: `YES`, `NO`, `CANCELLED`.
- `CANCELLED` returns spent credits for that market.

## Architecture
- Frontend: Next.js + Tailwind + Recharts
- Backend: Node + Express
- Data: Postgres
- Auth: JWT

## Data Model
- `users`
- `wallets`
- `markets`
- `trades`
- `positions`
- `ledger`
- `settlements`
- `admin_actions`
- `audit_logs`

## API MVP
- `POST /auth/register`
- `POST /auth/login`
- `GET /markets`
- `GET /markets/:id`
- `POST /markets/:id/trade`
- `GET /me/portfolio`
- `GET /me/transactions`
- `GET /leaderboard`
- `POST /admin/markets` (`ADMIN_API_KEY`)
- `POST /admin/markets/:id/settle` (`ADMIN_API_KEY`)

## Market Maker
- LMSR binary pricing
- Provide quote and execute calculations
- Keep prices bounded away from 0/1
- Validate with unit tests

## Security
- Password hashing with bcrypt
- JWT verification for protected user routes
- API key protection for admin routes
- Append-only ledger for all balance mutations
- Audit logs for request history

## Success Criteria
- Users can sign up, receive credits, and trade on markets.
- Settlement updates balances correctly in transactions.
- No path allows cash movement or withdrawal.
- Seed data provides demo admin and 5 demo markets.
