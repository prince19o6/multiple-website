"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  adminLoginApi,
  getAdminToken,
  getAdminUser,
  getAdminSite,
  ADMIN_SITE_NAMES,
  type AdminSiteId,
} from "@/lib/adminApi";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/admin";

  const [selectedSite, setSelectedSite] = useState<AdminSiteId>("tripgoasia");
  const [email, setEmail] = useState("admin@tripgoasia.com");
  const [password, setPassword] = useState("Admin@12345");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentSite = getAdminSite();
    setSelectedSite(currentSite);
    updateDefaultEmail(currentSite);

    // If already logged in for this site, redirect immediately to intended page
    const token = getAdminToken(currentSite);
    const user = getAdminUser(currentSite);
    const roleLower = (user?.role || "").toLowerCase();
    if (token && user && (roleLower === "admin" || roleLower === "superadmin")) {
      router.replace(returnUrl);
    }
  }, [router, returnUrl]);

  const updateDefaultEmail = (site: AdminSiteId) => {
    if (site === "website1" || site === "gujjutours") setEmail("admin@gujjutours.com");
    else if (site === "website2" || site === "tripgoasia") setEmail("admin@tripgoasia.com");
    else if (site === "website3" || site === "technoheaven") setEmail("admin@technoheaven.com");
  };

  const handleSiteChange = (newSite: AdminSiteId) => {
    setSelectedSite(newSite);
    updateDefaultEmail(newSite);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);

    try {
      await adminLoginApi(email.trim(), password, selectedSite);
      // Ensure redirect to returnUrl
      router.replace(returnUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to log in. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const currentBrand =
    ADMIN_SITE_NAMES[selectedSite] || ADMIN_SITE_NAMES.tripgoasia || ADMIN_SITE_NAMES.gujjutours;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg transition-colors"
            style={{ backgroundColor: currentBrand.color }}
          >
            🛡️
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Portal</h1>
          <p className="text-xs text-gray-500 mt-1">Multi-Tenant Management Console</p>
        </div>

        {/* Tenant Website Selector */}
        <div className="mb-5 bg-gray-50 p-3 rounded-2xl border border-gray-200">
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
            Target Website Tenant
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(["gujjutours", "tripgoasia", "technoheaven"] as AdminSiteId[]).map((site) => {
              const brand = ADMIN_SITE_NAMES[site];
              const isSelected = selectedSite === site || ADMIN_SITE_NAMES[selectedSite]?.id === site;
              return (
                <button
                  type="button"
                  key={site}
                  onClick={() => handleSiteChange(site)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl transition-all truncate text-center ${
                    isSelected
                      ? "bg-white text-slate-900 shadow-sm border border-gray-200 ring-2 ring-blue-500/20"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                    style={{ backgroundColor: brand.color }}
                  />
                  {brand.label.split(" ")[0]}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400 mt-2 font-mono text-center truncate">
            Target Host: {currentBrand.hostname}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-start gap-2">
            <span className="text-base leading-none mt-0.5">⚠️</span>
            <div className="flex-1">
              <span>{error}</span>
              {error.includes("locked") && (
                <p className="text-[11px] text-rose-600 mt-1">
                  Tip: Too many failed password attempts. Wait the cooldown period or reset lockout via CLI.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Administrator Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm font-medium text-gray-900"
              placeholder="admin@domain.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm font-medium text-gray-900 pr-12"
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-medium"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md transition-all hover:opacity-90 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            style={{ backgroundColor: currentBrand.color }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to {currentBrand.label} Admin</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>Protected Multi-Tenant Area</span>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-gray-500 hover:text-gray-800 font-semibold"
          >
            ← Public Site
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans text-sm">
          Loading login portal...
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
