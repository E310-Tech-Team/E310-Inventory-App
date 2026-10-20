"use client";

import { useRouter } from "next/navigation";
import { LogOut, Package } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";

export function MobileHeader() {
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
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <Package className="w-3.5 h-3.5 text-white" strokeWidth={2} />
          </div>
          <span className="font-semibold text-sm leading-tight">EThree10 Inventory</span>
        </div>
        <div className="flex items-center gap-2">
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

