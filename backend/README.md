# Backend API

Production-oriented MVP backend for a play-money Music Prediction Exchange.

## Stack
- Node.js + Express
- Postgres
- JWT auth
- LMSR binary market maker

## Features
- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- Markets: `GET /markets`, `GET /markets/:id`, `POST /markets/:id/trade`
- User: `GET /me/portfolio`, `GET /me/transactions`
- Public ranking: `GET /leaderboard`
- Public analytics: `GET /stats/public`
- Admin key routes:
  - `POST /admin/markets`
  - `POST /admin/markets/:id/settle`
  - `POST /admin/ingest/spotify`
- Full ledger tracking for all credit changes
- Audit log table for request traces
- Seed script with demo admin + 5 markets
- Spotify data ingestion for source snapshots (`market_data_points`)

## Schema
Migrations create:
- `users`
- `wallets`
- `markets`
- `trades`
- `positions`
- `ledger`
- `settlements`
- `admin_actions`
- `audit_logs`
- `market_data_points`

## Local setup
1. Copy env file:
   - PowerShell: `Copy-Item env.example .env`
2. Edit `.env` values (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_API_KEY`).
3. Optional for Spotify ingestion:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
4. Install packages:
   - `npm install`
5. Run migrations:
   - `npm run migrate`
6. Seed demo data:
   - `npm run seed`
7. Start dev server:
   - `npm run dev`

Backend default URL: `http://localhost:4000`

## Scripts
- `npm run dev` - Start with nodemon
- `npm run start` - Start without watcher
- `npm run test` - Node test runner (LMSR unit tests)
- `npm run lint` - ESLint
- `npm run migrate` - Run SQL migrations
- `npm run seed` - Insert demo admin and 5 open markets
- `npm run ingest:spotify` - Pull Spotify snapshots for eligible markets

## Trading model
- LMSR for binary YES/NO outcomes.
- `quoteBinaryTrade` computes deterministic cost and post-trade probabilities.
- `executeBinaryTrade` returns quote plus average execution price.
- Probabilities are clamped by epsilon bounds to avoid exact `0` and `1`.

## Settlement rules
- `YES` or `NO`: each winning share pays `1` credit.
- `CANCELLED`: users receive refunds equal to summed trade costs in that market.
- All settlement writes happen in one DB transaction.

## Spotify ingestion notes
- Source type `SPOTIFY_TRACK_POPULARITY` stores track popularity snapshots from Spotify Web API.
- Spotify Web API does not expose track stream counts directly. Popularity is a proxy metric (0-100), not canonical streams.
- Add `spotifyTrackId` when creating a market to enable automated snapshots.

## Deployment notes (Render/Railway)
- Use managed Postgres and set `DATABASE_URL`.
- Set `JWT_SECRET` and `ADMIN_API_KEY` as secure env vars.
- Build/start command:
  - Build: `npm install`
  - Start: `npm run start`
- Run `npm run migrate` before first release and on schema changes.
- Run `npm run seed` in non-production environments only.
