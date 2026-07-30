import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/SignupForm";
import { SignupStartForm } from "@/components/auth/SignupStartForm";
import { dataStore } from "@/lib/data";

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ email?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const email = typeof params?.email === "string" ? params.email.trim().toLowerCase() : "";

  if (!email) {
    return <SignupStartForm />;
  }

  const user = await dataStore.getUserByEmail(email);
  if (!user || user.status !== "pending") {
    return <SignupStartForm initialEmail={email} invalidEmail />;
  }

  return <SignupForm initialName={user.name} initialEmail={user.email} />;
}
