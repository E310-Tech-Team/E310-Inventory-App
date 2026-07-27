"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Package,
  ArrowLeftRight,
  LogOut,
  UserRoundCog,
} from "lucide-react";
import { Admin } from "@/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/categories", label: "Categories", icon: Boxes },
  { href: "/checkouts", label: "Checkouts", icon: ArrowLeftRight },
];

export function Sidebar({ admin }: { admin: Admin }) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems =
    admin.role === "super-admin"
      ? [...NAV_ITEMS, { href: "/access", label: "Access", icon: UserRoundCog }]
      : NAV_ITEMS;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-surface flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Package className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <span className="font-semibold text-sm leading-tight">EThree10 Inventory App</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`pressable flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-white shadow-sm shadow-accent/20"
                  : "text-foreground hover:bg-background"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium">{admin.name}</p>
          <p className="text-xs text-muted capitalize">{admin.role.replace("-", " ")}</p>
        </div>
        <button
          onClick={handleLogout}
          className="pressable w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:bg-background hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" strokeWidth={2} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
