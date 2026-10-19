import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isTechUser } from "@/lib/auth/session";
import { Monitor, AlertCircle, PlusCircle, LogOut, ShieldCheck } from "lucide-react";
import { NotificationBell } from "@/components/layout/NotificationBell";

export default async function StaffPortalPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "pending") {
    redirect("/change-password");
  }

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Top Header */}
      <header className="border-b border-border bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-sm">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">R4C Global Staff Portal</h1>
              <p className="text-xs text-muted">Self-Service Device & Support Hub</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationBell />
            {isTechUser(user) && (
              <Link
                href="/tech"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-sm transition-colors"
                title="Switch back to Tech Command Center"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Tech Command Center</span>
              </Link>
            )}
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:bg-neutral-50 hover:text-foreground transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Welcome back, {user.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {user.department ?? "R4C Global Team"} {user.staffId ? `• Staff ID: ${user.staffId}` : ""}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
              Active Staff Account
            </span>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4">
              <Monitor className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">My Assigned Devices</h3>
            <p className="mt-1 text-xs text-muted">
              View custody status, serial numbers, and return dates for all your active office hardware.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 mb-4">
              <PlusCircle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Register New Device</h3>
            <p className="mt-1 text-xs text-muted">
              Self-register personal or newly procured work devices for tech review and approval.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 mb-4">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Report Hardware Issue</h3>
            <p className="mt-1 text-xs text-muted">
              Log a ticket with the E310 Tech Agency for device malfunctions, screen damage, or battery issues.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
