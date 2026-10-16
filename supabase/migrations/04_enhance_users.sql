-- Migration: 04_enhance_users.sql
-- Description: Extend department_users with staff_id, phone, department, and enforce @r4cglobal.org email domain constraint.
-- Issue: #4

-- 1. Normalize any legacy user emails to @r4cglobal.org domain prior to applying constraint
update public.department_users
set email = lower(regexp_replace(email, '@.*$', '@r4cglobal.org'))
where email not like '%@r4cglobal.org';

-- 2. Add profile attributes (staff_id, phone, department)
alter table public.department_users
  add column if not exists staff_id text,
  add column if not exists phone text,
  add column if not exists department text;

-- 3. Enforce organization-wide @r4cglobal.org email domain constraint
alter table public.department_users
  drop constraint if exists check_department_users_email_domain;

alter table public.department_users
  add constraint check_department_users_email_domain
  check (email like '%@r4cglobal.org');

-- 4. Create performance indexes for profile attributes
create index if not exists idx_department_users_staff_id on public.department_users(staff_id);
create index if not exists idx_department_users_department on public.department_users(department);
