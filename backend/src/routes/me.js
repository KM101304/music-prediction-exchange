const express = require('express');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { lmsrPriceYes } = require('../lib/lmsr');

const router = express.Router();

router.get('/portfolio', requireAuth, async (req, res, next) => {
  try {
    const walletResult = await pool.query(
      'SELECT credits_balance FROM wallets WHERE user_id = $1',
      [req.user.userId]
    );

    const positionsResult = await pool.query(
      `SELECT p.market_id, p.side, p.shares, m.title, m.status, m.outcome, m.shares_yes, m.shares_no, m.lmsr_b
       FROM positions p
       JOIN markets m ON m.id = p.market_id
       WHERE p.user_id = $1
       ORDER BY p.updated_at DESC`,
      [req.user.userId]
    );

    const positions = positionsResult.rows.map((row) => {
      const qYes = Number(row.shares_yes);
      const qNo = Number(row.shares_no);
      const b = Number(row.lmsr_b);
      const priceYes = lmsrPriceYes(qYes, qNo, b);
      const currentPrice = row.side === 'YES' ? priceYes : 1 - priceYes;

      return {
        marketId: row.market_id,
        marketTitle: row.title,
        marketStatus: row.status,
        outcome: row.outcome,
        side: row.side,
        shares: Number(row.shares),
        markPrice: currentPrice,
        markValue: Number((Number(row.shares) * currentPrice).toFixed(6)),
      };
    });

    return res.json({
      userId: req.user.userId,
      creditsBalance: walletResult.rowCount ? Number(walletResult.rows[0].credits_balance) : 0,
      positions,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/transactions', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, market_id, entry_type, amount_credits, balance_after, reference_id, metadata, created_at
       FROM ledger
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 200`,
      [req.user.userId]
    );

    return res.json(
      result.rows.map((row) => ({
        id: row.id,
        marketId: row.market_id,
        entryType: row.entry_type,
        amountCredits: Number(row.amount_credits),
        balanceAfter: Number(row.balance_after),
        referenceId: row.reference_id,
        metadata: row.metadata,
        createdAt: row.created_at,
      }))
    );
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
