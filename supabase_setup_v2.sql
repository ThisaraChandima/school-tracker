-- ══════════════════════════════════════════════
-- Run this in Supabase SQL Editor (upgrade v2)
-- ══════════════════════════════════════════════

-- 1. Add image_url column to issues
ALTER TABLE issues ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. School access table (PIN per school)
CREATE TABLE IF NOT EXISTS school_access (
  school_id  INTEGER PRIMARY KEY,
  pin        VARCHAR(20) NOT NULL,
  enabled    BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE school_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON school_access FOR ALL USING (true) WITH CHECK (true);

-- 3. Supabase Storage bucket for issue images
-- Go to Storage in the sidebar → New bucket → name: issue-images → Public: ON
-- Then run these policies:

INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-images', 'issue-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'issue-images');
CREATE POLICY "Auth upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'issue-images');
CREATE POLICY "Auth delete" ON storage.objects FOR DELETE USING (bucket_id = 'issue-images');
