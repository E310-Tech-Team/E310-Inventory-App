"use client";

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
  Sliders,
  LifeBuoy,
} from "lucide-react";
import { Admin } from "@/types";
import { isTechUser } from "@/lib/auth/roles";

const TECH_NAV_ITEMS = [
  { href: "/tech", label: "Dashboard", icon: LayoutDashboard },
  { href: "/items", label: "Inventory", icon: Package },
  { href: "/tech/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/tech/options", label: "Options", icon: Sliders },
  { href: "/checkouts", label: "Checkouts", icon: ArrowLeftRight },
];

const STAFF_NAV_ITEMS = [
  { href: "/staff", label: "Overview", icon: Home },
  { href: "/staff/devices", label: "My Devices", icon: Laptop },
  { href: "/staff/tickets", label: "Tickets", icon: LifeBuoy },
];

export function MobileNav({
  admin,
  isStaffPreview = false,
}: {
  admin: Admin;
  isStaffPreview?: boolean;
}) {
  const pathname = usePathname();
  const isStaff = !isTechUser(admin) || isStaffPreview;
  const navItems = isStaff
    ? STAFF_NAV_ITEMS
    : admin.role === "super-admin"
    ? [...TECH_NAV_ITEMS, { href: "/access", label: "Access", icon: UserRoundCog }]
    : TECH_NAV_ITEMS;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/85 backdrop-blur-xl border-t border-zinc-800/80 shadow-2xl shadow-black/80 transition-all">
      <nav className="flex items-center justify-around px-2 py-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10px] font-semibold leading-none transition-all duration-150 active:scale-95 ${
                isActive
                  ? "bg-zinc-800/80 text-white shadow-sm ring-1 ring-zinc-700/60"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-[19px] h-[19px] transition-transform ${
                    isActive ? "scale-105 text-emerald-400" : "text-zinc-400"
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <span className="truncate max-w-full px-0.5 tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
