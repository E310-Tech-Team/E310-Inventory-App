"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  ArrowLeftRight,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { Admin, DeviceComplaint, Item, Checkout } from "@/types";
import { LiveActivityTimeline } from "./LiveActivityTimeline";
import { AssignTicketModal } from "./AssignTicketModal";

interface DashboardMetrics {
  totalAssets: number;
  checkedOut: number;
  pendingComplaints: number;
  overdueReturns: number;
  lowStockCount: number;
}

export function TechDashboard({ admin }: { admin: Admin }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalAssets: 0,
    checkedOut: 0,
    pendingComplaints: 0,
    overdueReturns: 0,
    lowStockCount: 0,
  });
  const [criticalComplaints, setCriticalComplaints] = useState<DeviceComplaint[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<DeviceComplaint[]>([]);
  const [assigningTicket, setAssigningTicket] = useState<DeviceComplaint | null>(null);
  const [assignmentSuccessMsg, setAssignmentSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        const [itemsRes, checkoutsRes, complaintsRes] = await Promise.all([
          fetch("/api/items").catch(() => null),
          fetch("/api/checkouts").catch(() => null),
          fetch("/api/tech/complaints").catch(() => null),
        ]);

        const items: Item[] = itemsRes && itemsRes.ok ? await itemsRes.json() : [];
        const checkouts: Checkout[] = checkoutsRes && checkoutsRes.ok ? await checkoutsRes.json() : [];
        const complaintsData = complaintsRes && complaintsRes.ok ? await complaintsRes.json() : { complaints: [] };
        const rawComplaints: any[] = complaintsData.complaints ?? [];

        const complaints: DeviceComplaint[] = rawComplaints.map((c) => ({
          id: c.id,
          ticketNumber: c.ticket_number || c.ticketNumber,
          userId: c.user_id || c.userId,
          userName: c.user_name || c.userName || "Staff Member",
          userEmail: c.user_email || c.userEmail || "",
          userDepartment: c.user_department || c.userDepartment,
          itemId: c.item_id || c.itemId,
          itemName: c.item?.name || c.itemName,
          itemSerial: c.item?.serial_number || c.itemSerial,
          title: c.title,
          description: c.description,
          issueType: c.issue_type || c.issueType,
          priority: c.priority || "medium",
          status: c.status || "submitted",
          attachmentUrls: c.attachment_urls || c.attachmentUrls || [],
          assignedTechId: c.assigned_tech_id || c.assignedTechId,
          assignedTechName: c.assigned_tech?.name || c.assignedTechName || null,
          techNotes: c.tech_notes || c.techNotes,
          resolutionSummary: c.resolution_summary || c.resolutionSummary,
          resolvedAt: c.resolved_at || c.resolvedAt,
          createdAt: c.created_at || c.createdAt,
          updatedAt: c.updated_at || c.updatedAt,
        }));

        const now = Date.now();
        const activeCheckouts = checkouts.filter((c) => c.status === "active");
        const overdueCheckouts = checkouts.filter(
          (c) => c.status === "overdue" || (c.status === "active" && c.dueDate && new Date(c.dueDate).getTime() < now)
        );

        const pendingTickets = complaints.filter(
          (c) => c.status === "pending" || c.status === "assigned" || c.status === "in-progress"
        );

        const critical = complaints.filter(
          (c) => c.priority === "critical" && c.status !== "resolved" && c.status !== "closed"
        );

        const lowStock = items.filter((i) => i.status === "low-stock");

        setMetrics({
          totalAssets: items.length,
          checkedOut: activeCheckouts.length,
          pendingComplaints: pendingTickets.length,
          overdueReturns: overdueCheckouts.length,
          lowStockCount: lowStock.length,
        });

        setCriticalComplaints(critical);
        setRecentComplaints(complaints.slice(0, 5));
      } catch (err) {
        console.error("Failed to load tech command metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8 py-8 text-foreground">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Top Header / Greeting */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Welcome back, {admin.name}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Enterprise hardware lifecycle, triage dispatch, and custody monitoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/checkouts"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-xs sm:text-sm font-medium text-foreground transition-colors shadow-xs"
            >
              <ArrowLeftRight className="w-4 h-4 text-brand-teal" />
              Checkouts
            </Link>
            <Link
              href="/exports"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-xs sm:text-sm font-medium text-foreground transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-brand-teal" />
              Reports
            </Link>
            <Link
              href="/categories"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-yellow hover:bg-brand-yellow/90 text-xs sm:text-sm font-bold text-brand-navy transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              New Asset
            </Link>
          </div>
        </div>

        {/* Critical Complaints Alert Banner */}
        {!loading && criticalComplaints.length > 0 && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 sm:p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-rose-600 dark:text-rose-300">
                    High Priority: {criticalComplaints.length} Critical Hardware {criticalComplaints.length === 1 ? "Ticket" : "Tickets"}
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-500/30">
                    Action Required
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-foreground-muted">
                  Critical hardware complaints require immediate IT triage or equipment replacement.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {criticalComplaints.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-xs"
                    >
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{ticket.ticketNumber}</span>
                      <span>{ticket.title}</span>
                      <span className="text-muted">•</span>
                      <span className="text-muted">{ticket.userName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Executive Metric KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Assets */}
          <Link
            href="/categories"
            className="group relative rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all hover:border-brand-teal hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Total Inventory
              </span>
              <div className="p-2.5 rounded-xl bg-brand-teal/15 text-brand-teal group-hover:bg-brand-teal/25 transition-colors">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-8 w-16 bg-surface-elevated animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-black text-foreground tracking-tight">
                  {metrics.totalAssets}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between text-xs text-muted">
                <span>Catalogued equipment</span>
                <span className="inline-flex items-center text-brand-teal font-semibold group-hover:translate-x-0.5 transition-transform">
                  View items <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          </Link>

          {/* Card 2: Checked Out */}
          <Link
            href="/checkouts"
            className="group relative rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all hover:border-brand-teal hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Active Custody
              </span>
              <div className="p-2.5 rounded-xl bg-brand-teal/15 text-brand-teal group-hover:bg-brand-teal/25 transition-colors">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-8 w-16 bg-surface-elevated animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-black text-foreground tracking-tight">
                  {metrics.checkedOut}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between text-xs text-muted">
                <span>Assigned to staff</span>
                <span className="inline-flex items-center text-brand-teal font-semibold group-hover:translate-x-0.5 transition-transform">
                  Checkouts <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          </Link>

          {/* Card 3: Pending Complaints */}
          <div className="relative rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all hover:border-amber-500/50 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Hardware Tickets
              </span>
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-8 w-16 bg-surface-elevated animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-black text-foreground tracking-tight">
                  {metrics.pendingComplaints}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between text-xs text-muted">
                <span>Active tickets in queue</span>
                <span className="inline-flex items-center text-amber-600 dark:text-amber-400 font-semibold">
                  {metrics.pendingComplaints > 0 ? "Triage active" : "All cleared"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Overdue Returns */}
          <Link
            href="/checkouts"
            className="group relative rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all hover:border-rose-500/50 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Overdue Returns
              </span>
              <div
                className={`p-2.5 rounded-xl transition-colors ${
                  metrics.overdueReturns > 0
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    : "bg-surface-elevated text-muted"
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-8 w-16 bg-surface-elevated animate-pulse rounded" />
              ) : (
                <div
                  className={`text-3xl font-black tracking-tight ${
                    metrics.overdueReturns > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                  }`}
                >
                  {metrics.overdueReturns}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between text-xs text-muted">
                <span>Past scheduled return date</span>
                <span
                  className={`inline-flex items-center font-semibold group-hover:translate-x-0.5 transition-transform ${
                    metrics.overdueReturns > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted"
                  }`}
                >
                  Inspect <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Assignment Success Alert */}
        {assignmentSuccessMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{assignmentSuccessMsg}</span>
            </div>
            <button
              onClick={() => setAssignmentSuccessMsg(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:underline text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Live Support & Complaint Triage Queue */}
        <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-surface-elevated flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Recent Hardware Tickets</h2>
              <p className="text-xs text-muted">Live feed of submitted issues and support requests</p>
            </div>
            <span className="text-xs font-semibold text-muted">
              {recentComplaints.length} tickets
            </span>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-surface-elevated animate-pulse rounded-xl" />
              ))}
            </div>
          ) : recentComplaints.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-brand-teal mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No active support tickets</p>
              <p className="text-xs text-muted mt-1">All staff devices are operating normally.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentComplaints.map((ticket) => {
                const priorityBadge =
                  ticket.priority === "critical"
                    ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                    : ticket.priority === "high"
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                    : "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";

                const statusBadge =
                  ticket.status === "resolved" || ticket.status === "closed"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                    : ticket.status === "in-progress" || ticket.status === "under-review"
                    ? "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30"
                    : "bg-surface-elevated text-foreground-muted border-border";

                return (
                  <div
                    key={ticket.id}
                    className="p-4 sm:px-6 hover:bg-surface-elevated/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-surface-elevated border border-border text-muted mt-0.5 shrink-0">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {ticket.ticketNumber}
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${priorityBadge}`}>
                            {ticket.priority.toUpperCase()}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                            {ticket.status.replace("-", " ")}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-foreground mt-1">{ticket.title}</h4>
                        <p className="text-xs text-muted mt-0.5">
                          Submitted by <span className="font-medium text-foreground">{ticket.userName}</span>
                          {ticket.userDepartment ? ` (${ticket.userDepartment})` : ""} •{" "}
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
                      <span className="text-xs text-muted font-mono hidden sm:inline">
                        {ticket.itemSerial ? `SN: ${ticket.itemSerial}` : ""}
                      </span>

                      {/* Assigned Specialist Badge */}
                      {ticket.assignedTechName ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Specialist: <strong>{ticket.assignedTechName}</strong></span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                          Unassigned
                        </span>
                      )}

                      {/* Delegate / Reassign Button for Super Admins */}
                      {admin.role === "super-admin" && (
                        <button
                          type="button"
                          onClick={() => setAssigningTicket(ticket)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-foreground transition-colors shadow-xs"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-brand-teal" />
                          <span>{ticket.assignedTechId ? "Reassign" : "Assign Specialist"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Real-Time Live Activity Feed */}
        <LiveActivityTimeline />

        {/* Ticket Assignment Modal */}
        <AssignTicketModal
          isOpen={Boolean(assigningTicket)}
          ticket={assigningTicket}
          currentUserId={admin.id}
          onClose={() => setAssigningTicket(null)}
          onAssigned={(updatedTicket) => {
            setRecentComplaints((prev) =>
              prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t))
            );
            setCriticalComplaints((prev) =>
              prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t))
            );
            setAssignmentSuccessMsg(
              `Ticket ${updatedTicket.ticketNumber} successfully delegated to ${updatedTicket.assignedTechName || "specialist"}.`
            );
            setTimeout(() => setAssignmentSuccessMsg(null), 5000);
          }}
        />
      </div>
    </div>
  );
}
