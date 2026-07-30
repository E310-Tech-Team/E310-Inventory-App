-- Fix the check constraint on department_users.status to include 'pending'
-- The schema.sql currently has: check (status in ('active', 'inactive', 'pending'))
-- If your table was created before 'pending' was added, you need to run this migration.

alter table public.department_users
drop constraint if exists department_users_status_check,
add constraint department_users_status_check
  check (status in ('active', 'inactive', 'pending'));

