# Docker Full-Stack & Backend Guide

This project includes a Docker environment that runs the **Next.js Application** alongside a local **Supabase-compatible Backend** (PostgreSQL + PostgREST + API Gateway + Database GUI).

---

## Architecture Overview

```
                          ┌──────────────────────────┐
                          │   Browser / Host (Client) │
                          └─────────────┬────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 │                                             │
          (Port 3000)                                   (Port 54321)
                 │                                             │
                 ▼                                             ▼
        ┌─────────────────┐                          ┌──────────────────┐
        │    Next.js Web  │                          │  Nginx Gateway   │
        │  (App + Routes) │──────(Internal: 8000)───▶│   (/rest/v1/*)   │
        └─────────────────┘                          └─────────┬────────┘
                                                               │
                                                               ▼
                                                     ┌──────────────────┐
                                                     │    PostgREST     │
                                                     │   REST API Core  │
                                                     └─────────┬────────┘
                                                               │
                                                               ▼
                                                     ┌──────────────────┐
                                                     │   PostgreSQL 15  │
                                                     │ (supabase/schema)│
                                                     └──────────────────┘
                                                               ▲
                                                               │
                                                     ┌─────────┴────────┐
                                                     │     Adminer      │
                                                     │  (Web GUI :8080) │
                                                     └──────────────────┘
```

### Services & Port Mappings

| Service | Container Name | Host Port | Description |
| :--- | :--- | :--- | :--- |
| **Next.js Web** | `e310-web` | `http://localhost:3000` | Full Next.js frontend and backend route handlers |
| **Supabase Gateway** | `e310-supabase-gateway` | `http://localhost:54321` | Nginx gateway routing `/rest/v1/*` to PostgREST |
| **PostgREST** | `e310-supabase-rest` | Internal `3000` | High-performance Supabase REST API engine |
| **PostgreSQL** | `e310-supabase-db` | `localhost:54322` | PostgreSQL database automatically seeded with `schema.sql` |
| **Adminer** | `e310-adminer` | `http://localhost:8080` | Web database manager (browse tables, inspect records, run queries) |

---

## Quick Start: Full Stack

To build and start all services (Next.js app + backend):

```bash
docker compose up --build -d
```

Check running services:
```bash
docker compose ps
```

View application logs:
```bash
docker compose logs -f web
```

Stop everything:
```bash
docker compose down
```

---

## Alternative: Backend in Docker + Local Next.js (`npm run dev`)

If you want the database and Supabase API running in Docker, while running Next.js locally on your machine for ultra-fast local editing:

1. **Start the backend containers only:**
   ```bash
   docker compose up -d db rest gateway adminer
   ```

2. **Configure your `.env.local` to point to the local Docker backend:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   SUPABASE_URL=http://localhost:54321
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDEwMTIwMDAsImV4cCI6MTk1NjM3MjAwMH0.UsEo-2rJcMnv7J5MvriUvPUr8LOYsMkpv8O6rgMAEAw
   SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDEwMTIwMDAsImV4cCI6MTk1NjM3MjAwMH0.UsEo-2rJcMnv7J5MvriUvPUr8LOYsMkpv8O6rgMAEAw
   ```
   *(A reference file is provided at `.env.docker.example`)*

3. **Start Next.js locally:**
   ```bash
   npm run dev
   ```

---

## Alternative: Full-Stack in Docker with Live Code Reloading

If you want the entire stack inside Docker, but want changes in `./src` to hot-reload inside the container:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

---

## Inspecting the Database (Adminer GUI)

1. Open **[http://localhost:8080](http://localhost:8080)** in your browser.
2. Log in with:
   * **System:** `PostgreSQL`
   * **Server:** `db`
   * **Username:** `postgres`
   * **Password:** `postgres`
   * **Database:** `postgres`
3. You can inspect all tables (`department_users`, `items`, `categories`, `checkouts`, `device_complaints`, `portal_options`, `notifications`, `audit_logs`).

---

## Pre-seeded Test Users

The database initializes with the seed users defined in `supabase/schema.sql`:

* `boss@r4cglobal.org` (Super Admin)
* `ezekielgoodness@r4cglobal.org` (Super Admin)
* `admin2@r4cglobal.org` (Team Member / Tech)

---

## Resetting Database & Seed Data

To completely reset the database and re-run all initialization and seed scripts:

```bash
docker compose down -v
docker compose up -d
```
*(The `-v` flag removes the persistent `db-data` volume so Postgres re-runs `00-init-roles.sql` and `schema.sql` on startup).*

