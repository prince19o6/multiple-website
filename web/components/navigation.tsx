"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";
import type { SiteConfig } from "@/lib/config/siteConfigSchema";
import {
  getAdminUser,
  onAdminSessionChange,
  clearAdminSession,
} from "@/lib/adminApi";
import TopBar from "./navigation/TopBar";
import AuthModal from "./auth/AuthModal";
import GlobalSearchModal from "./search/GlobalSearchModal";
import { useCurrency } from "@/lib/CurrencyContext";

interface NavigationProps {
  config?: MergedWebsiteConfig | SiteConfig | any;
}

interface CurrentUser {
  name: string;
  email?: string;
  role?: string;
}

export const ALL_SERVICES = [
  { name: "Tours & Sightseeing", href: "/en/tours", icon: "🌴", desc: "Desert safaris, city tours & attractions" },
  { name: "Holiday Packages", href: "/en/packages", icon: "🎒", desc: "Curated multi-day global vacations" },
  { name: "Hotels & Stays", href: "/en/hotels", icon: "🏨", desc: "Luxury resorts and verified hotels" },
  { name: "Flight Booking", href: "/en/flights", icon: "✈️", desc: "Domestic & international flight tickets" },
  { name: "Transfers & Cabs", href: "/en/transfers", icon: "🚗", desc: "Airport pick & drop, private chauffeurs" },
  { name: "Visa Services", href: "/en/visas", icon: "🛂", desc: "Hassle-free tourist & express visas" },
  { name: "Dining & Restaurants", href: "/en/restaurants", icon: "🍽️", desc: "Fine dining & gourmet culinary experiences" },
  { name: "Custom Package Builder", href: "/en/buildpackage", icon: "🛠️", desc: "Design your personalized dream trip" },
  { name: "Car Rental", href: "/en/car-rental", icon: "🚘", desc: "Self-drive & luxury fleet rentals" },
  { name: "Currency Exchange", href: "/en/currency-exchange", icon: "💱", desc: "Best live travel foreign exchange rates" },
];

export const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", flag: "🇸🇬" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", flag: "🇲🇾" },
];

