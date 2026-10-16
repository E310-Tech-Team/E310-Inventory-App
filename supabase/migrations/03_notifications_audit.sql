-- Migration: 03_notifications_audit.sql
-- Description: Create notifications and audit_logs tables, indexes, and RLS policies.
-- Issue: #3

-- 1. Create notifications table (Multi-Channel Dispatch Engine)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.department_users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  message text not null check (char_length(trim(message)) > 0),
  notification_type text not null check (
    notification_type in (
      'complaint_logged',
      'complaint_assigned',
      'complaint_status_changed',
      'device_registered',
      'device_approved',
      'system_alert'
    )
  ),
  link_url text,
  is_read boolean not null default false,
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. Performance indexes for notifications
create index if not exists idx_notifications_recipient_unread on public.notifications(recipient_id, is_read, created_at desc);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

-- 3. Row-Level Security for notifications
alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select, insert, update, delete on public.notifications to service_role;

-- 4. Create audit_logs table (Live Tech Activity Feed)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.department_users(id) on delete set null,
  actor_name text not null check (char_length(trim(actor_name)) > 0),
  action_type text not null check (char_length(trim(action_type)) > 0),
  entity_type text not null check (char_length(trim(entity_type)) > 0),
  entity_id text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 5. Performance indexes for audit_logs
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_action_type on public.audit_logs(action_type);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- 6. Row-Level Security for audit_logs
alter table public.audit_logs enable row level security;
revoke all on public.audit_logs from anon, authenticated;
grant select, insert, update, delete on public.audit_logs to service_role;
