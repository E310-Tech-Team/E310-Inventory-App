"use client";

import { useEffect, useState } from "react";
import { Admin } from "@/types";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { MobileHeader } from "./MobileHeader";
import { TopHeader } from "./TopHeader";
import { CommandSearchModal } from "./CommandSearchModal";

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
  const [searchOpen, setSearchOpen] = useState(false);

  function handleToggle() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }

  // Global keyboard shortcut: ⌘K or Ctrl+K opens the command search modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <Sidebar admin={admin} collapsed={collapsed} onToggle={handleToggle} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileHeader onOpenSearch={() => setSearchOpen(true)} />

        {/* Modular Desktop Top Application Header */}
        <TopHeader
          admin={admin}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
      </div>
      <MobileNav admin={admin} />

      {/* Global Command Search Modal */}
      <CommandSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        userRole={admin?.role}
      />
    </div>
  );
}

