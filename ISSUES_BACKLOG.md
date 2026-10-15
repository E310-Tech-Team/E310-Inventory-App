# E310 Inventory & Device Management Platform
# Complete GitHub Issues Backlog (36 Modular Issues)

This document contains the complete, assignable issue backlog for the E310 platform revamp. Every issue is pre-formatted with clear descriptions, implementation guidelines, branch naming conventions, and verifiable acceptance criteria.

---

## Table of Contents
* [Phase 1: Database Schema, Types & Authentication (Issues #1 - #7)](#phase-1-database-schema-types--authentication)
* [Phase 2: Design System, UI Tokens & App Shell (Issues #8 - #13)](#phase-2-design-system-ui-tokens--app-shell)
* [Phase 3: Portal 1 — Staff Self-Service Portal (Issues #14 - #21)](#phase-3-portal-1--staff-self-service-portal)
* [Phase 4: Portal 2 — Tech Team Command Center (Issues #22 - #29)](#phase-4-portal-2--tech-team-command-center)
* [Phase 5: Multi-Channel Notifications & Ticket Delegation (Issues #30 - #33)](#phase-5-multi-channel-notifications--ticket-delegation)
* [Phase 6: PWA, Mobile Optimization & Launch QA (Issues #34 - #36)](#phase-6-pwa-mobile-optimization--launch-qa)

---

## Phase 1: Database Schema, Types & Authentication

### Issue #1: [Database] Create `device_complaints` Table and Policies in Supabase
* **Branch:** `feature/issue-01-device-complaints-schema`
* **Description:** Add the `public.device_complaints` table in Supabase to track all hardware and software issues reported by staff.
* **Implementation Guidelines:**
  * Create `supabase/migrations/01_device_complaints.sql`.
  * Fields: `id`, `ticket_number` (unique, format `TKT-YYYY-XXXX`), `user_id` (references `department_users`), `item_id` (nullable), `device_summary`, `issue_type`, `severity` (`low`, `medium`, `high`, `critical`), `title`, `description`, `attachment_urls`, `status` (`submitted`, `under-review`, `in-repair`, `resolved`, `cancelled`), `assigned_tech_id`, `resolution_notes`, `resolved_at`, `created_at`, `updated_at`.
  * Add trigger for `updated_at`.
  * Add RLS policies granting full access to `service_role`.
* **Acceptance Criteria:**
  - [ ] Migration script runs cleanly without syntax errors.
  - [ ] Ticket numbers auto-increment or format consistently.
  - [ ] Foreign keys to `department_users` and `items` correctly enforced.

---

### Issue #2: [Database] Create `portal_options` Dynamic Form Engine in Supabase
* **Branch:** `feature/issue-02-portal-options-schema`
* **Description:** Create the `public.portal_options` table allowing the Tech Team to dynamically manage dropdown options (device types, brands, issue categories) from the UI without code changes.
* **Implementation Guidelines:**
  * Create `supabase/migrations/02_portal_options.sql`.
  * Fields: `id`, `category_group` (text), `label` (text), `value` (text), `is_active` (boolean default true), `display_order` (integer default 0), `created_at`.
  * Add seed entries for initial groups: `device_type`, `device_brand`, `issue_type`, `department`.
* **Acceptance Criteria:**
  - [ ] Table created with indices on `category_group` and `is_active`.
  - [ ] Seed data populates initial dropdown options.

---

### Issue #3: [Database] Create `notifications` & `audit_logs` Tables in Supabase
* **Branch:** `feature/issue-03-notifications-audit-schema`
* **Description:** Create database tables to support the in-portal multi-channel notifications and live tech audit activity feed.
* **Implementation Guidelines:**
  * Create `supabase/migrations/03_notifications_audit.sql`.
  * `public.notifications`: `id`, `recipient_id`, `title`, `message`, `notification_type`, `link_url`, `is_read`, `email_sent`, `created_at`.
  * `public.audit_logs`: `id`, `actor_id`, `actor_name`, `action_type`, `entity_type`, `entity_id`, `details` (jsonb), `created_at`.
* **Acceptance Criteria:**
  - [ ] Both tables created with foreign keys and timestamp defaults.
  - [ ] Index on `recipient_id` and `is_read` for rapid notification queries.

---

### Issue #4: [Database] Extend `department_users` with Staff Attributes & `@r4cglobal.org` Domain Constraint
* **Branch:** `feature/issue-04-users-domain-enhancement`
* **Description:** Add missing profile attributes (`staff_id`, `phone`, `department`) and enforce organization-wide email domain restriction to `@r4cglobal.org`.
* **Implementation Guidelines:**
  * Create `supabase/migrations/04_enhance_users.sql`.
  * Alter `public.department_users` to add columns `staff_id text`, `phone text`, `department text`.
  * Add check constraint: `check (email like '%@r4cglobal.org')`.
* **Acceptance Criteria:**
  - [ ] Schema allows updating existing users to `@r4cglobal.org`.
  - [ ] Any insert or update with a non-`@r4cglobal.org` email is rejected at the DB level.

---

### Issue #5: [Types] Expand Shared TypeScript Models in `src/types/index.ts`
* **Branch:** `feature/issue-05-typescript-models`
* **Description:** Update shared TypeScript interfaces across the entire repository to reflect new entities and dual-portal roles.
* **Implementation Guidelines:**
  * Edit `src/types/index.ts`.
  * Update `UserRole` to: `'super-admin' | 'tech-support' | 'staff'`.
  * Add `DeviceComplaint` interface (matching ticket schema).
  * Add `PortalOption` interface.
  * Add `Notification` interface.
  * Add `AuditLog` interface.
* **Acceptance Criteria:**
  - [ ] All new interfaces exported with strict typing.
  - [ ] `npm run build` passes with zero type errors.

---

### Issue #6: [DataStore] Implement Repository Methods in `src/lib/data/`
* **Branch:** `feature/issue-06-datastore-methods`
* **Description:** Extend `DataStore` interface and `SupabaseStore` implementation to support CRUD for complaints, dynamic options, notifications, and audit logs.
* **Implementation Guidelines:**
  * Edit `src/lib/data/types.ts` and `src/lib/data/supabase-store.ts`.
  * Implement:
    * `getComplaints()`, `getComplaintsByUser(userId)`, `createComplaint()`, `updateComplaint()`.
    * `getPortalOptions(group?)`, `createPortalOption()`, `updatePortalOption()`, `deletePortalOption()`.
    * `getNotifications(userId)`, `markNotificationRead(id)`.
    * `createAuditLog()`, `getRecentAuditLogs(limit)`.
* **Acceptance Criteria:**
  - [ ] Unit tests or integration calls return expected typed rows.
  - [ ] Clean error handling using `throwOnError` wrapper.

---

### Issue #7: [Auth] Enforce `@r4cglobal.org` Domain & Multi-Role Portal Routing
* **Branch:** `feature/issue-07-auth-domain-routing`
* **Description:** Update login route and authentication middleware to validate `@r4cglobal.org`, handle pending accounts, and direct users to their assigned portal.
* **Implementation Guidelines:**
  * Edit `src/app/api/auth/login/route.ts` and `src/lib/auth/session.ts`.
  * Reject emails not ending in `@r4cglobal.org`.
  * If `status === 'pending'`, issue restricted session and return `mustChangePassword: true`.
  * Return user role so the client router knows whether to route to `/staff` or `/tech`.
* **Acceptance Criteria:**
  - [ ] Non-`@r4cglobal.org` emails receive 403 error.
  - [ ] Pending users are routed directly to `/change-password`.
  - [ ] Active staff land on `/staff`, tech admins land on `/tech`.

---

## Phase 2: Design System, UI Tokens & App Shell

### Issue #8: [Design System] Light Mode Palette & Global Design Tokens
* **Branch:** `feature/issue-08-light-mode-tokens`
* **Description:** Establish the crisp Light Mode design system across `src/app/globals.css` with pure white backgrounds, subtle off-white layering, and high-contrast typography.
* **Implementation Guidelines:**
  * Define CSS variables:
    * Canvas: `#FFFFFF`, Surface Subtle: `#F8FAFC`, Border: `#E2E8F0`.
    * Text Primary: `#0F172A`, Text Secondary: `#64748B`.
    * Accent Lime: `#D4F868`, Accent Teal: `#0D9488`.
  * Enforce Google Font `Plus Jakarta Sans` or `Inter` in `src/app/layout.tsx`.
* **Acceptance Criteria:**
  - [ ] All dark theme legacy classes replaced with clean light-mode tokens.
  - [ ] High contrast ratios pass WCAG AA accessibility standards.

---

### Issue #9: [Branding] E310 Vector Logo & Role Context Badge
* **Branch:** `feature/issue-09-e310-brand-logo`
* **Description:** Implement the vector `E310` wordmark logo component and dynamic role context indicator badge as seen in the reference dashboard.
* **Implementation Guidelines:**
  * Create `src/components/common/E310Logo.tsx` rendering vector SVG.
  * Create `src/components/common/RoleContextBadge.tsx` displaying `Working as Staff` or `Working as Tech Support` based on session.
* **Acceptance Criteria:**
  - [ ] Logo renders sharply at all resolutions.
  - [ ] Context badge dynamically switches based on active portal context.

---

### Issue #10: [UI Primitives] Reusable Common Component Library
* **Branch:** `feature/issue-10-ui-primitives`
* **Description:** Build standardized, reusable light-mode UI primitives under `src/components/common/`.
* **Implementation Guidelines:**
  * Create:
    * `Button.tsx` (variants: primary lime, secondary subtle, destructive, ghost).
    * `Input.tsx` and `Select.tsx` with floating label, error state, and icon support.
    * `Modal.tsx` accessible dialog with backdrop blur and escape key listener.
    * `Badge.tsx` for status pills (Active, Overdue, Under Review, Resolved).
* **Acceptance Criteria:**
  - [ ] All components fully typed with TypeScript.
  - [ ] Smooth focus rings and hover transitions.

---

### Issue #11: [Navigation] Collapsible Enterprise Sidebar
* **Branch:** `feature/issue-11-collapsible-sidebar`
* **Description:** Implement the multi-tier desktop sidebar with collapsible navigation groups and high-contrast active tab indicator.
* **Implementation Guidelines:**
  * Create `src/components/layout/Sidebar.tsx`.
  * Support collapse/expand with persistence in `localStorage`.
  * Active link styling uses high-contrast neon/lime pill (`#D4F868`) with dark text.
  * Profile footer with user avatar, name, staff ID, and logout button.
* **Acceptance Criteria:**
  - [ ] Sidebar collapses smoothly to icon-only rail.
  - [ ] Correct routes highlighted based on `usePathname()`.

---

### Issue #12: [Header] Top Command Bar & Global Search Modal (`⌘K`)
* **Branch:** `feature/issue-12-command-search-header`
* **Description:** Build the persistent top application header with quick search trigger (`⌘K`), notification bell icon, and quick action icons.
* **Implementation Guidelines:**
  * Create `src/components/layout/TopHeader.tsx`.
  * Create `src/components/layout/CommandSearchModal.tsx` triggered by `⌘K` or search bar click.
  * Allows searching across devices, tickets, and staff members.
* **Acceptance Criteria:**
  - [ ] Pressing `Cmd+K` or `Ctrl+K` opens the search modal immediately.
  - [ ] Keyboard navigation (arrow keys + Enter) works inside results.

---

### Issue #13: [Layout] Unified `AppShell` with Role-Aware Portal Switching
* **Branch:** `feature/issue-13-unified-app-shell`
* **Description:** Build the root `AppShell` wrapping all authenticated pages, automatically configuring sidebar links and permissions based on user role.
* **Implementation Guidelines:**
  * Create `src/components/layout/AppShell.tsx`.
  * Reads session and conditionally renders Staff links (`Home`, `My Devices`, `Report Issue`) vs Tech links (`Dashboard`, `Inventory`, `Tickets`, `Options`, `Users`).
* **Acceptance Criteria:**
  - [ ] Staff cannot view tech admin links in sidebar.
  - [ ] Super Admins have a one-click toggle to preview Staff View.

---

## Phase 3: Portal 1 — Staff Self-Service Portal

### Issue #14: [Staff UI] Staff Home Dashboard & Hero Greeting
* **Branch:** `feature/issue-14-staff-home-dashboard`
* **Description:** Build the Staff Portal landing page with the hero greeting (`Welcome back, [Name] 👋`), live date, and modular quick action cards.
* **Implementation Guidelines:**
  * Create `src/app/staff/page.tsx` and `src/components/staff/StaffDashboard.tsx`.
  * Include:
    * Greeting banner with dynamic date.
    * Quick cards: "My Primary Device", "Report a Problem", "Equipment Policy".
    * IT Bulletin announcement widget.
* **Acceptance Criteria:**
  - [ ] Displays user's first name accurately from session.
  - [ ] Quick cards trigger their respective modal or view.

---

### Issue #15: [Staff API] Equipment Retrieval Endpoint (`GET /api/staff/devices`)
* **Branch:** `feature/issue-15-staff-devices-api`
* **Description:** Implement secure server route handler returning all hardware devices currently assigned to the authenticated staff member.
* **Implementation Guidelines:**
  * Create `src/app/api/staff/devices/route.ts`.
  * Query `checkouts` and `items` joined where `assigned_to_email === session.user.email` and `status === 'active'`.
* **Acceptance Criteria:**
  - [ ] Only returns items belonging to the requesting user.
  - [ ] Returns 401 if unauthenticated.

---

### Issue #16: [Staff UI] "My Assigned Devices" View
* **Branch:** `feature/issue-16-staff-devices-view`
* **Description:** Build the staff asset view showing all company equipment in the user's custody with status badges and condition history.
* **Implementation Guidelines:**
  * Create `src/app/staff/devices/page.tsx` and `src/components/staff/MyDevicesList.tsx`.
  * Display device cards with specs, serial number, date collected, and "Report Issue" action button.
* **Acceptance Criteria:**
  - [ ] Empty state shown if user has no assigned devices.
  - [ ] Clicking "Report Issue" pre-fills the complaint modal with that device's details.

---

### Issue #17: [Staff API] Device Self-Registration Endpoint (`POST /api/staff/devices/register`)
* **Branch:** `feature/issue-17-staff-register-device-api`
* **Description:** Implement route handler allowing staff members to register hardware received from IT.
* **Implementation Guidelines:**
  * Create `src/app/api/staff/devices/register/route.ts`.
  * Validate device category, model, serial number, and initial condition.
  * Insert item record with `registered_by_staff = true` and `status = 'checked-out'`.
  * Create checkout log assigning custody to the submitting staff member.
* **Acceptance Criteria:**
  - [ ] Returns 400 for missing serial number or device type.
  - [ ] Logs activity in `audit_logs`.

---

### Issue #18: [Staff UI] Device Self-Registration Guided Modal
* **Branch:** `feature/issue-18-staff-register-modal`
* **Description:** Build the guided modal for staff to register their laptop, phone, or accessory with dynamic dropdowns.
* **Implementation Guidelines:**
  * Create `src/components/staff/RegisterDeviceModal.tsx`.
  * Consumes dynamic options from `/api/staff/options` for Device Type and Brand.
  * Form validation with instant feedback on duplicate serial numbers.
* **Acceptance Criteria:**
  - [ ] Dropdowns populate dynamically from `portal_options`.
  - [ ] Successful registration closes modal, refreshes device list, and shows toast notification.

---

### Issue #19: [Staff API] Complaint Management Endpoints (`/api/staff/complaints`)
* **Branch:** `feature/issue-19-staff-complaints-api`
* **Description:** Implement `POST` and `GET` route handlers for staff ticket submission and progress tracking.
* **Implementation Guidelines:**
  * Create `src/app/api/staff/complaints/route.ts` and `src/app/api/staff/complaints/[id]/route.ts`.
  * `POST`: Auto-generates unique `ticket_number` (`TKT-YYYY-XXXX`), validates issue category, saves attachments, and triggers notification broadcast.
  * `GET`: Returns list of complaints submitted by logged-in user.
* **Acceptance Criteria:**
  - [ ] User can only view their own tickets.
  - [ ] Creating a complaint triggers entry in `public.notifications` for tech team.

---

### Issue #20: [Staff UI] File a Complaint / Repair Request Modal
* **Branch:** `feature/issue-20-staff-complaint-modal`
* **Description:** Build the ticket creation dialog allowing staff to describe device faults, select severity, and attach screenshots or photos.
* **Implementation Guidelines:**
  * Create `src/components/staff/CreateComplaintModal.tsx`.
  * Fields: Select Assigned Device (or type manually), Issue Category (Screen, Battery, OS, Physical Damage), Severity (Low, Medium, High, Critical), Description, Photo/File upload.
* **Acceptance Criteria:**
  - [ ] Form validates required fields before submission.
  - [ ] Shows clear confirmation banner with assigned Ticket Number upon success.

---

### Issue #21: [Staff UI] "My Support Tickets" Status Tracker
* **Branch:** `feature/issue-21-staff-ticket-tracker`
* **Description:** Build the staff ticket tracking page showing active and resolved complaints with a visual progress stepper.
* **Implementation Guidelines:**
  * Create `src/app/staff/complaints/page.tsx` and `src/components/staff/ComplaintTrackerList.tsx`.
  * Visual stepper: `Submitted` ➔ `Under Review` ➔ `In Repair` ➔ `Resolved`.
  * Displays technician notes when resolution is completed.
* **Acceptance Criteria:**
  - [ ] Progress stepper clearly reflects current ticket status.
  - [ ] Tickets filterable by status (`All`, `Active`, `Resolved`).

---

## Phase 4: Portal 2 — Tech Team Command Center

### Issue #22: [Tech UI] Command Center Dashboard & Executive KPI Cards
* **Branch:** `feature/issue-22-tech-dashboard-kpis`
* **Description:** Build the Tech Team command center dashboard featuring metric cards for active complaints, overdue checkouts, total inventory, and low stock.
* **Implementation Guidelines:**
  * Create `src/app/tech/page.tsx` and `src/components/tech/TechDashboard.tsx`.
  * Metric cards: Total Assets, Checked Out, Pending Complaints, Overdue Returns.
  * High-priority alert banner for tickets with severity `'critical'`.
* **Acceptance Criteria:**
  - [ ] Metrics load asynchronously with skeleton loaders.
  - [ ] Clicking a metric card navigates directly to that filtered view.

---

### Issue #23: [Tech API] Tech Complaints & Triage Endpoints (`/api/tech/complaints`)
* **Branch:** `feature/issue-23-tech-complaints-api`
* **Description:** Implement route handlers for tech administrators to query, filter, update, and resolve all organization tickets.
* **Implementation Guidelines:**
  * Create `src/app/api/tech/complaints/route.ts` and `src/app/api/tech/complaints/[id]/route.ts`.
  * Query parameters: `status`, `severity`, `assigned_tech_id`, `search`.
  * `PATCH`: Updates status, adds `resolution_notes`, sets `resolved_at` when closed.
* **Acceptance Criteria:**
  - [ ] Restricted strictly to `tech-support` and `super-admin` roles.
  - [ ] Status transitions trigger notification back to staff member.

---

### Issue #24: [Tech UI] Real-Time Live Activity Feed
* **Branch:** `feature/issue-24-tech-activity-feed`
* **Description:** Build a real-time audit log timeline component on the tech dashboard tracking staff device registrations, ticket updates, and checkouts.
* **Implementation Guidelines:**
  * Create `src/app/api/tech/activity/route.ts` and `src/components/tech/LiveActivityTimeline.tsx`.
  * Visual timeline items with actor name, timestamp, action icon, and target device/ticket badge.
* **Acceptance Criteria:**
  - [ ] Displays events chronologically with relative timestamps ("5 minutes ago").
  - [ ] Supports auto-refresh or polling toggle.

---

### Issue #25: [Tech API] Dynamic Options Management Endpoints (`/api/tech/options`)
* **Branch:** `feature/issue-25-tech-options-api`
* **Description:** Implement CRUD route handlers for managing the dynamic form dropdown options stored in `portal_options`.
* **Implementation Guidelines:**
  * Create `src/app/api/tech/options/route.ts` and `src/app/api/tech/options/[id]/route.ts`.
  * `POST`: Add new dropdown option.
  * `PATCH`: Toggle active/inactive, update label, or reorder.
  * `DELETE`: Soft delete or disable option to preserve historic references.
* **Acceptance Criteria:**
  - [ ] Validation ensures `category_group`, `label`, and `value` are non-empty.
  - [ ] Changes immediately reflect in staff form dropdowns.

---

### Issue #26: [Tech UI] Dynamic Options Manager Interface
* **Branch:** `feature/issue-26-tech-options-manager-ui`
* **Description:** Build the settings interface allowing the Tech Team to add, edit, disable, and reorder dropdown items for staff forms.
* **Implementation Guidelines:**
  * Create `src/app/tech/options/page.tsx` and `src/components/tech/OptionsManager.tsx`.
  * Tabbed layout by category group: `Device Types`, `Brands/Models`, `Issue Types`, `Departments`.
  * In-line editing and toggle switches for activation.
* **Acceptance Criteria:**
  - [ ] Tech can add a new device brand or model in under 10 seconds.
  - [ ] Disabled options hide from staff forms without breaking existing records.

---

### Issue #27: [Tech UI] Device Self-Registration Approval Queue
* **Branch:** `feature/issue-27-device-approval-queue`
* **Description:** Build a verification queue where tech admins can inspect, verify, and approve staff self-registered equipment before it enters the official inventory.
* **Implementation Guidelines:**
  * Create `src/app/tech/approvals/page.tsx` and `src/components/tech/DeviceApprovalQueue.tsx`.
  * Shows unverified devices submitted by staff. Actions: "Approve & Tag Asset", "Reject / Request Info".
* **Acceptance Criteria:**
  - [ ] Approving links the item to the official catalog and notifies the staff member.
  - [ ] Rejecting sends an explanatory note back to staff.

---

### Issue #28: [Tech UI] Inventory & Asset Catalog Modernization
* **Branch:** `feature/issue-28-inventory-catalog-revamp`
* **Description:** Refactor the existing items and category views to match the pure white light-mode design system with advanced multi-attribute filtering.
* **Implementation Guidelines:**
  * Redesign `src/app/tech/items/page.tsx` and `src/components/items/ItemsList.tsx`.
  * Filters: Category, Status (Available, Checked Out, In Repair, Damaged), Condition, Identifier Type.
  * Quick serial number search and CSV export trigger.
* **Acceptance Criteria:**
  - [ ] Clean card and desktop table view with pagination.
  - [ ] Modal for adding/editing items matches new design system.

---

### Issue #29: [Tech UI] Custody, Checkouts & Returns Management
* **Branch:** `feature/issue-29-checkouts-returns-revamp`
* **Description:** Overhaul checkouts tracking with overdue highlighting, return condition verification, and due-date extension workflow.
* **Implementation Guidelines:**
  * Redesign `src/app/tech/checkouts/page.tsx` and `src/components/checkouts/CheckoutsList.tsx`.
  * Prominent badge for overdue items.
  * Return modal captures return condition (`good`, `fair`, `damaged`) and automatically flags items needing repair.
* **Acceptance Criteria:**
  - [ ] Default view highlights active and overdue checkouts.
  - [ ] Returning a damaged item prompts immediate repair ticket creation.

---

## Phase 5: Multi-Channel Notifications & Ticket Delegation

### Issue #30: [Delegation API] Ticket Assignment Endpoint (`POST /api/tech/complaints/[id]/assign`)
* **Branch:** `feature/issue-30-ticket-assign-api`
* **Description:** Implement server route handler allowing Super Admins to assign or reassign any complaint to a specific tech admin or specialist.
* **Implementation Guidelines:**
  * Create `src/app/api/tech/complaints/[id]/assign/route.ts`.
  * Updates `assigned_tech_id` on the ticket, updates `status` to `'under-review'`.
  * Creates an internal notification in `notifications` for the assigned technician.
* **Acceptance Criteria:**
  - [ ] Only `super-admin` can reassign tickets.
  - [ ] Logs delegation event in `audit_logs`.

---

### Issue #31: [Tech UI] Ticket Triage & Specialist Assignment Modal
* **Branch:** `feature/issue-31-ticket-assignment-modal`
* **Description:** Build the assignment dialog in the tech ticket queue allowing Super Admins to delegate tickets with priority and notes.
* **Implementation Guidelines:**
  * Create `src/components/tech/AssignTicketModal.tsx`.
  * Dropdown selector listing all active tech team members.
  * Priority adjuster (`Low`, `Medium`, `High`, `Urgent`).
* **Acceptance Criteria:**
  - [ ] Modal displays technician workload (number of tickets currently open).
  - [ ] Submitting immediately updates ticket card in queue.

---

### Issue #32: [Notifications UI] In-Portal Alert Bell & Notification Drawer
* **Branch:** `feature/issue-32-in-portal-notifications`
* **Description:** Build the interactive notification bell in the top application header with unread badge counter and slide-out notification drawer.
* **Implementation Guidelines:**
  * Create `src/components/layout/NotificationBell.tsx` and `src/components/layout/NotificationDrawer.tsx`.
  * Polls `/api/notifications` or connects via Supabase real-time channel.
  * "Mark as Read" and "Clear All" actions.
* **Acceptance Criteria:**
  - [ ] Unread badge displays count of unread alerts.
  - [ ] Clicking a notification navigates directly to that ticket or device.

---

### Issue #33: [Email Service] Automated Multi-Channel Email Dispatch
* **Branch:** `feature/issue-33-email-notification-service`
* **Description:** Implement automated email notifications for new complaints (sent to tech team) and ticket resolution updates (sent to staff).
* **Implementation Guidelines:**
  * Create `src/lib/email/service.ts` and email templates in `src/lib/email/templates/`.
  * Integrates with SendGrid / Resend / Mailgun using existing `.env` configuration.
  * Dispatches asynchronously to avoid blocking API responses.
* **Acceptance Criteria:**
  - [ ] Tech team receives email within 60 seconds of complaint submission.
  - [ ] Staff receives email confirmation upon resolution.

---

## Phase 6: PWA, Mobile Optimization & Launch QA

### Issue #34: [Mobile UX] Bottom Navigation Bar & Mobile Card Stack
* **Branch:** `feature/issue-34-mobile-bottom-nav`
* **Description:** Implement mobile-specific navigation bar and replace horizontal data tables with responsive stacked cards on viewport widths under 640px.
* **Implementation Guidelines:**
  * Create `src/components/layout/MobileBottomNav.tsx`.
  * Mobile tab bar with icons for: `Home`, `Devices`, `Report`, `Profile`.
  * Refactor table views using Tailwind responsive utilities (`hidden md:table`, `block md:hidden`).
* **Acceptance Criteria:**
  - [ ] Flawless usability on iPhone and Android screen widths (375px - 430px).
  - [ ] Zero horizontal overflow or awkward side-scrolling.

---

### Issue #35: [PWA] Web App Manifest, Install Prompt & Offline Resilience
* **Branch:** `feature/issue-35-pwa-install-offline`
* **Description:** Polish PWA capabilities with complete manifest metadata, standalone mobile display, and in-app "Install App" prompt.
* **Implementation Guidelines:**
  * Update `public/manifest.json` with app name "E310 Inventory", high-res icons, and theme color `#FFFFFF`.
  * Create `src/components/common/PwaInstallPrompt.tsx` detecting `beforeinstallprompt` event.
  * Configure service worker cache for offline shell access.
* **Acceptance Criteria:**
  - [ ] Passes Lighthouse PWA audit.
  - [ ] Install button triggers native browser install sheet.

---

### Issue #36: [Security & QA] End-to-End Route Guarding & Verification Suite
* **Branch:** `feature/issue-36-security-launch-qa`
* **Description:** Final security hardening, RBAC route guarding verification, and end-to-end user journey validation across both portals.
* **Implementation Guidelines:**
  * Verify middleware in `src/middleware.ts` restricts `/tech/*` and `/api/tech/*` exclusively to `tech-support` and `super-admin`.
  * Audit all API endpoints against SQL injection, missing user validation, and IDOR vulnerabilities.
  * Run full `npm run build` and `npm run lint`.
* **Acceptance Criteria:**
  - [ ] Staff attempting to access `/tech/dashboard` are redirected to `/staff` with 403.
  - [ ] Production build succeeds with zero TypeScript or ESLint warnings.
