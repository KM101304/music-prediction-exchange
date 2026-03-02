const { pool } = require('../db/pool');
const { settleMarketById } = require('../services/settlement');

async function runAutoSettleCycle() {
  const candidates = await pool.query(
    `SELECT id, latest_source_value, target_metric_value
     FROM markets
     WHERE status = 'OPEN'
       AND source_type = 'SPOTIFY_TRACK_POPULARITY'
       AND close_at <= NOW()
       AND latest_source_value IS NOT NULL
       AND target_metric_value IS NOT NULL
     ORDER BY close_at ASC
     LIMIT 100`
  );

  let settled = 0;
  let skipped = 0;

  for (const row of candidates.rows) {
    const outcome = Number(row.latest_source_value) >= Number(row.target_metric_value) ? 'YES' : 'NO';
    const result = await settleMarketById({
      marketId: row.id,
      outcome,
      notes: 'Auto-settled from latest Spotify metric threshold at close time.',
      actionType: 'AUTO_SETTLE_MARKET',
    });

    if (result.status === 'settled') {
      settled += 1;
    } else {
      skipped += 1;
    }
  }

  return { scanned: candidates.rowCount, settled, skipped };
}

module.exports = { runAutoSettleCycle };
