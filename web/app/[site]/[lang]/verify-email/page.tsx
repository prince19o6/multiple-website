"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useSiteConfig } from "@/lib/SiteConfigContext";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const site = (params?.site as string) || "gujjutours";
  const lang = (params?.lang as string) || "en";
  const token = searchParams.get("token") || "";

  const { verifyEmail, resendVerification, user } = useAuth();
  const config = useSiteConfig();
  const primaryColor = config?.theme?.colors?.primary || "#2563eb";

  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [claimedBookings, setClaimedBookings] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [resendEmail, setResendEmail] = useState(user?.email || "");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleVerify = async () => {
    if (!token) {
      setError("Verification token was not found in the link.");
      return;
    }

    setLoading(true);
    setError(null);
    const result = await verifyEmail(token);
    setLoading(false);

    if (result.success) {
      setVerified(true);
      setClaimedBookings(result.claimedBookings || 0);
    } else {
      setError(result.error || "The verification link is invalid or has expired.");
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResending(true);
    setError(null);
    const result = await resendVerification(resendEmail);
    setResending(false);

    if (result.success) {
      setResendSuccess(true);
    } else {
      setError(result.error || "Failed to resend verification link. Please try again later.");
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-2 transition-colors">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 sm:p-10 rounded-3xl shadow-xl border border-border text-center">
        {/* Verification Success State */}
        {verified ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-3xl text-emerald-600">
              ✓
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Email Verified Successfully!
            </h1>
            <p className="text-sm text-foreground-muted">
              Your email address has been verified. You now have full access to all account privileges, booking management, and rewards.
            </p>

            {claimedBookings > 0 && (
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-left">
                <p className="text-xs font-bold text-primary uppercase tracking-wide">
                  🎉 Bookings Linked
                </p>
                <p className="text-xs text-foreground mt-1">
                  We found and linked <span className="font-bold">{claimedBookings}</span> previous guest booking(s) associated with your email to your account!
                </p>
              </div>
            )}

            <div className="pt-4 flex flex-col gap-2">
              <Link
                href={`/${site}/${lang}/my-bookings`}
                className="w-full py-3.5 px-6 rounded-xl text-white font-bold text-sm shadow-md transition-all hover:brightness-105"
                style={{ backgroundColor: primaryColor }}
              >
                View My Bookings
              </Link>
              <Link
                href={`/${site}/${lang}/account`}
                className="w-full py-2.5 px-4 rounded-xl text-foreground font-semibold text-xs hover:bg-surface-2 transition-colors border border-border"
              >
                Go to Account Settings
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-3xl text-primary">
              ✉️
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                Verify Your Email Address
              </h1>
              <p className="mt-2 text-sm text-foreground-muted">
                Please click the button below to confirm and verify your email account.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-medium animate-in fade-in">
                {error}
              </div>
            )}

            {token ? (
              <button
                type="button"
                onClick={handleVerify}
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
                    Verifying...
                  </span>
                ) : (
                  "Confirm & Verify Email"
                )}
              </button>
            ) : (
              <div className="text-xs text-foreground-muted">
                No verification token was provided in this URL.
              </div>
            )}

            {/* Resend Verification Form */}
            <div className="pt-6 border-t border-border text-left">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">
                Need a new verification link?
              </h2>
              {resendSuccess ? (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
                  A fresh verification email has been dispatched. Please check your inbox.
                </div>
              ) : (
                <form onSubmit={handleResend} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-border bg-surface text-foreground"
                  />
                  <button
                    type="submit"
                    disabled={resending}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-border hover:bg-surface-2 transition-colors"
                  >
                    {resending ? "Sending..." : "Resend Link"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

