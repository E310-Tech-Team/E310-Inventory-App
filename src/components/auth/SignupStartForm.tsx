"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignupStartForm({
  initialEmail = "",
  invalidEmail = false,
}: {
  initialEmail?: string;
  invalidEmail?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(invalidEmail ? "No invited account matches that email." : null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const safeEmail = email.trim().toLowerCase();
    if (!safeEmail) {
      setError("Enter the invited email address to continue.");
      return;
    }

    setLoading(true);
    router.push(`/signup?email=${encodeURIComponent(safeEmail)}`);
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-enter">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-xl font-semibold text-foreground">Finish account setup</h1>
          <p className="text-sm text-muted text-center mt-2">
            Enter the email address you were invited with to complete signup and set your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="email">
              Invited email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-ring/45"
              placeholder="you@yourcompany.org"
              required
            />
          </div>

          {error && <p className="text-sm text-status-overdue">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="pressable w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Continuing..." : "Continue to signup"}
          </button>
        </form>
      </div>
    </div>
  );
}
