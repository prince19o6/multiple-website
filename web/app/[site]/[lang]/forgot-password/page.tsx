"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useSiteConfig } from "@/lib/SiteConfigContext";

export default function ForgotPasswordPage() {
  const params = useParams();
  const site = (params?.site as string) || "gujjutours";
  const lang = (params?.lang as string) || "en";

  const { forgotPassword } = useAuth();
  const config = useSiteConfig();
  const primaryColor = config?.theme?.colors?.primary || "#2563eb";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await forgotPassword({ email });
    setLoading(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error || "Failed to process request. Please try again.");
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-2 transition-colors">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 sm:p-10 rounded-3xl shadow-xl border border-border">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl">
            🔑
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Forgot Your Password?
          </h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Enter your registered email address and we&apos;ll send you a secure link to reset your password.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3 animate-in fade-in">
            <div className="text-2xl">📬</div>
            <h2 className="text-base font-bold text-emerald-800 dark:text-emerald-200">
              Reset Link Sent
            </h2>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
              If an account exists for <span className="font-bold">{email}</span>, you will receive an email shortly with instructions to reset your password. Please check your inbox and spam folder.
            </p>
            <div className="pt-2">
              <Link
                href={`/${site}/${lang}/login`}
                className="inline-block px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder-foreground-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl text-white font-bold text-sm shadow-md transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Sending Link...
                </span>
              ) : (
                "Send Reset Instructions"
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-border">
          <Link
            href={`/${site}/${lang}/login`}
            className="text-xs font-semibold text-primary hover:underline"
          >
            ← Remember your password? Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

