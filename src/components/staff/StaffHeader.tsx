import Link from "next/link";
import { ArrowUpRight, LogOut } from "lucide-react";
import { DepartmentUser } from "@/types";
import { isTechUser } from "@/lib/auth/session";
import { E310Logo } from "@/components/common/E310Logo";
import { RoleContextBadge } from "@/components/common/RoleContextBadge";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface StaffHeaderProps {
  user: DepartmentUser;
  activePath: "/staff" | "/staff/devices" | "/staff/tickets";
}

const NAV_ITEMS: Array<{
  href: StaffHeaderProps["activePath"];
  label: string;
  mobileLabel: string;
}> = [
  { href: "/staff", label: "Overview", mobileLabel: "Overview" },
  { href: "/staff/devices", label: "My Devices", mobileLabel: "My Devices" },
  { href: "/staff/tickets", label: "Support Tickets", mobileLabel: "Tickets" },
];

export function StaffHeader({ user, activePath }: StaffHeaderProps) {
  const canSwitchPortal = isTechUser(user);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-surface/90 backdrop-blur-md">
      {/* Main Bar */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <Link href="/staff" aria-label="Staff Portal Home" className="shrink-0">
            <span className="sm:hidden">
              <E310Logo size="xs" />
            </span>
            <span className="hidden sm:inline-flex">
              <E310Logo size="sm" />
            </span>
          </Link>

          <span className="hidden sm:block h-4 w-px bg-border/70 shrink-0" />

          <nav aria-label="Staff portal navigation" className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === activePath;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                    isActive
                      ? "bg-surface-elevated text-foreground border-border/70 shadow-2xs"
                      : "text-muted hover:text-foreground hover:bg-surface-elevated/60 border-transparent"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {canSwitchPortal && (
            <Link
              href="/dashboard"
              className="sm:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border/70 bg-surface-elevated/60 text-[11px] font-medium text-foreground"
            >
              <span>Tech</span>
              <ArrowUpRight className="w-3 h-3 text-accent" />
            </Link>
          )}

          <div className="hidden sm:flex items-center">
            <RoleContextBadge
              role={user.role}
              currentPortal="staff"
              canSwitchPortal={canSwitchPortal}
            />
          </div>

          <NotificationBell />
          <ThemeToggle compact />

          <span className="hidden md:block h-4 w-px bg-border/70 mx-0.5" />

          <div className="hidden md:flex flex-col text-right pr-1">
            <span className="text-xs font-medium text-foreground leading-tight">
              {user.name}
            </span>
            <span className="text-[11px] text-muted leading-tight">
              {user.email}
            </span>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              title="Sign out"
              aria-label="Sign out"
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile 3-Tab Sub-Bar: zero wrapping, zero horizontal scroll */}
      <nav
        aria-label="Mobile staff portal navigation"
        className="sm:hidden border-t border-border/50 bg-surface-elevated/30 px-3 py-1.5 grid grid-cols-3 gap-1"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === activePath;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-center py-1.5 px-2 rounded-lg text-xs font-medium transition-colors truncate ${
                isActive
                  ? "bg-surface text-foreground border border-border/70 shadow-2xs font-semibold"
                  : "text-muted hover:text-foreground border border-transparent"
              }`}
            >
              {item.mobileLabel}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
