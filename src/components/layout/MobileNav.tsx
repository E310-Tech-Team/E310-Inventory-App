"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Boxes, ArrowLeftRight, UserRoundCog } from "lucide-react";
import { Admin } from "@/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/categories", label: "Categories", icon: Boxes },
  { href: "/checkouts", label: "Checkouts", icon: ArrowLeftRight },
];

export function MobileNav({ admin }: { admin: Admin }) {
  const pathname = usePathname();
  const navItems =
    admin.role === "super-admin"
      ? [...NAV_ITEMS, { href: "/access", label: "Access", icon: UserRoundCog }]
      : NAV_ITEMS;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-surface flex items-stretch z-10">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`pressable flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
              isActive ? "text-accent" : "text-muted"
            }`}
          >
            <Icon className="w-5 h-5" strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
