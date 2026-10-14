"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";
import { getAdminUser, onAdminSessionChange } from "@/lib/adminApi";

interface NavigationProps {
  config?: MergedWebsiteConfig;
}

interface NavItem {
  label: string;
  href: string;
  show: boolean;
}

export default function Navigation({ config }: NavigationProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const checkAdmin = () => {
      const user = getAdminUser();
      const hasAdmin = Boolean(user && (user.role === "Admin" || user.role === "SuperAdmin"));
      setIsAdminLoggedIn(hasAdmin);
    };

    checkAdmin();
    return onAdminSessionChange(() => {
      checkAdmin();
    });
  }, []);

  const theme = config?.theme;
  const primary = theme?.primary || "#2563eb";
  const textColor = theme?.text || "#111827";
  const surface = theme?.surface || "#ffffff";
  const borderColor = theme?.border || "#e2e8f0";

  // Build nav items dynamically from API header links if available
  const apiHeaderLinks = config?.headerLinks;

  const defaultNavItems: NavItem[] = [
    { label: "Home", href: "/", show: true },
    { label: "Tours", href: "/explore", show: true },
    { label: "Destinations", href: "/explore", show: true },
    { label: "Gallery", href: "/#gallery", show: true },
    { label: "Explore", href: "/explore", show: true },
  ];

  const navItems: NavItem[] =
    apiHeaderLinks && apiHeaderLinks.length > 0
      ? [
          { label: "Home", href: "/", show: true },
          ...apiHeaderLinks.map((link) => ({
            label: link.label,
            href: link.href.startsWith("/") ? link.href : `/${link.href}`,
            show: true,
          })),
          { label: "Explore", href: "/explore", show: true },
        ]
      : defaultNavItems;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  const logo = config?.logo;
  const siteName = config?.name || "Tours";

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-md shadow-sm transition-all"
      style={{
        backgroundColor: surface,
        borderColor: borderColor,
        color: textColor,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-20 flex items-center justify-between">
          {/* Logo / Brand Name */}
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 shrink-0"
          >
            {logo && !logoFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt={siteName}
                className="h-10 w-auto object-contain max-h-12"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div className="flex items-center gap-2.5">
                <div
                  className="h-10 w-10 flex items-center justify-center text-white font-bold rounded-xl shadow-sm text-lg"
                  style={{ backgroundColor: primary }}
                >
                  {siteName.charAt(0)}
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900">
                  {siteName}
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="relative px-2 py-2 text-sm font-semibold transition-colors hover:opacity-80"
                  style={{ color: active ? primary : textColor }}
                >
                  {item.label}
                  {active && (
                    <span
                      className="absolute left-0 right-0 bottom-0 h-0.5 rounded-full"
                      style={{ backgroundColor: primary }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Action CTA & Discreet Admin Link */}
          <div className="hidden lg:flex items-center gap-3">
            {isAdminLoggedIn && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 shadow-sm"
                title="Open Administrator Console"
              >
                <span>🛡️</span>
                <span>Admin</span>
              </Link>
            )}

            <Link
              href="/explore"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: primary }}
            >
              Explore Tours
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            {isAdminLoggedIn && (
              <Link
                href="/admin"
                className="p-1.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg border border-slate-200"
                title="Admin"
              >
                🛡️
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-slate-700 hover:text-slate-900"
              aria-label="Toggle navigation menu"
            >
              <span className="text-2xl font-bold">{mobileOpen ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden border-t px-4 py-6 shadow-xl"
          style={{ backgroundColor: surface, borderColor }}
        >
          <div className="flex flex-col space-y-4">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className="px-3 py-2 text-base font-semibold rounded-lg transition-colors"
                  style={{
                    color: active ? primary : textColor,
                    backgroundColor: active ? `${primary}15` : "transparent",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}

            {isAdminLoggedIn && (
              <Link
                href="/admin"
                onClick={closeMobileMenu}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl transition-colors"
              >
                <span>🛡️</span>
                <span>Administrator Console</span>
              </Link>
            )}

            <div className="pt-2">
              <Link
                href="/explore"
                onClick={closeMobileMenu}
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-md text-center"
                style={{ backgroundColor: primary }}
              >
                Explore Tours
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}