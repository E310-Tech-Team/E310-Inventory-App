import { redirect } from "next/navigation";
import { getSession, isTechUser } from "@/lib/auth/session";

export default async function TechPortalRoot() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "pending") {
    redirect("/change-password");
  }

  // Enforce role barrier: staff accounts are blocked from tech portal
  if (!isTechUser(user)) {
    redirect("/staff");
  }

  // Active tech team members land directly on the tech inventory dashboard
  redirect("/dashboard");
}
