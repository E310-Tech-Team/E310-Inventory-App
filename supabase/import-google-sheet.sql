begin;

-- Remove the original demo inventory rows created by schema.sql.
delete from public.categories
where id in (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004'
);

insert into public.categories (id, name, tracking_type, return_type, low_stock_threshold, created_by, created_at)
values
  (
    '00000000-0000-4000-8000-000000000010',
    'R4C EliteBook Laptops',
    'individual',
    'open-ended',
    null,
    'Google Sheet Import',
    '2026-07-30T09:00:00.000Z'
  )
on conflict (id) do update set
  name = excluded.name,
  tracking_type = excluded.tracking_type,
  return_type = excluded.return_type,
  low_stock_threshold = excluded.low_stock_threshold,
  created_by = excluded.created_by;

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
  (
    '00000000-0000-4000-8000-000000000110',
    '00000000-0000-4000-8000-000000000010',
    'R4C-ELITEBOOK-001',
    '5CG11945GK',
    'serial-number',
    '5CG11945GK',
    null,
    'checked-out',
    'good',
    null,
    '2026-07-30T09:01:00.000Z'
  ),
  (
    '00000000-0000-4000-8000-000000000111',
    '00000000-0000-4000-8000-000000000010',
    'R4C-ELITEBOOK-002',
    '5CG04545VL',
    'serial-number',
    '5CG04545VL',
    null,
    'checked-out',
    'good',
    'Transferred PC: HP Laptop; Recipient: Miss Heritage',
    '2026-07-30T09:02:00.000Z'
  ),
  (
    '00000000-0000-4000-8000-000000000112',
    '00000000-0000-4000-8000-000000000010',
    'R4C-ELITEBOOK-003',
    '5CG0469PQT',
    'serial-number',
    '5CG0469PQT',
    null,
    'checked-out',
    'good',
    'Transferred PC: Dell Laptop',
    '2026-07-30T09:03:00.000Z'
  ),
  (
    '00000000-0000-4000-8000-000000000113',
    '00000000-0000-4000-8000-000000000010',
    'R4C-ELITEBOOK-004',
    '5CG1193Z5F',
    'serial-number',
    '5CG1193Z5F',
    null,
    'checked-out',
    'good',
    'Transferred PC: MacBook Air 2015',
    '2026-07-30T09:04:00.000Z'
  ),
  (
    '00000000-0000-4000-8000-000000000114',
    '00000000-0000-4000-8000-000000000010',
    'R4C-ELITEBOOK-005',
    '5CG1023S61',
    'serial-number',
    '5CG1023S61',
    null,
    'checked-out',
    'good',
    null,
    '2026-07-30T09:05:00.000Z'
  ),
  (
    '00000000-0000-4000-8000-000000000115',
    '00000000-0000-4000-8000-000000000010',
    'R4C-ELITEBOOK-006',
    '5CG1056892',
    'serial-number',
    '5CG1056892',
    null,
    'checked-out',
    'good',
    'Transferred PC: HP Laptop 14s-dq5xxx; Recipient: Mrs. Oluwanifemi Adeyan',
    '2026-07-30T09:06:00.000Z'
  ),
  (
    '00000000-0000-4000-8000-000000000116',
    '00000000-0000-4000-8000-000000000010',
    'R4C-ELITEBOOK-007',
    '5CG1193WK7',
    'serial-number',
    '5CG1193WK7',
    null,
    'checked-out',
    'good',
    'Transferred PC: HP; Recipient: David Jayeoba',
    '2026-07-30T09:07:00.000Z'
  ),
  (
    '00000000-0000-4000-8000-000000000117',
    '00000000-0000-4000-8000-000000000010',
    'R4C-ELITEBOOK-008',
    '5CG1193WK5',
    'serial-number',
    '5CG1193WK5',
    null,
    'checked-out',
    'good',
    'Transferred PC: HP; Recipient: Mrs. Chiamaka Chibuenyiim',
    '2026-07-30T09:08:00.000Z'
  )
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  serial_number = excluded.serial_number,
  identifier_type = excluded.identifier_type,
  identifier_value = excluded.identifier_value,
  quantity = excluded.quantity,
  status = excluded.status,
  condition = excluded.condition,
  notes = excluded.notes;

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
    '00000000-0000-4000-8000-000000000210',
    '00000000-0000-4000-8000-000000000110',
    null,
    'Google Sheet Import',
    'Mrs. Boluwatife Oladele',
    '',
    '',
    'good',
    null,
    '2026-07-30T09:11:00.000Z',
    null,
    null,
    null,
    null,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000211',
    '00000000-0000-4000-8000-000000000111',
    null,
    'Google Sheet Import',
    'Mr. Chukwudi Chukwuemeka',
    '',
    '',
    'good',
    'Transferred PC: HP Laptop; Recipient: Miss Heritage',
    '2026-07-30T09:12:00.000Z',
    null,
    null,
    null,
    null,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000212',
    '00000000-0000-4000-8000-000000000112',
    null,
    'Google Sheet Import',
    'Mrs. Akomolafe Sandra',
    '',
    '',
    'good',
    'Transferred PC: Dell Laptop',
    '2026-07-30T09:13:00.000Z',
    null,
    null,
    null,
    null,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000213',
    '00000000-0000-4000-8000-000000000113',
    null,
    'Google Sheet Import',
    'Mr. Ayobami Segun',
    '',
    '',
    'good',
    'Transferred PC: MacBook Air 2015',
    '2026-07-30T09:14:00.000Z',
    null,
    null,
    null,
    null,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000214',
    '00000000-0000-4000-8000-000000000114',
    null,
    'Google Sheet Import',
    'Mr. Ilori Goodness',
    '',
    '',
    'good',
    null,
    '2026-07-30T09:15:00.000Z',
    null,
    null,
    null,
    null,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000215',
    '00000000-0000-4000-8000-000000000115',
    null,
    'Google Sheet Import',
    'Mr. Treasures',
    '',
    '',
    'good',
    'Transferred PC: HP Laptop 14s-dq5xxx; Recipient: Mrs. Oluwanifemi Adeyan',
    '2026-07-30T09:16:00.000Z',
    null,
    null,
    null,
    null,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000216',
    '00000000-0000-4000-8000-000000000116',
    null,
    'Google Sheet Import',
    'Mrs. Nkechi',
    '',
    '',
    'good',
    'Transferred PC: HP; Recipient: David Jayeoba',
    '2026-07-30T09:17:00.000Z',
    null,
    null,
    null,
    null,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000217',
    '00000000-0000-4000-8000-000000000117',
    null,
    'Google Sheet Import',
    'Mrs. Priscilla Peter',
    '',
    '',
    'good',
    'Transferred PC: HP; Recipient: Mrs. Chiamaka Chibuenyiim',
    '2026-07-30T09:18:00.000Z',
    null,
    null,
    null,
    null,
    'active'
  )
on conflict (id) do update set
  item_id = excluded.item_id,
  quantity = excluded.quantity,
  collected_by = excluded.collected_by,
  assigned_to_name = excluded.assigned_to_name,
  assigned_to_phone = excluded.assigned_to_phone,
  assigned_to_email = excluded.assigned_to_email,
  condition_on_collection = excluded.condition_on_collection,
  collection_notes = excluded.collection_notes,
  date_collected = excluded.date_collected,
  due_date = excluded.due_date,
  date_returned = excluded.date_returned,
  condition_on_return = excluded.condition_on_return,
  return_notes = excluded.return_notes,
  status = excluded.status;

commit;
