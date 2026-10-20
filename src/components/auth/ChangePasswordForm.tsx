"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { E310Logo } from "@/components/common/E310Logo";

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!currentPassword || !newPassword) {
      setError("Current and new passwords are required.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error ?? "Unable to change password.");
      setLoading(false);
      return;
    }

    const redirectTarget = data?.redirectUrl ?? "/";
    router.push(redirectTarget);
    router.refresh();
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-enter">
        <div className="flex flex-col items-center mb-8">
          <E310Logo size="lg" className="mb-3" priority />
          <h1 className="text-xl font-semibold text-foreground">Set your permanent password</h1>
          <p className="text-sm text-muted text-center mt-2">
            You&apos;re signed in with a temporary password. Please set a permanent password for your
            account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="currentPassword">
              Temporary password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-ring/45"
              placeholder="Enter your temporary password"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="newPassword">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-ring/45"
              placeholder="At least 8 characters"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="confirmPassword">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-ring/45"
              placeholder="Re-enter your new password"
              required
            />
          </div>

          {error && <p className="text-sm text-status-overdue">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="pressable w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Set password"}
          </button>
        </form>
      </div>
    </div>
  );
}
