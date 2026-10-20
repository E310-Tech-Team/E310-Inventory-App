"use client";

import { useEffect, useState } from "react";
import { Admin, DepartmentUser } from "@/types";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { MobileHeader } from "./MobileHeader";
import { TopHeader } from "./TopHeader";
import { CommandSearchModal } from "./CommandSearchModal";

export function AppShell({
  admin,
  children,
}: {
  admin: Admin | DepartmentUser;
  children: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [isStaffPreview, setIsStaffPreview] = useState(false);

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
        />


        <main className="flex-1 min-w-0 pb-24 md:pb-0">{children}</main>
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