
-- Speed up issue queries (add if not already there)
CREATE INDEX IF NOT EXISTS idx_issues_school_done ON issues(school_id, done);
CREATE INDEX IF NOT EXISTS idx_issues_created ON issues(created_at DESC);
