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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-10">
      <nav className="border-t border-border bg-surface flex items-stretch">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`pressable flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold leading-none ${
                isActive ? "text-accent" : "text-muted"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
              <span className="truncate max-w-full px-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

