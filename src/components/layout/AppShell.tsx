import { Admin } from "@/types";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

import { ThemeToggle } from "./ThemeToggle";

export function AppShell({
  admin,
  children,
}: {
  admin: Admin;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <Sidebar admin={admin} />
      </div>
      <main className="flex-1 min-w-0 pb-16 md:pb-0 relative">{children}</main>
      <div className="md:hidden fixed top-4 right-4 z-20">
        <ThemeToggle compact />
      </div>
      <MobileNav admin={admin} />
    </div>
  );
}
