"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Package,
  ArrowLeftRight,
  Home,
  LogOut,
  UserRoundCog,
  FileSpreadsheet,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
} from "lucide-react";
import { Admin } from "@/types";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tech/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/categories", label: "Categories", icon: Boxes },
  { href: "/checkouts", label: "Checkouts", icon: ArrowLeftRight },
  { href: "/exports", label: "Exports", icon: FileSpreadsheet },
];

export function Sidebar({
  admin,
  collapsed,
  onToggle,
}: {
  admin: Admin;
  collapsed: boolean;
  onToggle: () => void;
}) {
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
    <aside
      className={`h-screen sticky top-0 shrink-0 border-r border-border bg-surface flex flex-col transition-all duration-300 ease-in-out ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div
        className={`border-b border-border flex items-center ${
          collapsed ? "flex-col gap-3 px-2 py-4" : "justify-between px-5 py-5"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm leading-tight truncate">
              EThree10 Inventory App
            </span>
          )}
        </div>
        {collapsed ? (
          <button
            onClick={onToggle}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="pressable p-2 rounded-lg text-muted hover:bg-background hover:text-foreground transition-colors"
          >
            <PanelLeftOpen className="w-4 h-4" strokeWidth={2} />
          </button>
        ) : (
          <button
            onClick={onToggle}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className="pressable p-1.5 rounded-lg text-muted hover:bg-background hover:text-foreground transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" strokeWidth={2} />
          </button>
        )}
      </div>

      <nav className={`flex-1 py-4 space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`pressable flex items-center rounded-lg text-sm font-medium transition-colors ${
                collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2"
              } ${
                isActive
                  ? "bg-accent text-white shadow-sm shadow-accent/20"
                  : "text-foreground hover:bg-background"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {collapsed ? (
        <div className="px-2 py-4 border-t border-border flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center text-xs font-bold">
            {admin.name.charAt(0).toUpperCase()}
          </div>
          <ThemeToggle compact />
          <button
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="pressable p-2 rounded-lg text-muted hover:bg-background hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      ) : (
        <div className="px-3 py-4 border-t border-border space-y-3">
          <div className="px-3 py-2">
            <p className="text-sm font-medium truncate">{admin.name}</p>
            <p className="text-xs text-muted capitalize">{admin.role.replace("-", " ")}</p>
          </div>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="pressable w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:bg-background hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}

