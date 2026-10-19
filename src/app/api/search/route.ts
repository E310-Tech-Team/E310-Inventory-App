import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";

export interface SearchResultItem {
  id: string;
  category: "devices" | "tickets" | "staff";
  title: string;
  subtitle: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "danger" | "info";
  url: string;
}

export interface SearchResponse {
  results: {
    devices: SearchResultItem[];
    tickets: SearchResultItem[];
    staff: SearchResultItem[];
  };
  totalCount: number;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q || q.length === 0) {
      return NextResponse.json<SearchResponse>({
        results: { devices: [], tickets: [], staff: [] },
        totalCount: 0,
      });
    }

    if (!hasSupabaseConfig()) {
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 500 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const sanitizedQuery = q.replace(/[%_]/g, "");

    // Run parallel searches across devices, complaints, and staff directory
    const [devicesPromise, complaintsPromise, staffPromise] = await Promise.allSettled([
      // 1. Search Devices / Items
      supabase
        .from("items")
        .select("id, name, serial_number, identifier_type, identifier_value, status, condition")
        .or(
          `name.ilike.%${sanitizedQuery}%,serial_number.ilike.%${sanitizedQuery}%,identifier_value.ilike.%${sanitizedQuery}%`
        )
        .limit(5),

      // 2. Search Device Complaints / Tickets
      supabase
        .from("device_complaints")
        .select("id, ticket_number, title, issue_type, severity, priority, status")
        .or(
          `ticket_number.ilike.%${sanitizedQuery}%,title.ilike.%${sanitizedQuery}%,issue_type.ilike.%${sanitizedQuery}%`
        )
        .limit(5),

      // 3. Search Staff Directory
      supabase
        .from("department_users")
        .select("id, name, email, role, department, staff_id")
        .or(
          `name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%,department.ilike.%${sanitizedQuery}%,staff_id.ilike.%${sanitizedQuery}%`
        )
        .limit(5),
    ]);

    const devices: SearchResultItem[] = [];
    if (devicesPromise.status === "fulfilled" && devicesPromise.value.data) {
      for (const item of devicesPromise.value.data) {
        const idValue = item.serial_number || item.identifier_value || "No Serial";
        devices.push({
          id: `device-${item.id}`,
          category: "devices",
          title: item.name,
          subtitle: `${idValue} • Condition: ${item.condition || "standard"}`,
          badge: item.status,
          badgeVariant:
            item.status === "available"
              ? "success"
              : item.status === "checked-out"
              ? "info"
              : "warning",
          url: `/tech/items?search=${encodeURIComponent(item.name)}`,
        });
      }
    }

    const tickets: SearchResultItem[] = [];
    if (complaintsPromise.status === "fulfilled" && complaintsPromise.value.data) {
      for (const complaint of complaintsPromise.value.data) {
        const tktNum = complaint.ticket_number || "TKT";
        tickets.push({
          id: `ticket-${complaint.id}`,
          category: "tickets",
          title: complaint.title,
          subtitle: `${tktNum} • ${complaint.issue_type}`,
          badge: complaint.status,
          badgeVariant:
            complaint.status === "resolved"
              ? "success"
              : complaint.status === "in-repair"
              ? "warning"
              : "default",
          url: `/staff`,
        });
      }
    }

    const staff: SearchResultItem[] = [];
    if (staffPromise.status === "fulfilled" && staffPromise.value.data) {
      for (const member of staffPromise.value.data) {
        const dept = member.department ? ` • ${member.department}` : "";
        const staffId = member.staff_id ? ` [${member.staff_id}]` : "";
        staff.push({
          id: `staff-${member.id}`,
          category: "staff",
          title: `${member.name}${staffId}`,
          subtitle: `${member.email}${dept}`,
          badge: member.role,
          badgeVariant: member.role === "super-admin" ? "danger" : "default",
          url: `/staff`,
        });
      }
    }

    const totalCount = devices.length + tickets.length + staff.length;

    return NextResponse.json<SearchResponse>({
      results: {
        devices,
        tickets,
        staff,
      },
      totalCount,
    });
  } catch (error) {
    console.error("Global search error:", error);
    return NextResponse.json(
      { error: "Internal server error performing search" },
      { status: 500 }
    );
  }
}
