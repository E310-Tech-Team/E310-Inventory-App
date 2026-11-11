import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { DepartmentUser } from "@/types";
import { isTechUser } from "@/lib/auth/session";
import { E310Logo } from "@/components/common/E310Logo";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { StaffUserMenu } from "./StaffUserMenu";

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
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-5 min-w-0 h-full">
          <Link href="/staff" aria-label="Staff Portal Home" className="shrink-0 flex items-center">
            <span className="sm:hidden">
              <E310Logo size="xs" />
            </span>
            <span className="hidden sm:inline-flex">
              <E310Logo size="sm" />
            </span>
          </Link>

          <span className="hidden sm:block h-4 w-px bg-border/60 shrink-0" />

          <nav
            aria-label="Staff portal navigation"
            className="hidden sm:flex items-center gap-5 h-full"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === activePath;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`h-full inline-flex items-center border-b-2 text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "border-accent text-foreground font-semibold"
                      : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {canSwitchPortal && (
            <Link
              href="/dashboard"
              prefetch
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-border/70 bg-surface-elevated/50 hover:bg-surface-elevated text-[11px] sm:text-xs font-medium text-foreground transition-colors whitespace-nowrap"
              title="Switch to Tech Operations"
            >
              <ArrowLeftRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-teal shrink-0" />
              <span className="hidden sm:inline">Tech Ops</span>
              <span className="sm:hidden">Tech</span>
            </Link>
          )}

          <NotificationBell />
          <ThemeToggle compact />

          <span className="hidden sm:block h-4 w-px bg-border/60 mx-0.5" />

          <StaffUserMenu
            name={user.name}
            email={user.email}
            role={user.role}
            canSwitchPortal={canSwitchPortal}
          />
        </div>
      </div>

      {/* Mobile 3-Tab Sub-Bar */}
      <nav
        aria-label="Mobile staff portal navigation"
        className="sm:hidden border-t border-border/50 bg-surface-elevated/30 px-3.5 py-1.5 grid grid-cols-3 gap-1.5"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === activePath;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`min-h-[32px] flex items-center justify-center py-1 px-2 rounded-lg text-xs font-medium transition-colors truncate ${
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
