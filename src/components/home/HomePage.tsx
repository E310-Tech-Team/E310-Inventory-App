"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Boxes, ArrowLeftRight } from "lucide-react";
import { Admin } from "@/types";

function getGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}!`;
  if (hour < 18) return `Good afternoon, ${name}!`;
  return `Good evening, ${name}!`;
}

const HOME_ACTIONS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/categories", label: "Categories", icon: Boxes },
  { href: "/checkouts", label: "Checkouts", icon: ArrowLeftRight },
];

const REVEAL_DELAY_MS = 2500;

export function HomePage({ admin }: { admin: Admin }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setRevealed(true), REVEAL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="text-center w-full max-w-4xl flex flex-col items-center">
        <h1
          className={`text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-foreground transition-transform duration-700 ease-out ${
            revealed ? "-translate-y-2.5 sm:-translate-y-4" : "translate-y-0"
          }`}
        >
          {getGreeting(admin.name)}
        </h1>

        <div
          className={`mt-7 sm:mt-9 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            revealed ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95"
          }`}
          aria-hidden={!revealed}
        >
          {HOME_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                tabIndex={revealed ? 0 : -1}
                aria-hidden={!revealed}
                className={`pressable inline-flex items-center gap-1.5 sm:gap-2 rounded-xl border border-border bg-surface px-3.5 sm:px-5 py-2 sm:py-2.5 text-[13px] sm:text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-accent/50 hover:text-accent ${
                  revealed ? "pointer-events-auto" : "pointer-events-none"
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" strokeWidth={2} />
                {action.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

