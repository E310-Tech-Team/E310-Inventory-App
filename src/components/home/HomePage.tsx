"use client";

import Link from "next/link";
import { Home, LayoutDashboard, Boxes, ArrowLeftRight, FileSpreadsheet, UserRoundCog } from "lucide-react";
import { Admin } from "@/types";

const navCards = [
  { href: "/dashboard", label: "Dashboard", description: "Snapshot of inventory health", icon: LayoutDashboard },
  { href: "/categories", label: "Categories", description: "Manage groups and stock rules", icon: Boxes },
  { href: "/checkouts", label: "Checkouts", description: "Track assignments and returns", icon: ArrowLeftRight },
  { href: "/exports", label: "Exports", description: "Download reports and records", icon: FileSpreadsheet },
];

function getGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}!`;
  if (hour < 18) return `Good afternoon, ${name}!`;
  return `Good evening, ${name}!`;
}

export function HomePage({ admin }: { admin: Admin }) {
  const cards = admin.role === "super-admin"
    ? [...navCards, { href: "/access", label: "Access", description: "Manage team permissions", icon: UserRoundCog }]
    : navCards;

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-8">
        <div className="w-full max-w-3xl rounded-[28px] border border-border bg-surface/90 px-6 py-8 shadow-[0_20px_70px_rgba(0,0,0,0.08)] backdrop-blur md:px-10 md:py-12">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Home className="h-7 w-7" strokeWidth={1.8} />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">Welcome back</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-foreground sm:text-5xl md:text-6xl">
              {getGreeting(admin.name)}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">
              Your inventory workspace is ready. Jump into the area you need most and keep operations moving smoothly.
            </p>
          </div>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-[24px] border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:bg-background"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h2 className="text-lg font-semibold text-foreground">{card.label}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{card.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
