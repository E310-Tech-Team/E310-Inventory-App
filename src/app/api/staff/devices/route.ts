import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { getStaffDevices } from "@/lib/data/staff-devices";

export async function GET() {
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

    const devices = await getStaffDevices(user, { includeComplaints: true });
    return NextResponse.json({ devices });
  } catch (error) {
    console.error("Staff devices retrieval error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching staff equipment" },
      { status: 500 }
    );
  }
}
