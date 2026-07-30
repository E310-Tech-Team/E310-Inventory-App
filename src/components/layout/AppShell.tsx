import { Admin } from "@/types";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

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
      <main className="flex-1 min-w-0 pb-24 md:pb-0">{children}</main>
      <MobileNav admin={admin} />
    </div>
  );
}
