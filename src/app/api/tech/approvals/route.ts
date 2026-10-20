import { NextRequest, NextResponse } from "next/server";
import { getSession, isTechUser } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";

interface ApprovalCheckoutInfo {
  id: string;
  item_id: string;
  assigned_to_name: string;
  assigned_to_email: string;
  assigned_to_phone: string;
  condition_on_collection: string;
  collection_notes: string | null;
  date_collected: string;
  status: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isTechUser(user)) {
      return NextResponse.json(
        { error: "Forbidden: Only Tech Team members can access verification queues" },
        { status: 403 }
      );
    }

    if (!hasSupabaseConfig()) {
      return NextResponse.json(
        { error: "Database service is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") || "pending";
    const searchQuery = searchParams.get("search") || "";

    const supabase = getSupabaseAdminClient();

    // Query items where registered_by_staff = true
    let query = supabase
      .from("items")
      .select(`
        id,
        name,
        serial_number,
        identifier_type,
        identifier_value,
        quantity,
        status,
        condition,
        notes,
        registered_by_staff,
        approval_status,
        created_by,
        created_at,
        category:categories (
          id,
          name,
          tracking_type,
          return_type
        )
      `)
      .eq("registered_by_staff", true)
      .order("created_at", { ascending: false });

    if (statusParam !== "all") {
      query = query.eq("approval_status", statusParam);
    }

    const { data: items, error: itemsError } = await query;

    if (itemsError) {
      console.error("Error fetching self-registered devices:", itemsError);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    const itemIds = (items || []).map((i) => i.id);

    // Fetch associated checkout records to find the submitting staff member
    const checkoutsMap: Record<string, ApprovalCheckoutInfo> = {};
    if (itemIds.length > 0) {
      const { data: checkouts, error: checkoutsError } = await supabase
        .from("checkouts")
        .select(`
          id,
          item_id,
          assigned_to_name,
          assigned_to_email,
          assigned_to_phone,
          condition_on_collection,
          collection_notes,
          date_collected,
          status
        `)
        .in("item_id", itemIds)
        .order("date_collected", { ascending: false });

      if (!checkoutsError && checkouts) {
        for (const co of checkouts) {
          if (!checkoutsMap[co.item_id]) {
            checkoutsMap[co.item_id] = co;
          }
        }
      }
    }

    // Combine item with checkout info
    let enrichedItems = (items || []).map((item) => {
      const checkout = checkoutsMap[item.id] || null;
      return {
        ...item,
        submitter: checkout
          ? {
              name: checkout.assigned_to_name,
              email: checkout.assigned_to_email,
              phone: checkout.assigned_to_phone,
              collectedAt: checkout.date_collected,
              condition: checkout.condition_on_collection,
              notes: checkout.collection_notes,
            }
          : {
              name: item.created_by,
              email: "",
              phone: "",
              collectedAt: item.created_at,
              condition: item.condition,
              notes: item.notes,
            },
      };
    });

    // Apply search filter if provided
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      enrichedItems = enrichedItems.filter((item) => {
        return (
          item.name.toLowerCase().includes(q) ||
          (item.serial_number && item.serial_number.toLowerCase().includes(q)) ||
          (item.submitter?.name && item.submitter.name.toLowerCase().includes(q)) ||
          (item.submitter?.email && item.submitter.email.toLowerCase().includes(q))
        );
      });
    }

    // Calculate queue summary counts
    const { count: pendingCount } = await supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("registered_by_staff", true)
      .eq("approval_status", "pending");

    const { count: approvedCount } = await supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("registered_by_staff", true)
      .eq("approval_status", "approved");

    const { count: rejectedCount } = await supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("registered_by_staff", true)
      .eq("approval_status", "rejected");

    return NextResponse.json({
      approvals: enrichedItems,
      counts: {
        pending: pendingCount || 0,
        approved: approvedCount || 0,
        rejected: rejectedCount || 0,
        total: (pendingCount || 0) + (approvedCount || 0) + (rejectedCount || 0),
      },
    });
  } catch (error) {
    console.error("GET /api/tech/approvals error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching approval queue" },
      { status: 500 }
    );
  }
}
