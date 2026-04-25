# School Issue Tracker

## Setup Steps

### 1. Supabase
1. supabase.com → New Project
2. SQL Editor → run `supabase_setup.sql`
3. SQL Editor → run `seed_issues.sql` (421 pre-loaded issues)
4. Settings → API → copy Project URL + service_role key

### 2. Vercel Environment Variables
Add these 3 variables:
- `SUPABASE_URL` = your project URL
- `SUPABASE_SERVICE_KEY` = service_role key
- `ADMIN_PASSWORD` = any password you choose (e.g. school2025)

### 3. GitHub → Vercel
- Push code to GitHub
- Import repo in Vercel → add env vars → Deploy
