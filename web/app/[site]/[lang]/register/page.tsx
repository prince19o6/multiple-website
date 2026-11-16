"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import type { DietaryPreference } from "@/lib/auth/schemas";

const countryCodes = [
  { code: "+91", label: "India (+91)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+1", label: "USA/Canada (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+65", label: "Singapore (+65)" },
  { code: "+66", label: "Thailand (+66)" },
  { code: "+60", label: "Malaysia (+60)" },
  { code: "+61", label: "Australia (+61)" },
];

const dietaryOptions: { value: DietaryPreference; label: string }[] = [
  { value: "None", label: "No Preference / Standard" },
  { value: "PureVeg", label: "Pure Vegetarian (100% Veg Kitchen)" },
  { value: "Jain", label: "Jain Meals (No onion, no garlic, no root veg)" },
  { value: "Swaminarayan", label: "Swaminarayan (Strict veg, no garlic)" },
  { value: "Halal", label: "Halal (Certified Halal meals)" },
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const site = (params?.site as string) || "gujjutours";
  const lang = (params?.lang as string) || "en";

  // Support both returnUrl and redirect query parameters
  const redirectUrl =
    searchParams.get("returnUrl") ||
    searchParams.get("redirect") ||
    `/${site}/${lang}`;

  const { register, isAuthenticated } = useAuth();
  const config = useSiteConfig();
  const primaryColor = config?.theme?.colors?.primary || "#2563eb";
  const siteName = config?.site?.name || "Gujju Tours";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>("None");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If already authenticated, redirect immediately
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);

  // Password strength score 0-4
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const strengthLabel = ["Weak", "Fair", "Good", "Strong"][Math.max(0, passwordStrength - 1)] || "Weak";
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

    if (fullName.trim().length < 2) {
      setError("Please enter your full name (minimum 2 characters).");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (phone.trim().length < 6) {
      setError("Please enter a valid mobile phone number (minimum 6 digits).");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify your confirm password field.");
      return;
    }

    if (!termsAccepted) {
      setError("Please agree to the Terms and Conditions and Privacy Policy to continue.");
      return;
    }

    setLoading(true);
    const result = await register({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phoneCountryCode,
      phone: phone.trim(),
      password,
      confirmPassword,
      dietaryPreference,
      marketingOptIn,
      termsAccepted,
    });

    setLoading(false);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push(redirectUrl);
      }, 1000);
    } else {
      setError(result.error || "Failed to create account. Please try again.");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-surface-2 transition-colors">
      <div className="max-w-md w-full space-y-6 bg-surface p-6 sm:p-8 rounded-3xl shadow-xl border border-border">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Create Your Account
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-foreground-muted leading-relaxed">
            Join <span className="font-semibold text-foreground">{siteName}</span> to manage bookings, unlock exclusive member rates, and enjoy seamless checkouts.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-in fade-in flex items-start gap-2">
            <span className="text-base leading-none">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold animate-in fade-in flex items-center gap-2">
            <span className="text-base leading-none">✓</span>
            <span>Account created successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground placeholder:text-foreground-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground placeholder:text-foreground-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-1">
              Mobile Phone *
            </label>
            <div className="flex gap-2">
              <select
                value={phoneCountryCode}
                onChange={(e) => setPhoneCountryCode(e.target.value)}
                className="w-36 px-2.5 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              >
                {countryCodes.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter mobile phone number"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground placeholder:text-foreground-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
            </div>
          </div>

          {/* Dietary Preference */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-1">
              Dietary Preference
            </label>
            <select
              value={dietaryPreference}
              onChange={(e) => setDietaryPreference(e.target.value as DietaryPreference)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            >
              {dietaryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted">
                Password *
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-primary hover:underline font-semibold cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password (min. 8 characters)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground placeholder:text-foreground-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
            />
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground-muted">Password Strength:</span>
                  <span className="font-bold text-foreground">{strengthLabel}</span>
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
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-1">
              Confirm Password *
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground placeholder:text-foreground-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
            />
          </div>

          {/* Marketing Opt-in */}
          <div>
            <label className="flex items-start gap-2.5 text-xs text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="mt-0.5 rounded border-border text-primary focus:ring-primary h-4 w-4 shrink-0"
              />
              <span className="text-foreground-muted">
                Send me exclusive flight discounts, holiday promotions, and travel guides.
              </span>
            </label>
          </div>

          {/* Terms Agreement */}
          <div className="pt-0.5">
            <label className="flex items-start gap-2.5 text-xs text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded border-border text-primary focus:ring-primary h-4 w-4 shrink-0"
              />
              <span className="text-foreground-muted">
                I agree to the{" "}
                <Link
                  href={`/${site}/${lang}/termsandconditions`}
                  target="_blank"
                  className="font-bold underline text-primary hover:opacity-90"
                >
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link
                  href={`/${site}/${lang}/privacy-policy`}
                  target="_blank"
                  className="font-bold underline text-primary hover:opacity-90"
                >
                  Privacy Policy
                </Link>
                . <span className="text-rose-500">*</span>
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3.5 px-6 rounded-xl text-white font-bold text-sm shadow-md transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2"
            style={{ backgroundColor: primaryColor }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Creating Account...
              </span>
            ) : (
              "Complete Registration"
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-3 border-t border-border">
          <p className="text-xs text-foreground-muted">
            Already have an account?{" "}
            <Link
              href={`/${site}/${lang}/login?returnUrl=${encodeURIComponent(redirectUrl)}`}
              className="font-bold text-primary hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
