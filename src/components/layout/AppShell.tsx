"use client";

import { useState } from "react";
import Link from "next/link";
import { Admin } from "@/types";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { MobileHeader } from "./MobileHeader";
import { NotificationBell } from "./NotificationBell";

const SIDEBAR_STORAGE_KEY = "inventory-sidebar-collapsed";

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
  return stored === null ? true : stored === "true";
}

export function AppShell({
  admin,
  children,
}: {
  admin: Admin;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  function handleToggle() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <Sidebar admin={admin} collapsed={collapsed} onToggle={handleToggle} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileHeader />

        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex h-14 items-center justify-between px-6 lg:px-8 border-b border-border bg-surface/90 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              EThree10 Portal
            </span>
            <span className="h-3.5 w-px bg-neutral-200" />
            <span className="text-xs text-neutral-600 font-medium">
              Enterprise Device Inventory & Support Hub
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="h-4 w-px bg-neutral-200" />
            <Link
              href="/staff"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-colors shadow-2xs"
            >
              <span>Staff View</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
      </div>
      <MobileNav admin={admin} />
    </div>
  );
}

