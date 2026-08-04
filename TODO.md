# Task Progress

## Goals
1. Checkouts page defaults to "Active" filter.
2. Home page greeting: buttons (Dashboard, Categories, Checkouts) pop in after ~2.5s with greeting shifting up smoothly; centered.
3. Home becomes a clickable nav page (desktop sidebar + mobile nav) with Home link.
4. Mobile nav reduced to fit all items proportionally on screen.
5. Desktop sidebar collapsible from the side; closed by default when signing in; toggle button to expand/collapse.
6. Login redirect lands on Home ("/") so the greeting animation is shown after sign-in.

## Steps
- [x] 1. CheckoutsList: change default filter from "all" to "active".
- [x] 2. HomePage: convert to client component with delayed animation + action buttons.
- [x] 3. Sidebar: add Home nav item, fix active state, add collapsed mode + toggle, default closed.
- [x] 4. MobileNav: add Home nav item, fix active state, reduce sizes to fit screen.
- [x] 5. AppShell: manage collapsed state (default true) and pass to Sidebar.
- [x] 6. LoginForm + ChangePasswordForm: redirect to "/" after sign in / password change.
- [x] 7. Build/verify (npm run lint / tsc).
- [x] 8. Checkouts: responsive layout so mobile cards fit the screen (mobile cards, desktop table).
- [x] 8a. Checkouts: cards are clickable (open details modal).
- [x] 9. AccessList: stacked clickable cards on mobile.
- [x] 10. ItemsList: stacked clickable cards on mobile.
- [x] 11. CategoriesList: stacked clickable cards on mobile.
- [x] 12. CategoryDetailView: stacked clickable cards on mobile.
- [x] 13. DashboardView: stacked clickable cards on mobile for all tables.
- [x] 14. Build/verify (tsc + eslint).
- [x] 15. Home greeting reveal delay set to 1.3s per user feedback.
- [x] 16. Dashboard landing redesigned to 4 big bold centered at-a-glance cards (Overdue, Low stock, Pending requests, Recently added) with expandable lists; raw tables moved to "By category" and "History" tabs; mobile responsive.
- [x] 17. Categories: clicking a category navigates to its detail page (not a popup) with full item CRUD; each item is clickable to view full details.
- [x] 18. Verified: production build (npm run build) succeeds; dev server running on localhost:3000 serving current code; / redirects to /login when unauthenticated; /login returns 200.


