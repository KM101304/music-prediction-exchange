# Product Requirements Document (PRD)

## Product
Music Prediction Exchange (MVP)

## Goal
Create a play-money web app where users make predictions on music-related YES/NO markets, see portfolio performance, and participate in a transparent, manually settled market system.

## Non-Goals (MVP)
- No real-money deposits.
- No withdrawals of any kind.
- No crypto wallets or blockchain integrations.
- No automated oracle settlement.
- No advanced trading instruments (options, leverage, shorts).

## Principles
- Use neutral language: "prediction", "market", "position", "settlement", "points".
- Keep rules explicit and visible before users join a market.
- Prioritize integrity: only admins can settle outcomes.

## Core User Stories
1. As a user, I can register/login and receive a starting virtual points balance.
2. As a user, I can browse open YES/NO music markets with clear close/settle timelines.
3. As a user, I can take a YES or NO position and spend virtual points.
4. As a user, I can view my open positions, settled results, and points balance history.
5. As an admin, I can create markets and manually settle outcomes (YES/NO/CANCELLED).
6. As an admin, I can audit user activity and settlement logs.

## MVP Scope

### 1) Authentication & Accounts
- Email + password signup/login.
- JWT-based auth for API access.
- Basic profile (display name, email).
- User starts with fixed play-money points balance (e.g., 10,000 points).

### 2) Markets (YES/NO)
- Market fields:
  - `title`
  - `description`
  - `category` (e.g., Charts, Awards, Releases)
  - `resolution_criteria` (explicit settlement rule text)
  - `close_at` (no new positions after this time)
  - `settle_by` (target latest settlement date)
  - `status` (`OPEN`, `CLOSED`, `SETTLED`)
- Only admins can create/edit/close/settle markets.
- Users can view all markets; only open markets accept new positions.

### 3) Position Placement
- Users choose YES or NO and stake points.
- Validation:
  - User must have enough available points.
  - Market must be `OPEN` and before `close_at`.
  - Stake must be positive and within configured limits.
- MVP pricing model:
  - Fixed price per share (simple model) OR fixed payout multiplier.
  - Keep deterministic and transparent; avoid complex order book in MVP.
- Record immutable position transactions.

### 4) Settlement (Admin Manual)
- Admin sets final outcome: `YES`, `NO`, or `CANCELLED`.
- On settlement:
  - Winning side gets payout per defined MVP formula.
  - Losing side receives 0 on that market.
  - `CANCELLED` returns original staked points.
- Settlement creates ledger entries for auditability.

### 5) Portfolio & Activity
- Dashboard shows:
  - Current points balance.
  - Open positions.
  - Settled positions with P/L in points.
  - Transaction ledger (credits/debits/settlements).

### 6) Admin Console
- Admin authentication/authorization.
- Create/edit markets.
- Close market early.
- Settle market with outcome + optional notes/source link.
- View settlement history and affected accounts.

## Functional Requirements
1. System shall require authentication for all account-specific actions.
2. System shall enforce role-based access (`USER`, `ADMIN`) for admin endpoints.
3. System shall prevent position placement after `close_at`.
4. System shall maintain an append-only ledger for all balance changes.
5. System shall compute balances from ledger-safe operations (no silent overwrites).
6. System shall support manual market settlement by admins only.
7. System shall expose REST APIs consumed by Next.js frontend.

## Suggested Data Model (Postgres)
- `users` (id, email, password_hash, display_name, role, created_at)
- `accounts` (id, user_id, points_balance, created_at)
- `markets` (id, title, description, category, resolution_criteria, close_at, settle_by, status, outcome, created_by, settled_by, settled_at)
- `positions` (id, user_id, market_id, side, stake_points, pricing_snapshot, created_at)
- `ledger_entries` (id, user_id, market_id nullable, type, amount_points, direction, reference_id, metadata_json, created_at)
- `settlements` (id, market_id, outcome, notes, source_url, created_by, created_at)

## API Surface (MVP)
- Auth:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/me`
- Markets:
  - `GET /markets`
  - `GET /markets/:id`
  - `POST /markets` (admin)
  - `PATCH /markets/:id` (admin)
  - `POST /markets/:id/close` (admin)
  - `POST /markets/:id/settle` (admin)
- Positions:
  - `POST /markets/:id/positions`
  - `GET /me/positions`
- Portfolio/Ledger:
  - `GET /me/portfolio`
  - `GET /me/ledger`

## UX Requirements (Next.js + Tailwind)
- Public pages: landing, login, register.
- Authenticated pages: markets list, market detail, portfolio, activity.
- Admin pages: market creation/editing, settlement queue/history.
- Clear labels for "Play Money Points" on all value displays.

## Security & Compliance Requirements (MVP)
- Password hashing with bcrypt/argon2.
- JWT expiry + refresh strategy or short-lived access token pattern.
- Input validation on all API payloads.
- Rate limiting on auth endpoints.
- Audit logs for admin market and settlement actions.
- Prominent disclaimer: platform uses play money only; no cash value.

## Out of Scope for MVP
- Secondary market order matching.
- Real-time websockets.
- Social features/comments.
- Mobile native app.
- External identity/KYC.

## Success Criteria
- Users can register, receive points, and place YES/NO positions.
- Admin can settle markets manually with correct payouts/refunds.
- Portfolio and ledger reflect all actions accurately.
- No path exists for real-money movement, withdrawals, or wallet linkage.

## Tech Stack
- Frontend: Next.js + Tailwind CSS
- Backend: Node.js + Express
- Database: Postgres
- Auth: JWT