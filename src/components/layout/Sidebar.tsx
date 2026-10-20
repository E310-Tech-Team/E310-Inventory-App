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
  FileSpreadsheet,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Home,
  Laptop,
  Eye,
  Sliders,
  LifeBuoy,
} from "lucide-react";
import { Admin } from "@/types";
import { isTechUser } from "@/lib/auth/roles";
import { ThemeToggle } from "./ThemeToggle";

const TECH_NAV_ITEMS = [
  { href: "/tech", label: "Dashboard", icon: LayoutDashboard },
  { href: "/items", label: "Inventory", icon: Package },
  { href: "/tech/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/tech/options", label: "Options", icon: Sliders },
  { href: "/categories", label: "Categories", icon: Boxes },
  { href: "/checkouts", label: "Checkouts", icon: ArrowLeftRight },
  { href: "/exports", label: "Exports", icon: FileSpreadsheet },
];

const STAFF_NAV_ITEMS = [
  { href: "/staff", label: "Overview", icon: Home },
  { href: "/staff/devices", label: "My Devices", icon: Laptop },
  { href: "/staff/tickets", label: "Support Tickets", icon: LifeBuoy },
];

export function Sidebar({
  admin,
  collapsed,
  onToggle,
  isStaffPreview = false,
  onToggleStaffPreview,
}: {
  admin: Admin;
  collapsed: boolean;
  onToggle: () => void;
  isStaffPreview?: boolean;
  onToggleStaffPreview?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isStaff = !isTechUser(admin) || isStaffPreview;
  const navItems = isStaff
    ? STAFF_NAV_ITEMS
    : admin.role === "super-admin"
    ? [...TECH_NAV_ITEMS, { href: "/access", label: "Access", icon: UserRoundCog }]
    : TECH_NAV_ITEMS;

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
        {isStaffPreview && !collapsed && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-1.5 font-semibold text-[11px]">
              <Eye className="w-3.5 h-3.5" />
              <span>Staff Preview</span>
            </div>
            {onToggleStaffPreview && (
              <button
                type="button"
                onClick={onToggleStaffPreview}
                className="underline text-[11px] font-bold hover:text-amber-800 dark:hover:text-amber-300"
              >
                Exit
              </button>
            )}
          </div>
        )}

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

      {/* Super Admin Preview Toggle */}
      {admin.role === "super-admin" && onToggleStaffPreview && (
        <div className={`border-t border-border ${collapsed ? "p-2 flex justify-center" : "p-3"}`}>
          {collapsed ? (
            <button
              type="button"
              onClick={onToggleStaffPreview}
              title={isStaffPreview ? "Exit Staff Preview" : "Preview Staff View"}
              aria-label={isStaffPreview ? "Exit Staff Preview" : "Preview Staff View"}
              className={`pressable p-2 rounded-lg text-xs transition-colors border ${
                isStaffPreview
                  ? "bg-amber-500/20 text-amber-600 border-amber-500/40"
                  : "text-muted hover:bg-background hover:text-foreground border-transparent"
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleStaffPreview}
              className={`pressable w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                isStaffPreview
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                  : "bg-surface hover:bg-background border-border text-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5" />
                <span>{isStaffPreview ? "Exit Preview" : "Staff View Preview"}</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                Admin
              </span>
            </button>
          )}
        </div>
      )}

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

