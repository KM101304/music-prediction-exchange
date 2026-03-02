const bcrypt = require('bcryptjs');
const { pool } = require('./pool');
const { config } = require('../config');

const demoMarkets = [
  {
    title: 'Will "Midnight Echo" reach 50M streams on Spotify by June 30, 2026?',
    description:
      'Prediction on whether the track "Midnight Echo" exceeds 50,000,000 Spotify streams before the settlement date.',
    resolutionCriteria:
      'Resolve YES if Spotify publicly shows at least 50,000,000 streams for "Midnight Echo" by 2026-06-30 23:59:59 UTC. Otherwise NO.',
    closeOffsetDays: 40,
    settleOffsetDays: 120,
    sourceType: 'SPOTIFY_TRACK_POPULARITY',
    spotifyTrackId: '0VjIjW4GlUZAMYd2vXMi3b',
    targetMetricValue: 85,
  },
  {
    title: 'Will "Neon Skyline" reach 20M YouTube Music plays by July 31, 2026?',
    description:
      'Prediction on whether "Neon Skyline" crosses 20,000,000 YouTube Music plays by the settlement deadline.',
    resolutionCriteria:
      'Resolve YES if official YouTube Music metrics show 20,000,000 plays or more by 2026-07-31 23:59:59 UTC. Otherwise NO.',
    closeOffsetDays: 50,
    settleOffsetDays: 150,
    sourceType: 'SPOTIFY_TRACK_POPULARITY',
    spotifyTrackId: '7qiZfU4dY1lWllzX7mPBI3',
    targetMetricValue: 82,
  },
  {
    title: 'Will "Golden Tape" reach 10M Apple Music streams by May 31, 2026?',
    description:
      'Prediction on whether "Golden Tape" reaches 10,000,000 Apple Music streams by date cutoff.',
    resolutionCriteria:
      'Resolve YES if Apple Music or label-published verified metric is at least 10,000,000 by 2026-05-31 23:59:59 UTC. Otherwise NO.',
    closeOffsetDays: 25,
    settleOffsetDays: 90,
    sourceType: 'SPOTIFY_TRACK_POPULARITY',
    spotifyTrackId: '4LRPiXqCikLlN15c3yImP7',
    targetMetricValue: 75,
  },
  {
    title: 'Will "Static Bloom" hit 30M global streams by August 15, 2026?',
    description:
      'Prediction market for total global streams across major DSPs for "Static Bloom".',
    resolutionCriteria:
      'Resolve YES if verified total reaches 30,000,000 across public reporting by 2026-08-15 23:59:59 UTC. Otherwise NO.',
    closeOffsetDays: 70,
    settleOffsetDays: 165,
  },
  {
    title: 'Will "Signal Hearts" reach 5M streams in first 30 days after release?',
    description:
      'Prediction on whether the song reaches 5,000,000 streams across official reported platforms within 30 days of release.',
    resolutionCriteria:
      'Resolve YES if verified reporting confirms 5,000,000 streams within 30 calendar days post-release window. Otherwise NO.',
    closeOffsetDays: 15,
    settleOffsetDays: 60,
  },
  {
    title: 'Will "Skyline Letters" reach Spotify popularity 78+ by August 31, 2026?',
    description:
      'Prediction on whether "Skyline Letters" track popularity reaches 78 or above on Spotify by the settlement date.',
    resolutionCriteria:
      'Resolve YES if Spotify track popularity for "Skyline Letters" is 78 or greater at settlement verification time. Otherwise NO.',
    closeOffsetDays: 45,
    settleOffsetDays: 130,
    sourceType: 'SPOTIFY_TRACK_POPULARITY',
    spotifyTrackId: '3n3Ppam7vgaVa1iaRUc9Lp',
    targetMetricValue: 78,
  },
  {
    title: 'Will "Electric Summer" reach Spotify popularity 70+ by September 15, 2026?',
    description:
      'Prediction on whether "Electric Summer" reaches popularity score of at least 70 in Spotify data.',
    resolutionCriteria:
      'Resolve YES if Spotify popularity is 70 or above by settlement verification timestamp. Otherwise NO.',
    closeOffsetDays: 55,
    settleOffsetDays: 145,
    sourceType: 'SPOTIFY_TRACK_POPULARITY',
    spotifyTrackId: '6habFhsOp2NvshLv26DqMb',
    targetMetricValue: 70,
  },
  {
    title: 'Will "Parallel Dreams" exceed 25M total streams by October 1, 2026?',
    description:
      'Prediction on aggregate major-platform streaming count for "Parallel Dreams".',
    resolutionCriteria:
      'Resolve YES if trusted platform reporting confirms at least 25,000,000 total streams by 2026-10-01 UTC. Otherwise NO.',
    closeOffsetDays: 60,
    settleOffsetDays: 170,
  },
  {
    title: 'Will "Late Night Transit" hit 15M streams by July 15, 2026?',
    description:
      'Prediction for whether "Late Night Transit" reaches 15,000,000 streams before deadline.',
    resolutionCriteria:
      'Resolve YES if official track metrics from trusted source show 15,000,000 or more by settlement verification time. Otherwise NO.',
    closeOffsetDays: 35,
    settleOffsetDays: 110,
  },
  {
    title: 'Will "Cherry Signal" reach Spotify popularity 65+ by July 31, 2026?',
    description:
      'Prediction on Spotify popularity index for "Cherry Signal".',
    resolutionCriteria:
      'Resolve YES if Spotify popularity for "Cherry Signal" is at least 65 by settlement verification. Otherwise NO.',
    closeOffsetDays: 38,
    settleOffsetDays: 120,
    sourceType: 'SPOTIFY_TRACK_POPULARITY',
    spotifyTrackId: '4iV5W9uYEdYUVa79Axb7Rh',
    targetMetricValue: 65,
  },
  {
    title: 'Will "Echo District" cross 8M streams in first 45 days?',
    description:
      'Prediction on first-45-day stream milestone for "Echo District".',
    resolutionCriteria:
      'Resolve YES if verified first-45-day streams are at least 8,000,000. Otherwise NO.',
    closeOffsetDays: 20,
    settleOffsetDays: 70,
  },
  {
    title: 'Will "Blue Terminal" reach 40M streams by November 1, 2026?',
    description:
      'Prediction on whether "Blue Terminal" can achieve 40,000,000 streams before the cutoff.',
    resolutionCriteria:
      'Resolve YES if verified reporting confirms at least 40,000,000 streams by 2026-11-01 UTC. Otherwise NO.',
    closeOffsetDays: 75,
    settleOffsetDays: 180,
  },
];

