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
        badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
        iconBg: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-border",
      };
    case "complaint_logged":
      return {
        label: "Ticket Created",
        icon: AlertTriangle,
        badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
        iconBg: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-border",
      };
    case "complaint_updated":
      return {
        label: "Ticket Updated",
        icon: RefreshCw,
        badgeClass: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
        iconBg: "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-border",
      };
    case "checkout_created":
      return {
        label: "Device Checked Out",
        icon: ArrowLeftRight,
        badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
        iconBg: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-border",
      };
    case "checkout_returned":
      return {
        label: "Device Returned",
        icon: CheckCircle2,
        badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
        iconBg: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-border",
      };
    default:
      return {
        label: actionType.replace(/_/g, " "),
        icon: Activity,
        badgeClass: "bg-surface-elevated text-foreground-muted border-border",
        iconBg: "bg-surface-elevated text-muted border-border",
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
    <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-surface-elevated flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span>Live Activity Audit Feed</span>
            {autoPoll && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-teal opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-teal" />
              </span>
            )}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Real-time equipment lifecycle, triage updates, and staff actions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchActivities()}
            className="p-1.5 rounded-xl border border-border text-muted hover:text-foreground hover:bg-surface transition-colors"
            title="Refresh feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoPoll}
              onChange={(e) => setAutoPoll(e.target.checked)}
              className="rounded border-border text-brand-teal focus:ring-brand-teal h-3.5 w-3.5"
            />
            <span className="flex items-center gap-1">
              <Radio className={`w-3.5 h-3.5 ${autoPoll ? "text-brand-teal" : "text-muted"}`} />
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
                <div className="w-8 h-8 rounded-full bg-surface-elevated animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-elevated animate-pulse rounded w-1/3" />
                  <div className="h-3 bg-surface-elevated animate-pulse rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-10">
            <Clock className="w-8 h-8 text-muted mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">No activity logged yet</p>
            <p className="text-xs text-muted mt-1">Actions on devices and tickets will appear here live.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
            {activities.map((act) => {
              const meta = getActionMeta(act.action_type);
              const Icon = meta.icon;
              const details = act.details as Record<string, string> | null;

              return (
                <div key={act.id} className="relative flex items-start gap-3 group">
                  {/* Timeline Node Icon */}
                  <div
                    className={`absolute -left-6 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-border shadow-xs ${meta.iconBg}`}
                  >
                    <Icon className="h-3 w-3" />
                  </div>

                  <div className="flex-1 min-w-0 bg-surface-elevated hover:bg-surface-elevated/80 rounded-xl p-3.5 border border-border transition-colors">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{act.actor_name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted font-mono">
                        {getRelativeTime(act.created_at)}
                      </span>
                    </div>

                    {/* Details content */}
                    {details && (
                      <div className="mt-1.5 text-xs text-foreground-muted flex flex-wrap items-center gap-x-3 gap-y-1">
                        {details.ticketNumber && (
                          <span>
                            Ticket: <strong className="font-mono text-foreground">{details.ticketNumber}</strong>
                          </span>
                        )}
                        {details.itemName && (
                          <span>
                            Device: <strong className="text-foreground">{details.itemName}</strong>
                          </span>
                        )}
                        {details.serialNumber && (
                          <span className="text-muted font-mono">
                            SN: {details.serialNumber}
                          </span>
                        )}
                        {details.newStatus && (
                          <span className="inline-flex items-center gap-1">
                            Status: <span className="font-bold text-foreground">{details.newStatus}</span>
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
