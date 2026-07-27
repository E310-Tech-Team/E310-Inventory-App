# EThree10 Inventory App

Internal equipment and supplies inventory system for department-managed equipment and supplies.

## Current state

The app can run in two data modes:

- **Local mock mode**: if Supabase env vars are missing, it uses `src/mock-data-store/db.json`.
- **Supabase mode**: if Supabase env vars are present, it uses Postgres tables in Supabase.

Access is managed by a **super-admin**. Active department team members can add, edit, delete, assign, and check in inventory. Only a super-admin can add, edit, deactivate, or remove users.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll land on the login screen.

Mock login emails:

- `boss@department.local` — super-admin
- `admin1@department.local` — team member
- `admin2@department.local` — team member

## Supabase setup

1. Create a Supabase project.
2. In Supabase, open the SQL editor and run `supabase/schema.sql`.
3. Replace the placeholder super-admin email (`boss@department.local`) in `department_users` with your boss's real email.
4. Copy `.env.example` to `.env.local`.
5. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`
6. Restart `npm run dev`.

The service-role/secret key is used only by server-side route handlers. Do not expose it in client components.

## Building for production

```bash
npm run build
npm run start
```

Note: `build`/`start`/`dev` are pinned to `--webpack` rather than Turbopack — the PWA plugin needs webpack, and Next.js 16 defaults to Turbopack otherwise.

## What's built

- **Access**: super-admin can grant, update, deactivate, and remove team access
- **Categories**: full CRUD, clickable category detail pages, and item management inside each category
- **Items**: full CRUD from category detail pages, with identifier type/value fields for serial numbers, asset tags, service tags, IMEI, model numbers, or other details
- **Checkouts**: assign an item to a recipient with full name, phone number, and official email; check items back in with condition + notes
- **Dashboard**: assigned items, overdue items, low-stock supplies, category breakdown, history by recipient, history by item
- **PWA**: installable on phones, manifest + service worker configured

## What's not built yet

- Password/OAuth login; current login is an access-list email check
- Overdue email alerts (needs Gmail/Sheets credentials to send from)
- Deployment to the Hostinger VPS

## Next steps to go live

1. Run `supabase/schema.sql` in your Supabase project.
2. Add `.env.local` with your Supabase URL and service-role key.
3. Replace the placeholder super-admin email with the boss's real email.
4. Add real auth, such as Supabase Auth magic links or Google Workspace SSO.
5. Set up overdue email alerts.
6. Deploy to the VPS with PM2: `pm2 start npm --name inventory -- start`

## Project structure

```
src/
├── app/
│   ├── (app)/              # authenticated routes (dashboard, categories, checkouts, access)
│   ├── api/                # API routes — the only place that talks to the data layer
│   └── login/
├── components/
│   ├── ui/                 # shared primitives (Modal, StatusPill, PageHeader, FormField)
│   ├── layout/              # Sidebar, MobileNav, AppShell
│   ├── categories/ items/ checkouts/ dashboard/
├── lib/
│   ├── data/                # DataStore interface + MockStore implementation
│   ├── auth/                # session helpers
│   ├── dashboard.ts         # dashboard view aggregation
│   └── checkout-status.ts   # overdue detection
└── types/                   # shared TypeScript types
```
