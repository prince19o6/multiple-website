"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useSiteConfig } from "@/lib/SiteConfigContext";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const site = (params?.site as string) || "gujjutours";
  const lang = (params?.lang as string) || "en";
  const redirectUrl =
    searchParams.get("returnUrl") ||
    searchParams.get("redirect") ||
    `/${site}/${lang}`;

  const { login, isAuthenticated } = useAuth();
  const config = useSiteConfig();
  const primaryColor = config?.theme?.colors?.primary || "#2563eb";
  const siteName = config?.site?.name || "Gujju Tours";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login({
      email,
      password,
      rememberMe,
    });

    setLoading(false);
    if (result.success) {
      router.push(redirectUrl);
    } else {
      setError(result.error || "Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-surface-2 transition-colors">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 sm:p-10 rounded-3xl shadow-xl border border-border">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Sign in to your <span className="font-semibold text-foreground">{siteName}</span> account to access your bookings and travel preferences.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-medium animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* Email */}
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

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted">
                Password
              </label>
              <Link
                href={`/${site}/${lang}/forgot-password`}
                className="text-xs text-primary hover:underline font-semibold"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder-foreground-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-foreground-muted hover:text-foreground"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-foreground">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <span>Remember me on this device</span>
            </label>
          </div>

          {/* Submit Button */}
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
                Signing In...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Guest Booking Lookup link */}
        <div className="text-center pt-2">
          <Link
            href={`/${site}/${lang}/my-bookings`}
            className="text-xs font-semibold text-foreground-muted hover:text-primary transition-colors"
          >
            Looking for a booking placed as a guest? Click here to find it.
          </Link>
        </div>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-border">
          <p className="text-xs text-foreground-muted">
            Don&apos;t have an account yet?{" "}
            <Link
              href={`/${site}/${lang}/register?returnUrl=${encodeURIComponent(redirectUrl)}`}
              className="font-bold text-primary hover:underline"
            >
              Register Now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

