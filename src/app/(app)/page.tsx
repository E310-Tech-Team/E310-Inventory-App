import { getSession } from "@/lib/auth/session";
import { HomePage } from "@/components/home/HomePage";

export default async function HomeRoute() {
  const admin = await getSession();

  if (!admin) {
    return null;
  }

  return <HomePage admin={admin} />;
}
