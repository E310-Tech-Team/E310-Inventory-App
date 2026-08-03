# EThree10 Inventory App

EThree10's inventory system for equipment and supplies with invite-only onboarding and super-admin access control.

## What is included

- Invite-only user onboarding via pending Supabase users
- Direct sign-in with a temporary password, forcing a permanent password change on first login
- Super-admin access management for add/edit/deactivate/remove users
- Category management with item grouping and category detail pages
- Item CRUD with serial number / asset tag / identifier support
- Checkout assignment, return workflows, and condition tracking
- Dashboard views for assigned, overdue, and low-stock inventory
- CSV export reporting for inventory and checkout history
- PWA support with manifest and service worker configuration

## Built functionality

- `src/app/api/*`: all server routes and access validation
- `src/lib/data/`: Supabase data store and typed data mappings
- `src/lib/auth/`: session helpers, password hashing, and permission checks
- `src/components/`: feature-specific UI organized by domain
- `src/app/change-password/page.tsx`: forced password setup for pending users on first login

## Quick start

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Create a Supabase project.
4. Copy `.env.example` to `.env.local`.
5. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`

6. Run the database schema:

```bash
supabase db reset --schema-only
# or run the SQL in supabase/schema.sql manually
```

7. Start the dev server:

```bash
npm run dev
```

8. Open `http://localhost:3000`.

## Supabase setup

1. Run `supabase/schema.sql` in the Supabase SQL editor.
2. Run `supabase/import-google-sheet.sql` if you want the sample inventory import.
3. Update placeholder super-admin email entries in `department_users` to your real admin addresses.
4. Use the service-role key only in server-side code, not in client components.

## Developer onboarding

- `src/app/` contains the Next.js App Router pages and API routes.
- `src/components/` contains reusable UI and feature views.
- `src/lib/` contains backend helpers, data access, and business logic abstractions.
- `src/types/` contains shared TypeScript models and domain types.

## Folder structure

```
src/
├── app/
│   ├── (app)/              # authenticated routes for dashboard, categories, checkouts, access
│   ├── api/                # server route handlers
│   ├── login/              # login page
│   ├── change-password/    # forced password setup for pending users
├── components/             # UI and feature components
├── lib/                    # shared helpers and data layer
└── types/                  # TypeScript domain types
```

## Notes

- New members are invited by a super-admin as pending users. They sign in once with a temporary password and are prompted to set a permanent password on first login.
- Super-admins control user access and can only be changed through the admin access page.

## Run production

```bash
npm run build
npm run start
```

> Note: This project uses webpack for build and dev, not Turbopack, due to the PWA plugin compatibility.
