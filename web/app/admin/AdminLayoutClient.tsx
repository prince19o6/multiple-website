"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { SiteDefinition } from "@/lib/siteRegistry";
import {
  getAdminToken,
  getAdminUser,
  clearAdminSession,
  onAdminSessionChange,
  ADMIN_SITE_NAMES,
  type AdminSiteId,
  type AdminUser,
} from "@/lib/adminApi";

interface Props {
  siteDef: SiteDefinition;
  children: React.ReactNode;
}

export default function AdminLayoutClient({ siteDef, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    const checkAuth = () => {
      if (isLoginPage) {
        setIsLoading(false);
        setIsAuthorized(true);
        return;
      }

      const token = getAdminToken(siteDef.siteId as AdminSiteId);
      const user = getAdminUser(siteDef.siteId as AdminSiteId);

      if (!token || !user) {
        setIsLoading(false);
        setIsAuthorized(false);
        const returnUrl = encodeURIComponent(pathname);
        router.replace(`/admin/login?returnUrl=${returnUrl}`);
        return;
      }

      const roleLower = (user.role || "").toLowerCase();
      if (roleLower !== "admin" && roleLower !== "superadmin") {
        setIsLoading(false);
        setIsAuthorized(false);
        setAdminUser(user);
        return;
      }

      setAdminUser(user);
      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuth();
    return onAdminSessionChange(() => {
      checkAuth();
    });
  }, [pathname, router, isLoginPage, siteDef.siteId]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const brandInfo = ADMIN_SITE_NAMES[siteDef.siteId as AdminSiteId] || ADMIN_SITE_NAMES.tripgoasia;
  const brandColor = siteDef.defaultAccentColor || brandInfo.color || "#2563eb";

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: `${brandColor} transparent transparent transparent` }}
          />
          <p className="text-sm font-medium text-slate-400">
            Verifying administrator credentials for {siteDef.displayName}...
          </p>
        </div>
      </div>
    );
  }

  // 403 Forbidden screen for non-admin logged in users
  if (isAuthorized === false && adminUser && (adminUser.role || "").toLowerCase() !== "admin" && (adminUser.role || "").toLowerCase() !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-8 shadow-2xl text-slate-100 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
            ⛔
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">403 - Access Denied</h1>
          <p className="text-sm text-slate-400 mb-4">
            Your account (<strong className="text-white">{adminUser.email}</strong>) has the role &quot;
            <span className="text-amber-400 font-semibold">{adminUser.role}</span>&quot;, which does not have permission
            to manage <strong className="text-sky-400">{siteDef.displayName}</strong>.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                clearAdminSession(siteDef.siteId as AdminSiteId);
                router.replace("/admin/login");
              }}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-md"
            >
              Sign In with an Admin Account
            </button>
            <Link
              href="/"
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-colors"
            >
              Return to Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    clearAdminSession(siteDef.siteId as AdminSiteId);
    router.replace("/admin/login");
  };

  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/tours", label: "Tours Catalog", icon: "🗺️" },
    { href: "/admin/bookings", label: "Reservations", icon: "📅" },
    { href: "/admin/users", label: "Users & Roles", icon: "👥" },
    { href: "/admin/analytics", label: "Analytics", icon: "📈" },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* ─── Mobile Slide-over Overlay ─── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ─── Sidebar (Desktop & Mobile Drawer) ─── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-white transition-all duration-300 ${
          mobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        } ${sidebarOpen ? "lg:w-64" : "lg:w-20"}`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              {siteDef.displayName.charAt(0)}
            </div>
            {(sidebarOpen || mobileMenuOpen) && (
              <div className="truncate">
                <h1 className="text-sm font-bold tracking-tight text-white leading-tight">Admin Console</h1>
                <p className="text-xs text-slate-400 truncate">{siteDef.displayName}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-400"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? "text-white font-semibold shadow-md"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
                style={isActive ? { backgroundColor: brandColor } : undefined}
              >
                <span className="text-lg shrink-0">{item.icon}</span>
                {(sidebarOpen || mobileMenuOpen) && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 shrink-0 space-y-2">
          {(sidebarOpen || mobileMenuOpen) && (
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/40">
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Active Tenant</p>
              <p className="text-sm font-bold text-white truncate">{siteDef.displayName}</p>
              <p className="text-[11px] font-mono text-sky-400 truncate">{siteDef.backendHostname}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 rounded-xl transition-all font-medium text-sm"
          >
            <span className="text-lg">🚪</span>
            {(sidebarOpen || mobileMenuOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-3.5 flex justify-between items-center shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Open mobile menu"
            >
              ☰
            </button>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: brandColor }}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 hidden sm:inline">
                Tenant:
              </span>
              <span className="text-sm font-bold text-gray-900">{siteDef.displayName}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* View Live Website Link */}
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            >
              <span>🌐</span>
              <span>View Site</span>
            </Link>

            {/* Admin Profile Info */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0"
                style={{ backgroundColor: brandColor }}
              >
                {adminUser?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[120px]">
                  {adminUser?.name || "Admin"}
                </p>
                <p className="text-[10px] text-gray-500 font-medium uppercase">
                  {adminUser?.role || "Admin"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
