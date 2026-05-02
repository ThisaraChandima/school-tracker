-- ============================================================
-- Run this FULLY in Supabase SQL Editor (replace old version)
-- ============================================================

-- 1. ISSUES TABLE
CREATE TABLE IF NOT EXISTS issues (
  id         SERIAL PRIMARY KEY,
  school_id  INTEGER NOT NULL,
  text       TEXT NOT NULL,
  done       BOOLEAN DEFAULT FALSE,
  image_url  TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issues_school_id ON issues(school_id);

-- Add image_url if upgrading from old version
ALTER TABLE issues ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. SCHOOL ACCOUNTS TABLE (for school-level login)
CREATE TABLE IF NOT EXISTS school_accounts (
  id         SERIAL PRIMARY KEY,
  school_id  INTEGER NOT NULL UNIQUE,
  school_name TEXT NOT NULL,
  password   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ROW LEVEL SECURITY
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all issues" ON issues;
CREATE POLICY "Allow all issues" ON issues FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all accounts" ON school_accounts;
CREATE POLICY "Allow all accounts" ON school_accounts FOR ALL USING (true) WITH CHECK (true);

-- 4. STORAGE BUCKET for issue images
-- Go to: Storage → New bucket → Name: issue-images → Public: ON
-- (Cannot create bucket via SQL, do it manually in Supabase dashboard)

SELECT 'Setup complete! Now create storage bucket: issue-images (public)' as message;

-- ============================================================
-- ADD THIS SECTION to your Supabase SQL Editor
-- (Run separately if you already ran the original setup)
-- ============================================================

-- School detail overrides (admin-editable)
CREATE TABLE IF NOT EXISTS school_overrides (
  school_id      INTEGER PRIMARY KEY,
  principal      TEXT,
  type           TEXT,
  medium         TEXT,
  students_m     INTEGER,
  students_f     INTEGER,
  teachers       INTEGER,
  classification TEXT,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE school_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all overrides" ON school_overrides;
CREATE POLICY "Allow all overrides" ON school_overrides FOR ALL USING (true) WITH CHECK (true);

-- ── SCHOOL DETAILS OVERRIDES TABLE ──
-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS school_details (
  school_id     INTEGER PRIMARY KEY,
  principal     TEXT,
  type          TEXT,
  medium        TEXT,
  students_m    INTEGER,
  students_f    INTEGER,
  teachers      INTEGER,
  classification TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE school_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all school_details" ON school_details;
CREATE POLICY "Allow all school_details" ON school_details FOR ALL USING (true) WITH CHECK (true);

-- ── SCHOOL DETAILS OVERRIDES TABLE ──
-- Admin can edit these to override the hardcoded Excel data
CREATE TABLE IF NOT EXISTS school_details (
  school_id     INTEGER PRIMARY KEY,
  principal     TEXT,
  type          TEXT,
  medium        TEXT,
  students_m    INTEGER,
  students_f    INTEGER,
  teachers      INTEGER,
  classification TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE school_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all school_details" ON school_details;
CREATE POLICY "Allow all school_details" ON school_details FOR ALL USING (true) WITH CHECK (true);
