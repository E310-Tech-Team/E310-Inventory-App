-- Migration: 05_items_self_registration.sql
-- Description: Add registered_by_staff and approval_status to items table.
-- Issue: #17

alter table public.items
  add column if not exists registered_by_staff boolean not null default false,
  add column if not exists approval_status text not null default 'approved' check (approval_status in ('pending', 'approved', 'rejected'));

create index if not exists idx_items_registered_by_staff on public.items(registered_by_staff, approval_status);
