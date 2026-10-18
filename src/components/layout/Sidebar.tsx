"use client";

import { useEffect, useState } from "react";
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
  ChevronDown,
  Monitor,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";
import { Admin, DepartmentUser } from "@/types";
import { ThemeToggle } from "./ThemeToggle";

const SIDEBAR_STORAGE_KEY = "inventory-sidebar-collapsed";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: string;
  superAdminOnly?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const TECH_NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/tech/approvals", label: "Approvals", icon: ShieldCheck, badge: "Queue" },
    ],
  },
  {
    id: "inventory",
    label: "Inventory & Assets",
    items: [
      { href: "/items", label: "Inventory Catalog", icon: Package },
      { href: "/categories", label: "Categories", icon: Boxes },
      { href: "/checkouts", label: "Checkouts & Loans", icon: ArrowLeftRight },
    ],
  },
  {
    id: "management",
    label: "Management",
    items: [
      { href: "/tech/options", label: "Form Options", icon: SlidersHorizontal },
      { href: "/exports", label: "Data Exports", icon: FileSpreadsheet },
      { href: "/staff", label: "Staff Portal View", icon: Monitor },
      { href: "/access", label: "User Access", icon: UserRoundCog, superAdminOnly: true },
    ],
  },
];

const STAFF_NAV_GROUPS: NavGroup[] = [
  {
    id: "staff-portal",
    label: "Self-Service",
    items: [
      { href: "/staff", label: "Staff Home", icon: Home },
      { href: "/staff#devices", label: "My Devices", icon: Monitor },
      { href: "/staff#report", label: "Report Issue", icon: AlertCircle },
    ],
  },
];

