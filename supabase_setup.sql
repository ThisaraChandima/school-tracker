
-- Speed up issue queries (add if not already there)
CREATE INDEX IF NOT EXISTS idx_issues_school_done ON issues(school_id, done);
CREATE INDEX IF NOT EXISTS idx_issues_created ON issues(created_at DESC);

-- ── CUSTOM SCHOOLS TABLE ──
-- Admin can add extra schools not in the original Excel data
CREATE TABLE IF NOT EXISTS custom_schools (
  id             SERIAL PRIMARY KEY,
  school_id      INTEGER NOT NULL UNIQUE,  -- must match what's used in issues
  name           TEXT NOT NULL,
  name_en        TEXT,
  address        TEXT,
  address_en     TEXT,
  type           TEXT,
  medium         TEXT,
  principal      TEXT,
  students_m     INTEGER DEFAULT 0,
  students_f     INTEGER DEFAULT 0,
  teachers       INTEGER DEFAULT 0,
  classification TEXT,
  active         BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE custom_schools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all custom_schools" ON custom_schools;
CREATE POLICY "Allow all custom_schools" ON custom_schools FOR ALL USING (true) WITH CHECK (true);

-- Table to track removed/hidden schools from original list
CREATE TABLE IF NOT EXISTS removed_schools (
  school_id INTEGER PRIMARY KEY,
  removed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE removed_schools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all removed_schools" ON removed_schools;
CREATE POLICY "Allow all removed_schools" ON removed_schools FOR ALL USING (true) WITH CHECK (true);

SELECT 'School management tables ready!' as message;

-- ── CUSTOM SCHOOLS TABLE (for schools added by admin beyond Excel list) ──
CREATE TABLE IF NOT EXISTS custom_schools (
  id             INTEGER PRIMARY KEY,
  name           TEXT NOT NULL,
  address        TEXT DEFAULT '',
  address_en     TEXT DEFAULT '',
  type           TEXT DEFAULT '',
  medium         TEXT DEFAULT 'Sinhala',
  principal      TEXT DEFAULT '',
  students_m     INTEGER DEFAULT 0,
  students_f     INTEGER DEFAULT 0,
  teachers       INTEGER DEFAULT 0,
  classification TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE custom_schools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all custom_schools" ON custom_schools;
CREATE POLICY "Allow all custom_schools" ON custom_schools FOR ALL USING (true) WITH CHECK (true);
