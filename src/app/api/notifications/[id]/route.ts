import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("recipient_id", user.id);

    if (error) {
      console.error("Failed to mark notification as read:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("PATCH /api/notifications/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error updating notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("recipient_id", user.id);

    if (error) {
      console.error("Failed to delete notification:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("DELETE /api/notifications/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error deleting notification" },
      { status: 500 }
    );
  }
}
