# Nextute — Local Coaching Discovery Platform

**Live:** https://nextute-chi.vercel.app (Vercel project `nextute`)

Next.js 15 + Supabase (Postgres, Auth, Storage) + Tailwind CSS v4.

## What's inside

**Students**
- Home page with search (name / area / course), course categories, browse-by-area, featured institutes
- `/institutes` — listing with filters: city, multiple areas, class, exams, fee range (presets + custom), mode, facilities, verified, has demo lectures, featured, rating; sorting; pagination
- Institute cards show photos, fee range, facilities, demo lecture count, exams
- `/institutes/[slug]` — signed-out visitors see a preview (cover photos, fees, facilities, classes). **Signing up unlocks** all photos, demo lectures (YouTube or uploaded video), faculty with qualifications, batches & fees, contact details, reviews, map
- Compare up to 3 institutes side by side (fees, rating, mode, batch size, faculty qualifications, batches, timings, scholarship, full facility matrix). Compare tray persists while browsing
- Send admission enquiry (name, phone, class, exam, preferred batch, message), shortlist, write reviews
- `/student` dashboard: enquiry status tracking, shortlist, profile

**Institutes**
- Sign up as "I run an institute" → fill the listing form (basic info, location, contact, classes/exams/boards/subjects, fees, scholarship, timings, facilities, photo uploads with cover selection, demo lectures via YouTube link or video upload, faculty with photos, batches, results)
- New listings go to **pending** → admin approves → live. Owners cannot self-verify/feature/approve (enforced in the database)
- `/institute` dashboard: views, enquiries, lead management (status: new → contacted → visited → admitted/closed, private notes, call/WhatsApp buttons, CSV export), multiple branches
- Help section with support phone + ticket form

**Admin portal (`/admin`)**
- Overview stats, pending approvals, latest enquiries, new sign-ups
- Institutes: approve / reject (with reason) / verify / feature / edit / delete, add institute on behalf of a coaching, link a listing to an owner account, bulk-delete sample listings
- Users: search, filter by role, change role, CSV export
- All enquiries across the platform, reviews moderation, support tickets

Security is enforced with Postgres Row Level Security — signed-out visitors can only read preview columns of approved listings.

## Supabase project

Already created and set up: project **nextute** (`fmzujywipwbxlgmeigkp`, Mumbai region).
Tables, policies, storage bucket `media`, and 12 **sample listings** (marked "Sample listing") are in place.
Delete the samples from Admin → Institutes → "Delete all samples" once real institutes are onboarded.

**Admin login:** `admin@nextute.com` / `Nextute@Admin2026` — change this password after your first login (Forgot password, or Supabase → Authentication → Users).

### ⚠️ Two settings to change in the Supabase dashboard before launch
1. **Email confirmation** — Supabase's built-in email sender only delivers to your own team's addresses and is heavily rate-limited. Either:
   - Authentication → Sign In / Providers → Email → turn **off "Confirm email"** (students get logged in instantly), or
   - Authentication → Emails → SMTP Settings → add a custom SMTP (e.g. Resend, Brevo, Zoho) to keep verification on.
2. **URL configuration** — Authentication → URL Configuration → set **Site URL** to `https://nextute-chi.vercel.app` (or your own domain later) and add `https://nextute-chi.vercel.app/**` to Redirect URLs.

## Run locally

Requires Node.js 18.18+ (20 LTS recommended).

```bash
npm install
npm run dev
# open http://localhost:3000
```

The Supabase URL and publishable key are already set as defaults in `lib/supabase/config.ts` (they are public keys). To point at another project, copy `.env.example` to `.env.local` and edit.

## Deploy (Vercel)

1. Push this folder to a GitHub repo.
2. vercel.com → Add New Project → import the repo → Deploy (no settings needed).
3. Add your domain, then update the Supabase URL configuration (step 2 above).

## Project structure

```
app/                 pages (App Router)
  institutes/        listing + detail
  compare/           comparison
  student/           student dashboard
  institute/         institute dashboard + listing form
  admin/             admin portal
components/          UI components (InstituteForm, Filters, LeadsTable, …)
lib/                 Supabase clients, constants (areas, exams, facilities), helpers
supabase/schema.sql  full database schema
supabase/seed.sql    sample listings
```

To add more areas, exams, classes or facilities to the filters, edit `lib/constants.ts`.
