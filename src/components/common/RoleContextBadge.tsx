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
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-surface-subtle text-foreground border border-border">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            isWorkingAsTech ? "bg-emerald-500" : "bg-muted"
          }`}
        />
        <span>{roleText}</span>
      </span>

      {canSwitchPortal && (
        <Link
          href={isWorkingAsTech ? "/staff" : "/tech"}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
          title={`Switch to ${isWorkingAsTech ? "Staff Portal" : "Tech Command Center"}`}
        >
          <ArrowRightLeft className="w-3 h-3 text-muted" />
          <span>{isWorkingAsTech ? "Staff Portal" : "Tech Center"}</span>
        </Link>
      )}
    </div>
  );
}
