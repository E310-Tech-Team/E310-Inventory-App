"use client";

import { useRouter } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { E310Logo } from "@/components/common/E310Logo";

export function MobileHeader({ onOpenSearch }: { onOpenSearch?: () => void }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="md:hidden sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <E310Logo size="xs" />
          <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-yellow/25 text-brand-navy dark:text-brand-yellow border border-brand-yellow/40 leading-none">
            INVENTORY
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              title="Search devices, tickets, staff"
              aria-label="Search"
              className="pressable p-2 rounded-lg border border-border bg-surface text-muted hover:bg-background hover:text-foreground transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
          <NotificationBell />
          <ThemeToggle compact />
          <button
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="pressable p-2 rounded-lg border border-border bg-surface text-muted hover:bg-background hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

