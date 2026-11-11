"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Eye } from "lucide-react";
import { Admin, DepartmentUser } from "@/types";
import { isTechUser } from "@/lib/auth/roles";
import { E310Logo } from "@/components/common/E310Logo";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";

interface TopHeaderProps {
  admin?: Admin | DepartmentUser | null;
  onOpenSearch: () => void;
  isStaffPreview?: boolean;
  onToggleStaffPreview?: () => void;
  sidebarCollapsed?: boolean;
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
  sidebarCollapsed = false,
}: TopHeaderProps) {
  const [shortcutKey] = useState(getShortcutKey);
  const isStaff = !isTechUser(admin) || isStaffPreview;

  return (
    <header className="hidden md:flex h-14 items-center justify-between gap-4 px-6 lg:px-8 border-b border-border/70 bg-surface/80 backdrop-blur sticky top-0 z-20 transition-colors">
      {/* Left: Brand Logo (when sidebar is collapsed) & Search Trigger (⌘K) */}
      <div className="flex-1 flex items-center gap-4 min-w-0">
        {sidebarCollapsed && (
          <Link
            href={isStaff ? "/staff" : "/dashboard"}
            className="flex items-center shrink-0 hover:opacity-85 transition-opacity"
            title="E310 Inventory App"
          >
            <E310Logo size="sm" />
          </Link>
        )}

        <div className="flex-1 max-w-md min-w-0">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl border border-border/70 bg-background/70 hover:bg-background hover:border-border text-muted hover:text-foreground text-xs transition-colors group"
            title={`Global Search (${shortcutKey})`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="w-3.5 h-3.5 text-muted group-hover:text-foreground transition-colors shrink-0" />
              <span className="truncate">Search devices, tickets, staff...</span>
            </div>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wider font-mono bg-surface border border-border/70 text-muted group-hover:text-foreground transition-colors shrink-0 ml-2">
              {shortcutKey}
            </kbd>
          </button>
        </div>
      </div>

      {/* Right: Preview Exit (only when active), Notifications & Theme */}
      <div className="flex items-center gap-1.5">
        {isStaffPreview && onToggleStaffPreview && (
          <button
            type="button"
            onClick={onToggleStaffPreview}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 mr-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-xs font-medium text-amber-700 dark:text-amber-300 transition-colors"
            title="Exit Staff View Preview"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Exit Staff Preview</span>
          </button>
        )}

        <NotificationBell />
        <ThemeToggle compact />
      </div>
    </header>
  );
}