function isoAfterDays(days) {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() + days);
  return now.toISOString();
}

async function run() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const adminEmail = config.demoAdminEmail.toLowerCase();
    const existingAdmin = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    let adminId;

    if (existingAdmin.rowCount > 0) {
      adminId = existingAdmin.rows[0].id;
      await client.query('UPDATE users SET role = $1 WHERE id = $2', ['ADMIN', adminId]);
    } else {
      const passwordHash = await bcrypt.hash(config.demoAdminPassword, 12);
      const adminInsert = await client.query(
        `INSERT INTO users (email, password_hash, display_name, role)
         VALUES ($1,$2,$3,'ADMIN')
         RETURNING id`,
        [adminEmail, passwordHash, 'Demo Admin']
      );
      adminId = adminInsert.rows[0].id;

      await client.query(
        'INSERT INTO wallets (user_id, credits_balance) VALUES ($1,$2)',
        [adminId, config.startingCredits]
      );

      await client.query(
        `INSERT INTO ledger (user_id, entry_type, amount_credits, balance_after, metadata)
         VALUES ($1,'SIGNUP_CREDITS',$2,$2,$3::jsonb)`,
        [adminId, config.startingCredits, JSON.stringify({ reason: 'Seed admin account' })]
      );
    }

    for (const m of demoMarkets) {
      const exists = await client.query('SELECT id FROM markets WHERE title = $1', [m.title]);
      if (exists.rowCount > 0) {
        await client.query(
          `UPDATE markets
           SET source_type = $1,
               spotify_track_id = $2,
               target_metric_value = $3
           WHERE id = $4`,
          [m.sourceType || 'MANUAL', m.spotifyTrackId || null, m.targetMetricValue || null, exists.rows[0].id]
        );
        continue;
      }

      const inserted = await client.query(
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
         VALUES ($1,$2,$3,$4,$5,'OPEN',$6,$7,$8,$9,$10)
         RETURNING id`,
        [
          m.title,
          m.description,
          m.resolutionCriteria,
          isoAfterDays(m.closeOffsetDays),
          isoAfterDays(m.settleOffsetDays),
          config.defaultLmsrB,
          adminId,
          m.sourceType || 'MANUAL',
          m.spotifyTrackId || null,
          m.targetMetricValue || null,
        ]
      );

      await client.query(
        `INSERT INTO admin_actions (action_type, market_id, metadata)
         VALUES ('SEED_MARKET', $1, $2::jsonb)`,
        [inserted.rows[0].id, JSON.stringify({ source: 'seed-script' })]
      );
    }

    await client.query('COMMIT');
    console.log('Seed completed');
    console.log(`Demo admin email: ${adminEmail}`);
    console.log(`Demo admin password: ${config.demoAdminPassword}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
