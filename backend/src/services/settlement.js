const { pool } = require('../db/pool');

async function settleMarketById({ marketId, outcome, notes = null, sourceUrl = null, actionType = 'SETTLE_MARKET' }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const marketResult = await client.query('SELECT * FROM markets WHERE id = $1 FOR UPDATE', [marketId]);
    if (marketResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return { status: 'not_found' };
    }

    const market = marketResult.rows[0];
    if (market.status === 'SETTLED') {
      await client.query('ROLLBACK');
      return { status: 'already_settled', marketId: market.id, outcome: market.outcome };
    }

    await client.query(
      `UPDATE markets
       SET status = 'SETTLED', outcome = $1, settled_at = NOW()
       WHERE id = $2`,
      [outcome, market.id]
    );

    await client.query(
      `INSERT INTO settlements (market_id, outcome, notes, source_url)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (market_id)
       DO UPDATE SET outcome = EXCLUDED.outcome, notes = EXCLUDED.notes, source_url = EXCLUDED.source_url`,
      [market.id, outcome, notes, sourceUrl]
    );

    let payoutsIssued = 0;
    let totalCredits = 0;

    if (outcome === 'CANCELLED') {
      const refunds = await client.query(
        `SELECT user_id, COALESCE(SUM(cost_credits), 0) AS refund
         FROM trades
         WHERE market_id = $1
         GROUP BY user_id`,
        [market.id]
      );

      for (const row of refunds.rows) {
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
           VALUES ($1,$2,'SETTLEMENT_REFUND',$3,$4,$5::jsonb)`,
          [row.user_id, market.id, refund, balanceAfter, JSON.stringify({ outcome })]
        );

        payoutsIssued += 1;
        totalCredits += refund;
      }
    } else {
      const winners = await client.query(
        `SELECT user_id, COALESCE(SUM(shares), 0) AS winning_shares
         FROM positions
         WHERE market_id = $1 AND side = $2
         GROUP BY user_id`,
        [market.id, outcome]
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
           VALUES ($1,$2,'SETTLEMENT_PAYOUT',$3,$4,$5::jsonb)`,
          [row.user_id, market.id, payout, balanceAfter, JSON.stringify({ outcome })]
        );

        payoutsIssued += 1;
        totalCredits += payout;
      }
    }

    await client.query(
      `INSERT INTO admin_actions (action_type, market_id, metadata)
       VALUES ($1, $2, $3::jsonb)`,
      [
        actionType,
        market.id,
        JSON.stringify({
          outcome,
          payoutsIssued,
          totalCredits,
          sourceUrl: sourceUrl || null,
          notes: notes || null,
        }),
      ]
    );

    await client.query('COMMIT');
    return { status: 'settled', marketId: market.id, outcome, payoutsIssued, totalCredits };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  settleMarketById,
};
