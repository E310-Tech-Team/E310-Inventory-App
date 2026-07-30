create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.department_users (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  email citext not null unique,
  role text not null check (role in ('super-admin', 'team-member')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  invited_by text,
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

create index if not exists idx_department_users_status on public.department_users(status);
create index if not exists idx_department_users_role_status on public.department_users(role, status);
create index if not exists idx_items_category_id on public.items(category_id);
create index if not exists idx_items_status on public.items(status);
create index if not exists idx_checkouts_item_id on public.checkouts(item_id);
create index if not exists idx_checkouts_status on public.checkouts(status);
create index if not exists idx_checkouts_collected_by on public.checkouts(collected_by);

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

alter table public.department_users enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.checkouts enable row level security;

revoke all on public.department_users from anon, authenticated;
revoke all on public.categories from anon, authenticated;
revoke all on public.items from anon, authenticated;
revoke all on public.checkouts from anon, authenticated;

grant select, insert, update, delete on public.department_users to service_role;
grant select, insert, update, delete on public.categories to service_role;
grant select, insert, update, delete on public.items to service_role;
grant select, insert, update, delete on public.checkouts to service_role;

insert into public.department_users (name, email, role, status, invited_by)
values
  ('Department Lead', 'boss@department.local', 'super-admin', 'active', null),
  ('Goodness', 'goodnessezekiel@theincubatorhub.org', 'super-admin', 'active', 'Department Lead'),
  ('Admin 2', 'admin2@department.local', 'team-member', 'active', 'Department Lead')
on conflict (email) do update set
  name = excluded.name,
  role = excluded.role,
  status = excluded.status,
  invited_by = excluded.invited_by;

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
  created_at
)
values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'MacBook Pro 14"', 'C02FX1234ABC', 'serial-number', 'C02FX1234ABC', null, 'checked-out', 'good', null, '2026-01-10T09:20:00.000Z'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'Dell XPS 15', 'DXP15-9922', 'service-tag', 'DXP15-9922', null, 'available', 'good', null, '2026-01-10T09:22:00.000Z'),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000002', 'Canon EOS R6', 'CN-R6-0451', 'serial-number', 'CN-R6-0451', null, 'checked-out', 'good', null, '2026-01-10T09:25:00.000Z'),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000003', 'HDMI Cable 2m', 'HDMI-002', 'asset-tag', 'HDMI-002', null, 'available', 'fair', null, '2026-01-10T09:30:00.000Z'),
  ('00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000004', 'A4 Notebooks', null, null, null, 3, 'low-stock', 'new', null, '2026-01-10T09:35:00.000Z')
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
    'goodnessezekiel@theincubatorhub.org',
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
    'admin2@department.local',
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
