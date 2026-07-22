-- Run this once in the Neon SQL editor to set up the tables.

CREATE TABLE IF NOT EXISTS exam_state (
  id INT PRIMARY KEY DEFAULT 1,
  state TEXT NOT NULL DEFAULT 'IDLE',
  remaining_ms BIGINT NOT NULL DEFAULT 0,
  duration_ms BIGINT NOT NULL DEFAULT 0,
  course_code TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO exam_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS pending_commands (
  id SERIAL PRIMARY KEY,
  command TEXT NOT NULL,
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consumed BOOLEAN NOT NULL DEFAULT false
);

-- Optional: keep the commands table small
CREATE INDEX IF NOT EXISTS idx_pending_commands_consumed
  ON pending_commands (consumed, created_at);
