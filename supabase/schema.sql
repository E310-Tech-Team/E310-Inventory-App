create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.department_users (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  email citext not null unique check (email like '%@r4cglobal.org'),
  password_hash text,
  role text not null check (role in ('super-admin', 'team-member', 'viewer')),
  status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  invited_by text,
  staff_id text,
  phone text,
  department text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  tracking_type text not null check (tracking_type in ('individual', 'quantity')),
  return_type text not null check (return_type in ('fixed-date', 'open-ended')),
  low_stock_threshold integer check (low_stock_threshold is null or low_stock_threshold >= 0),
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  serial_number text,
  identifier_type text check (
    identifier_type is null or
    identifier_type in ('serial-number', 'asset-tag', 'service-tag', 'imei', 'model-number', 'other')
  ),
  identifier_value text,
  quantity integer check (quantity is null or quantity >= 0),
  status text not null check (status in ('available', 'checked-out', 'low-stock')),
  condition text not null check (condition in ('new', 'good', 'fair', 'damaged')),
  notes text,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.checkouts (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  quantity integer check (quantity is null or quantity > 0),
  collected_by text not null,
  assigned_to_name text not null,
  assigned_to_phone text not null,
  assigned_to_email citext not null,
  condition_on_collection text not null check (condition_on_collection in ('new', 'good', 'fair', 'damaged')),
  collection_notes text,
  date_collected timestamptz not null default now(),
  due_date timestamptz,
  date_returned timestamptz,
  condition_on_return text check (condition_on_return is null or condition_on_return in ('new', 'good', 'fair', 'damaged')),
  return_notes text,
  status text not null check (status in ('active', 'returned', 'overdue'))
);

create sequence if not exists public.device_complaint_ticket_seq start with 1 increment by 1;

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

create table if not exists public.portal_options (
  id uuid primary key default gen_random_uuid(),
  category_group text not null check (char_length(trim(category_group)) > 0),
  label text not null check (char_length(trim(label)) > 0),
  value text not null check (char_length(trim(value)) > 0),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_portal_options_group_value unique (category_group, value)
);

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

create index if not exists idx_department_users_status on public.department_users(status);
create index if not exists idx_department_users_role_status on public.department_users(role, status);
create index if not exists idx_department_users_staff_id on public.department_users(staff_id);
create index if not exists idx_department_users_department on public.department_users(department);
create index if not exists idx_items_category_id on public.items(category_id);
create index if not exists idx_items_status on public.items(status);
create index if not exists idx_checkouts_item_id on public.checkouts(item_id);
create index if not exists idx_checkouts_status on public.checkouts(status);
create index if not exists idx_checkouts_collected_by on public.checkouts(collected_by);
create index if not exists idx_device_complaints_user_id on public.device_complaints(user_id);
create index if not exists idx_device_complaints_item_id on public.device_complaints(item_id);
create index if not exists idx_device_complaints_status on public.device_complaints(status);
create index if not exists idx_device_complaints_assigned_tech on public.device_complaints(assigned_tech_id);
create index if not exists idx_device_complaints_created_at on public.device_complaints(created_at desc);
create index if not exists idx_portal_options_group on public.portal_options(category_group, is_active, display_order);
create index if not exists idx_notifications_recipient_unread on public.notifications(recipient_id, is_read, created_at desc);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_action_type on public.audit_logs(action_type);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_department_users_updated_at on public.department_users;
create trigger set_department_users_updated_at
before update on public.department_users
for each row execute function public.set_updated_at();

drop trigger if exists set_device_complaints_updated_at on public.device_complaints;
create trigger set_device_complaints_updated_at
before update on public.device_complaints
for each row execute function public.set_updated_at();

drop trigger if exists set_portal_options_updated_at on public.portal_options;
create trigger set_portal_options_updated_at
before update on public.portal_options
for each row execute function public.set_updated_at();

alter table public.department_users enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.checkouts enable row level security;
alter table public.device_complaints enable row level security;
alter table public.portal_options enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.department_users from anon, authenticated;
revoke all on public.categories from anon, authenticated;
revoke all on public.items from anon, authenticated;
revoke all on public.checkouts from anon, authenticated;
revoke all on public.device_complaints from anon, authenticated;
revoke all on public.portal_options from anon, authenticated;
revoke all on public.notifications from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;

grant select, insert, update, delete on public.department_users to service_role;
grant select, insert, update, delete on public.categories to service_role;
grant select, insert, update, delete on public.items to service_role;
grant select, insert, update, delete on public.checkouts to service_role;
grant select, insert, update, delete on public.device_complaints to service_role;
grant select, insert, update, delete on public.portal_options to service_role;
grant select, insert, update, delete on public.notifications to service_role;
grant select, insert, update, delete on public.audit_logs to service_role;
grant usage, select on sequence public.device_complaint_ticket_seq to service_role;

insert into public.department_users (name, email, role, status, invited_by, staff_id, department)
values
  ('Department Lead', 'boss@r4cglobal.org', 'super-admin', 'active', null, 'R4C-001', 'Executive & Leadership'),
  ('Goodness', 'goodness.ezekiel@r4cglobal.org', 'super-admin', 'active', 'Department Lead', 'R4C-002', 'Software & Engineering'),
  ('Admin 2', 'admin2@r4cglobal.org', 'team-member', 'active', 'Department Lead', 'R4C-003', 'Operations & Logistics')
on conflict (email) do update set
  name = excluded.name,
  role = excluded.role,
  status = excluded.status,
  invited_by = excluded.invited_by,
  staff_id = excluded.staff_id,
  department = excluded.department;

insert into public.categories (id, name, tracking_type, return_type, low_stock_threshold, created_by, created_at)
values
  ('00000000-0000-4000-8000-000000000001', 'Laptops', 'individual', 'open-ended', null, 'Goodness', '2026-01-10T09:00:00.000Z'),
  ('00000000-0000-4000-8000-000000000002', 'Cameras', 'individual', 'fixed-date', null, 'Goodness', '2026-01-10T09:05:00.000Z'),
  ('00000000-0000-4000-8000-000000000003', 'Cables & Extensions', 'individual', 'fixed-date', null, 'Admin 2', '2026-01-10T09:10:00.000Z'),
  ('00000000-0000-4000-8000-000000000004', 'Office Supplies', 'quantity', 'open-ended', 5, 'Admin 2', '2026-01-10T09:15:00.000Z')
on conflict (id) do nothing;

insert into public.items (
  id,
  category_id,
  name,
  serial_number,
  identifier_type,
  identifier_value,
  quantity,
  status,
  condition,
  notes,
  created_by,
  created_at
)
values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'MacBook Pro 14"', 'C02FX1234ABC', 'serial-number', 'C02FX1234ABC', null, 'checked-out', 'good', null, 'Goodness', '2026-01-10T09:20:00.000Z'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'Dell XPS 15', 'DXP15-9922', 'service-tag', 'DXP15-9922', null, 'available', 'good', null, 'Goodness', '2026-01-10T09:22:00.000Z'),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000002', 'Canon EOS R6', 'CN-R6-0451', 'serial-number', 'CN-R6-0451', null, 'checked-out', 'good', null, 'Admin 2', '2026-01-10T09:25:00.000Z'),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000003', 'HDMI Cable 2m', 'HDMI-002', 'asset-tag', 'HDMI-002', null, 'available', 'fair', null, 'Admin 2', '2026-01-10T09:30:00.000Z'),
  ('00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000004', 'A4 Notebooks', null, null, null, 3, 'low-stock', 'new', null, 'Admin 2', '2026-01-10T09:35:00.000Z')
