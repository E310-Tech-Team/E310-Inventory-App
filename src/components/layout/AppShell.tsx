"use client";

import { useState } from "react";
import { Admin } from "@/types";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { MobileHeader } from "./MobileHeader";

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
        <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
      </div>
      <MobileNav admin={admin} />
    </div>
  );
}

