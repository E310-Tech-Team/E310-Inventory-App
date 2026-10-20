"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { E310Logo } from "@/components/common/E310Logo";

export function LoginForm({ setupError }: { setupError?: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Couldn't sign in. Check your credentials.");
      setLoading(false);
      return;
    }

    const data = await response.json().catch(() => null);
    if (data?.redirectUrl) {
      router.push(data.redirectUrl);
    } else if (data?.mustChangePassword) {
      router.push("/change-password");
    } else {
      router.push("/");
    }
    router.refresh();
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-enter">
        <div className="flex flex-col items-center mb-8">
          <E310Logo size="lg" className="mb-3" priority />
          <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-brand-yellow/25 text-brand-navy dark:text-brand-yellow border border-brand-yellow/40">
            Inventory & Asset Operations
          </span>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-ring/45"
              placeholder="you@r4cglobal.org"
              required
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
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-sm text-status-overdue">{error}</p>}
          {setupError && <p className="text-sm text-status-overdue">{setupError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="pressable w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
