"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  UserCheck,
  Clock,
  Laptop,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { InAppNotification, NotificationType } from "@/types";

interface NotificationDrawerProps {
  isOpen: boolean;
  notifications: InAppNotification[];
  unreadCount: number;
  loading: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "complaint_logged":
      return {
        icon: AlertTriangle,
        bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      };
    case "complaint_assigned":
      return {
        icon: UserCheck,
        bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      };
    case "complaint_status_changed":
      return {
        icon: Clock,
        bg: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      };
    case "device_registered":
      return {
        icon: Laptop,
        bg: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
      };
    case "device_approved":
      return {
        icon: CheckCircle2,
        bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      };
    case "system_alert":
    default:
      return {
        icon: ShieldAlert,
        bg: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      };
  }
}

function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return "Recently";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recently";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "Just now";
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export function NotificationDrawer({
  isOpen,
  notifications,
  unreadCount,
  loading,
  onClose,
  onRefresh,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}: NotificationDrawerProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [clearing, setClearing] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => {
          const isItemRead = Boolean(n.isRead || (n as any).is_read);
          return !isItemRead;
        })
      : notifications;

  function handleNotificationClick(item: InAppNotification) {
    const isItemRead = item.isRead === true || (item as any).is_read === true;
    if (!isItemRead) {
      onMarkAsRead(item.id);
    }
    onClose();
    const targetUrl = item.linkUrl || (item as any).link_url;
    if (targetUrl) {
      router.push(targetUrl);
    }
  }

  async function handleClearAll() {
    if (window.confirm("Are you sure you want to clear all notifications?")) {
      setClearing(true);
      await onClearAll();
      setClearing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 z-50 flex max-w-full pl-6 sm:pl-10 h-screen h-[100dvh] pointer-events-none">
        <div className="pointer-events-auto relative w-screen max-w-md h-screen h-[100dvh] bg-surface shadow-2xl flex flex-col border-l border-border text-foreground">
          {/* Header */}
          <div className="shrink-0 px-6 py-4 border-b border-border bg-surface flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-teal/10 border border-brand-teal/20 text-brand-teal shadow-xs">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground tracking-tight">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-teal/15 text-brand-teal border border-brand-teal/25 font-mono">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted">Field custody, service tickets & system updates</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:bg-surface-elevated hover:text-foreground transition-colors"
              title="Close notifications (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Subheader Controls: Segmented Tabs & Actions */}
          <div className="shrink-0 px-6 py-2.5 border-b border-border bg-surface-elevated/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-surface-elevated border border-border/80">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  filter === "all"
                    ? "bg-surface text-foreground shadow-xs font-semibold border border-border/60"
                    : "text-muted hover:text-foreground"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  filter === "unread"
                    ? "bg-surface text-foreground shadow-xs font-semibold border border-border/60"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 text-brand-teal" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications Scroll List */}
          <div className="flex-1 min-h-[200px] overflow-y-auto divide-y divide-border overscroll-contain">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-brand-teal" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-muted mb-3">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {filter === "unread" ? "No unread alerts" : "No notifications"}
                </p>
                <p className="text-xs text-muted mt-1 max-w-xs">
                  {filter === "unread"
                    ? "You are all caught up on all support tickets and system alerts."
                    : "You will receive updates here when tickets are assigned, logged, or updated."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const notifType = item.notificationType || (item as any).notification_type;
                const iconConfig = getNotificationIcon(notifType);
                const IconComponent = iconConfig.icon;
                const isItemRead = item.isRead === true || (item as any).is_read === true;
                const dateVal = item.createdAt || (item as any).created_at;
                const targetUrl = item.linkUrl || (item as any).link_url;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`group relative p-4 sm:px-6 flex items-start gap-3 cursor-pointer transition-colors ${
                      isItemRead
                        ? "bg-surface hover:bg-surface-elevated"
                        : "bg-brand-teal/5 hover:bg-brand-teal/10"
                    }`}
                  >
                    {/* Notification Type Icon */}
                    <div
                      className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${iconConfig.bg}`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4
                          className={`text-xs ${
                            isItemRead
                              ? "font-medium text-foreground-muted"
                              : "font-bold text-foreground"
                          }`}
                        >
                          {item.title}
                        </h4>
                        {!isItemRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
                        )}
                      </div>

                      <p className="text-xs text-muted mt-1 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted">
                        <span>{formatRelativeTime(dateVal)}</span>
                        {targetUrl && (
                          <span className="inline-flex items-center gap-0.5 text-muted group-hover:text-foreground font-medium transition-colors">
                            View details <ExternalLink className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Single Mark Read Action on Hover */}
                    {!isItemRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 p-1 rounded-md text-muted hover:text-foreground hover:bg-surface-elevated transition-all shadow-xs border border-border"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="shrink-0 p-4 border-t border-border bg-surface-elevated flex items-center justify-between text-xs mt-auto">
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="inline-flex items-center gap-1.5 text-muted hover:text-rose-500 transition-colors font-medium disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{clearing ? "Clearing..." : "Clear all notifications"}</span>
              </button>

              <button
                onClick={onRefresh}
                className="text-muted hover:text-foreground transition-colors font-medium"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
