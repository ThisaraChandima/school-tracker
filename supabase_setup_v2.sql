-- Run this in Supabase SQL Editor to add school details editing
-- (Only needed if you already ran the original supabase_setup.sql)

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

SELECT 'school_details table ready!' as message;
