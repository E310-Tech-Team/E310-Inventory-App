"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";

export function SignupForm({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!name || !password) {
      setError("Name and password are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: initialEmail, password }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error ?? "Unable to complete signup.");
      setLoading(false);
      return;
    }

    router.push("/login");
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-enter">
        <div className="flex flex-col items-center mb-8">
          <div className="status-live w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Complete Your Invitation</h1>
          <p className="text-sm text-muted text-center mt-2">
            Only invited department members with a @theincubatorhub.org email can finish signup.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-ring/45"
              placeholder="Amina Yusuf"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={initialEmail}
              readOnly
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-muted opacity-70 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-ring/45"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-ring/45"
              required
            />
          </div>

          {error && <p className="text-sm text-status-overdue">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="pressable w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Saving password..." : "Complete signup"}
          </button>
        </form>
      </div>
    </div>
  );
}
