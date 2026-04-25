-- Run this in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard → your project → SQL Editor

CREATE TABLE IF NOT EXISTS issues (
  id        SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL,
  text      TEXT NOT NULL,
  done      BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issues_school_id ON issues(school_id);

-- Allow all operations (no auth required for this app)
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON issues FOR ALL USING (true) WITH CHECK (true);
