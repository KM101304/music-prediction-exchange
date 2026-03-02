const express = require('express');
const { z } = require('zod');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { lmsrPriceYes, executeBinaryTrade } = require('../lib/lmsr');
const { hasSpotifyCreds, searchSpotifyTracks } = require('../lib/spotify');

const router = express.Router();

const tradeSchema = z.object({
  side: z.enum(['YES', 'NO']),
  shares: z.number().positive().max(50000),
});

const createMarketSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  resolutionCriteria: z.string().min(10).max(5000),
  closeAt: z.string().datetime(),
  settleBy: z.string().datetime(),
  lmsrB: z.number().positive().max(100000).optional(),
  sourceType: z.enum(['MANUAL', 'SPOTIFY_TRACK_POPULARITY']).default('MANUAL'),
  spotifyTrackId: z.string().min(5).max(100).optional(),
  targetMetricValue: z.number().positive().optional(),
});

function extractSongSnapshot(row) {
  const payload = row.latest_raw_payload && typeof row.latest_raw_payload === 'object' ? row.latest_raw_payload : null;
  return {
    songTitle: payload?.name || null,
    songArtists: Array.isArray(payload?.artists) ? payload.artists : [],
    songImageUrl: payload?.imageUrl || null,
    songUrl: payload?.spotifyUrl || null,
  };
}

function mapMarket(row) {
  const qYes = Number(row.shares_yes);
  const qNo = Number(row.shares_no);
  const b = Number(row.lmsr_b);
  const priceYes = lmsrPriceYes(qYes, qNo, b);
  const songSnapshot = extractSongSnapshot(row);

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
    songTitle: songSnapshot.songTitle,
    songArtists: songSnapshot.songArtists,
    songImageUrl: songSnapshot.songImageUrl,
    songUrl: songSnapshot.songUrl,
  };
}

router.get('/', async (_req, res, next) => {
  try {
    const markets = await pool.query(
      `SELECT m.*, mdp.raw_payload AS latest_raw_payload
       FROM markets m
       LEFT JOIN LATERAL (
         SELECT raw_payload
         FROM market_data_points
         WHERE market_id = m.id
         ORDER BY recorded_at DESC
         LIMIT 1
       ) mdp ON TRUE
       ORDER BY m.created_at DESC`
    );
    return res.json(markets.rows.map(mapMarket));
  } catch (error) {
    return next(error);
  }
});

router.get('/spotify/search', requireAuth, async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim();
    const limit = Number(req.query.limit || 8);

    if (query.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }
    if (!hasSpotifyCreds()) {
      return res.status(503).json({ error: 'Spotify search is not configured' });
    }

    const tracks = await searchSpotifyTracks(query, limit);
    return res.json({ tracks });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const marketResult = await pool.query(
      `SELECT m.*, mdp.raw_payload AS latest_raw_payload
       FROM markets m
       LEFT JOIN LATERAL (
         SELECT raw_payload
         FROM market_data_points
         WHERE market_id = m.id
         ORDER BY recorded_at DESC
         LIMIT 1
       ) mdp ON TRUE
       WHERE m.id = $1`,
      [req.params.id]
    );
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

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const payload = createMarketSchema.parse(req.body);
    const closeAt = new Date(payload.closeAt);
    const settleBy = new Date(payload.settleBy);

    if (Number.isNaN(closeAt.getTime()) || Number.isNaN(settleBy.getTime())) {
      return res.status(400).json({ error: 'Invalid closeAt/settleBy date' });
    }
    if (closeAt <= new Date()) {
      return res.status(400).json({ error: 'closeAt must be in the future' });
    }
    if (settleBy <= closeAt) {
      return res.status(400).json({ error: 'settleBy must be after closeAt' });
    }
    if (payload.sourceType === 'SPOTIFY_TRACK_POPULARITY' && !payload.spotifyTrackId) {
      return res.status(400).json({ error: 'spotifyTrackId is required for Spotify markets' });
    }
    if (payload.sourceType === 'SPOTIFY_TRACK_POPULARITY' && !payload.targetMetricValue) {
      return res.status(400).json({ error: 'targetMetricValue is required for Spotify markets' });
    }

    const result = await pool.query(
      `INSERT INTO markets (
         title,
         description,
         resolution_criteria,
         close_at,
         settle_by,
         status,
         lmsr_b,
         created_by,
         source_type,
         spotify_track_id,
         target_metric_value
       )
       VALUES ($1,$2,$3,$4,$5,'OPEN',$6,$7,$8,$9)
       RETURNING *`,
      [
        payload.title.trim(),
        payload.description.trim(),
        payload.resolutionCriteria.trim(),
        closeAt.toISOString(),
        settleBy.toISOString(),
        payload.lmsrB ?? 100,
        req.user.userId,
        payload.sourceType,
        payload.spotifyTrackId ?? null,
        payload.targetMetricValue ?? null,
      ]
    );

    return res.status(201).json(mapMarket(result.rows[0]));
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request body', details: error.issues });
    }
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
