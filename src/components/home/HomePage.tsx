"use client";

import { Admin } from "@/types";

function getGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}!`;
  if (hour < 18) return `Good afternoon, ${name}!`;
  return `Good evening, ${name}!`;
}

export function HomePage({ admin }: { admin: Admin }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-12">
      <div className="text-center">
        <h1 className="text-5xl font-black tracking-tight text-foreground sm:text-7xl md:text-8xl lg:text-9xl">
          {getGreeting(admin.name)}
        </h1>
      </div>
    </div>
  );
}

