import { NextRequest, NextResponse } from "next/server";
import { getSession, isTechUser } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isTechUser(user)) {
      return NextResponse.json(
        { error: "Forbidden: Access restricted to Tech Team administrators" },
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
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "30", 10), 1),
      100
    );

    const supabase = getSupabaseAdminClient();

    const { data: logs, error } = await supabase
      .from("audit_logs")
      .select(`
        id,
        actor_id,
        actor_name,
        action_type,
        entity_type,
        entity_id,
        details,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to query audit logs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ activities: logs ?? [] });
  } catch (error) {
    console.error("Tech activity feed error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching activity feed" },
      { status: 500 }
    );
  }
}
