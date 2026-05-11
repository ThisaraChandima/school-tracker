# 🏫 School Issue Tracker — Mawanella Education Zone

> A modern platform to track, manage, and resolve infrastructure issues across all 134 schools in the Mawanella Education Zone, Sri Lanka.

🔗 **Live Site:** [mavanella-zone.vercel.app](https://mavanella-zone.vercel.app)

---

## Overview

The **School Issue Tracker** is a full-stack web application built for the Mawanella Education Zone to digitally monitor and resolve school infrastructure problems — teacher shortages, missing labs, computers, sanitation issues, and more.

Over **421 issues** across 134 schools were pre-loaded from the 2026 school directory. Admins and individual schools can log in to update, resolve, and track issues in real time.

---

## Features

- 🔍 **Smart Search** — Find schools by name or area in English and Sinhala
- 📝 **Issue Logging** — Log problems with optional photo evidence
- ✅ **Resolve & Track** — Mark issues done, reopen, with full date history
- 📊 **Live Dashboard** — Zone-wide progress stats in real time
- 🔐 **Role-based Access** — Admin + individual school logins
- ✏️ **Editable School Details** — Admin can update principal, type, student counts
- 📥 **CSV Export** — Export all issues as a spreadsheet
- 🔑 **Bulk Access Control** — Grant or revoke school logins in bulk
- 📱 **Fully Responsive** — Works on phone, tablet, and desktop

---

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | Next.js 14 (App Router) |
| Styling  | Custom CSS — Plus Jakarta Sans font |
| Backend  | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Storage  | Supabase Storage (issue images) |
| Hosting  | Vercel |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/ThisaraChandima/school-tracker.git
cd school-tracker
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Run `supabase_setup.sql` in the SQL Editor
3. Run `seed_issues.sql` to load 421 pre-built issues
4. Create a public storage bucket named `issue-images`

### 3. Environment variables

Create a `.env.local` file:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
ADMIN_PASSWORD=your-admin-password
```

### 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

This project is deployed on **Vercel**. To deploy your own:

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add the three environment variables
4. Deploy

---

## Access Levels

| Role   | Can do |
|--------|--------|
| **Guest** | View all schools and issues |
| **School** | View + edit issues for their own school only |
| **Admin** | Full access — all schools, bulk actions, export, edit school details |

---

## Screenshots

> Home page · Tracker · Admin Panel

---

## License

This project was built for the **Mawanella Education Zone Office**, Sri Lanka.  
© 2026 Mawanella Education Zone · All rights reserved.
