"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Admin, DepartmentUser } from "@/types";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { MobileHeader } from "./MobileHeader";
import { TopHeader } from "./TopHeader";
import { CommandSearchModal } from "./CommandSearchModal";

const SIDEBAR_STORAGE_KEY = "inventory-sidebar-collapsed";
const SIDEBAR_CHANGE_EVENT = "e310-sidebar-collapsed-change";
let memorySidebarCollapsed = false;

function subscribeSidebarCollapsed(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SIDEBAR_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, callback);
  };
}

function getSidebarCollapsedSnapshot(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return memorySidebarCollapsed;
  }
}

function getSidebarCollapsedServerSnapshot(): boolean {
  return false;
}

export function AppShell({
  admin,
  children,
}: {
  admin: Admin | DepartmentUser;
  children: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [isStaffPreview, setIsStaffPreview] = useState(false);

  const sidebarCollapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    getSidebarCollapsedServerSnapshot
  );

  const toggleSidebar = useCallback(() => {
    const next = !getSidebarCollapsedSnapshot();
    memorySidebarCollapsed = next;
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
    } catch (err) {
      console.warn("Unable to persist sidebar state to localStorage:", err);
    }
    window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
  }, []);

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
        <Sidebar
          admin={admin}
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          isStaffPreview={isStaffPreview}
          onToggleStaffPreview={() => setIsStaffPreview((prev) => !prev)}
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileHeader onOpenSearch={() => setSearchOpen(true)} />

        {/* Modular Desktop Top Application Header */}
        <TopHeader
          admin={admin}
          onOpenSearch={() => setSearchOpen(true)}
          isStaffPreview={isStaffPreview}
          onToggleStaffPreview={() => setIsStaffPreview((prev) => !prev)}
          sidebarCollapsed={sidebarCollapsed}
        />


        <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
      </div>
      <MobileNav
        admin={admin}
        isStaffPreview={isStaffPreview}
      />

      {/* Global Command Search Modal */}
      <CommandSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        userRole={admin?.role}
      />
    </div>
  );
}