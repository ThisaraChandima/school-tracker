# School Issue Tracker — Setup Guide

## Step 1 — Supabase (Database)

1. Go to https://supabase.com and sign up for free
2. Click **New Project** → give it a name like `school-tracker` → set a password → Create
3. Wait ~1 minute for it to set up
4. Go to **SQL Editor** (left sidebar) → paste the contents of `supabase_setup.sql` → click **Run**
5. Go to **Project Settings → API**:
   - Copy **Project URL** → this is your `SUPABASE_URL`
   - Copy **service_role** key (under "Project API keys") → this is your `SUPABASE_SERVICE_KEY`

## Step 2 — GitHub (Push Code)

```bash
cd school-tracker
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/school-tracker.git
git push -u origin main
```

## Step 3 — Vercel (Deploy)

1. Go to https://vercel.com → sign in with GitHub
2. Click **Add New → Project**
3. Import your `school-tracker` repository
4. In **Environment Variables**, add:
   - `SUPABASE_URL` → paste your Supabase Project URL
   - `SUPABASE_SERVICE_KEY` → paste your service_role key
5. Click **Deploy**

Done! Your site will be live at `https://school-tracker-xxx.vercel.app`

## Local Development

```bash
cp .env.local.example .env.local
# Edit .env.local and fill in your Supabase keys
npm install
npm run dev
# Open http://localhost:3000
```
