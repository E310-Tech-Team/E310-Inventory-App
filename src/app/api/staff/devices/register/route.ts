import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasSupabaseConfig()) {
      return NextResponse.json(
        { error: "Database service is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const {
      name,
      serialNumber,
      categoryId,
      deviceType,
      condition = "good",
      notes,
    } = body;

    // Validate required fields
    if (!serialNumber || typeof serialNumber !== "string" || serialNumber.trim().length === 0) {
      return NextResponse.json({ error: "Device serial number is required" }, { status: 400 });
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Device name/model is required" }, { status: 400 });
    }

    const resolvedDeviceType = categoryId || deviceType;
    if (!resolvedDeviceType || typeof resolvedDeviceType !== "string" || resolvedDeviceType.trim().length === 0) {
      return NextResponse.json({ error: "Device category/type is required" }, { status: 400 });
    }

    const validConditions = ["new", "good", "fair", "damaged"];
    const sanitizedCondition = validConditions.includes(condition) ? condition : "good";
    const trimmedSerial = serialNumber.trim();
    const trimmedName = name.trim();

    const supabase = getSupabaseAdminClient();

    // Check if an item with this serial number already exists
    const { data: existingItem } = await supabase
      .from("items")
      .select("id, name, serial_number")
      .eq("serial_number", trimmedSerial)
      .maybeSingle();

    if (existingItem) {
      return NextResponse.json(
        { error: `A device with serial number "${trimmedSerial}" is already registered in inventory.` },
        { status: 409 }
      );
    }

    // Resolve category ID
    let resolvedCategoryId: string | null = null;
    if (categoryId && typeof categoryId === "string") {
      const { data: catById } = await supabase
        .from("categories")
        .select("id")
        .eq("id", categoryId)
        .maybeSingle();
      if (catById) {
        resolvedCategoryId = catById.id;
      }
    }

    if (!resolvedCategoryId && deviceType) {
      const { data: catByName } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", `%${deviceType}%`)
        .maybeSingle();
      if (catByName) {
        resolvedCategoryId = catByName.id;
      }
    }

    // Fallback to first available category if not matched
    if (!resolvedCategoryId) {
      const { data: firstCat } = await supabase
        .from("categories")
        .select("id")
        .limit(1)
        .single();
      resolvedCategoryId = firstCat?.id ?? "00000000-0000-4000-8000-000000000001";
    }

    // 1. Insert item record with registered_by_staff = true, approval_status = 'pending', status = 'checked-out'
    const { data: newItem, error: itemError } = await supabase
      .from("items")
      .insert({
        category_id: resolvedCategoryId,
        name: trimmedName,
        serial_number: trimmedSerial,
        identifier_type: "serial-number",
        identifier_value: trimmedSerial,
        quantity: null,
        status: "checked-out",
        condition: sanitizedCondition,
        notes: notes ? String(notes).trim() : null,
        registered_by_staff: true,
        approval_status: "pending",
        created_by: user.name,
      })
      .select()
      .single();

    if (itemError) {
      console.error("Failed to insert self-registered item:", itemError);
      return NextResponse.json({ error: itemError.message }, { status: 500 });
    }

    // 2. Create active checkout log assigning custody to submitting staff member
    const { data: newCheckout, error: checkoutError } = await supabase
      .from("checkouts")
      .insert({
        item_id: newItem.id,
        quantity: null,
        collected_by: user.name,
        assigned_to_name: user.name,
        assigned_to_phone: user.phone ?? "",
        assigned_to_email: user.email.toLowerCase(),
        condition_on_collection: sanitizedCondition,
        collection_notes: notes
          ? `Staff self-registration: ${String(notes).trim()}`
          : "Staff self-registered hardware device",
        date_collected: new Date().toISOString(),
        due_date: null,
        status: "active",
      })
      .select()
      .single();

    if (checkoutError) {
      console.error("Failed to create self-registration checkout record:", checkoutError);
      // Clean up item if checkout record failed
      await supabase.from("items").delete().eq("id", newItem.id);
      return NextResponse.json({ error: checkoutError.message }, { status: 500 });
    }

    // 3. Log activity in audit_logs
    try {
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        actor_name: user.name,
        action_type: "device_self_registered",
        entity_type: "item",
        entity_id: newItem.id,
        details: {
          itemName: trimmedName,
          serialNumber: trimmedSerial,
          condition: sanitizedCondition,
          checkoutId: newCheckout.id,
          staffEmail: user.email,
        },
      });
    } catch (auditErr) {
      console.warn("Failed to create audit log for device self-registration:", auditErr);
    }

    // 4. Create in-app notification for the user confirming submission
    try {
      await supabase.from("notifications").insert({
        recipient_id: user.id,
        title: "Device Registration Submitted",
        message: `Your device ${trimmedName} (${trimmedSerial}) was registered and is currently pending IT verification.`,
        notification_type: "device_registered",
        link_url: "/staff",
        is_read: false,
        email_sent: false,
      });
    } catch (notifErr) {
      console.warn("Failed to dispatch registration confirmation notification:", notifErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Device successfully registered and submitted for IT verification.",
        item: newItem,
        checkout: newCheckout,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Device self-registration error:", error);
    return NextResponse.json(
      { error: "Internal server error registering device" },
      { status: 500 }
    );
  }
}
