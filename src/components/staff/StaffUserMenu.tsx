"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, LogOut } from "lucide-react";
import { UserRole } from "@/types";

interface StaffUserMenuProps {
  name: string;
  email: string;
  role: UserRole;
  canSwitchPortal: boolean;
}

function getInitials(name: string, email: string): string {
  const source = name.trim() || email.split("@")[0] || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 1).toUpperCase();
}

function formatRoleLabel(role: UserRole): string {
  if (role === "super-admin") return "Super Admin";
  if (role === "tech-support" || role === "team-member") return "IT Support";
  return "Staff";
}

export function StaffUserMenu({
  name,
  email,
  role,
  canSwitchPortal,
}: StaffUserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed:", err);
    }
    router.push("/login");
    router.refresh();
  }

  const initials = getInitials(name, email);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        title={name}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold tracking-tight transition-all cursor-pointer border ${
          open
            ? "bg-accent text-white border-accent ring-2 ring-accent/25"
            : "bg-brand-teal/15 text-brand-teal border-brand-teal/30 hover:bg-brand-teal/20"
        }`}
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border/80 bg-surface shadow-2xl shadow-brand-navy/15 dark:shadow-black/70 py-1.5 z-50 modal-panel"
        >
          <div className="px-3.5 py-2.5 border-b border-border/60">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground truncate">{name}</p>
              <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-elevated text-muted border border-border/60">
                {formatRoleLabel(role)}
              </span>
            </div>
            <p className="text-[11px] text-muted truncate mt-0.5">{email}</p>
          </div>

          {canSwitchPortal && (
            <div className="p-1 border-b border-border/60">
              <Link
                href="/dashboard"
                prefetch
                onClick={() => setOpen(false)}
                role="menuitem"
                className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-surface-elevated transition-colors"
              >
                <span>Open Tech Operations</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-accent" />
              </Link>
            </div>
          )}

          <div className="p-1">
            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              role="menuitem"
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{signingOut ? "Signing out..." : "Sign out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

