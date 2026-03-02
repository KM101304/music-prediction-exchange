const express = require('express');
const { z } = require('zod');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { lmsrPriceYes, executeBinaryTrade } = require('../lib/lmsr');

const router = express.Router();

const tradeSchema = z.object({
  side: z.enum(['YES', 'NO']),
  shares: z.number().positive().max(50000),
});

function mapMarket(row) {
  const qYes = Number(row.shares_yes);
  const qNo = Number(row.shares_no);
  const b = Number(row.lmsr_b);
  const priceYes = lmsrPriceYes(qYes, qNo, b);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    resolutionCriteria: row.resolution_criteria,
    closeAt: row.close_at,
    settleBy: row.settle_by,
    status: row.status,
    outcome: row.outcome,
    lmsrB: b,
    sharesYes: qYes,
    sharesNo: qNo,
    volumeShares: qYes + qNo,
    probabilityYes: priceYes,
    probabilityNo: 1 - priceYes,
    createdAt: row.created_at,
    settledAt: row.settled_at,
    sourceType: row.source_type,
    spotifyTrackId: row.spotify_track_id,
    targetMetricValue: row.target_metric_value ? Number(row.target_metric_value) : null,
    latestSourceValue: row.latest_source_value ? Number(row.latest_source_value) : null,
    latestSourceAt: row.latest_source_at,
  };
}

router.get('/', async (_req, res, next) => {
  try {
    const markets = await pool.query('SELECT * FROM markets ORDER BY created_at DESC');
    return res.json(markets.rows.map(mapMarket));
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const marketResult = await pool.query('SELECT * FROM markets WHERE id = $1', [req.params.id]);
    if (marketResult.rowCount === 0) {
      return res.status(404).json({ error: 'Market not found' });
    }

    const tradesResult = await pool.query(
      `SELECT id, side, shares, cost_credits, q_yes_after, q_no_after, created_at
       FROM trades
       WHERE market_id = $1
       ORDER BY created_at ASC
       LIMIT 200`,
      [req.params.id]
    );

    const tradePoints = tradesResult.rows.map((trade, idx) => {
      const qYesAfter = Number(trade.q_yes_after);
      const qNoAfter = Number(trade.q_no_after);
      const b = Number(marketResult.rows[0].lmsr_b);
      return {
        index: idx + 1,
        tradeId: trade.id,
        timestamp: trade.created_at,
        probabilityYes: lmsrPriceYes(qYesAfter, qNoAfter, b),
      };
    });

    const dataPointsResult = await pool.query(
      `SELECT id, source, metric_name, metric_value, raw_payload, recorded_at
       FROM market_data_points
       WHERE market_id = $1
       ORDER BY recorded_at ASC
       LIMIT 500`,
      [req.params.id]
    );

    return res.json({
      ...mapMarket(marketResult.rows[0]),
      tradeHistory: tradePoints,
      sourceDataPoints: dataPointsResult.rows.map((row, idx) => ({
        index: idx + 1,
        id: row.id,
        source: row.source,
        metricName: row.metric_name,
        metricValue: Number(row.metric_value),
        recordedAt: row.recorded_at,
        rawPayload: row.raw_payload,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/data-points', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, source, metric_name, metric_value, raw_payload, recorded_at
       FROM market_data_points
       WHERE market_id = $1
       ORDER BY recorded_at DESC
       LIMIT 500`,
      [req.params.id]
    );
    return res.json(
      result.rows.map((row) => ({
        id: row.id,
        source: row.source,
        metricName: row.metric_name,
        metricValue: Number(row.metric_value),
        recordedAt: row.recorded_at,
        rawPayload: row.raw_payload,
      }))
    );
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/trade', requireAuth, async (req, res, next) => {
  try {
    const payload = tradeSchema.parse(req.body);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const marketResult = await client.query('SELECT * FROM markets WHERE id = $1 FOR UPDATE', [req.params.id]);
      if (marketResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Market not found' });
      }

      const market = marketResult.rows[0];
      if (market.status !== 'OPEN' || new Date() > new Date(market.close_at)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Market is not open for trading' });
      }

      const walletResult = await client.query(
        'SELECT user_id, credits_balance FROM wallets WHERE user_id = $1 FOR UPDATE',
        [req.user.userId]
      );
      if (walletResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Wallet not found' });
      }

      const wallet = walletResult.rows[0];
      const execution = executeBinaryTrade({
        qYes: Number(market.shares_yes),
        qNo: Number(market.shares_no),
        b: Number(market.lmsr_b),
        side: payload.side,
        shares: payload.shares,
      });

      const cost = Number(execution.cost.toFixed(6));
      const balanceBefore = Number(wallet.credits_balance);
      if (cost > balanceBefore) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Insufficient credits' });
      }

      const balanceAfter = Number((balanceBefore - cost).toFixed(6));

      await client.query(
        'UPDATE wallets SET credits_balance = $1, updated_at = NOW() WHERE user_id = $2',
        [balanceAfter, req.user.userId]
      );

      const tradeInsert = await client.query(
        `INSERT INTO trades (user_id, market_id, side, shares, cost_credits, q_yes_before, q_no_before, q_yes_after, q_no_after)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id, created_at`,
        [
          req.user.userId,
          market.id,
          payload.side,
          payload.shares,
          cost,
          execution.qYesBefore,
          execution.qNoBefore,
          execution.qYesAfter,
          execution.qNoAfter,
        ]
      );

      await client.query(
        `INSERT INTO positions (user_id, market_id, side, shares)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (user_id, market_id, side)
         DO UPDATE SET shares = positions.shares + EXCLUDED.shares, updated_at = NOW()`,
        [req.user.userId, market.id, payload.side, payload.shares]
      );

      await client.query('UPDATE markets SET shares_yes = $1, shares_no = $2 WHERE id = $3', [
        execution.qYesAfter,
        execution.qNoAfter,
        market.id,
      ]);

      await client.query(
        `INSERT INTO ledger (user_id, market_id, entry_type, amount_credits, balance_after, reference_id, metadata)
         VALUES ($1,$2,'TRADE_COST',$3,$4,$5,$6::jsonb)`,
        [
          req.user.userId,
          market.id,
          -cost,
          balanceAfter,
          tradeInsert.rows[0].id,
          JSON.stringify({
            side: payload.side,
            shares: payload.shares,
            avgExecutionPrice: execution.averageExecutionPrice,
          }),
        ]
      );

      await client.query('COMMIT');

      return res.status(201).json({
        tradeId: tradeInsert.rows[0].id,
        marketId: market.id,
        side: payload.side,
        shares: payload.shares,
        cost,
        avgExecutionPrice: execution.averageExecutionPrice,
        probabilityYesBefore: execution.priceYesBefore,
        probabilityYesAfter: execution.priceYesAfter,
        balanceAfter,
        createdAt: tradeInsert.rows[0].created_at,
      });
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
