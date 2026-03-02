const express = require('express');
const { pool } = require('../db/pool');

const router = express.Router();

router.get('/public', async (_req, res, next) => {
  try {
    const [overview, signupTrend, tradeTrend] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*)::INT FROM users) AS total_users,
          (SELECT COUNT(*)::INT FROM users WHERE created_at >= NOW() - INTERVAL '24 hours') AS new_users_24h,
          (SELECT COUNT(DISTINCT user_id)::INT FROM trades WHERE created_at >= NOW() - INTERVAL '24 hours') AS active_traders_24h,
          (SELECT COUNT(*)::INT FROM trades) AS total_trades,
          (SELECT COUNT(*)::INT FROM trades WHERE created_at >= NOW() - INTERVAL '24 hours') AS trades_24h,
          (SELECT COALESCE(SUM(shares), 0) FROM trades) AS total_shares,
          (SELECT COUNT(*)::INT FROM markets WHERE status = 'OPEN') AS open_markets,
          (SELECT COUNT(*)::INT FROM markets WHERE status = 'SETTLED') AS settled_markets
      `),
      pool.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS day,
          COUNT(*)::INT AS signups
        FROM users
        WHERE created_at >= NOW() - INTERVAL '14 days'
        GROUP BY 1
        ORDER BY 1 ASC
      `),
      pool.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS day,
          COUNT(*)::INT AS trades,
          COALESCE(SUM(shares), 0) AS shares
        FROM trades
        WHERE created_at >= NOW() - INTERVAL '14 days'
        GROUP BY 1
        ORDER BY 1 ASC
      `),
    ]);

    return res.json({
      ...overview.rows[0],
      total_shares: Number(overview.rows[0].total_shares || 0),
      signup_trend: signupTrend.rows.map((row) => ({ day: row.day, value: row.signups })),
      trade_trend: tradeTrend.rows.map((row) => ({
        day: row.day,
        trades: row.trades,
        shares: Number(row.shares || 0),
      })),
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
