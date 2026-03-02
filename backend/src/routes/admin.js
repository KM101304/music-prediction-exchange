const express = require('express');
const { z } = require('zod');
const { pool } = require('../db/pool');
const { requireAdminApiKey } = require('../middleware/adminKey');
const { config } = require('../config');

const router = express.Router();
router.use(requireAdminApiKey);

const createMarketSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10),
  resolutionCriteria: z.string().min(10),
  closeAt: z.string().datetime(),
  settleBy: z.string().datetime(),
  lmsrB: z.number().positive().optional(),
});

const settleSchema = z.object({
  outcome: z.enum(['YES', 'NO', 'CANCELLED']),
  notes: z.string().max(5000).optional(),
  sourceUrl: z.string().url().optional(),
});

router.post('/markets', async (req, res, next) => {
  try {
    const payload = createMarketSchema.parse(req.body);

    const closeAt = new Date(payload.closeAt);
    const settleBy = new Date(payload.settleBy);
    if (settleBy <= closeAt) {
      return res.status(400).json({ error: 'settleBy must be after closeAt' });
    }

    const result = await pool.query(
      `INSERT INTO markets (
        title,
        description,
        resolution_criteria,
        close_at,
        settle_by,
        lmsr_b,
        status
      ) VALUES ($1,$2,$3,$4,$5,$6,'OPEN')
      RETURNING *`,
      [
        payload.title,
        payload.description,
        payload.resolutionCriteria,
        closeAt,
        settleBy,
        payload.lmsrB ?? config.defaultLmsrB,
      ]
    );

    const market = result.rows[0];

    await pool.query(
      `INSERT INTO admin_actions (action_type, market_id, metadata)
       VALUES ('CREATE_MARKET', $1, $2)`,
      [market.id, JSON.stringify({ title: market.title })]
    );

    return res.status(201).json({
      id: market.id,
      title: market.title,
      description: market.description,
      resolutionCriteria: market.resolution_criteria,
      closeAt: market.close_at,
      settleBy: market.settle_by,
      status: market.status,
      lmsrB: Number(market.lmsr_b),
      sharesYes: Number(market.shares_yes),
      sharesNo: Number(market.shares_no),
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request body', details: error.issues });
    }
    return next(error);
  }
});

router.post('/markets/:id/settle', async (req, res, next) => {
  try {
    const payload = settleSchema.parse(req.body);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const marketResult = await client.query(
        'SELECT * FROM markets WHERE id = $1 FOR UPDATE',
        [req.params.id]
      );

      if (marketResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Market not found' });
      }

      const market = marketResult.rows[0];
      if (market.status === 'SETTLED') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Market already settled' });
      }

      await client.query(
        `UPDATE markets
         SET status = 'SETTLED', outcome = $1, settled_at = NOW()
         WHERE id = $2`,
        [payload.outcome, market.id]
      );

      await client.query(
        `INSERT INTO settlements (market_id, outcome, notes, source_url)
         VALUES ($1,$2,$3,$4)`,
        [market.id, payload.outcome, payload.notes ?? null, payload.sourceUrl ?? null]
      );

      let payoutsIssued = 0;

      if (payload.outcome === 'CANCELLED') {
        const refundRows = await client.query(
          `SELECT user_id, COALESCE(SUM(cost_credits), 0) AS refund
           FROM trades
           WHERE market_id = $1
           GROUP BY user_id`,
          [market.id]
        );

        for (const row of refundRows.rows) {
          const refund = Number(row.refund);
          if (refund <= 0) {
            continue;
          }

          const walletResult = await client.query(
            'SELECT credits_balance FROM wallets WHERE user_id = $1 FOR UPDATE',
            [row.user_id]
          );
          if (walletResult.rowCount === 0) {
            continue;
          }

          const balanceAfter = Number(walletResult.rows[0].credits_balance) + refund;
          await client.query(
            'UPDATE wallets SET credits_balance = $1, updated_at = NOW() WHERE user_id = $2',
            [balanceAfter, row.user_id]
          );

          await client.query(
            `INSERT INTO ledger (user_id, market_id, entry_type, amount_credits, balance_after, metadata)
             VALUES ($1,$2,'SETTLEMENT_REFUND',$3,$4,$5)`,
            [
              row.user_id,
              market.id,
              refund,
              balanceAfter,
              JSON.stringify({ outcome: payload.outcome }),
            ]
          );
          payoutsIssued += 1;
        }
      } else {
        const winners = await client.query(
          `SELECT user_id, COALESCE(SUM(shares), 0) AS winning_shares
           FROM positions
           WHERE market_id = $1 AND side = $2
           GROUP BY user_id`,
          [market.id, payload.outcome]
        );

        for (const row of winners.rows) {
          const payout = Number(row.winning_shares);
          if (payout <= 0) {
            continue;
          }

          const walletResult = await client.query(
            'SELECT credits_balance FROM wallets WHERE user_id = $1 FOR UPDATE',
            [row.user_id]
          );
          if (walletResult.rowCount === 0) {
            continue;
          }

          const balanceAfter = Number(walletResult.rows[0].credits_balance) + payout;
          await client.query(
            'UPDATE wallets SET credits_balance = $1, updated_at = NOW() WHERE user_id = $2',
            [balanceAfter, row.user_id]
          );

          await client.query(
            `INSERT INTO ledger (user_id, market_id, entry_type, amount_credits, balance_after, metadata)
             VALUES ($1,$2,'SETTLEMENT_PAYOUT',$3,$4,$5)`,
            [
              row.user_id,
              market.id,
              payout,
              balanceAfter,
              JSON.stringify({ outcome: payload.outcome }),
            ]
          );
          payoutsIssued += 1;
        }
      }

      await client.query(
        `INSERT INTO admin_actions (action_type, market_id, metadata)
         VALUES ('SETTLE_MARKET', $1, $2)`,
        [
          market.id,
          JSON.stringify({
            outcome: payload.outcome,
            payoutsIssued,
            sourceUrl: payload.sourceUrl ?? null,
          }),
        ]
      );

      await client.query('COMMIT');
      return res.json({ marketId: market.id, outcome: payload.outcome, payoutsIssued });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request body', details: error.issues });
    }
    return next(error);
  }
});

module.exports = router;
