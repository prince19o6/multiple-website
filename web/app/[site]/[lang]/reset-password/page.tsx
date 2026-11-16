"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useSiteConfig } from "@/lib/SiteConfigContext";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const site = (params?.site as string) || "gujjutours";
  const lang = (params?.lang as string) || "en";
  const token = searchParams.get("token") || "";

  const { resetPassword } = useAuth();
  const config = useSiteConfig();
  const primaryColor = config?.theme?.colors?.primary || "#2563eb";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password strength score 0-4
  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score;
  }, [newPassword]);

  const strengthLabel = ["Weak", "Fair", "Good", "Strong"][Math.max(0, passwordStrength - 1)] || "Very Weak";
  const strengthColor =
    passwordStrength <= 1
      ? "bg-rose-500"
      : passwordStrength === 2
      ? "bg-amber-500"
      : passwordStrength === 3
      ? "bg-blue-500"
      : "bg-emerald-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset token is missing from the URL. Please re-open the link from your email.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    const result = await resetPassword({
      token,
      newPassword,
      confirmPassword,
    });
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${site}/${lang}/login`);
      }, 2000);
    } else {
      setError(result.error || "Failed to reset password. The token may be expired or already used.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-2 transition-colors">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 sm:p-10 rounded-3xl shadow-xl border border-border">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl">
            🔒
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Set New Password
          </h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Please choose a secure, strong password for your account.
          </p>
        </div>

        {!token && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs sm:text-sm font-medium">
            ⚠️ Invalid reset link. The reset token was not detected in this request. Please request a new password reset.
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3 animate-in fade-in">
            <div className="text-2xl">✅</div>
            <h2 className="text-base font-bold text-emerald-800 dark:text-emerald-200">
              Password Reset Successfully!
            </h2>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Your password has been updated. Redirecting you to the login page now...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* New Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted">
                  New Password *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 8 characters)"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder-foreground-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {newPassword.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-foreground-muted">Strength:</span>
                    <span className="font-bold">{strengthLabel}</span>
                  </div>
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strengthColor}`}
                      style={{ width: `${(passwordStrength / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-1.5">
                Confirm New Password *
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder-foreground-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-3.5 px-6 rounded-xl text-white font-bold text-sm shadow-md transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Updating Password...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-border">
          <Link
            href={`/${site}/${lang}/login`}
            className="text-xs font-semibold text-primary hover:underline"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

