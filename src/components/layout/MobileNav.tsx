"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  UserRoundCog,
  Package,
  ShieldCheck,
  Home,
  Laptop,
  LifeBuoy,
  MoreHorizontal,
  Boxes,
  SlidersHorizontal,
  FileSpreadsheet,
  Monitor,
  X,
} from "lucide-react";
import { Admin } from "@/types";
import { isTechUser } from "@/lib/auth/roles";

const TECH_PRIMARY_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/tech", label: "Tickets", icon: LifeBuoy },
  { href: "/items", label: "Inventory", icon: Package },
  { href: "/checkouts", label: "Loans", icon: ArrowLeftRight },
];

const TECH_SECONDARY_ITEMS = [
  { href: "/tech/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/categories", label: "Categories", icon: Boxes },
  { href: "/tech/options", label: "Form Options", icon: SlidersHorizontal },
  { href: "/exports", label: "Data Exports", icon: FileSpreadsheet },
  { href: "/staff", label: "Staff Portal", icon: Monitor },
  { href: "/access", label: "User Access", icon: UserRoundCog, superAdminOnly: true },
];

const STAFF_NAV_ITEMS = [
  { href: "/staff", label: "Overview", icon: Home },
  { href: "/staff/devices", label: "My Devices", icon: Laptop },
  { href: "/staff/tickets", label: "Tickets", icon: LifeBuoy },
];

function matchesPath(pathname: string, href: string): boolean {
  if (href === "/tech") return pathname === "/tech";
  if (href === "/staff") return pathname === "/staff";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav({
  admin,
  isStaffPreview = false,
}: {
  admin: Admin;
  isStaffPreview?: boolean;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isStaff = !isTechUser(admin) || isStaffPreview;

  if (isStaff) {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border/70 shadow-lg">
        <nav className="flex items-center justify-around px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] gap-1">
          {STAFF_NAV_ITEMS.map((item) => {
            const isActive = matchesPath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] font-medium leading-none transition-colors ${
                  isActive
                    ? "bg-surface-elevated text-foreground border border-border/70"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? "text-accent" : "text-muted"}`} />
                <span className="truncate max-w-full">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  const secondaryItems = TECH_SECONDARY_ITEMS.filter(
    (item) => !item.superAdminOnly || admin.role === "super-admin"
  );
  const isMoreActive = secondaryItems.some((item) => matchesPath(pathname, item.href));

  return (
    <>
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
          onClick={() => setMoreOpen(false)}
          aria-hidden="true"
        />
      )}

      {moreOpen && (
        <div className="md:hidden fixed bottom-[62px] left-3 right-3 z-50 rounded-2xl border border-border/80 bg-surface shadow-2xl p-3 animate-fade-in">
          <div className="flex items-center justify-between px-1 pb-2.5 mb-2.5 border-b border-border/60">
            <span className="text-xs font-semibold text-foreground">All Workspaces</span>
            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              className="p-1 rounded-lg text-muted hover:text-foreground"
              aria-label="Close workspaces menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const active = matchesPath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                    active
                      ? "bg-accent-soft text-accent border-accent/25 font-semibold"
                      : "bg-surface-elevated/40 text-foreground border-border/50 hover:bg-surface-elevated"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border/70 shadow-lg">
        <nav className="flex items-center justify-around px-1.5 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] gap-1">
          {TECH_PRIMARY_ITEMS.map((item) => {
            const isActive = matchesPath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10px] font-medium leading-none transition-colors ${
                  isActive
                    ? "bg-surface-elevated text-foreground border border-border/70 font-semibold"
                    : "text-muted hover:text-foreground border border-transparent"
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] ${isActive ? "text-accent" : "text-muted"}`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span className="truncate max-w-full">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen((prev) => !prev)}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10px] font-medium leading-none transition-colors ${
              moreOpen || isMoreActive
                ? "bg-surface-elevated text-foreground border border-border/70 font-semibold"
                : "text-muted hover:text-foreground border border-transparent"
            }`}
          >
            <MoreHorizontal
              className={`w-[18px] h-[18px] ${
                moreOpen || isMoreActive ? "text-accent" : "text-muted"
              }`}
              strokeWidth={moreOpen || isMoreActive ? 2.2 : 1.8}
            />
            <span className="truncate max-w-full">More</span>
          </button>
        </nav>
      </div>
    </>
  );
}
