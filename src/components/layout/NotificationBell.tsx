"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { InAppNotification } from "@/types";
import { NotificationDrawer } from "./NotificationDrawer";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = "" }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (!res.ok) return;

      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and poll every 30 seconds
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  async function handleMarkAsRead(id: string) {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", id }),
      });
    } catch (err) {
      console.warn("Error marking notification read:", err);
    }
  }

  async function handleMarkAllAsRead() {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
    } catch (err) {
      console.warn("Error marking all read:", err);
    }
  }

  async function handleClearAll() {
    setNotifications([]);
    setUnreadCount(0);

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_all" }),
      });
    } catch (err) {
      console.warn("Error clearing notifications:", err);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`relative flex items-center justify-center p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900/10 ${className}`}
        aria-label={`Notifications (${unreadCount} unread)`}
        title={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
      >
        <Bell className="w-4 h-4" />

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-75">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}

        {/* Subtle Pulse Animation when there are unread items */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-400 opacity-40 animate-ping pointer-events-none" />
        )}
      </button>

      {/* Slide-out Drawer */}
      <NotificationDrawer
        isOpen={isOpen}
        notifications={notifications}
        unreadCount={unreadCount}
        loading={loading}
        onClose={() => setIsOpen(false)}
        onRefresh={fetchNotifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAll}
      />
    </>
  );
}
