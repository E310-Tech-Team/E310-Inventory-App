-- Migration: 02_portal_options.sql
-- Description: Create portal_options table, indexes, RLS, and seed dropdown options.
-- Issue: #2

-- 1. Create portal_options table
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

-- 2. Create performance indexes
create index if not exists idx_portal_options_group on public.portal_options(category_group, is_active, display_order);

-- 3. Automatically maintain updated_at timestamp
drop trigger if exists set_portal_options_updated_at on public.portal_options;
create trigger set_portal_options_updated_at
before update on public.portal_options
for each row execute function public.set_updated_at();

-- 4. Row-Level Security and Permissions
alter table public.portal_options enable row level security;

revoke all on public.portal_options from anon, authenticated;
grant select, insert, update, delete on public.portal_options to service_role;

-- 5. Seed Initial Standardized Dropdown Options
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
