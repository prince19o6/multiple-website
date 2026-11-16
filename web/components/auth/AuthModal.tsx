"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  adminLoginApi,
  getAdminSite,
  type AdminSiteId,
} from "@/lib/adminApi";
import type { DietaryPreference } from "@/lib/auth/schemas";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: { name: string; email: string; role?: string }) => void;
  accentColor?: string;
  initialTab?: "customer" | "register" | "admin";
}

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

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  accentColor = "#2882c5",
  initialTab = "customer",
}: AuthModalProps) {
  const params = useParams();
  const siteId = (params?.site as string) || "gujjutours";
  const lang = (params?.lang as string) || "en";

  const { login, register } = useAuth();
  const [tab, setTab] = useState<"customer" | "register" | "admin">(initialTab);

  // Sync tab with initialTab when opened
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setError(null);
    }
  }, [isOpen, initialTab]);

  // Customer Login state
  const [custEmail, setCustEmail] = useState("");
  const [custPassword, setCustPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Registration state
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhoneCountryCode, setRegPhoneCountryCode] = useState("+91");
  const [regPhone, setRegPhone] = useState("");
  const [regDietary, setRegDietary] = useState<DietaryPreference>("None");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regMarketingOptIn, setRegMarketingOptIn] = useState(false);
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);
  const [regShowPassword, setRegShowPassword] = useState(false);

  // Admin Login state
  const currentSite = getAdminSite();
  const [adminSite, setAdminSite] = useState<AdminSiteId>(currentSite);
  const [adminEmail, setAdminEmail] = useState("admin@gujjutours.com");
  const [adminPassword, setAdminPassword] = useState("Admin@12345");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength score 0-4
  const passwordStrength = useMemo(() => {
    if (!regPassword) return 0;
    let score = 0;
    if (regPassword.length >= 8) score++;
    if (/[A-Z]/.test(regPassword) && /[a-z]/.test(regPassword)) score++;
    if (/[0-9]/.test(regPassword)) score++;
    if (/[^A-Za-z0-9]/.test(regPassword)) score++;
    return score;
  }, [regPassword]);

  const strengthLabel = ["Weak", "Fair", "Good", "Strong"][Math.max(0, passwordStrength - 1)] || "Weak";
  const strengthColor =
    passwordStrength <= 1
      ? "bg-rose-500"
      : passwordStrength === 2
      ? "bg-amber-500"
      : passwordStrength === 3
      ? "bg-blue-500"
      : "bg-emerald-500";

  if (!isOpen) return null;

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const email = custEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    if (!custPassword) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await login({ email, password: custPassword, rememberMe: false });
      if (res.success) {
        onSuccess?.({ name: email.split("@")[0], email });
        onClose();
      } else {
        setError(res.error || "Invalid email or password. Please try again.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regFullName.trim().length < 2) {
      setError("Please enter your full name (minimum 2 characters).");
      return;
    }

    const email = regEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    if (regPhone.trim().length < 6) {
      setError("Please enter a valid mobile number (minimum 6 digits).");
      return;
    }

    if (regPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Z]/.test(regPassword) || !/[a-z]/.test(regPassword) || !/[0-9]/.test(regPassword) || !/[^A-Za-z0-9]/.test(regPassword)) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match. Please verify your confirm password field.");
      return;
    }

    if (!regTermsAccepted) {
      setError("Please accept the Terms and Conditions and Privacy Policy to register.");
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        fullName: regFullName.trim(),
        email,
        phoneCountryCode: regPhoneCountryCode,
        phone: regPhone.trim(),
        password: regPassword,
        confirmPassword: regConfirmPassword,
        dietaryPreference: regDietary,
        marketingOptIn: regMarketingOptIn,
        termsAccepted: regTermsAccepted,
      });

      if (res.success) {
        onSuccess?.({ name: regFullName.trim(), email });
        onClose();
      } else {
        setError(res.error || "Failed to create account. Please try again.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await adminLoginApi(adminEmail.trim(), adminPassword, adminSite);
      const user = res.user || {
        name: "Platform Administrator",
        email: adminEmail.trim(),
        role: "Admin",
      };

      window.dispatchEvent(new CustomEvent("tours_user_session_changed"));
      window.dispatchEvent(new CustomEvent("storage"));
      onSuccess?.({ name: user.name || "Administrator", email: user.email, role: user.role });
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to authenticate administrator."
      );
    } finally {
      setLoading(false);
    }
  };

  const uniqueAdminSites = [
    { key: "gujjutours" as AdminSiteId, label: "Gujju Tours" },
    { key: "tripgoasia" as AdminSiteId, label: "TripGo Asia" },
    { key: "technoheaven" as AdminSiteId, label: "Technoheaven B2B" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-surface text-foreground rounded-3xl shadow-2xl border border-border overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-4 sm:my-8">
        {/* Header Bar */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {tab === "register" ? "Create Your Account" : tab === "admin" ? "Admin Access" : "Welcome Back"}
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              {tab === "register"
                ? "Join to manage bookings and unlock exclusive member rates"
                : tab === "admin"
                ? "Sign in to management portal"
                : "Access your bookings, itinerary & profile"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-2 text-foreground-muted hover:text-foreground transition-colors"
            aria-label="Close dialog"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 3-Tab Switcher */}
        <div className="flex border-b border-border bg-surface-2 p-1 gap-1">
          <button
            type="button"
            onClick={() => {
              setTab("customer");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === "customer"
                ? "bg-surface text-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            Traveler Login
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === "register"
                ? "bg-surface text-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("admin");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === "admin"
                ? "bg-surface text-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            Admin Portal
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Traveler / Customer Login */}
        {tab === "customer" && (
          <form onSubmit={handleCustomerSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-foreground">
                  Password <span className="text-rose-500">*</span>
                </label>
                <Link
                  href={`/${siteId}/${lang}/forgot-password`}
                  onClick={onClose}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={custPassword}
                  onChange={(e) => setCustPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              style={{ backgroundColor: accentColor }}
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

            <div className="pt-2 text-center border-t border-border flex items-center justify-between">
              <span className="text-xs text-foreground-muted">Don&apos;t have an account yet?</span>
              <button
                type="button"
                onClick={() => {
                  setTab("register");
                  setError(null);
                }}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                Create Account Now →
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Create Account / Registration Form */}
        {tab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="p-4 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Mobile Phone */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Mobile Phone <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={regPhoneCountryCode}
                  onChange={(e) => setRegPhoneCountryCode(e.target.value)}
                  className="w-36 px-2.5 py-2 rounded-xl border border-border bg-surface text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
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
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="Enter mobile phone number"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Dietary Preference */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Dietary Preference
              </label>
              <select
                value={regDietary}
                onChange={(e) => setRegDietary(e.target.value as DietaryPreference)}
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-surface text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                <label className="block text-xs font-semibold text-foreground">
                  Password <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setRegShowPassword(!regShowPassword)}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  {regShowPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={regShowPassword ? "text" : "password"}
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="At least 8 chars, 1 uppercase, 1 symbol"
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {regPassword.length > 0 && (
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <div className="flex-1 h-1 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strengthColor} transition-all duration-300`}
                      style={{ width: `${(passwordStrength / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-foreground-muted">{strengthLabel}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <input
                type={regShowPassword ? "text" : "password"}
                required
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-1 text-xs">
              <label className="flex items-start gap-2 text-foreground-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={regMarketingOptIn}
                  onChange={(e) => setRegMarketingOptIn(e.target.checked)}
                  className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                />
                <span>Send me exclusive flight discounts, promotions, and travel guides.</span>
              </label>

              <label className="flex items-start gap-2 text-foreground-muted cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={regTermsAccepted}
                  onChange={(e) => setRegTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                />
                <span>
                  I agree to the{" "}
                  <Link href={`/${siteId}/${lang}/termsandconditions`} target="_blank" className="text-primary hover:underline font-semibold">
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href={`/${siteId}/${lang}/privacy-policy`} target="_blank" className="text-primary hover:underline font-semibold">
                    Privacy Policy
                  </Link>
                  . <span className="text-rose-500">*</span>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
              style={{ backgroundColor: accentColor }}
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

            <div className="pt-2 text-center border-t border-border flex items-center justify-between">
              <span className="text-xs text-foreground-muted">Already have an account?</span>
              <button
                type="button"
                onClick={() => {
                  setTab("customer");
                  setError(null);
                }}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                Sign In Instead →
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Admin Login */}
        {tab === "admin" && (
          <form onSubmit={handleAdminSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Website Environment
              </label>
              <select
                value={adminSite}
                onChange={(e) => setAdminSite(e.target.value as AdminSiteId)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {uniqueAdminSites.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label} ({item.key})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@gujjutours.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin@12345"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                "Sign In to Admin Portal"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
