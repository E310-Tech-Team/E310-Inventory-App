const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || "http://localhost:54321";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDEwMTIwMDAsImV4cCI6MTk1NjM3MjAwMH0.UsEo-2rJcMnv7J5MvriUvPUr8LOYsMkpv8O6rgMAEAw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Restoring laptops and assignments in Supabase database...");

  // 1. Ensure Categories exist
  const categories = [
    {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Laptops",
      tracking_type: "individual",
      return_type: "open-ended",
      low_stock_threshold: null,
      created_by: "Goodness",
    },
    {
      id: "00000000-0000-4000-8000-000000000010",
      name: "R4C EliteBook Laptops",
      tracking_type: "individual",
      return_type: "open-ended",
      low_stock_threshold: null,
      created_by: "Goodness",
    },
  ];

  for (const cat of categories) {
    const { error } = await supabase.from("categories").upsert(cat, { onConflict: "id" });
    if (error) console.error("Error upserting category:", cat.name, error);
    else console.log("Category ready:", cat.name);
  }

  // 2. Restore MacBook Pro 14" to checked-out & restore active checkout for Goodness
  const { error: mbpErr } = await supabase
    .from("items")
    .update({ status: "checked-out" })
    .eq("id", "00000000-0000-4000-8000-000000000101");
  if (mbpErr) console.error("Error updating MacBook Pro 14 status:", mbpErr);
  else console.log("MacBook Pro 14 status set to checked-out");

  const { error: chk201Err } = await supabase
    .from("checkouts")
    .update({
      status: "active",
      date_returned: null,
      assigned_to_name: "Goodness",
      assigned_to_email: "ezekielgoodness@r4cglobal.org",
      due_date: "2026-11-24T00:00:00.000Z",
    })
    .eq("id", "00000000-0000-4000-8000-000000000201");
  if (chk201Err) console.error("Error reactivating checkout 201:", chk201Err);
  else console.log("Checkout 201 for Goodness reactivated as active");

  // 3. Upsert the 8 R4C EliteBook laptops
  const elitebooks = [
    {
      id: "00000000-0000-4000-8000-000000000110",
      category_id: "00000000-0000-4000-8000-000000000010",
      name: "R4C-ELITEBOOK-001",
      serial_number: "5CG11945GK",
      identifier_type: "serial-number",
      identifier_value: "5CG11945GK",
      quantity: null,
      status: "checked-out",
      condition: "good",
      notes: null,
      created_by: "Goodness",
      created_at: "2026-07-30T09:01:00.000Z",
    },
    {
      id: "00000000-0000-4000-8000-000000000111",
      category_id: "00000000-0000-4000-8000-000000000010",
      name: "R4C-ELITEBOOK-002",
      serial_number: "5CG04545VL",
      identifier_type: "serial-number",
      identifier_value: "5CG04545VL",
      quantity: null,
      status: "checked-out",
      condition: "good",
      notes: "Transferred PC: HP Laptop; Recipient: Miss Heritage",
      created_by: "Goodness",
      created_at: "2026-07-30T09:02:00.000Z",
    },
    {
      id: "00000000-0000-4000-8000-000000000112",
      category_id: "00000000-0000-4000-8000-000000000010",
      name: "R4C-ELITEBOOK-003",
      serial_number: "5CG0469PQT",
      identifier_type: "serial-number",
      identifier_value: "5CG0469PQT",
      quantity: null,
      status: "checked-out",
      condition: "good",
      notes: "Transferred PC: Dell Laptop",
      created_by: "Goodness",
      created_at: "2026-07-30T09:03:00.000Z",
    },
    {
      id: "00000000-0000-4000-8000-000000000113",
      category_id: "00000000-0000-4000-8000-000000000010",
      name: "R4C-ELITEBOOK-004",
      serial_number: "5CG1193Z5F",
      identifier_type: "serial-number",
      identifier_value: "5CG1193Z5F",
      quantity: null,
      status: "checked-out",
      condition: "good",
      notes: "Transferred PC: MacBook Air 2015",
      created_by: "Goodness",
      created_at: "2026-07-30T09:04:00.000Z",
    },
    {
      id: "00000000-0000-4000-8000-000000000114",
      category_id: "00000000-0000-4000-8000-000000000010",
      name: "R4C-ELITEBOOK-005",
      serial_number: "5CG1023S61",
      identifier_type: "serial-number",
      identifier_value: "5CG1023S61",
      quantity: null,
      status: "checked-out",
      condition: "good",
      notes: null,
      created_by: "Goodness",
      created_at: "2026-07-30T09:05:00.000Z",
    },
    {
      id: "00000000-0000-4000-8000-000000000115",
      category_id: "00000000-0000-4000-8000-000000000010",
      name: "R4C-ELITEBOOK-006",
      serial_number: "5CG1056892",
      identifier_type: "serial-number",
      identifier_value: "5CG1056892",
      quantity: null,
      status: "checked-out",
      condition: "good",
      notes: "Transferred PC: HP Laptop 14s-dq5xxx; Recipient: Mrs. Oluwanifemi Adeyan",
      created_by: "Goodness",
      created_at: "2026-07-30T09:06:00.000Z",
    },
    {
      id: "00000000-0000-4000-8000-000000000116",
      category_id: "00000000-0000-4000-8000-000000000010",
      name: "R4C-ELITEBOOK-007",
      serial_number: "5CG1193WK7",
      identifier_type: "serial-number",
      identifier_value: "5CG1193WK7",
      quantity: null,
      status: "checked-out",
      condition: "good",
      notes: "Transferred PC: HP; Recipient: David Jayeoba",
      created_by: "Goodness",
      created_at: "2026-07-30T09:07:00.000Z",
    },
    {
      id: "00000000-0000-4000-8000-000000000117",
      category_id: "00000000-0000-4000-8000-000000000010",
      name: "R4C-ELITEBOOK-008",
      serial_number: "5CG1193WK5",
      identifier_type: "serial-number",
      identifier_value: "5CG1193WK5",
      quantity: null,
      status: "checked-out",
      condition: "good",
      notes: "Transferred PC: HP; Recipient: Mrs. Chiamaka Chibuenyiim",
      created_by: "Goodness",
      created_at: "2026-07-30T09:08:00.000Z",
    },
  ];

  for (const item of elitebooks) {
    const { error } = await supabase.from("items").upsert(item, { onConflict: "id" });
    if (error) console.error("Error upserting item:", item.name, error);
    else console.log("Item restored:", item.name, `(${item.serial_number})`);
  }

  // 4. Upsert Department Users for staff members
  const staffUsers = [
    {
      name: "Mrs. Boluwatife Oladele",
      email: "boluwatife.oladele@r4cglobal.org",
      role: "team-member",
      status: "active",
      staff_id: "R4C-004",
      department: "Finance & Administration",
    },
    {
      name: "Mr. Chukwudi Chukwuemeka",
      email: "chukwudi.chukwuemeka@r4cglobal.org",
      role: "team-member",
      status: "active",
      staff_id: "R4C-005",
      department: "Software & Engineering",
    },
    {
      name: "Mrs. Akomolafe Sandra",
      email: "akomolafe.sandra@r4cglobal.org",
      role: "team-member",
      status: "active",
      staff_id: "R4C-006",
      department: "Operations & Logistics",
    },
    {
      name: "Mr. Ayobami Segun",
      email: "ayobami.segun@r4cglobal.org",
      role: "team-member",
      status: "active",
      staff_id: "R4C-007",
      department: "Media & Communications",
    },
    {
      name: "Mr. Treasures",
      email: "treasures@r4cglobal.org",
      role: "team-member",
      status: "active",
      staff_id: "R4C-008",
      department: "Programs & Projects",
    },
    {
      name: "Mrs. Nkechi",
      email: "nkechi@r4cglobal.org",
      role: "team-member",
      status: "active",
      staff_id: "R4C-009",
      department: "Human Resources",
    },
    {
      name: "Mrs. Priscilla Peter",
      email: "priscilla.peter@r4cglobal.org",
      role: "team-member",
      status: "active",
      staff_id: "R4C-010",
      department: "Executive & Leadership",
    },
  ];

  for (const u of staffUsers) {
    const { error } = await supabase.from("department_users").upsert(u, { onConflict: "email" });
    if (error) console.error("Error upserting staff user:", u.email, error);
    else console.log("Staff user ready:", u.name, `(${u.email})`);
  }

  // 5. Upsert checkouts for all 8 laptops
  const checkouts = [
    {
      id: "00000000-0000-4000-8000-000000000210",
      item_id: "00000000-0000-4000-8000-000000000110",
      quantity: null,
      collected_by: "Goodness",
      assigned_to_name: "Mrs. Boluwatife Oladele",
      assigned_to_phone: "+234 801 111 0001",
      assigned_to_email: "boluwatife.oladele@r4cglobal.org",
      condition_on_collection: "good",
      collection_notes: null,
      date_collected: "2026-07-30T09:11:00.000Z",
      due_date: null,
      date_returned: null,
      condition_on_return: null,
      return_notes: null,
      status: "active",
    },
    {
      id: "00000000-0000-4000-8000-000000000211",
      item_id: "00000000-0000-4000-8000-000000000111",
      quantity: null,
      collected_by: "Goodness",
      assigned_to_name: "Mr. Chukwudi Chukwuemeka",
      assigned_to_phone: "+234 801 111 0002",
      assigned_to_email: "chukwudi.chukwuemeka@r4cglobal.org",
      condition_on_collection: "good",
      collection_notes: "Transferred PC: HP Laptop; Recipient: Miss Heritage",
      date_collected: "2026-07-30T09:12:00.000Z",
      due_date: null,
      date_returned: null,
      condition_on_return: null,
      return_notes: null,
      status: "active",
    },
    {
      id: "00000000-0000-4000-8000-000000000212",
      item_id: "00000000-0000-4000-8000-000000000112",
      quantity: null,
      collected_by: "Goodness",
      assigned_to_name: "Mrs. Akomolafe Sandra",
      assigned_to_phone: "+234 801 111 0003",
      assigned_to_email: "akomolafe.sandra@r4cglobal.org",
      condition_on_collection: "good",
      collection_notes: "Transferred PC: Dell Laptop",
      date_collected: "2026-07-30T09:13:00.000Z",
      due_date: null,
      date_returned: null,
      condition_on_return: null,
      return_notes: null,
      status: "active",
    },
    {
      id: "00000000-0000-4000-8000-000000000213",
      item_id: "00000000-0000-4000-8000-000000000113",
      quantity: null,
      collected_by: "Goodness",
      assigned_to_name: "Mr. Ayobami Segun",
      assigned_to_phone: "+234 801 111 0004",
      assigned_to_email: "ayobami.segun@r4cglobal.org",
      condition_on_collection: "good",
      collection_notes: "Transferred PC: MacBook Air 2015",
      date_collected: "2026-07-30T09:14:00.000Z",
      due_date: null,
      date_returned: null,
      condition_on_return: null,
      return_notes: null,
      status: "active",
    },
    {
      id: "00000000-0000-4000-8000-000000000214",
      item_id: "00000000-0000-4000-8000-000000000114",
      quantity: null,
      collected_by: "Goodness",
      assigned_to_name: "Mr. Ilori Goodness",
      assigned_to_phone: "+234 800 000 0001",
      assigned_to_email: "ezekielgoodness@r4cglobal.org",
      condition_on_collection: "good",
      collection_notes: null,
      date_collected: "2026-07-30T09:15:00.000Z",
      due_date: null,
      date_returned: null,
      condition_on_return: null,
      return_notes: null,
      status: "active",
    },
    {
      id: "00000000-0000-4000-8000-000000000215",
      item_id: "00000000-0000-4000-8000-000000000115",
      quantity: null,
      collected_by: "Goodness",
      assigned_to_name: "Mr. Treasures",
      assigned_to_phone: "+234 801 111 0005",
      assigned_to_email: "treasures@r4cglobal.org",
      condition_on_collection: "good",
      collection_notes: "Transferred PC: HP Laptop 14s-dq5xxx; Recipient: Mrs. Oluwanifemi Adeyan",
      date_collected: "2026-07-30T09:16:00.000Z",
      due_date: null,
      date_returned: null,
      condition_on_return: null,
      return_notes: null,
      status: "active",
    },
    {
      id: "00000000-0000-4000-8000-000000000216",
      item_id: "00000000-0000-4000-8000-000000000116",
      quantity: null,
      collected_by: "Goodness",
      assigned_to_name: "Mrs. Nkechi",
      assigned_to_phone: "+234 801 111 0006",
      assigned_to_email: "nkechi@r4cglobal.org",
      condition_on_collection: "good",
      collection_notes: "Transferred PC: HP; Recipient: David Jayeoba",
      date_collected: "2026-07-30T09:17:00.000Z",
      due_date: null,
      date_returned: null,
      condition_on_return: null,
      return_notes: null,
      status: "active",
    },
    {
      id: "00000000-0000-4000-8000-000000000217",
      item_id: "00000000-0000-4000-8000-000000000117",
      quantity: null,
      collected_by: "Goodness",
      assigned_to_name: "Mrs. Priscilla Peter",
      assigned_to_phone: "+234 801 111 0007",
      assigned_to_email: "priscilla.peter@r4cglobal.org",
      condition_on_collection: "good",
      collection_notes: "Transferred PC: HP; Recipient: Mrs. Chiamaka Chibuenyiim",
      date_collected: "2026-07-30T09:18:00.000Z",
      due_date: null,
      date_returned: null,
      condition_on_return: null,
      return_notes: null,
      status: "active",
    },
  ];

  for (const chk of checkouts) {
    const { error } = await supabase.from("checkouts").upsert(chk, { onConflict: "id" });
    if (error) console.error("Error upserting checkout:", chk.assigned_to_name, error);
    else console.log("Checkout active for:", chk.assigned_to_name);
  }

  console.log("\n--- Verification Summary ---");
  const { data: allItems } = await supabase.from("items").select("id, name, serial_number, status");
  console.log(`Total Items in Database: ${allItems?.length}`);
  const { data: allCheckouts } = await supabase.from("checkouts").select("id, item_id, assigned_to_name, status").eq("status", "active");
  console.log(`Total Active Checkouts: ${allCheckouts?.length}`);
  console.log("All Active Assignments:");
  allCheckouts?.forEach((c) => console.log(` - ${c.assigned_to_name}: item ${c.item_id}`));
}

main().catch(console.error);

