const { pool } = require('../db/pool');
const { hasSpotifyCreds, getSpotifyTrack } = require('../lib/spotify');

async function ingestSpotifyData() {
  if (!hasSpotifyCreds()) {
    throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET are required for spotify ingestion');
  }

  const client = await pool.connect();
  let ingested = 0;

  try {
    const marketsResult = await client.query(
      `SELECT id, spotify_track_id
       FROM markets
       WHERE source_type = 'SPOTIFY_TRACK_POPULARITY'
         AND spotify_track_id IS NOT NULL
         AND status IN ('OPEN', 'CLOSED')`
    );

    for (const market of marketsResult.rows) {
      try {
        const snapshot = await getSpotifyTrack(market.spotify_track_id);

        await client.query('BEGIN');
        await client.query(
          `INSERT INTO market_data_points (market_id, source, metric_name, metric_value, raw_payload, recorded_at)
           VALUES ($1,'SPOTIFY','track_popularity',$2,$3::jsonb,NOW())`,
          [
            market.id,
            snapshot.popularity,
            JSON.stringify({
              trackId: snapshot.trackId,
              name: snapshot.name,
              artists: snapshot.artists,
              spotifyUrl: snapshot.spotifyUrl,
              album: snapshot.album,
            }),
          ]
        );

        await client.query(
          `UPDATE markets
           SET latest_source_value = $1,
               latest_source_at = NOW()
           WHERE id = $2`,
          [snapshot.popularity, market.id]
        );

        await client.query('COMMIT');
        ingested += 1;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Failed to ingest market ${market.id}:`, error.message);
      }
    }

    return { ingested, totalCandidates: marketsResult.rowCount };
  } finally {
    client.release();
  }
}

async function run() {
  try {
    const result = await ingestSpotifyData();
    console.log(`Spotify ingestion complete: ${result.ingested}/${result.totalCandidates} markets updated`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  run();
}

module.exports = { ingestSpotifyData };
