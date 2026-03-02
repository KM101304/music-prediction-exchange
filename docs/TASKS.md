# Build Checklist (Best Implementation Order)

1. Initialize repository structure and shared conventions
   - Confirm `frontend/` (Next.js + Tailwind) and `backend/` (Express) app skeletons.
   - Add root docs for environment variables, scripts, and local setup.

2. Define product constants and policy guardrails
   - Add shared constants for "play money points" naming.
   - Add explicit policy flags: no deposits, no withdrawals, no wallet integrations.

3. Provision Postgres and baseline schema
   - Create initial migrations for `users`, `accounts`, `markets`, `positions`, `ledger_entries`, `settlements`.
   - Add indexes and foreign keys for market/user lookups.

4. Implement backend app foundation (Express)
   - Add config loading, error handler, request validation, logging, health endpoint.
   - Set up DB access layer and migration runner.

5. Implement auth and authorization
   - Build register/login/me endpoints.
   - Hash passwords securely.
   - Issue/verify JWTs.
   - Add role middleware for `USER`/`ADMIN`.

6. Implement account + ledger core
   - Create starting points grant on user registration.
   - Add append-only ledger service and balance calculation utilities.
   - Enforce transactional DB writes for balance-changing operations.

7. Implement market management APIs
   - Admin create/update/list/detail markets.
   - Market status transitions (`OPEN` -> `CLOSED` -> `SETTLED`).
   - Validate `close_at`, `settle_by`, and resolution criteria presence.

8. Implement position placement logic
   - User places YES/NO position with points stake.
   - Validate market open state and sufficient points.
   - Write position + ledger debit atomically.

9. Implement manual settlement engine
   - Admin settle with `YES`/`NO`/`CANCELLED`.
   - Compute payouts/refunds via deterministic formula.
   - Write settlement records and ledger credits atomically.

10. Implement portfolio and activity APIs
    - `GET /me/portfolio` for balances + open/settled positions summary.
    - `GET /me/ledger` for chronological transaction history.

11. Build frontend auth flows (Next.js)
    - Pages/forms for register/login/logout.
    - JWT storage strategy and authenticated route guards.

12. Build frontend market experiences
    - Market list page with status filtering.
    - Market detail page with YES/NO position form and rule visibility.

13. Build frontend portfolio/activity views
    - Points balance, open positions, settled outcomes.
    - Ledger timeline with credits/debits and settlement references.

14. Build admin frontend console
    - Market creation/edit form.
    - Settlement workflow page with outcome selection and notes/source URL.

15. Add cross-cutting safeguards and observability
    - Rate limit auth endpoints.
    - Audit log admin actions.
    - Add structured logs and basic operational metrics.

16. Add tests in risk order
    - Unit tests: payout logic, ledger math, auth helpers.
    - Integration tests: auth, position placement, settlement atomicity.
    - E2E smoke tests: register -> place position -> settle -> verify portfolio.

17. Hardening and launch readiness
    - Validate no real-money/withdrawal/wallet paths exist in API or UI.
    - Add clear play-money disclaimer in UI footer and onboarding.
    - Final QA pass on edge cases (late positions, duplicate settlement, cancelled markets).