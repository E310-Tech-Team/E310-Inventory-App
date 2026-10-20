"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ExternalLink, User, Eye } from "lucide-react";
import { Admin } from "@/types";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { E310Logo } from "@/components/common/E310Logo";

interface TopHeaderProps {
  admin: Admin;
  onOpenSearch: () => void;
  isStaffPreview?: boolean;
  onToggleStaffPreview?: () => void;
}

function getShortcutKey(): string {
  if (typeof window === "undefined") return "⌘K";
  return /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent) ? "⌘K" : "Ctrl+K";
}

export function TopHeader({
  admin,
  onOpenSearch,
  isStaffPreview = false,
  onToggleStaffPreview,
}: TopHeaderProps) {
  const [shortcutKey] = useState(getShortcutKey);

  const isTechRole =
    admin?.role === "super-admin" ||
    admin?.role === "tech-support" ||
    admin?.role === "team-member";

  return (
    <header className="hidden md:flex h-14 items-center justify-between px-6 lg:px-8 border-b border-border bg-surface/90 backdrop-blur sticky top-0 z-20 transition-colors">
      {/* Left: Branding & Role Context Indicator */}
      <div className="flex items-center gap-3">
        <Link
          href={isTechRole ? "/dashboard" : "/staff"}
          className="flex items-center gap-2 hover:opacity-85 transition-opacity"
          title="E310 Inventory App"
        >
          <E310Logo size="xs" />
        </Link>
        <span className="h-4 w-px bg-border" />

        {isStaffPreview ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Staff Portal Preview
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              Admin Preview
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted">
              {isTechRole ? "Tech Command Center" : "Staff Hardware Portal"}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-elevated text-foreground border border-border">
              {admin?.role || "Staff"}
            </span>
          </div>
        )}
      </div>

      {/* Center: Command Bar Search Trigger (⌘K) */}
      <div className="flex-1 max-w-md mx-6">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl border border-border bg-background/80 hover:bg-background hover:border-accent/40 text-muted hover:text-foreground text-xs transition-all shadow-2xs group"
          title={`Global Search (${shortcutKey})`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-3.5 h-3.5 text-muted group-hover:text-foreground transition-colors shrink-0" />
            <span className="truncate">Search devices, tickets, staff...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider font-mono bg-surface border border-border text-muted group-hover:text-foreground transition-colors shrink-0 ml-2">
            {shortcutKey}
          </kbd>
        </button>
      </div>

      {/* Right: Notifications, Quick Actions, Portal Switcher & Profile */}
      <div className="flex items-center gap-3">
        <NotificationBell />
        <ThemeToggle compact />
        <span className="h-4 w-px bg-border" />

        {/* Portal Switcher Button / Preview Toggle */}
        {admin?.role === "super-admin" && onToggleStaffPreview ? (
          <button
            type="button"
            onClick={onToggleStaffPreview}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors shadow-2xs ${
              isStaffPreview
                ? "bg-amber-500 text-white border-amber-600 hover:bg-amber-600"
                : "border-border bg-surface hover:bg-background text-foreground"
            }`}
            title={isStaffPreview ? "Exit Staff View Preview" : "Preview Staff Self-Service Portal"}
          >
            <Eye className="w-3 h-3" />
            <span>{isStaffPreview ? "Exit Preview" : "Staff View"}</span>
          </button>
        ) : isTechRole ? (
          <Link
            href="/staff"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-background text-xs font-semibold text-foreground transition-colors shadow-2xs"
            title="Preview Staff Self-Service Portal"
          >
            <span>Staff View</span>
            <ExternalLink className="w-3 h-3 text-muted" />
          </Link>
        ) : (
          <Link
            href="/staff/devices"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-background text-xs font-semibold text-foreground transition-colors shadow-2xs"
          >
            <span>My Devices</span>
          </Link>
        )}

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-bold text-xs">
            {admin?.name ? admin.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground leading-none truncate max-w-[120px]">
              {admin?.name || "User"}
            </span>
            <span className="text-[10px] text-muted capitalize leading-tight truncate max-w-[120px]">
              {admin?.department || admin?.role || "Staff"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
