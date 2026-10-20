"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
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

        {/* Super Admin Staff Preview Mode Banner */}
        {isStaffPreview && (
          <div className="bg-amber-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 shrink-0" />
              <span>
                Super Admin Preview: You are currently previewing the Staff Self-Service Portal view.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsStaffPreview(false)}
              className="px-2.5 py-1 rounded bg-black/20 hover:bg-black/30 text-white text-[11px] font-bold tracking-wide transition-colors shrink-0 ml-3"
            >
              Exit Preview
            </button>
          </div>
        )}

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