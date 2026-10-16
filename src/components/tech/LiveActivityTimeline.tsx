"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Laptop,
  AlertTriangle,
  RefreshCw,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Activity,
  Radio,
} from "lucide-react";

export interface AuditLogActivity {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

function getRelativeTime(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  return `${diffDays}d ago`;
}

function getActionMeta(actionType: string) {
  switch (actionType) {
    case "device_self_registered":
      return {
        label: "Device Registered",
        icon: Laptop,
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        iconBg: "bg-blue-50 text-blue-600",
      };
    case "complaint_logged":
      return {
        label: "Ticket Created",
        icon: AlertTriangle,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        iconBg: "bg-amber-50 text-amber-600",
      };
    case "complaint_updated":
      return {
        label: "Ticket Updated",
        icon: RefreshCw,
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
        iconBg: "bg-purple-50 text-purple-600",
      };
    case "checkout_created":
      return {
        label: "Device Checked Out",
        icon: ArrowLeftRight,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        iconBg: "bg-emerald-50 text-emerald-600",
      };
    case "checkout_returned":
      return {
        label: "Device Returned",
        icon: CheckCircle2,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        iconBg: "bg-emerald-50 text-emerald-600",
      };
    default:
      return {
        label: actionType.replace(/_/g, " "),
        icon: Activity,
        badgeClass: "bg-neutral-100 text-neutral-700 border-neutral-200",
        iconBg: "bg-neutral-100 text-neutral-600",
      };
  }
}

export function LiveActivityTimeline() {
  const [activities, setActivities] = useState<AuditLogActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoPoll, setAutoPoll] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch("/api/tech/activity?limit=25");
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities ?? []);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.warn("Error fetching live activity feed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Polling interval
  useEffect(() => {
    if (!autoPoll) return;
    const interval = setInterval(() => {
      fetchActivities();
    }, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [autoPoll, fetchActivities]);

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-200/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <span>Live Activity Audit Feed</span>
            {autoPoll && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time equipment lifecycle, triage updates, and staff actions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchActivities()}
            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
            title="Refresh feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoPoll}
              onChange={(e) => setAutoPoll(e.target.checked)}
              className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 h-3.5 w-3.5"
            />
            <span className="flex items-center gap-1">
              <Radio className={`w-3.5 h-3.5 ${autoPoll ? "text-emerald-500" : "text-neutral-400"}`} />
              Auto-refresh
            </span>
          </label>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading && activities.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-neutral-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-100 animate-pulse rounded w-1/3" />
                  <div className="h-3 bg-neutral-50 animate-pulse rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-10">
            <Clock className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-neutral-800">No activity logged yet</p>
            <p className="text-xs text-neutral-500 mt-1">Actions on devices and tickets will appear here live.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-neutral-200/80">
            {activities.map((act) => {
              const meta = getActionMeta(act.action_type);
              const Icon = meta.icon;
              const details = act.details as Record<string, string> | null;

              return (
                <div key={act.id} className="relative flex items-start gap-3 group">
                  {/* Timeline Node Icon */}
                  <div
                    className={`absolute -left-6 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-white shadow-xs ${meta.iconBg}`}
                  >
                    <Icon className="h-3 w-3" />
                  </div>

                  <div className="flex-1 min-w-0 bg-neutral-50/50 hover:bg-neutral-50 rounded-lg p-3 border border-neutral-100 transition-colors">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900">{act.actor_name}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {getRelativeTime(act.created_at)}
                      </span>
                    </div>

                    {/* Details content */}
                    {details && (
                      <div className="mt-1.5 text-xs text-neutral-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {details.ticketNumber && (
                          <span>
                            Ticket: <strong className="font-mono text-neutral-800">{details.ticketNumber}</strong>
                          </span>
                        )}
                        {details.itemName && (
                          <span>
                            Device: <strong className="text-neutral-800">{details.itemName}</strong>
                          </span>
                        )}
                        {details.serialNumber && (
                          <span className="text-neutral-500 font-mono">
                            SN: {details.serialNumber}
                          </span>
                        )}
                        {details.newStatus && (
                          <span className="inline-flex items-center gap-1">
                            Status: <span className="font-semibold text-neutral-800">{details.newStatus}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
