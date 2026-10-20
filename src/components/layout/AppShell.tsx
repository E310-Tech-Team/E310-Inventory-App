"use client";

import { Admin, DepartmentUser } from "@/types";
import Link from "next/link";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { MobileHeader } from "./MobileHeader";
import { NotificationBell } from "./NotificationBell";

export function AppShell({
  admin,
  children,
}: {
  admin: Admin | DepartmentUser;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <Sidebar admin={admin} />
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