CREATE TABLE IF NOT EXISTS schema_migrations (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits_balance NUMERIC(20,6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS markets (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  resolution_criteria TEXT NOT NULL,
  close_at TIMESTAMPTZ NOT NULL,
  settle_by TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'SETTLED')),
  outcome TEXT CHECK (outcome IN ('YES', 'NO', 'CANCELLED')),
  lmsr_b NUMERIC(20,6) NOT NULL DEFAULT 100,
  shares_yes NUMERIC(20,6) NOT NULL DEFAULT 0,
  shares_no NUMERIC(20,6) NOT NULL DEFAULT 0,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  settled_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS trades (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id BIGINT NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('YES', 'NO')),
  shares NUMERIC(20,6) NOT NULL CHECK (shares > 0),
  cost_credits NUMERIC(20,6) NOT NULL CHECK (cost_credits >= 0),
  q_yes_before NUMERIC(20,6) NOT NULL,
  q_no_before NUMERIC(20,6) NOT NULL,
  q_yes_after NUMERIC(20,6) NOT NULL,
  q_no_after NUMERIC(20,6) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id BIGINT NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('YES', 'NO')),
  shares NUMERIC(20,6) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, market_id, side)
);

CREATE TABLE IF NOT EXISTS ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id BIGINT REFERENCES markets(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL,
  amount_credits NUMERIC(20,6) NOT NULL,
  balance_after NUMERIC(20,6) NOT NULL,
  reference_id BIGINT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settlements (
  id BIGSERIAL PRIMARY KEY,
  market_id BIGINT UNIQUE NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL CHECK (outcome IN ('YES', 'NO', 'CANCELLED')),
  notes TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_actions (
  id BIGSERIAL PRIMARY KEY,
  action_type TEXT NOT NULL,
  market_id BIGINT REFERENCES markets(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_markets_status_close_at ON markets(status, close_at);
CREATE INDEX IF NOT EXISTS idx_trades_market_id ON trades(market_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_user_id_created_at ON ledger(user_id, created_at DESC);
