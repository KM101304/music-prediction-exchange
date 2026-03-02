const express = require('express');
const { pool } = require('../db/pool');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.display_name, w.credits_balance
       FROM users u
       JOIN wallets w ON w.user_id = u.id
       ORDER BY w.credits_balance DESC, u.id ASC
       LIMIT 100`
    );

    return res.json(
      result.rows.map((row, index) => ({
        rank: index + 1,
        userId: row.id,
        displayName: row.display_name,
        creditsBalance: Number(row.credits_balance),
      }))
    );
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
