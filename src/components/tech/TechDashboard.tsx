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
} from "lucide-react";
import { Admin, DeviceComplaint, Item, Checkout } from "@/types";
import { LiveActivityTimeline } from "./LiveActivityTimeline";

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
        const complaints: DeviceComplaint[] = complaintsData.complaints ?? [];

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
    <div className="min-h-screen bg-white px-4 sm:px-6 lg:px-8 py-8 text-neutral-900">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Top Header / Greeting */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-neutral-200/80">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              EThree10 Tech Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Welcome back, {admin.name}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Enterprise hardware lifecycle, triage dispatch, and custody monitoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/checkouts"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs sm:text-sm font-medium text-neutral-800 transition-colors shadow-xs"
            >
              <ArrowLeftRight className="w-4 h-4 text-neutral-500" />
              Checkouts
            </Link>
            <Link
              href="/exports"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs sm:text-sm font-medium text-neutral-800 transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-neutral-500" />
              Reports
            </Link>
            <Link
              href="/categories"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs sm:text-sm font-medium text-white transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              New Asset
            </Link>
          </div>
        </div>

        {/* Critical Complaints Alert Banner */}
        {!loading && criticalComplaints.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 sm:p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-rose-900">
                    High Priority: {criticalComplaints.length} Critical Hardware {criticalComplaints.length === 1 ? "Ticket" : "Tickets"}
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-rose-200/80 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                    Action Required
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-rose-700">
                  Critical hardware complaints require immediate IT triage or equipment replacement.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {criticalComplaints.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-rose-300/80 bg-white px-3 py-1.5 text-xs font-medium text-rose-900 shadow-xs"
                    >
                      <span className="font-mono font-bold text-rose-600">{ticket.ticketNumber}</span>
                      <span>{ticket.title}</span>
                      <span className="text-neutral-400">•</span>
                      <span className="text-neutral-600">{ticket.userName}</span>
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
            className="group relative rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs transition-all hover:border-neutral-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Total Inventory
              </span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-8 w-16 bg-neutral-100 animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-extrabold text-neutral-900 tracking-tight">
                  {metrics.totalAssets}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
                <span>Catalogued equipment</span>
                <span className="inline-flex items-center text-blue-600 font-medium group-hover:translate-x-0.5 transition-transform">
                  View items <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          </Link>

          {/* Card 2: Checked Out */}
          <Link
            href="/checkouts"
            className="group relative rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs transition-all hover:border-neutral-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Active Custody
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-8 w-16 bg-neutral-100 animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-extrabold text-neutral-900 tracking-tight">
                  {metrics.checkedOut}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
                <span>Assigned to staff</span>
                <span className="inline-flex items-center text-emerald-600 font-medium group-hover:translate-x-0.5 transition-transform">
                  Checkouts <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          </Link>

          {/* Card 3: Pending Complaints */}
          <div className="relative rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs transition-all hover:border-neutral-300 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Hardware Tickets
              </span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-8 w-16 bg-neutral-100 animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-extrabold text-neutral-900 tracking-tight">
                  {metrics.pendingComplaints}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
                <span>Active tickets in queue</span>
                <span className="inline-flex items-center text-amber-600 font-medium">
                  {metrics.pendingComplaints > 0 ? "Triage active" : "All cleared"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Overdue Returns */}
          <Link
            href="/checkouts"
            className="group relative rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs transition-all hover:border-neutral-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Overdue Returns
              </span>
              <div
                className={`p-2 rounded-lg transition-colors ${
                  metrics.overdueReturns > 0
                    ? "bg-rose-50 text-rose-600 group-hover:bg-rose-100"
                    : "bg-neutral-50 text-neutral-500"
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-8 w-16 bg-neutral-100 animate-pulse rounded" />
              ) : (
                <div
                  className={`text-3xl font-extrabold tracking-tight ${
                    metrics.overdueReturns > 0 ? "text-rose-600" : "text-neutral-900"
                  }`}
                >
                  {metrics.overdueReturns}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
                <span>Past scheduled return date</span>
                <span
                  className={`inline-flex items-center font-medium group-hover:translate-x-0.5 transition-transform ${
                    metrics.overdueReturns > 0 ? "text-rose-600" : "text-neutral-500"
                  }`}
                >
                  Inspect <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Live Support & Complaint Triage Queue */}
        <div className="rounded-xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200/80 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Recent Hardware Tickets</h2>
              <p className="text-xs text-neutral-500">Live feed of submitted issues and support requests</p>
            </div>
            <span className="text-xs font-medium text-neutral-500">
              {recentComplaints.length} tickets
            </span>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-neutral-50 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : recentComplaints.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-900">No active support tickets</p>
              <p className="text-xs text-neutral-500 mt-1">All staff devices are operating normally.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {recentComplaints.map((ticket) => {
                const priorityBadge =
                  ticket.priority === "critical"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : ticket.priority === "high"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-blue-50 text-blue-700 border-blue-200";

                const statusBadge =
                  ticket.status === "resolved" || ticket.status === "closed"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : ticket.status === "in-progress"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-neutral-100 text-neutral-700 border-neutral-200";

                return (
                  <div
                    key={ticket.id}
                    className="p-4 sm:px-6 hover:bg-neutral-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-neutral-100 text-neutral-600 mt-0.5 shrink-0">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-neutral-900">
                            {ticket.ticketNumber}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${priorityBadge}`}>
                            {ticket.priority.toUpperCase()}
                          </span>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusBadge}`}>
                            {ticket.status.replace("-", " ")}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-neutral-900 mt-1">{ticket.title}</h4>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Submitted by <span className="font-medium text-neutral-700">{ticket.userName}</span>
                          {ticket.userDepartment ? ` (${ticket.userDepartment})` : ""} •{" "}
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs text-neutral-400 font-mono">
                        {ticket.itemSerial ? `SN: ${ticket.itemSerial}` : "No serial linked"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Real-Time Live Activity Feed */}
        <LiveActivityTimeline />
      </div>
    </div>
  );
}
