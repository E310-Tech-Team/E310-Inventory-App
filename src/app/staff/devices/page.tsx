import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { getStaffDevices } from "@/lib/data/staff-devices";
import { StaffDevice } from "@/types";
import { StaffHeader } from "@/components/staff/StaffHeader";
import { DevicesViewClient } from "./DevicesViewClient";

export default async function StaffDevicesPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "pending") {
    redirect("/change-password");
  }

  let initialDevices: StaffDevice[] = [];

  if (hasSupabaseConfig()) {
    try {
      initialDevices = await getStaffDevices(user, { includeComplaints: true });
    } catch (err) {
      console.warn("Could not load devices during SSR:", err);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StaffHeader user={user} activePath="/staff/devices" />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-3.5 sm:px-6 pt-6 sm:pt-10 lg:pt-12 pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-10">
        <DevicesViewClient initialDevices={initialDevices} />
      </main>
    </div>
  );
}
