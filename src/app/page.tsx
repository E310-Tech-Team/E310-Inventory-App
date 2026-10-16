import { redirect } from "next/navigation";
import { getPortalRoute, getSession } from "@/lib/auth/session";

export default async function RootPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  redirect(getPortalRoute(user));
}
