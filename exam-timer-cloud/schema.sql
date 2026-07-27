-- Run this in the Neon SQL editor. Safe to re-run (uses IF NOT EXISTS).

-- Existing table from Phase 1 - add last_seen and queue mirror columns
CREATE TABLE IF NOT EXISTS exam_state (
  id INT PRIMARY KEY DEFAULT 1,
  state TEXT NOT NULL DEFAULT 'IDLE',
  remaining_ms BIGINT NOT NULL DEFAULT 0,
  duration_ms BIGINT NOT NULL DEFAULT 0,
  course_code TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  queue_json TEXT NOT NULL DEFAULT '[]',
  last_seen TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO exam_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- If the table already existed from before, add the new columns safely
ALTER TABLE exam_state ADD COLUMN IF NOT EXISTS queue_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE exam_state ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

-- Existing pending commands queue
CREATE TABLE IF NOT EXISTS pending_commands (
  id SERIAL PRIMARY KEY,
  command TEXT NOT NULL,
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consumed BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_pending_commands_consumed
  ON pending_commands (consumed, created_at);

-- Cloud-side user accounts (independent of the ESP32's local accounts)
CREATE TABLE IF NOT EXISTS cloud_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',    -- admin | staff | student
  status TEXT NOT NULL DEFAULT 'active', -- active | suspended
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cloud sessions (serverless functions are stateless, so sessions live in DB)
CREATE TABLE IF NOT EXISTS cloud_sessions (
  token TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cloud_sessions_expires ON cloud_sessions (expires_at);

-- Mirrored audit log, pushed wholesale by the ESP32 on each sync cycle
CREATE TABLE IF NOT EXISTS cloud_logs (
  id SERIAL PRIMARY KEY,
  time_str TEXT,
  username TEXT,
  action TEXT,
  details TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
