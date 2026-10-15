# E310 Inventory & Device Management Platform

Enterprise hardware asset management, custody tracking, and IT support platform built for **R4C Global**, managed and operated by the **E310 Tech Agency**.

---

## Architecture Overview: The Dual-Portal System

The platform is architected as two dedicated portals sharing a unified Next.js + Supabase backend:

1. **Portal 1: Staff Self-Service Portal (Company-Wide)**
   * Built for all staff across R4C Global (`@r4cglobal.org`).
   * **Device Self-Registration:** Register company-issued laptops, phones, and peripherals with standardized dropdowns.
   * **My Assets Dashboard:** Real-time visibility into all equipment currently in the staff member's possession.
   * **Complaint & Fault Reporting:** Fast, structured issue submission (screen damage, battery degradation, OS faults, physical wear).
   * **Ticket Progress Tracking:** Transparent status updates (`Submitted`, `Under Review`, `In Repair`, `Resolved`).

2. **Portal 2: Tech Team Command Center (Back-End / Admin)**
   * Built for the E310 Tech Agency / Support Administrators.
   * **Live Activity Feed:** Real-time visibility of staff submissions, registrations, and complaints.
   * **Dynamic Options Engine:** Add, rename, or toggle form dropdown options for staff directly from the UI without code changes.
   * **Full Asset Inventory Management:** Complete CRUD operations for categories, serialized hardware, and bulk consumables.
   * **Multi-Channel Alerts:** Instant in-portal bell alerts and automated emails whenever a staff member files a complaint.
   * **Ticket Delegation:** Super Admins can assign repair tickets to specific team technicians.

---

## Product Requirements Document (PRD)

For comprehensive architectural specifications, database schemas, API contracts, and UX standards, review the full specification document:
👉 **[Read the Full PRD (PRD.md)](./PRD.md)**

---

## Visual Design & UI System

* **Strict Light Mode:** Clean, pure-white canvas (`#FFFFFF`) with subtle off-white layering (`#F8FAFC`) and hairline borders (`#E2E8F0`). *No dark mode.*
* **Enterprise Layout:** Inspired by modern executive dashboards (collapsible grouped sidebar, top command search bar `⌘K`, role context badge `Working as Staff` vs `Working as Tech Support`).
* **Design Accents:** High-contrast lime/neon active pills (`#D4F868`) and teal status indicators (`#0D9488`).
* **Mobile-First PWA:** Fully responsive across mobile, tablet, and desktop with standalone Progressive Web App installation support.

---

## Authentication & Onboarding Workflow

* **Domain Restriction:** Strictly enforced for verified `@r4cglobal.org` email accounts.
* **Admin-Provisioned Accounts:** Super Admins create accounts with a **default temporary password** (`status: 'pending'`).
* **Mandatory Password Creation:** On first sign-in, users are locked onto the `/change-password` screen and must set a permanent password before portal access is granted.

---

## Engineering & Collaboration Guidelines (Git Policy)

To maintain code quality across multiple contributors:

1. **Zero Direct Pushes to `main`:** All work must be conducted on feature branches.
2. **Branch Naming Pattern:** `feature/issue-<number>-<short-description>` (e.g., `feature/issue-03-device-registration`).
3. **Mandatory Implementation Plan:** Every contributor must write an implementation plan (files impacted, database/API contracts, UI states, test plan) before writing code.
4. **Pull Requests Only:** Changes must be submitted via PR targeting `main`, linked to the corresponding issue (`Closes #X`). Only the project lead / admin merges to `main`.
5. **Strict Code Quality:** Modular directory layout, strict TypeScript (no `any`), and reusable UI primitives.

---

## Tech Stack

* **Frontend:** Next.js (App Router), React, Vanilla CSS / Tailwind utilities, Lucide React Icons.
* **Backend:** Next.js Route Handlers (`src/app/api/`).
* **Database & Auth:** Supabase PostgreSQL with Service Role Administration.
* **PWA:** Web App Manifest & Service Worker for installability.
* **Deployment:** Vercel.

---

## Quick Start (Local Development)

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/E310-Tech-Team/E310-Inventory-App.git
   cd E310-Inventory-App
   npm install
   ```

2. Configure environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

3. Run the database schema in Supabase:
   * Execute `supabase/schema.sql` in the Supabase SQL Editor.

4. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.
