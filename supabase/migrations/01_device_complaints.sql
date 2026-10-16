-- Migration: 01_device_complaints.sql
-- Description: Create device_complaints table, ticket sequence, indexes, and RLS policies.
-- Issue: #1

-- 1. Create auto-increment sequence for human-readable ticket numbers
create sequence if not exists public.device_complaint_ticket_seq start with 1 increment by 1;

-- 2. Create device_complaints table
create table if not exists public.device_complaints (
  id uuid primary key default gen_random_uuid(),
  ticket_number text unique not null default (
    'TKT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.device_complaint_ticket_seq'::regclass)::text, 4, '0')
  ),
  user_id uuid not null references public.department_users(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  device_summary text not null check (char_length(trim(device_summary)) > 0),
  issue_type text not null check (char_length(trim(issue_type)) > 0),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  title text not null check (char_length(trim(title)) > 0),
  description text not null check (char_length(trim(description)) > 0),
  attachment_urls text[] default '{}',
  status text not null default 'submitted' check (status in ('submitted', 'under-review', 'in-repair', 'resolved', 'cancelled')),
  assigned_tech_id uuid references public.department_users(id) on delete set null,
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Create performance indexes
create index if not exists idx_device_complaints_user_id on public.device_complaints(user_id);
create index if not exists idx_device_complaints_item_id on public.device_complaints(item_id);
create index if not exists idx_device_complaints_status on public.device_complaints(status);
create index if not exists idx_device_complaints_assigned_tech on public.device_complaints(assigned_tech_id);
create index if not exists idx_device_complaints_created_at on public.device_complaints(created_at desc);

-- 4. Automatically maintain updated_at timestamp
drop trigger if exists set_device_complaints_updated_at on public.device_complaints;
create trigger set_device_complaints_updated_at
before update on public.device_complaints
for each row execute function public.set_updated_at();

-- 5. Row-Level Security and Permissions
alter table public.device_complaints enable row level security;

revoke all on public.device_complaints from anon, authenticated;
grant select, insert, update, delete on public.device_complaints to service_role;
grant usage, select on sequence public.device_complaint_ticket_seq to service_role;
