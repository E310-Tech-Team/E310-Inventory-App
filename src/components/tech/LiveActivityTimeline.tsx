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
} from "lucide-react";
import { ShowMoreBar } from "@/components/ui/ShowMoreBar";

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
        badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
        iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      };
    case "complaint_logged":
      return {
        label: "Ticket Created",
        icon: AlertTriangle,
        badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
        iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      };
    case "complaint_updated":
      return {
        label: "Ticket Updated",
        icon: RefreshCw,
        badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
        iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      };
    case "checkout_created":
      return {
        label: "Device Checked Out",
        icon: ArrowLeftRight,
        badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
        iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      };
    case "checkout_returned":
      return {
        label: "Device Returned",
        icon: CheckCircle2,
        badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
        iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      };
    default:
      return {
        label: actionType.replace(/_/g, " "),
        icon: Activity,
        badgeClass: "bg-surface-elevated text-foreground-muted border-border/60",
        iconBg: "bg-surface-elevated text-muted border-border/60",
      };
  }
}

export function LiveActivityTimeline() {
  const [activities, setActivities] = useState<AuditLogActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoPoll, setAutoPoll] = useState(true);
  const [mobileLimit, setMobileLimit] = useState(6);

  const fetchActivities = useCallback(async (manual = false) => {
    try {
      if (manual) setIsRefreshing(true);
      const res = await fetch("/api/tech/activity?limit=30");
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities ?? []);
      }
    } catch (err) {
      console.warn("Error fetching live activity feed:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const res = await fetch("/api/tech/activity?limit=30");
        if (res.ok) {
          const data = await res.json();
          if (active) setActivities(data.activities ?? []);
        }
      } catch (err) {
        console.warn("Error fetching live activity feed:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, []);

  // Calm background polling interval (every 60s)
  useEffect(() => {
    if (!autoPoll) return;
    const interval = setInterval(() => {
      fetchActivities(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [autoPoll, fetchActivities]);

  return (
    <div className="rounded-2xl border border-border/70 bg-surface/90 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border/60 bg-surface/60 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span>Audit & Activity Timeline</span>
            {autoPoll && (
              <span
                className="inline-flex h-1.5 w-1.5 rounded-full bg-brand-teal"
                title="Live sync enabled"
              />
            )}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Chronological log of ticket transitions, device custody, and administrative actions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoPoll((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              autoPoll
                ? "border-brand-teal/30 bg-brand-teal/10 text-brand-teal"
                : "border-border/70 bg-surface text-muted hover:text-foreground"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                autoPoll ? "bg-brand-teal" : "bg-muted"
              }`}
            />
            <span>{autoPoll ? "Auto-sync On" : "Auto-sync Off"}</span>
          </button>

          <button
            type="button"
            onClick={() => fetchActivities(true)}
            className="p-1.5 rounded-lg border border-border/70 text-muted hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
            title="Refresh feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {loading && activities.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-7 h-7 rounded-full bg-surface-elevated animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-elevated animate-pulse rounded w-1/3" />
                  <div className="h-3 bg-surface-elevated animate-pulse rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border/60 flex items-center justify-center text-muted mx-auto mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">No activity logged yet</p>
            <p className="text-xs text-muted mt-1">
              Updates to tickets and hardware custody will appear here automatically.
            </p>
          </div>
        ) : (
          <>
            <div className="relative pl-5 sm:pl-6 space-y-2.5 sm:space-y-3.5 before:absolute before:left-2 before:sm:left-2.5 before:top-3 before:bottom-3 before:w-px before:bg-border/70">
              {activities.map((act, idx) => {
                const meta = getActionMeta(act.action_type);
                const Icon = meta.icon;
                const details = act.details as Record<string, string> | null;

                return (
                  <div
                    key={act.id}
                    className={`${
                      idx >= mobileLimit ? "hidden md:flex" : "flex"
                    } relative items-start gap-3`}
                  >
                    {/* Timeline Node Icon */}
                    <div
                      className={`absolute -left-5 sm:-left-6 mt-2 flex h-5 w-5 items-center justify-center rounded-full border shadow-2xs ${meta.iconBg}`}
                    >
                      <Icon className="h-2.5 w-2.5" />
                    </div>

                    <div className="flex-1 min-w-0 bg-surface-elevated/35 hover:bg-surface-elevated/60 rounded-xl p-3 sm:p-3.5 border border-border/60 transition-colors">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {act.actor_name}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted font-mono">
                          {getRelativeTime(act.created_at)}
                        </span>
                      </div>

                      {details && (
                        <div className="mt-1.5 text-xs text-foreground-muted flex flex-wrap items-center gap-x-3 gap-y-1">
                          {details.ticketNumber && (
                            <span>
                              Ticket:{" "}
                              <span className="font-mono font-medium text-foreground">
                                {details.ticketNumber}
                              </span>
                            </span>
                          )}
                          {details.itemName && (
                            <span>
                              Device:{" "}
                              <span className="font-medium text-foreground">{details.itemName}</span>
                            </span>
                          )}
                          {details.serialNumber && (
                            <span className="text-muted font-mono">SN: {details.serialNumber}</span>
                          )}
                          {details.newStatus && (
                            <span>
                              Status:{" "}
                              <span className="font-semibold text-foreground capitalize">
                                {String(details.newStatus).replace(/-/g, " ")}
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="md:hidden">
              <ShowMoreBar
                visibleCount={Math.min(mobileLimit, activities.length)}
                totalCount={activities.length}
                initialLimit={6}
                noun="events"
                standalone
                onShowMore={() => setMobileLimit((prev) => prev + 6)}
                onCollapse={() => setMobileLimit(6)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
