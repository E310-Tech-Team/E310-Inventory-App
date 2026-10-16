import { redirect } from "next/navigation";
import { getSession, isTechUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";
import { DeviceApprovalQueue } from "@/components/tech/DeviceApprovalQueue";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Device Registration Approval Queue | E310 Tech Command Center",
  description: "Verify and approve equipment self-registered by staff members.",
};

export default async function TechApprovalsPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "pending") {
    redirect("/change-password");
  }

  if (!isTechUser(user)) {
    redirect("/staff");
  }

  return (
    <AppShell admin={user}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb & Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/dashboard"
              className="hover:text-slate-800 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tech Dashboard</span>
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800">Device Approvals</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
                <ShieldCheck className="w-7 h-7 text-blue-600" />
                <span>Device Approval Queue</span>
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Inspect, verify, and approve staff self-registered equipment before official inventory enrollment.
              </p>
            </div>
          </div>
        </div>

        {/* Verification Queue Component */}
        <DeviceApprovalQueue />
      </div>
    </AppShell>
  );
}
