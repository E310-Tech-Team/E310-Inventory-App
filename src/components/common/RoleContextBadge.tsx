import React from "react";
import Link from "next/link";
import { ArrowRightLeft } from "lucide-react";
import { UserRole } from "@/types";

interface RoleContextBadgeProps {
  role: UserRole;
  currentPortal?: "staff" | "tech";
  canSwitchPortal?: boolean;
  className?: string;
}

export function RoleContextBadge({
  role,
  currentPortal = "staff",
  canSwitchPortal = false,
  className = "",
}: RoleContextBadgeProps) {
  const isWorkingAsTech = currentPortal === "tech";

  const roleText =
    role === "super-admin"
      ? "Super Admin"
      : role === "tech-support" || role === "team-member"
      ? "IT Support"
      : "Staff";

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-elevated/80 text-foreground border border-border/70">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            isWorkingAsTech ? "bg-emerald-500" : "bg-muted"
          }`}
        />
        <span>{roleText}</span>
      </span>

      {canSwitchPortal && (
        <Link
          href={isWorkingAsTech ? "/staff" : "/dashboard"}
          prefetch
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/70 bg-surface-elevated/70 hover:bg-surface-elevated text-xs font-medium text-foreground transition-colors"
          title={`Switch to ${isWorkingAsTech ? "Staff Portal" : "Tech Portal"}`}
        >
          <ArrowRightLeft className="w-3 h-3 text-accent" />
          <span>{isWorkingAsTech ? "Staff Portal" : "Tech Ops"}</span>
        </Link>
      )}

    </div>
  );
}