const DEFAULT_MOCK_USER: Admin = {
  id: "mock-user",
  name: "Alex Morgan",
  email: "alex.morgan@e310.io",
  role: "super-admin",
  status: "active",
  staffId: "E310-8492",
  department: "Tech Operations",
  invitedBy: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

interface SidebarProps {
  admin?: Admin | DepartmentUser | null;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({
  admin,
  collapsed: controlledCollapsed,
  onToggle: controlledOnToggle,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Internal collapsed state initialized to false to match SSR
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Read collapsed state from localStorage inside useEffect to prevent Next.js hydration mismatch
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setInternalCollapsed(stored === "true");
      }
    } catch (err) {
      console.warn("Unable to access localStorage for sidebar state:", err);
    }
  }, []);

  const isControlled = typeof controlledCollapsed === "boolean";
  const isCollapsed = isControlled ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (controlledOnToggle) {
      controlledOnToggle();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
        } catch (err) {
          console.warn("Unable to persist sidebar state to localStorage:", err);
        }
        return next;
      });
    }
  };

  // Keyboard shortcut: Cmd+[ or Ctrl+[ to toggle sidebar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "[") {
        e.preventDefault();
        handleToggle();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const currentUser = admin || DEFAULT_MOCK_USER;
  const isSuperAdmin = currentUser.role === "super-admin";
  const isViewer = currentUser.role === "viewer";

  const rawGroups = isViewer ? STAFF_NAV_GROUPS : TECH_NAV_GROUPS;
  const groups = rawGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.superAdminOnly || isSuperAdmin),
  }));

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed:", err);
    }
    router.push("/login");
    router.refresh();
  }

  const isItemActive = (href: string): boolean => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/tech";
    if (href === "/staff") return pathname === "/staff";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const userInitials = (currentUser.name || "AM")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      aria-label="Sidebar navigation"
      className={`h-screen sticky top-0 shrink-0 border-r border-border bg-surface flex flex-col transition-[width] duration-300 ease-in-out z-20 select-none ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* ─── Top Header: Brand Wordmark & Collapse Toggle ─── */}
      <div
        className={`border-b border-border flex items-center transition-all duration-200 ${
          isCollapsed ? "flex-col gap-2.5 py-4 px-2" : "justify-between px-4 py-4"
        }`}
      >
        <Link
          href={isViewer ? "/staff" : "/dashboard"}
          className="flex items-center gap-2.5 min-w-0 group"
          title="E310 Inventory App"
        >
          <div className="w-8 h-8 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center font-bold text-xs tracking-tight shrink-0 shadow-sm transition-transform group-hover:scale-105">
            310
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-foreground leading-none truncate">
                  E310
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#D4F868]/30 text-neutral-800 dark:text-[#D4F868] border border-[#D4F868]/50">
                  ENT
                </span>
              </div>
              <p className="text-[11px] text-muted truncate mt-0.5">
                {isViewer ? "Staff Self-Service" : "Tech Operations"}
              </p>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={handleToggle}
          title={isCollapsed ? "Expand sidebar (⌘[)" : "Collapse sidebar (⌘[)"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="pressable p-1.5 rounded-lg text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-foreground transition-colors shrink-0"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" strokeWidth={2} />
          ) : (
            <PanelLeftClose className="w-4 h-4" strokeWidth={2} />
          )}
        </button>
      </div>

      {/* ─── Navigation Area: Multi-tier Groups ─── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-4 px-2">
        {groups.map((group, groupIdx) => {
          const isGroupCollapsed = !isCollapsed && Boolean(collapsedGroups[group.id]);

          return (
            <div key={group.id} className="space-y-1">
              {/* Group Header (Expanded) or Divider (Rail) */}
              {isCollapsed ? (
                groupIdx > 0 && <div className="border-t border-border/60 my-2 mx-1" />
              ) : (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={!isGroupCollapsed}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted/70 hover:text-foreground transition-colors rounded-md group"
                >
                  <span className="truncate">{group.label}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 text-muted/50 group-hover:text-foreground ${
                      isGroupCollapsed ? "-rotate-90" : "rotate-0"
                    }`}
                  />
                </button>
              )}

              {/* Group Items */}
              {(!isGroupCollapsed || isCollapsed) && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = isItemActive(item.href);
                    const Icon = item.icon;

                    return (
                      <div key={item.href} className="relative group">
                        <Link
                          href={item.href}
                          aria-label={item.label}
                          title={isCollapsed ? item.label : undefined}
                          className={`pressable flex items-center rounded-xl text-sm transition-all duration-150 ${
                            isCollapsed
                              ? "justify-center w-10 h-10 mx-auto"
                              : "gap-3 px-3 py-2.5 w-full"
                          } ${
                            isActive
                              ? "bg-[#D4F868] text-neutral-950 font-semibold shadow-sm"
                              : "text-muted hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800/60 font-medium"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive
                                ? "text-neutral-950"
                                : "text-muted group-hover:text-foreground"
                            }`}
                            strokeWidth={isActive ? 2.5 : 2}
                          />

                          {!isCollapsed && (
                            <span className="truncate flex-1 text-left leading-none">
                              {item.label}
                            </span>
                          )}

                          {!isCollapsed && item.badge && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium leading-none ${
                                isActive
                                  ? "bg-neutral-950/15 text-neutral-950"
                                  : "bg-accent/15 text-accent"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>

                        {/* Floating Tooltip in Icon-only Rail */}
                        {isCollapsed && (
                          <div
                            role="tooltip"
                            className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex items-center z-50 px-2.5 py-1 text-xs font-semibold rounded-md shadow-lg whitespace-nowrap bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 animate-in fade-in zoom-in-95 duration-100"
                          >
                            {item.label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ─── Profile Footer: Avatar, Name, Staff ID & Logout ─── */}
      {isCollapsed ? (
        <div className="border-t border-border p-2 flex flex-col items-center gap-2.5 bg-surface">
          {/* Avatar with Tooltip */}
          <div className="relative group">
            <div
              className="w-9 h-9 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm cursor-default"
              title={`${currentUser.name} (${currentUser.staffId || "E310-8492"})`}
              aria-label={`${currentUser.name} (${currentUser.staffId || "E310-8492"})`}
            >
              {userInitials}
            </div>
            <div
              role="tooltip"
              className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex flex-col z-50 px-2.5 py-1.5 text-xs rounded-md shadow-lg whitespace-nowrap bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 animate-in fade-in zoom-in-95 duration-100"
            >
              <span className="font-semibold">{currentUser.name}</span>
              <span className="text-[10px] opacity-80 font-mono">
                ID: {currentUser.staffId || "E310-8492"}
              </span>
            </div>
          </div>

          <ThemeToggle compact />

          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="pressable p-2 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      ) : (
        <div className="border-t border-border p-3 space-y-2.5 bg-surface">
          {/* User Profile Card */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-border/60">
            <div className="w-9 h-9 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate leading-tight">
                {currentUser.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-mono text-[10px] text-muted truncate">
                  ID: {currentUser.staffId || "E310-8492"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
              className="pressable p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          {/* Theme Toggle & Role Info */}
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-[11px] text-muted font-medium capitalize truncate">
              {currentUser.role.replace("-", " ")}
            </span>
            <div className="shrink-0">
              <ThemeToggle compact />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