export default function Navigation({ config }: NavigationProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // User Authentication & Cart State
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"customer" | "register" | "admin">("customer");
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [servicesMenuOpen, setServicesMenuOpen] = useState(false);
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const { currencyCode: selectedCurrency, setCurrency } = useCurrency();
  const [selectedLang, setSelectedLang] = useState("EN");

  const userMenuRef = useRef<HTMLDivElement>(null);
  const servicesMenuRef = useRef<HTMLDivElement>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);

  // Dark mode class observer
  useEffect(() => {
    if (typeof document === "undefined") return;
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Global modal triggers for login and registration
  useEffect(() => {
    const handleOpenRegister = () => {
      setAuthModalTab("register");
      setAuthModalOpen(true);
    };
    const handleOpenLogin = () => {
      setAuthModalTab("customer");
      setAuthModalOpen(true);
    };
    window.addEventListener("tours_open_register", handleOpenRegister);
    window.addEventListener("tours_open_login", handleOpenLogin);
    return () => {
      window.removeEventListener("tours_open_register", handleOpenRegister);
      window.removeEventListener("tours_open_login", handleOpenLogin);
    };
  }, []);

  // Quick keyboard shortcut (Cmd+K / Ctrl+K) for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync user session and cart count
  const refreshUserAndCart = useCallback(() => {
    if (typeof window === "undefined") return;

    // 1. Detect User Identity
    let foundUser: CurrentUser | null = null;

    // Check admin session
    const admin = getAdminUser();
    if (admin && admin.name) {
      foundUser = {
        name: admin.name,
        email: admin.email,
        role: admin.role,
      };
      setIsAdminLoggedIn(true);
    } else {
      setIsAdminLoggedIn(false);
    }

    // Check customer session if not admin
    if (!foundUser) {
      try {
        const rawCustomer = localStorage.getItem("customer_user");
        if (rawCustomer) {
          const parsed = JSON.parse(rawCustomer);
          if (parsed?.name || parsed?.email) {
            foundUser = {
              name: parsed.name || parsed.email.split("@")[0],
              email: parsed.email,
              role: "Customer",
            };
          }
        }
      } catch {}
    }

    // Check user_info
    if (!foundUser) {
      try {
        const rawInfo = localStorage.getItem("user_info");
        if (rawInfo) {
          const parsed = JSON.parse(rawInfo);
          if (parsed?.name || parsed?.email) {
            foundUser = {
              name: parsed.name || parsed.email.split("@")[0],
              email: parsed.email,
              role: parsed.role || "Member",
            };
          }
        }
      } catch {}
    }

    // Check customer_email
    if (!foundUser) {
      const custEmail = localStorage.getItem("customer_email");
      if (custEmail) {
        foundUser = {
          name: custEmail.split("@")[0],
          email: custEmail,
          role: "Customer",
        };
      }
    }

    setCurrentUser(foundUser);

    // 2. Calculate Cart Items Count (strictly real cart items, no mock booking refs)
    try {
      // Purge legacy mock demo booking references from storage if present
      const rawRefs = localStorage.getItem("customer_booking_refs");
      if (rawRefs) {
        try {
          const parsedRefs = JSON.parse(rawRefs);
          if (Array.isArray(parsedRefs)) {
            const cleaned = parsedRefs.filter(
              (r: string) => r !== "GT-849201" && r !== "GT-392019"
            );
            if (cleaned.length !== parsedRefs.length) {
              localStorage.setItem("customer_booking_refs", JSON.stringify(cleaned));
            }
          }
        } catch {}
      }

      let count = 0;
      const rawCart =
        localStorage.getItem("tours_cart") || localStorage.getItem("cart");
      if (rawCart) {
        const parsedCart = JSON.parse(rawCart);
        if (Array.isArray(parsedCart)) count = parsedCart.length;
      }
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    refreshUserAndCart();

    // Listen to cross-component auth & storage events
    const handleStorageChange = () => refreshUserAndCart();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("tours_user_session_changed", handleStorageChange);
    const unsubAdmin = onAdminSessionChange(() => refreshUserAndCart());

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "tours_user_session_changed",
        handleStorageChange
      );
      unsubAdmin();
    };
  }, [refreshUserAndCart]);

  const handleSelectCurrency = (currCode: string) => {
    setCurrency(currCode);
    setCurrencyMenuOpen(false);
  };

  // Click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      if (servicesMenuRef.current && !servicesMenuRef.current.contains(target)) {
        setServicesMenuOpen(false);
      }
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(target)) {
        setCurrencyMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setServicesMenuOpen(false);
    setCurrencyMenuOpen(false);
  }, [pathname]);

  const primary =
    config?.theme?.colors?.primary || config?.theme?.primary || "#2882c5";
  const logo = isDark
    ? config?.assets?.logoDark ||
      config?.logoDark ||
      config?.assets?.logoUrl ||
      config?.logo
    : config?.assets?.logoLight ||
      config?.logoLight ||
      config?.assets?.logoUrl ||
      config?.logo;

  const siteName = config?.site?.name || config?.name || "Gujju Tours";
  const siteId = config?.siteId || config?.site?.siteId || config?.site?.id || "gujjutours";

  // Dynamic languages from SiteConfig site.languages or fallback
  const siteLangs = config?.site?.languages;
  const legacyLangs = Array.isArray(config?.dynamic?.websiteLaunguage)
    ? config.dynamic.websiteLaunguage
    : [];

  const availableLangs =
    Array.isArray(siteLangs) && siteLangs.length > 0
      ? siteLangs.map((l: any) => ({
          code: String(l.code || "en").toUpperCase(),
          name: String(l.name || "English"),
        }))
      : legacyLangs.length > 0
      ? legacyLangs.map((l: any) => ({
          code: String(l.code || "en").toUpperCase(),
          name: String(l.name || "English"),
        }))
      : [
          { code: "EN", name: "English" },
          { code: "GU", name: "Gujarati" },
          { code: "HI", name: "Hindi" },
        ];

  const handleSelectLang = (code: string) => {
    setSelectedLang(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("tours_selected_lang", code);
    }
  };

  const handleLogout = () => {
    if (typeof window === "undefined") return;
    clearAdminSession();
    localStorage.removeItem("customer_user");
    localStorage.removeItem("customer_email");
    localStorage.removeItem("user_info");
    localStorage.removeItem("adminLoggedIn");
    window.dispatchEvent(new CustomEvent("tours_user_session_changed"));
    window.dispatchEvent(new CustomEvent("storage"));
    setCurrentUser(null);
    setIsAdminLoggedIn(false);
    setUserMenuOpen(false);
  };

  const userInitial = (currentUser?.name || "U").trim().charAt(0).toUpperCase();

  return (
    <div id="site-header" className="sticky top-0 z-40 w-full shadow-soft-sm">
      {/* 1. Top Contact & Appearance Bar */}
      <TopBar config={config} isAdminLoggedIn={isAdminLoggedIn} />

      {/* 2. Main Header: Clean layout with Logo on left and Cart, Language, Login/User on right */}
      <header className="w-full bg-surface border-b border-border text-foreground backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo / Brand Name */}
          <Link
            href="/en"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 sm:gap-3 shrink-0"
            aria-label={`${siteName} Home`}
          >
            {logo && !logoFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt={siteName}
                onError={() => setLogoFailed(true)}
                className="max-h-[38px] sm:max-h-[48px] w-auto max-w-[130px] sm:max-w-[200px] object-contain object-left"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-primary-contrast font-bold text-base sm:text-lg shadow-soft-sm"
                  style={{ backgroundColor: primary }}
                >
                  {siteName.charAt(0)}
                </div>
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-foreground truncate max-w-[120px] sm:max-w-none">
                  {siteName}
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Right Action Area: Search | MICE | All Services ⌵ | [Banknote] INR ⌵ | 🛒 | [ Login ] */}
          <div className="hidden lg:flex items-center gap-5 xl:gap-7 shrink-0">
            {/* Quick Search Button */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-surface-2/70 hover:bg-surface-2 text-foreground-muted hover:text-foreground text-xs font-semibold transition-all shadow-soft-sm cursor-pointer"
              aria-label="Open Search"
              title="Search catalogue"
            >
              <svg
                className="w-4 h-4 text-foreground-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Search...</span>
            </button>

            {/* 1. MICE Link */}
            <Link
              href="/en/contact-us?subject=MICE"
              className="text-[15px] font-semibold text-foreground/90 hover:text-primary transition-colors tracking-tight py-1"
            >
              MICE
            </Link>

            {/* 2. All Services Dropdown Menu */}
            <div className="relative" ref={servicesMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setServicesMenuOpen(!servicesMenuOpen);
                  setCurrencyMenuOpen(false);
                  setUserMenuOpen(false);
                }}
                className="flex items-center gap-1.5 text-[15px] font-semibold text-foreground/90 hover:text-primary transition-colors py-1 cursor-pointer"
                aria-expanded={servicesMenuOpen}
                aria-label="All Services Menu"
              >
                <span>All Services</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  className={`w-3.5 h-3.5 text-foreground-muted transition-transform duration-200 ${
                    servicesMenuOpen ? "rotate-180" : ""
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>

              {servicesMenuOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-80 sm:w-96 bg-surface text-foreground rounded-2xl shadow-2xl border border-border p-3 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1.5 mb-1.5 border-b border-border flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
                      Explore All Services
                    </span>
                    <span className="text-[10px] font-semibold text-primary bg-primary-light px-2 py-0.5 rounded-full">
                      {siteName}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[380px] overflow-y-auto">
                    {ALL_SERVICES.map((srv) => (
                      <Link
                        key={srv.name}
                        href={srv.href}
                        onClick={() => setServicesMenuOpen(false)}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-2 transition-colors group"
                      >
                        <span className="text-xl group-hover:scale-110 transition-transform">
                          {srv.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {srv.name}
                          </p>
                          <p className="text-[10px] text-foreground-muted truncate">
                            {srv.desc}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Currency Selector: [Banknote Icon] INR ⌵ */}
            <div className="relative" ref={currencyMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setCurrencyMenuOpen(!currencyMenuOpen);
                  setServicesMenuOpen(false);
                  setUserMenuOpen(false);
                }}
                className="flex items-center gap-2 text-[15px] font-semibold text-foreground/90 hover:text-primary transition-colors py-1 cursor-pointer"
                aria-expanded={currencyMenuOpen}
                aria-label="Select Currency"
              >
                {/* Banknote outline SVG with inner oval matching user's reference image */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="w-5 h-5 text-foreground/85"
                >
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2.8" />
                  <path strokeLinecap="round" d="M6 10h.01M18 14h.01" />
                </svg>
                <span>{selectedCurrency}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  className={`w-3.5 h-3.5 text-foreground-muted transition-transform duration-200 ${
                    currencyMenuOpen ? "rotate-180" : ""
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>

              {currencyMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-surface text-foreground rounded-2xl shadow-2xl border border-border p-2 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1.5 mb-1 border-b border-border">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
                      Choose Currency
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {CURRENCIES.map((curr) => (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={() => handleSelectCurrency(curr.code)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          selectedCurrency === curr.code
                            ? "bg-primary-light text-primary font-bold"
                            : "text-foreground hover:bg-surface-2"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{curr.flag}</span>
                          <span>{curr.code}</span>
                          <span className="text-foreground-muted font-normal text-[11px]">
                            ({curr.symbol})
                          </span>
                        </div>
                        <span className="text-[11px] text-foreground-muted truncate max-w-[80px]">
                          {curr.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Login Button or User Profile Dropdown (Only First Alphabet in Icon) */}
            {currentUser ? (
              /* When Authenticated: Profile Avatar Circle (First Alphabet Only) */
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setServicesMenuOpen(false);
                    setCurrencyMenuOpen(false);
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm uppercase cursor-pointer hover:opacity-90 transition-opacity border-2 border-primary"
                  style={{ backgroundColor: primary }}
                  aria-label={`User Account: ${currentUser.name}`}
                  aria-expanded={userMenuOpen}
                >
                  {userInitial}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-surface text-foreground rounded-2xl shadow-2xl border border-border py-2 z-50 animate-in fade-in slide-in-from-top-1">
                    {/* User Header Info */}
                    <div className="px-4 py-2.5 border-b border-border">
                      <p className="text-sm font-bold text-foreground truncate">
                        {currentUser.name}
                      </p>
                      {currentUser.email && (
                        <p className="text-xs text-foreground-muted truncate mt-0.5">
                          {currentUser.email}
                        </p>
                      )}
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-surface-2 text-foreground-muted border border-border">
                        {currentUser.role || "Member"}
                      </span>
                    </div>

                    {/* Menu Actions */}
                    <div className="py-1">
                      <Link
                        href="/en/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-surface-2 hover:text-primary transition-colors"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="w-4 h-4 text-primary"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                          />
                        </svg>
                        <span>Profile &amp; Settings</span>
                      </Link>

                      <Link
                        href="/en/my-bookings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-surface-2 hover:text-primary transition-colors"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="w-4 h-4 text-primary"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z"
                          />
                        </svg>
                        <span>My Bookings</span>
                      </Link>

                      {isAdminLoggedIn && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-surface-2 transition-colors"
                        >
                          <span>🛡️</span>
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-border pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                          />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Outlined Pill Login Button matching user reference image exactly */
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab("customer");
                  setAuthModalOpen(true);
                }}
                className="px-6 py-2 rounded-2xl border-2 border-primary text-primary font-bold text-sm bg-transparent hover:bg-primary hover:text-white transition-all shadow-soft-sm cursor-pointer min-h-[42px] flex items-center justify-center active:scale-95"
                aria-label="Login to account"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Right Action Bar: Search, Currency, Cart, Login/User Profile, Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden shrink-0">
            {/* Mobile Search Icon */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center border border-border text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
              aria-label="Open Search"
              title="Search"
            >
              <svg
                className="w-4 h-4 text-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Mobile Currency Indicator */}
            <button
              type="button"
              onClick={() => {
                const idx = CURRENCIES.findIndex((c) => c.code === selectedCurrency);
                const next = CURRENCIES[(idx + 1) % CURRENCIES.length];
                handleSelectCurrency(next.code);
              }}
              className="hidden min-[400px]:flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-full border border-border text-foreground text-xs font-bold transition-colors min-h-[36px] sm:min-h-[38px] hover:bg-surface-2"
              aria-label="Toggle Currency"
              title="Change Currency"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="w-3.5 h-3.5"
              >
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2.8" />
              </svg>
              <span>{selectedCurrency}</span>
            </button>

            {/* Mobile Login / User Avatar (First Alphabet Only) */}
            {currentUser ? (
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm cursor-pointer"
                style={{ backgroundColor: primary }}
                aria-label={`User Profile: ${currentUser.name}`}
              >
                {userInitial}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab("customer");
                  setAuthModalOpen(true);
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl border-2 border-primary text-primary font-bold text-xs hover:bg-primary hover:text-white transition-all cursor-pointer min-h-[36px] sm:min-h-[38px] active:scale-95"
                aria-label="Login"
              >
                Login
              </button>
            )}

            {/* Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-surface-2 text-foreground transition-colors min-w-[36px] min-h-[36px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center cursor-pointer active:scale-95"
              aria-label="Open Navigation Menu"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path
                  fillRule="evenodd"
                  d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm8.25 5.25a.75.75 0 0 1 .75-.75h8.25a.75.75 0 0 1 0 1.5H12a.75.75 0 0 1-.75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Mobile Slide-out Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-overlay backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative ml-auto w-[85vw] max-w-xs bg-surface h-full shadow-2xl flex flex-col z-10 overflow-y-auto border-l border-border overscroll-contain">
            {/* Drawer Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="font-bold text-base text-foreground">
                {siteName}
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-full hover:bg-surface-2 text-foreground-muted"
                aria-label="Close menu"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* User Profile Card inside Drawer */}
            <div className="p-4 border-b border-border bg-surface-2">
              {currentUser ? (
                <div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm uppercase shadow-sm"
                      style={{ backgroundColor: primary }}
                    >
                      {userInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">
                        {currentUser.name}
                      </p>
                      {currentUser.email && (
                        <p className="text-xs text-foreground-muted truncate">
                          {currentUser.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full py-1.5 px-3 rounded-lg border border-border bg-surface text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-foreground-muted">
                    Sign in to access your bookings and travel preferences
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        setAuthModalTab("customer");
                        setAuthModalOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl border border-border text-foreground font-bold text-xs hover:bg-surface-2 transition-all cursor-pointer"
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        setAuthModalTab("register");
                        setAuthModalOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                      style={{ backgroundColor: primary }}
                    >
                      Register
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Links & Services */}
            <div className="p-4 space-y-1">
              <div className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider mb-2">
                Services &amp; Bookings
              </div>
              <Link
                href="/en/contact-us?subject=MICE"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-foreground hover:bg-surface-2 hover:text-primary transition-colors"
              >
                <span>🤝</span>
                <span>MICE &amp; Corporate</span>
              </Link>
              {currentUser && (
                <Link
                  href="/en/account"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-surface-2"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="w-4 h-4 text-primary"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                  <span>Account Settings</span>
                </Link>
              )}
              <Link
                href="/en/my-bookings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-surface-2"
              >
                <div className="flex items-center gap-2.5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="w-4 h-4 text-primary"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z"
                    />
                  </svg>
                  <span>My Bookings &amp; Cart</span>
                </div>
                {cartCount > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: primary }}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                href="/en/tours"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-surface-2"
              >
                <span>🌴</span>
                <span>Tours &amp; Sightseeing</span>
              </Link>
              <Link
                href="/en/packages"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-surface-2"
              >
                <span>🎒</span>
                <span>Holiday Packages</span>
              </Link>
              <Link
                href="/en/hotels"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-surface-2"
              >
                <span>🏨</span>
                <span>Hotels &amp; Stays</span>
              </Link>
              <Link
                href="/en/flights"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-surface-2"
              >
                <span>✈️</span>
                <span>Flight Booking</span>
              </Link>
              <Link
                href="/en/transfers"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-surface-2"
              >
                <span>🚗</span>
                <span>Transfers &amp; Cabs</span>
              </Link>
              <Link
                href="/en/visas"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-surface-2"
              >
                <span>🛂</span>
                <span>Visa Services</span>
              </Link>
              <Link
                href="/en/restaurants"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-surface-2"
              >
                <span>🍽️</span>
                <span>Dining &amp; Buffets</span>
              </Link>
              <Link
                href="/en/buildpackage"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-surface-2"
              >
                <span>🛠️</span>
                <span>Custom Package Builder</span>
              </Link>
              <Link
                href="/en/web-check-in"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-surface-2"
              >
                <span>🧳</span>
                <span>Web Check-in</span>
              </Link>
              {isAdminLoggedIn && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-emerald-600 hover:bg-surface-2"
                >
                  <span>🛡️</span>
                  <span>Admin Dashboard</span>
                </Link>
              )}
            </div>

            {/* Currency Selector in Drawer */}
            <div className="border-t border-border p-4">
              <div className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider mb-2">
                Currency
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {CURRENCIES.map((curr) => (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => {
                      handleSelectCurrency(curr.code);
                      setMobileOpen(false);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      selectedCurrency === curr.code
                        ? "border-primary bg-primary-light text-primary"
                        : "border-border text-foreground hover:bg-surface-2"
                    }`}
                  >
                    <span className="text-sm">{curr.flag}</span>
                    <span>{curr.code}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selector in Drawer */}
            <div className="border-t border-border p-4">
              <div className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider mb-2">
                Language
              </div>
              <div className="grid grid-cols-3 gap-2">
                {availableLangs.map((lang: any) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      handleSelectLang(lang.code);
                      setMobileOpen(false);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      selectedLang === lang.code
                        ? "border-primary bg-primary-light text-primary"
                        : "border-border text-foreground hover:bg-surface-2"
                    }`}
                  >
                    {lang.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Footer Contact */}
            <div className="mt-auto border-t border-border p-4 bg-surface-2">
              <div className="text-xs text-foreground-muted mb-1">
                Customer Support
              </div>
              <div className="text-sm font-bold text-foreground">
                {config?.content?.contact?.phone ||
                  config?.contact?.phone ||
                  "+91 9875095616"}
              </div>
              <div className="text-xs text-foreground-muted mt-0.5">
                {config?.content?.contact?.email ||
                  config?.contact?.email ||
                  "booking@gujjutours.com"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Login & Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        accentColor={primary}
        initialTab={authModalTab}
        onSuccess={(user) => {
          setCurrentUser(user);
          refreshUserAndCart();
        }}
      />

      {/* 5. Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        siteId={siteId}
        primaryColor={primary}
      />
    </div>
  );
}
