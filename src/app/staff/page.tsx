import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { getStaffDevices } from "@/lib/data/staff-devices";
import { StaffDevice, DeviceComplaint } from "@/types";
import { StaffHeader } from "@/components/staff/StaffHeader";
import { StaffDashboard } from "@/components/staff/StaffDashboard";
import { AlertCircle } from "lucide-react";

export default async function StaffPortalPage({
  searchParams,
}: {
  searchParams?: Promise<{ forbidden?: string }>;
}) {
  const params = await searchParams;
  const isForbidden = params?.forbidden === "true";
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "pending") {
    redirect("/change-password");
  }

  let initialDevices: StaffDevice[] = [];
  let initialComplaints: DeviceComplaint[] = [];

  if (hasSupabaseConfig()) {
    try {
      const supabase = getSupabaseAdminClient();

      // Fetch active devices in custody
      initialDevices = await getStaffDevices(user, { includeComplaints: true });

      // Fetch staff complaints
      const { data: complaintRows } = await supabase
        .from("device_complaints")
        .select(`
          id,
          ticket_number,
          user_id,
          item_id,
          device_summary,
          title,
          description,
          issue_type,
          severity,
          status,
          attachment_urls,
          resolution_notes,
          resolved_at,
          created_at,
          updated_at
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (complaintRows) {
        initialComplaints = complaintRows.map((c: any) => ({
          id: c.id,
          ticketNumber: c.ticket_number,
          userId: c.user_id,
          userName: user.name,
          userEmail: user.email,
          itemId: c.item_id,
          deviceSummary: c.device_summary,
          title: c.title,
          description: c.description,
          issueType: c.issue_type,
          priority: c.severity || "medium",
          severity: c.severity || "medium",
          status: c.status,
          attachmentUrls: c.attachment_urls ?? [],
          techNotes: c.resolution_notes ?? null,
          resolutionSummary: c.resolution_notes ?? null,
          resolvedAt: c.resolved_at ?? null,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
      }
    } catch (err) {
      console.warn("Could not load initial staff data during SSR:", err);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 403 Forbidden Access Restricted Banner */}
      {isForbidden && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-6 py-2 text-center text-xs text-amber-700 dark:text-amber-300">
          <AlertCircle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-amber-600 dark:text-amber-400" />
          Access Restricted: The Tech Portal is reserved for IT specialists.
        </div>
      )}

      <StaffHeader user={user} activePath="/staff" />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-3.5 sm:px-6 pt-6 sm:pt-10 lg:pt-12 pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-10">
        <StaffDashboard
          user={user}
          initialDevices={initialDevices}
          initialComplaints={initialComplaints}
        />
      </main>
    </div>
  );
}
