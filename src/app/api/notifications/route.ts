import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { InAppNotification } from "@/types";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "40", 10);

    const supabase = getSupabaseAdminClient();

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("GET /api/notifications error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get unread count
    const { count: unreadCount, error: countError } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false);

    if (countError) {
      console.warn("Error calculating unread count:", countError);
    }

    const notifications: InAppNotification[] = (rows ?? []).map((row) => ({
      id: row.id,
      recipientId: row.recipient_id,
      title: row.title,
      message: row.message,
      notificationType: row.notification_type,
      linkUrl: row.link_url,
      isRead: row.is_read,
      emailSent: row.email_sent,
      createdAt: row.created_at,
    }));

    return NextResponse.json({
      notifications,
      unreadCount: unreadCount ?? notifications.filter((n) => !n.isRead).length,
    });
  } catch (error) {
    console.error("GET /api/notifications unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const { action, id } = body;
    const supabase = getSupabaseAdminClient();

    if (action === "mark_all_read") {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error("Failed to mark all as read:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (action === "clear_all") {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("recipient_id", user.id);

      if (error) {
        console.error("Failed to clear notifications:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "All notifications cleared" });
    }

    if (action === "mark_read" || id) {
      const targetId = id || body.notificationId;
      if (!targetId || typeof targetId !== "string") {
        return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
      }

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", targetId)
        .eq("recipient_id", user.id);

      if (error) {
        console.error("Failed to mark notification as read:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }

    return NextResponse.json({ error: "Unknown action provided" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error updating notifications" },
      { status: 500 }
    );
  }
}
