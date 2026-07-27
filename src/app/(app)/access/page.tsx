import { redirect } from "next/navigation";
import { AccessList } from "@/components/access/AccessList";
import { getSession } from "@/lib/auth/session";
import { dataStore } from "@/lib/data";

export default async function AccessPage() {
  const user = await getSession();

  if (!user || user.role !== "super-admin") {
    redirect("/dashboard");
  }

  const users = await dataStore.getUsers();

  return <AccessList users={users} currentUser={user} />;
}
