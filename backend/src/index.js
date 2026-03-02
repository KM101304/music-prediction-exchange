const { app } = require('./app');
const { config } = require('./config');
const { pool } = require('./db/pool');
const { runAutoSettleCycle } = require('./jobs/autoSettleMarkets');

const server = app.listen(config.port, () => {
  console.log(`Backend listening on port ${config.port}`);
});

let autoSettleTimer = null;
let autoSettleInFlight = false;

async function runAutoSettleSafe() {
  if (!config.autoSettleEnabled || autoSettleInFlight) {
    return;
  }
  autoSettleInFlight = true;
  try {
    const result = await runAutoSettleCycle();
    if (result.scanned > 0) {
      console.log(`Auto-settle cycle: scanned=${result.scanned}, settled=${result.settled}, skipped=${result.skipped}`);
    }
  } catch (error) {
    console.error('Auto-settle cycle failed:', error.message);
  } finally {
    autoSettleInFlight = false;
  }
}

if (config.autoSettleEnabled) {
  runAutoSettleSafe();
  autoSettleTimer = setInterval(runAutoSettleSafe, Math.max(30000, config.autoSettleIntervalMs));
}

async function shutdown() {
  if (autoSettleTimer) {
    clearInterval(autoSettleTimer);
  }
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
