ALTER TABLE markets
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'MANUAL' CHECK (source_type IN ('MANUAL', 'SPOTIFY_TRACK_POPULARITY')),
  ADD COLUMN IF NOT EXISTS spotify_track_id TEXT,
  ADD COLUMN IF NOT EXISTS target_metric_value NUMERIC(20,6),
  ADD COLUMN IF NOT EXISTS latest_source_value NUMERIC(20,6),
  ADD COLUMN IF NOT EXISTS latest_source_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS market_data_points (
  id BIGSERIAL PRIMARY KEY,
  market_id BIGINT NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC(20,6) NOT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_data_points_market_time ON market_data_points(market_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_markets_source_type ON markets(source_type);
