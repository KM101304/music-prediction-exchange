# Frontend

Next.js + Tailwind + Recharts frontend for the Music Prediction Exchange MVP.

## Local setup
1. Copy env file:
   - PowerShell: `Copy-Item .env.example .env.local`
2. Confirm backend URL:
   - `NEXT_PUBLIC_API_URL=http://localhost:4000`
3. Install packages:
   - `npm install`
4. Run dev server:
   - `npm run dev`

Default URL: `http://localhost:3000`

## Pages
- `/` markets list + top movers + auth widget
- `/market/[id]` probability chart + source metric chart + trade module + your position
- `/portfolio` positions + ledger history
- `/leaderboard` ranking by credits
- `/admin` create/settle market, trigger Spotify ingest (stores `ADMIN_API_KEY` in localStorage for MVP)

## Notes
- Frontend never uses Spotify secrets directly.
- Spotify credentials stay server-side in backend `.env`.

## Deployment notes (Vercel)
- Set `NEXT_PUBLIC_API_URL` to your deployed backend URL.
- Framework preset: Next.js
- Build command: `npm run build`
- Output: default Next.js output
- The app proxies all frontend `/api/*` calls through a Next route handler to the backend URL above.
- Ensure backend CORS includes frontend origin.
