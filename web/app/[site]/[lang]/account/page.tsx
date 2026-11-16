"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
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

export default function AccountPage() {
  const router = useRouter();
  const params = useParams();
  const site = (params?.site as string) || "gujjutours";
  const lang = (params?.lang as string) || "en";

  const {
    user,
    isAuthenticated,
    loading: authLoading,
    updateProfile,
    changePassword,
    deleteAccount,
    resendVerification,
    logout,
  } = useAuth();

  const config = useSiteConfig();
  const primaryColor = config?.theme?.colors?.primary || "#2563eb";

  const [activeTab, setActiveTab] = useState<"profile" | "security" | "danger">("profile");

  // Profile Form State
  const [fullName, setFullName] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>("None");
  const [preferredCurrency, setPreferredCurrency] = useState("USD");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Resend verification state
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Delete Account State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Initialize fields when user is loaded
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhoneCountryCode(user.phoneCountryCode || "+91");
      setPhone(user.phone || "");
      setDietaryPreference((user.dietaryPreference as DietaryPreference) || "None");
      setPreferredCurrency(user.preferredCurrency || (typeof config?.currency === "string" ? config.currency : "USD"));
      setMarketingOptIn(Boolean(user.marketingOptIn));
    }
  }, [user, config]);

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/${site}/${lang}/login?redirect=/${site}/${lang}/account`);
    }
  }, [authLoading, isAuthenticated, router, site, lang]);

  if (authLoading || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-foreground-muted">
          <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading your account...
        </div>
      </div>
    );
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileSaving(true);

    const result = await updateProfile({
      fullName,
      phoneCountryCode,
      phone,
      dietaryPreference,
      preferredCurrency,
      marketingOptIn,
    });

    setProfileSaving(false);
    if (result.success) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } else {
      setProfileError(result.error || "Failed to update profile.");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    setPasswordSaving(true);
    const result = await changePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    setPasswordSaving(false);
    if (result.success) {
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } else {
      setPasswordError(result.error || "Failed to change password.");
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setResendingEmail(true);
    setResendStatus(null);
    const result = await resendVerification(user.email);
    setResendingEmail(false);
    if (result.success) {
      setResendStatus("Verification email sent! Check your inbox.");
    } else {
      setResendStatus(result.error || "Failed to send verification email.");
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    setDeleting(true);

    const result = await deleteAccount(deletePassword);
    setDeleting(false);

    if (result.success) {
      router.push(`/${site}/${lang}`);
    } else {
      setDeleteError(result.error || "Failed to delete account. Please verify your password.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Account Settings
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Manage your personal profile, dietary preferences, security, and travel details.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/${site}/${lang}/my-bookings`}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-border hover:bg-surface-2 transition-colors text-foreground"
          >
            My Bookings
          </Link>
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-3 transition-colors ${
              activeTab === "profile"
                ? "bg-primary text-white shadow-soft-sm"
                : "text-foreground-muted hover:text-foreground hover:bg-surface-2"
            }`}
          >
            <span>👤</span>
            <span>Profile Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-3 transition-colors ${
              activeTab === "security"
                ? "bg-primary text-white shadow-soft-sm"
                : "text-foreground-muted hover:text-foreground hover:bg-surface-2"
            }`}
          >
            <span>🔒</span>
            <span>Security &amp; Password</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("danger")}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-3 transition-colors ${
              activeTab === "danger"
                ? "bg-rose-600 text-white shadow-soft-sm"
                : "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            }`}
          >
            <span>⚠️</span>
            <span>Delete Account</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 bg-surface p-6 sm:p-8 rounded-3xl border border-border shadow-soft-sm">
          {/* TAB 1: Profile Details */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Personal Information</h2>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Update your contact info and personal preferences used during booking checkout.
                </p>
              </div>

              {profileError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                  ✓ Profile updated successfully!
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Email Address (read-only) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted">
                    Email Address
                  </label>
                  {user.isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                      ⚠️ Unverified
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface-2 text-foreground-muted text-sm cursor-not-allowed"
                  />
                  {!user.isEmailVerified && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendingEmail}
                      className="px-3 py-2 text-xs font-bold rounded-xl border border-border hover:bg-surface-2 transition-colors text-foreground shrink-0"
                    >
                      {resendingEmail ? "Sending..." : "Resend Verification"}
                    </button>
                  )}
                </div>
                {resendStatus && (
                  <p className="mt-1.5 text-xs text-primary font-medium">{resendStatus}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-1.5">
                  Mobile Phone
                </label>
                <div className="flex gap-2">
                  <select
                    value={phoneCountryCode}
                    onChange={(e) => setPhoneCountryCode(e.target.value)}
                    className="w-1/3 px-3 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs sm:text-sm"
                  >
                    {countryCodes.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm"
                  />
                </div>
              </div>

              {/* Dietary Preferences */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-1.5">
                  Dietary Preference (Default for Meals &amp; Flights)
                </label>
                <select
                  value={dietaryPreference}
                  onChange={(e) => setDietaryPreference(e.target.value as DietaryPreference)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm"
                >
                  <option value="None">No Preference / Standard Meals</option>
                  <option value="PureVeg">Pure Vegetarian</option>
                  <option value="Jain">Jain (Strict Vegetarian without root vegetables)</option>
                  <option value="Swaminarayan">Swaminarayan (Vegetarian without onion &amp; garlic)</option>
                  <option value="Halal">Halal</option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-1.5">
                  Preferred Currency
                </label>
                <input
                  type="text"
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value.toUpperCase())}
                  maxLength={3}
                  className="w-32 px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm uppercase"
                />
              </div>

              {/* Marketing Opt-in */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer text-xs sm:text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Receive member discount alerts and customized trip deals via email.</span>
                </label>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-sm transition-all hover:brightness-105 disabled:opacity-60"
                  style={{ backgroundColor: primaryColor }}
                >
                  {profileSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Security & Password */}
          {activeTab === "security" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Change Password</h2>
                <p className="text-xs text-foreground-muted mt-0.5">
                  To protect your account, ensure your password is secure and unique.
                </p>
              </div>

              {passwordError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                  ✓ Password changed successfully!
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters with letters, numbers & symbol"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-6 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-sm transition-all hover:brightness-105 disabled:opacity-60"
                  style={{ backgroundColor: primaryColor }}
                >
                  {passwordSaving ? "Updating Password..." : "Update Password"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Danger Zone */}
          {activeTab === "danger" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-rose-600">Danger Zone</h2>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Permanent actions regarding your account and stored personal data.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20">
                <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  Delete Account
                </h3>
                <p className="text-xs text-rose-800 dark:text-rose-300 mt-1 leading-relaxed">
                  Once your account is deleted, your personally identifiable information (name, email, phone) will be permanently anonymized. Existing completed booking references will be retained without your personal details for tax and accounting compliance.
                </p>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
                >
                  Delete My Account
                </button>
              </div>

              {/* Delete Modal */}
              {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm">
                  <div className="max-w-md w-full bg-surface p-6 sm:p-8 rounded-3xl border border-border shadow-2xl space-y-4">
                    <h3 className="text-lg font-bold text-foreground">
                      Confirm Account Deletion
                    </h3>
                    <p className="text-xs text-foreground-muted">
                      Please enter your current password to authorize permanent deletion of your account.
                    </p>

                    {deleteError && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                        {deleteError}
                      </div>
                    )}

                    <form onSubmit={handleDeleteAccount} className="space-y-4">
                      <input
                        type="password"
                        required
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm"
                      />
                      <div className="flex gap-3 justify-end">
                        <button
                          type="button"
                          onClick={() => setDeleteModalOpen(false)}
                          className="px-4 py-2 rounded-xl text-xs font-bold border border-border hover:bg-surface-2 transition-colors text-foreground"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={deleting}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
                        >
                          {deleting ? "Deleting..." : "Permanently Delete"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
