const express = require('express');
const { z } = require('zod');
const { pool } = require('../db/pool');
const { requireAdminApiKey } = require('../middleware/adminKey');
const { config } = require('../config');
const { ingestSpotifyData } = require('../jobs/ingestSpotifyData');
const { hasSpotifyCreds } = require('../lib/spotify');
const { settleMarketById } = require('../services/settlement');

const router = express.Router();
router.use(requireAdminApiKey);

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

    if (Number.isNaN(closeAt.getTime()) || Number.isNaN(settleBy.getTime())) {
      return res.status(400).json({ error: 'Invalid closeAt/settleBy date' });
    }
    if (settleBy <= closeAt) {
      return res.status(400).json({ error: 'settleBy must be after closeAt' });
    }

    if (payload.sourceType === 'SPOTIFY_TRACK_POPULARITY' && !payload.spotifyTrackId) {
      return res.status(400).json({ error: 'spotifyTrackId is required for SPOTIFY_TRACK_POPULARITY markets' });
    }

    const marketResult = await pool.query(
      `INSERT INTO markets (
         title,
         description,
         resolution_criteria,
         close_at,
         settle_by,
         status,
         lmsr_b,
         source_type,
         spotify_track_id,
         target_metric_value
       )
       VALUES ($1,$2,$3,$4,$5,'OPEN',$6,$7,$8,$9)
       RETURNING *`,
      [
        payload.title,
        payload.description,
        payload.resolutionCriteria,
        closeAt,
        settleBy,
        payload.lmsrB ?? config.defaultLmsrB,
        payload.sourceType,
        payload.spotifyTrackId ?? null,
        payload.targetMetricValue ?? null,
      ]
    );

    const market = marketResult.rows[0];
    await pool.query(
      `INSERT INTO admin_actions (action_type, market_id, metadata)
       VALUES ('CREATE_MARKET', $1, $2::jsonb)`,
      [market.id, JSON.stringify({ title: market.title, closeAt: market.close_at, settleBy: market.settle_by })]
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
      sourceType: market.source_type,
      spotifyTrackId: market.spotify_track_id,
      targetMetricValue: market.target_metric_value ? Number(market.target_metric_value) : null,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request body', details: error.issues });
    }
    return next(error);
  }
});

router.post('/ingest/spotify', async (_req, res, next) => {
  try {
    if (!hasSpotifyCreds()) {
      return res.status(400).json({ error: 'Spotify credentials are not configured on backend' });
    }
    const result = await ingestSpotifyData();
    await pool.query(
      `INSERT INTO admin_actions (action_type, market_id, metadata)
       VALUES ('INGEST_SPOTIFY', NULL, $1::jsonb)`,
      [JSON.stringify(result)]
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.post('/markets/:id/settle', async (req, res, next) => {
  try {
    const payload = settleSchema.parse(req.body);
    const result = await settleMarketById({
      marketId: req.params.id,
      outcome: payload.outcome,
      notes: payload.notes ?? null,
      sourceUrl: payload.sourceUrl ?? null,
      actionType: 'SETTLE_MARKET',
    });

    if (result.status === 'not_found') {
      return res.status(404).json({ error: 'Market not found' });
    }
    if (result.status === 'already_settled') {
      return res.status(400).json({ error: 'Market already settled' });
    }

    return res.json(result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request body', details: error.issues });
    }
    return next(error);
  }
});

module.exports = router;
