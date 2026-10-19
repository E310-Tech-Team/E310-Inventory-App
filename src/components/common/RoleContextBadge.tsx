import React from "react";
import Link from "next/link";
import { ShieldCheck, UserCheck, ArrowRightLeft } from "lucide-react";
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
  const isTechSupport =
    role === "tech-support" || role === "super-admin" || role === "team-member";

  const isWorkingAsTech = currentPortal === "tech";

  const label = isWorkingAsTech ? "Working as Tech Support" : "Working as Staff";

  const roleText =
    role === "super-admin"
      ? "Super Administrator"
      : role === "tech-support" || role === "team-member"
      ? "IT Specialist"
      : "Staff Member";

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
          isWorkingAsTech
            ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
            : "bg-neutral-900/60 text-neutral-300 border-neutral-700/60"
        }`}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isWorkingAsTech ? "bg-emerald-400" : "bg-sky-400"
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isWorkingAsTech ? "bg-emerald-500" : "bg-sky-500"
            }`}
          />
        </span>

        {isWorkingAsTech ? (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <UserCheck className="w-3.5 h-3.5 text-sky-400" />
        )}

        <span className="font-semibold tracking-tight">{label}</span>
        <span className="text-neutral-500 font-normal">|</span>
        <span className="text-[11px] text-neutral-400 font-mono">{roleText}</span>
      </div>

      {canSwitchPortal && (
        <Link
          href={isWorkingAsTech ? "/staff" : "/tech"}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-mono text-neutral-400 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 transition-all active:scale-95"
          title={`Switch to ${isWorkingAsTech ? "Staff Portal" : "Tech Command Center"}`}
        >
          <ArrowRightLeft className="w-3 h-3 text-emerald-400" />
          <span>Switch to {isWorkingAsTech ? "Staff" : "Tech"}</span>
        </Link>
      )}
    </div>
  );
}