on conflict (id) do nothing;

insert into public.checkouts (
  id,
  item_id,
  quantity,
  collected_by,
  assigned_to_name,
  assigned_to_phone,
  assigned_to_email,
  condition_on_collection,
  collection_notes,
  date_collected,
  due_date,
  date_returned,
  condition_on_return,
  return_notes,
  status
)
values
  (
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000101',
    null,
    'Goodness',
    'Goodness',
    '+234 800 000 0001',
    'goodness.ezekiel@r4cglobal.org',
    'good',
    null,
    '2026-06-01T10:00:00.000Z',
    null,
    null,
    null,
    null,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000202',
    '00000000-0000-4000-8000-000000000103',
    null,
    'Admin 2',
    'Admin 2',
    '+234 800 000 0002',
    'admin2@r4cglobal.org',
    'good',
    'For product shoot',
    '2026-07-18T10:00:00.000Z',
    '2026-07-20T10:00:00.000Z',
    null,
    null,
    null,
    'overdue'
  )
on conflict (id) do nothing;

insert into public.portal_options (category_group, label, value, is_active, display_order)
values
  -- Device Types
  ('device_type', 'Laptop', 'laptop', true, 1),
  ('device_type', 'Smartphone / Mobile', 'smartphone', true, 2),
  ('device_type', 'Tablet', 'tablet', true, 3),
  ('device_type', 'Monitor / Display', 'monitor', true, 4),
  ('device_type', 'Peripheral / Accessory', 'peripheral', true, 5),
  ('device_type', 'Network Equipment', 'network-equipment', true, 6),
  ('device_type', 'Audio / Video Equipment', 'av-equipment', true, 7),
  ('device_type', 'Other', 'other', true, 8),

  -- Device Brands
  ('device_brand', 'Apple', 'apple', true, 1),
  ('device_brand', 'HP', 'hp', true, 2),
  ('device_brand', 'Dell', 'dell', true, 3),
  ('device_brand', 'Lenovo', 'lenovo', true, 4),
  ('device_brand', 'Samsung', 'samsung', true, 5),
  ('device_brand', 'Logitech', 'logitech', true, 6),
  ('device_brand', 'Canon', 'canon', true, 7),
  ('device_brand', 'Other', 'other', true, 8),

  -- Issue Categories / Types
  ('issue_type', 'Screen / Display Damage', 'screen-damage', true, 1),
  ('issue_type', 'Battery / Charging Issue', 'battery-charging', true, 2),
  ('issue_type', 'Operating System / Boot Failure', 'os-boot-failure', true, 3),
  ('issue_type', 'Physical Hardware Damage', 'hardware-damage', true, 4),
  ('issue_type', 'Keyboard / Trackpad Malfunction', 'keyboard-trackpad', true, 5),
  ('issue_type', 'Audio / Camera Fault', 'audio-camera', true, 6),
  ('issue_type', 'Overheating / Fan Noise', 'overheating', true, 7),
  ('issue_type', 'Lost or Stolen Device', 'lost-stolen', true, 8),
  ('issue_type', 'Other Technical Issue', 'other', true, 9),

  -- Organization Departments
  ('department', 'Executive & Leadership', 'executive', true, 1),
  ('department', 'Software & Engineering', 'engineering', true, 2),
  ('department', 'Media & Communications', 'media', true, 3),
  ('department', 'Operations & Logistics', 'operations', true, 4),
  ('department', 'Programs & Projects', 'programs', true, 5),
  ('department', 'Finance & Administration', 'finance', true, 6),
  ('department', 'Human Resources', 'hr', true, 7)
on conflict (category_group, value) do nothing;

