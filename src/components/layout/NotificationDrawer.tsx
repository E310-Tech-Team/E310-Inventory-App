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
        bg: "bg-amber-50 text-amber-600 border-amber-200/80",
      };
    case "complaint_assigned":
      return {
        icon: UserCheck,
        bg: "bg-emerald-50 text-emerald-600 border-emerald-200/80",
      };
    case "complaint_status_changed":
      return {
        icon: Clock,
        bg: "bg-blue-50 text-blue-600 border-blue-200/80",
      };
    case "device_registered":
      return {
        icon: Laptop,
        bg: "bg-purple-50 text-purple-600 border-purple-200/80",
      };
    case "device_approved":
      return {
        icon: CheckCircle2,
        bg: "bg-emerald-50 text-emerald-600 border-emerald-200/80",
      };
    case "system_alert":
    default:
      return {
        icon: ShieldAlert,
        bg: "bg-rose-50 text-rose-600 border-rose-200/80",
      };
  }
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
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
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  function handleNotificationClick(item: InAppNotification) {
    if (!item.isRead) {
      onMarkAsRead(item.id);
    }
    onClose();
    if (item.linkUrl) {
      router.push(item.linkUrl);
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
        className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="relative w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-neutral-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-200/80 bg-neutral-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-xs">
                <Bell className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-neutral-900">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500">In-portal ticket and hardware alerts</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                title="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Subheader Controls: Tabs & Actions */}
          <div className="px-6 py-3 border-b border-neutral-200/80 bg-white flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-100">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  filter === "all"
                    ? "bg-white text-neutral-900 shadow-2xs font-semibold"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  filter === "unread"
                    ? "bg-white text-neutral-900 shadow-2xs font-semibold"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="inline-flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-neutral-500 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-600" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-neutral-800">
                  {filter === "unread" ? "No unread alerts" : "No notifications"}
                </p>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                  {filter === "unread"
                    ? "You are all caught up on all support tickets and system alerts."
                    : "You will receive updates here when tickets are assigned, logged, or updated."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const iconConfig = getNotificationIcon(item.notificationType);
                const IconComponent = iconConfig.icon;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`group relative p-4 sm:px-6 flex items-start gap-3 cursor-pointer transition-colors ${
                      item.isRead
                        ? "bg-white hover:bg-neutral-50/70"
                        : "bg-emerald-50/25 hover:bg-emerald-50/40"
                    }`}
                  >
                    {/* Notification Type Icon */}
                    <div
                      className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${iconConfig.bg}`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4
                          className={`text-xs ${
                            item.isRead
                              ? "font-medium text-neutral-800"
                              : "font-bold text-neutral-900"
                          }`}
                        >
                          {item.title}
                        </h4>
                        {!item.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        )}
                      </div>

                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-400">
                        <span>{formatRelativeTime(item.createdAt)}</span>
                        {item.linkUrl && (
                          <span className="inline-flex items-center gap-0.5 text-neutral-500 group-hover:text-neutral-900 font-medium transition-colors">
                            View details <ExternalLink className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Single Mark Read Action on Hover */}
                    {!item.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 p-1 rounded-md text-neutral-400 hover:text-emerald-700 hover:bg-white transition-all shadow-2xs"
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
            <div className="p-4 border-t border-neutral-200/80 bg-neutral-50/50 flex items-center justify-between text-xs">
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-rose-600 transition-colors font-medium disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{clearing ? "Clearing..." : "Clear all notifications"}</span>
              </button>

              <button
                onClick={onRefresh}
                className="text-neutral-500 hover:text-neutral-900 transition-colors font-medium"
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
