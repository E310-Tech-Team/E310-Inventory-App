import { redirect } from "next/navigation";
import { getSession, isTechUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { DeviceApprovalQueue } from "@/components/tech/DeviceApprovalQueue";

export const metadata = {
  title: "Device Approvals | E310 Tech Ops",
  description: "Verify and approve equipment self-registered by staff members.",
};

export default async function TechApprovalsPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "pending") {
    redirect("/change-password");
  }

  if (!isTechUser(user)) {
    redirect("/staff");
  }

  return (
    <AppShell admin={user}>
      <PageHeader
        title="Device Approvals"
        description="Verify and approve staff-registered hardware before official catalog enrollment."
      />
      <div className="px-4 md:px-8 pb-12">
        <DeviceApprovalQueue />
      </div>
    </AppShell>
  );
}
