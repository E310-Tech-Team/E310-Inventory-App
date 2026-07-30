import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/SignupForm";
import { dataStore } from "@/lib/data";

const ALLOWED_SIGNUP_DOMAIN = "@theincubatorhub.org";

function isAllowedEmail(email: string): boolean {
  return email.toLowerCase().endsWith(ALLOWED_SIGNUP_DOMAIN);
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = typeof searchParams.email === "string" ? searchParams.email.trim().toLowerCase() : "";

  if (!email || !isAllowedEmail(email)) {
    redirect("/");
  }

  const user = await dataStore.getUserByEmail(email);
  if (!user || user.status !== "pending") {
    redirect("/");
  }

  return <SignupForm initialName={user.name} initialEmail={user.email} />;
}
