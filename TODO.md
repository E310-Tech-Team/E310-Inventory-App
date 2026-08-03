# Auth Flow Rework TODO

## Goal
Remove standalone sign-up. Onboard members sign in with a temporary password and are forced to set a permanent password on first login.

## Steps
- [x] 1. Update `src/lib/auth/session.ts` to allow `pending` users to hold a session
- [x] 2. Update `src/lib/auth/permissions.ts` to require `status === "active"` for API access
- [x] 3. Create `src/app/api/auth/change-password/route.ts`
- [x] 4. Create `src/components/auth/ChangePasswordForm.tsx`
- [x] 5. Create `src/app/change-password/page.tsx`
- [x] 6. Update `src/app/api/auth/login/route.ts` to allow pending users + return `mustChangePassword`
- [x] 7. Update `src/components/auth/LoginForm.tsx` (remove signup button, redirect pending users)
- [x] 8. Update `src/app/login/page.tsx` to redirect pending users
- [x] 9. Update `src/app/(app)/layout.tsx` to redirect pending users
- [x] 10. Update `src/components/access/AccessList.tsx` onboarding helper text
- [x] 11. Delete signup page, components, and API route
- [x] 12. Update README to remove signup references
- [x] 13. Verify build/lint
