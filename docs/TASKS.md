# TASKS

1. Repository + environment
   - Create `backend/`, `frontend/`, `docs/` structure.
   - Add `.env` templates for backend and frontend.

2. Database schema and migrations
   - Add migrations for `users`, `wallets`, `markets`, `trades`, `positions`, `ledger`, `settlements`, `admin_actions`, `audit_logs`.
   - Add migration runner and verify fresh DB bootstraps cleanly.

3. Backend foundation
   - Configure Express app with security headers, CORS, JSON parsing, and global error handling.
   - Add Postgres pool + graceful shutdown.

4. Authentication and credits bootstrap
   - Implement `POST /auth/register` and `POST /auth/login` with JWT.
   - Grant 10,000 signup credits and ledger entry atomically.

5. LMSR trading engine
   - Implement binary quote and execute functions.
   - Add epsilon bounds so probabilities never equal exactly 0 or 1.
   - Write and run unit tests.

6. Market and trade APIs
   - Implement `GET /markets`, `GET /markets/:id`.
   - Implement `POST /markets/:id/trade` with row locks and transaction-safe balance checks.

7. User portfolio APIs
   - Implement `GET /me/portfolio` and `GET /me/transactions`.
   - Implement `GET /leaderboard`.

8. Admin workflows
   - Protect admin routes with `ADMIN_API_KEY`.
   - Implement `POST /admin/markets` and `POST /admin/markets/:id/settle`.
   - Ensure settlement writes wallet + ledger updates in one transaction.

9. Seed data
   - Add seed script for demo admin and 5 open demo markets.
   - Confirm demo markets show up in `GET /markets`.

10. Frontend scaffold
    - Build Next.js + Tailwind + Recharts app.
    - Add responsive dark-first UI and route navigation.

11. Frontend pages
    - `/` market list + top movers + auth widget.
    - `/market/[id]` chart, probability, buy module, user position.
    - `/portfolio` positions + transactions.
    - `/leaderboard` ranking.
    - `/admin` create + settle market using locally stored admin key.

12. Integration and resilience
    - Add clear loading and error states on all pages.
    - Verify cross-origin backend access from `NEXT_PUBLIC_API_URL`.

13. Documentation and deployment notes
    - Backend README with run, migrate, seed steps.
    - Frontend README with local run and Vercel notes.
    - Deployment guidance for Render/Railway backend.

14. Launch checklist
    - [ ] Production Postgres provisioned and backed up.
    - [ ] Backend env vars set (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_API_KEY`, `CORS_ORIGIN`).
    - [ ] Frontend env var set (`NEXT_PUBLIC_API_URL`).
    - [ ] Migrations run in target environment.
    - [ ] Seed script run only for non-production demo environments.
    - [ ] Health check endpoint monitored.
    - [ ] Admin API key rotated from default value.
    - [ ] Manual settlement tested end-to-end in staging.
    - [ ] Explicit play-money/no-withdrawal disclaimer visible in UI.
