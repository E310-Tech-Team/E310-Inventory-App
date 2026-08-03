# Auth Flow Restructuring

## Goal
- Remove the signup flow entirely (page, components, API route).
- Keep only sign-in via the general login page.
- Keep temp-password → forced change-password flow for new members.
- Super-admins sign in with just their email (no password).

## Steps
- [x] 1. Remove `/signup` page (`src/app/signup/page.tsx`)
- [x] 2. Remove `SignupForm` and `SignupStartForm` components
- [x] 3. Remove `/api/auth/signup` route
- [x] 4. Update `LoginForm` to remove password requirement for super-admins (email-only + optional password)
- [x] 5. Verify login route signs in super-admins with email only
- [x] 6. Build and verify
