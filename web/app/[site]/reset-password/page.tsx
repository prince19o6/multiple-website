"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ site: string }>;
}) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const config = useSiteConfig();
  const theme = config?.theme;
  const primary = theme?.primary || "#2563eb";
  const siteName = config?.name || "Travel Platform";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token is missing or has expired. Please request a new link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: password,
          siteId: resolvedParams.site,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Password reset failed.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <span className="text-3xl">🔐</span>
          <h1 className="text-2xl font-bold text-slate-900">Set New Password</h1>
          <p className="text-xs text-slate-500">
            Resetting access credentials for your account on {siteName}.
          </p>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mx-auto">
              ✓
            </div>
            <h2 className="text-lg font-bold text-slate-900">Password Updated!</h2>
            <p className="text-xs text-slate-600">
              Your password has been changed successfully. You can now use your new credentials.
            </p>
            <div className="pt-2">
              <Link
                href="/admin/login"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-white font-semibold text-xs shadow"
                style={{ backgroundColor: primary }}
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {error}
              </div>
            )}

            {!token && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                ⚠️ No verification token found in URL. Please open the exact reset link sent to your email.
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password (min 8 chars)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: primary }}
            >
              {loading ? "Updating..." : "Change Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
