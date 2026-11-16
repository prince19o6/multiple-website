"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";
import type { SiteConfig } from "@/lib/config/siteConfigSchema";
import { useOptionalSite } from "@/lib/SiteContext";
import FloatingWhatsApp from "./navigation/FloatingWhatsApp";
import { ThemeToggle } from "./theme/ThemeToggle";

interface FooterProps {
  config?: MergedWebsiteConfig | SiteConfig | any;
  isSection?: boolean;
}

export default function Footer({ config, isSection }: FooterProps) {
  const [emailSub, setEmailSub] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const pathname = usePathname() || "";
  const siteDef = useOptionalSite();

  // Route & Homepage detection
  const pathParts = pathname.split("/").filter(Boolean);
  const isHomePage =
    pathParts.length === 0 ||
    (pathParts.length === 1 && ["en", "gu", "hi", "ar", "gujjutours", "tripgoasia", "technoheaven", "website1", "website2", "website3"].includes(pathParts[0])) ||
    (pathParts.length === 2 && ["gujjutours", "tripgoasia", "technoheaven", "website1", "website2", "website3"].includes(pathParts[0]) && ["en", "gu", "hi", "ar"].includes(pathParts[1]));

  // If this is the layout-level footer and the page is the homepage (which renders its own FooterSection), skip to avoid duplication
  if (!isSection && isHomePage) {
    return null;
  }

  // Tenant resolution
  const contextSiteId = siteDef?.siteId || "gujjutours";
  const siteId = config?.site?.id || config?.siteId || contextSiteId;
  const isTripGo = siteId === "tripgoasia" || siteId === "website2";
  const isTechno = siteId === "technoheaven" || siteId === "website3";

  const siteName =
    config?.site?.fullName ||
    config?.site?.name ||
    config?.name ||
    (isTripGo ? "TripGo Asia" : isTechno ? "Techno B2B" : "Gujju Tours");

  // Logo selection - prefer dark theme logo on the dark footer
  const logo =
    config?.assets?.logoDark ||
    config?.assets?.logoLight ||
    config?.assets?.logoUrl ||
    config?.logoLight ||
    config?.logoDark ||
    config?.logo;

  const currentYear = new Date().getFullYear();
  const copyright =
    config?.footerCopyright ||
    `© ${currentYear} ${siteName}. All Rights Reserved. Crafted for global travelers.`;

  // Default contact details per tenant
  const defaultPhone = isTripGo
    ? "+60 174969786"
    : isTechno
    ? "+971 42686884"
    : "+91 9875095616";

  const defaultEmail = isTripGo
    ? "support@tripgoasia.com"
    : isTechno
    ? "b2b@technoheaven.net"
    : "support@gujjutours.com";

  const defaultAddress = isTripGo
    ? "Level 28, Menara Ilham, Kuala Lumpur, Malaysia"
    : isTechno
    ? "Dubai Silicon Oasis, DDP, Building A1, Dubai, UAE"
    : "Sandhya Wad, Bilimora - Chikhli Rd, Gujarat 396321, India";

  const phone =
    config?.content?.contact?.phone ||
    config?.contact?.phone ||
    defaultPhone;
  const email =
    config?.content?.contact?.email ||
    config?.contact?.email ||
    defaultEmail;
  const address =
    config?.content?.contact?.address ||
    config?.contact?.address ||
    defaultAddress;

  const cleanPhone = phone.replace(/[^0-9+]/g, "");

  // Detect current language segment from URL
  const currentLang =
    pathParts[0] && (pathParts[0].length === 2 || pathParts[0] === "en" || pathParts[0] === "gu")
      ? pathParts[0]
      : "en";

  // URL normalization helper
  const resolveHref = (url: string) => {
    if (!url) return "#";
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("mailto:") ||
      url.startsWith("tel:")
    ) {
      return url;
    }
    if (url.startsWith(`/${currentLang}/`) || url === `/${currentLang}`) {
      return url;
    }
    if (url.startsWith("/admin")) {
      return url;
    }
    const clean = url.startsWith("/") ? url : `/${url}`;
    return `/${currentLang}${clean}`;
  };

  // Dynamic Footer Columns from Config
  const rawColumns: Array<{
    title: string;
    links: Array<{ label: string; href: string }>;
  }> = config?.navigation?.web?.footerColumns || [];

  // Column 1: Expeditions
  const colExpeditions =
    rawColumns[0]?.links?.length > 0
      ? [
          ...rawColumns[0].links,
          { label: "Goa Beach Escapes", href: "/tours?destination=Goa" },
          { label: "Kashmir Houseboats & Snow", href: "/tours?destination=Kashmir" },
          { label: "Kerala Backwaters & Hills", href: "/tours?destination=Kerala" },
        ]
      : [
          { label: "Dubai Desert Safari & BBQ", href: "/tours/dubai-desert-safari" },
          { label: "Abu Dhabi City & Grand Mosque", href: "/tours/abu-dhabi-city-tour" },
          { label: "Marina Luxury Dhow Cruise", href: "/tours/marina-dhow-cruise" },
          { label: "Goa Beach Holidays & Watersports", href: "/tours?destination=Goa" },
          { label: "Kashmir Valleys & Houseboats", href: "/tours?destination=Kashmir" },
          { label: "Thailand & Bali Getaways", href: "/tours?destination=Thailand" },
        ];

  // Column 2: Core Travel Modules
  const colModules = [
    { label: "Verified Hotels & Luxury Resorts", href: "/hotels" },
    { label: "Sightseeing Tours & Day Trips", href: "/tours" },
    { label: "Custom Holiday Packages", href: "/packages" },
    { label: "Domestic & International Flights", href: "/flights" },
    { label: "Seamless Airport & Cab Transfers", href: "/transfers" },
    { label: "Fast-Track Tourist Visas", href: "/visas" },
    { label: "Bespoke Multi-City Itinerary", href: "/buildpackage" },
  ];

  // Column 3: Corporate & MICE
  const colCorporate =
    rawColumns[1]?.links?.length > 0
      ? [
          ...rawColumns[1].links,
          { label: "Corporate Travel Desk", href: "/contact-us" },
          { label: "Affiliate & Partner Program", href: "/contact-us" },
        ]
      : [
          { label: "MICE & Corporate Offsites", href: "/contact-us" },
          { label: "Large Group Bookings", href: "/contact-us" },
          { label: "B2B Agent & Partner Portal", href: "/admin/login" },
          { label: "Corporate Concierge & Desk", href: "/contact-us" },
          { label: "Custom Event Charters", href: "/contact-us" },
        ];

  // Column 4: Guest Care & Trust
  const colLegal =
    rawColumns[2]?.links?.length > 0
      ? [
          { label: "Manage My Bookings", href: "/my-bookings" },
          ...rawColumns[2].links,
          { label: "Frequently Asked Questions", href: "/faq" },
          { label: "24/7 Help & Support", href: "/contact-us" },
        ]
      : [
          { label: "Manage My Bookings", href: "/my-bookings" },
          { label: "Instant E-Ticket & Voucher", href: "/my-bookings" },
          { label: "Cancellation & Refund Rules", href: "/termsandconditions" },
          { label: "Terms of Service", href: "/termsandconditions" },
          { label: "Privacy Policy", href: "/privacy-policy" },
          { label: "Cookie Policy", href: "/cookiepolicy" },
          { label: "24/7 Concierge Support", href: "/contact-us" },
        ];

  // Dynamic Social Links from Config
  const rawSocials: Array<{ platform: string; url: string }> =
    config?.navigation?.web?.socialLinks || [];

  const socialLinks =
    rawSocials.length > 0
      ? rawSocials
      : [
          { platform: "Facebook", url: "https://facebook.com/gujjutours" },
          { platform: "Instagram", url: "https://instagram.com/gujjutours" },
          { platform: "YouTube", url: "https://youtube.com/@gujjutours" },
          { platform: "Twitter", url: "https://x.com/gujjutours" },
          { platform: "LinkedIn", url: "https://linkedin.com/company/gujjutours" },
        ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailSub.trim()) {
      setSubscribed(true);
      setEmailSub("");
    }
  };

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-slate-50 dark:bg-[#090e1a] text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 font-sans mt-auto relative overflow-hidden transition-colors duration-200">
      {/* ───────────────────────────────────────────────────────────
          1. VALUE PROPOSITIONS & TRUST PILLARS BAR
      ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/60 shadow-xs hover:border-primary/50 transition-all group">
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-500 dark:text-primary-400 shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-slate-900 dark:text-white text-xs font-bold tracking-tight">Direct Wholesale Rates</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">Best price guarantee with zero hidden booking markups</p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/60 shadow-xs hover:border-emerald-500/50 transition-all group">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="text-slate-900 dark:text-white text-xs font-bold tracking-tight">Govt. Verified Agency</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">Ministry registered & IATA accredited travel operator</p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/60 shadow-xs hover:border-amber-500/50 transition-all group">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-slate-900 dark:text-white text-xs font-bold tracking-tight">24/7 Dedicated Concierge</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">Live assistance on WhatsApp, phone & priority dispatch</p>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/60 shadow-xs hover:border-sky-500/50 transition-all group">
              <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 dark:text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h4 className="text-slate-900 dark:text-white text-xs font-bold tracking-tight">100% Secure Checkout</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">256-bit SSL encrypted payments & instant e-vouchers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          2. VIP NEWSLETTER & SECRET DEALS STRIP
      ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-r from-slate-100 via-white to-slate-100 dark:from-slate-950 dark:via-[#0d1628] dark:to-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-sm dark:shadow-2xl relative overflow-hidden backdrop-blur-sm">
            {/* Subtle glow accent */}
            <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            {/* Left copy */}
            <div className="max-w-xl text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-primary/10 dark:bg-primary/15 text-primary-600 dark:text-primary-300 border border-primary/20 dark:border-primary/30 mb-3 tracking-wide">
                <span>✨</span> VIP TRAVEL CLUB
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                Unlock Secret Flash Sales & Flat 20% Off Your First Tour
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Join over 50,000+ smart travelers. Receive unadvertised flight price drops, member-only hotel rates, and custom vacation itinerary alerts.
              </p>
            </div>

            {/* Form */}
            <div className="w-full lg:w-auto shrink-0 flex flex-col items-center lg:items-end">
              <form
                onSubmit={handleSubscribe}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full max-w-md"
              >
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    required
                    value={emailSub}
                    onChange={(e) => setEmailSub(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-w-[240px]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 sm:py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md hover:shadow-primary/30 active:scale-95 whitespace-nowrap shrink-0"
                >
                  Claim 20% Off
                </button>
              </form>

              {subscribed && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2.5 flex items-center gap-1.5 animate-fadeIn">
                  <span>✓</span> Welcome to the VIP Club! Check your inbox for your 20% discount code.
                </p>
              )}

              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
                <span>🔒</span> Zero spam guarantee. Unsubscribe with one click anytime.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          3. MAIN BALANCED 5-COLUMN NAVIGATION GRID
      ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-8">
          {/* ──── Column 1: Brand & Contact Hub ──── */}
          <div className="space-y-4 lg:pr-2">
            <Link href={resolveHref("/")} className="inline-block group">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt={siteName}
                  className="h-10 sm:h-12 w-auto object-contain max-w-[210px] filter transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 flex items-center justify-center text-white font-black rounded-xl text-lg bg-primary shadow-lg">
                    {siteName.charAt(0)}
                  </div>
                  <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">
                    {siteName}
                  </span>
                </div>
              )}
            </Link>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Award-winning travel specialist offering custom holiday packages, luxury hotels, flight ticketing, private airport transfers, and tourist visas at direct transparent prices.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
              <span className="text-emerald-500">🛡️</span>
              <span>Govt. Reg. Tour Operator & IATA Verified</span>
            </div>

            {/* Direct Clickable Contact Cards */}
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
              <a
                href={`tel:${cleanPhone}`}
                className="flex items-start gap-2.5 group hover:text-primary transition-colors"
                title="Call 24/7 Concierge"
              >
                <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-primary group-hover:border-primary/50 transition-colors shrink-0 mt-0.5 shadow-2xs">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-primary transition-colors flex items-center gap-1.5">
                    <span>{phone}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online 24/7" />
                  </div>
                  <span className="text-[10px] text-slate-500">Toll-Free • 24/7 Live Support</span>
                </div>
              </a>

              <a
                href={`mailto:${email}`}
                className="flex items-start gap-2.5 group hover:text-primary transition-colors"
                title="Email Support Desk"
              >
                <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-primary group-hover:border-primary/50 transition-colors shrink-0 mt-0.5 shadow-2xs">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="truncate">
                  <span className="text-slate-800 dark:text-slate-300 group-hover:text-primary transition-colors truncate block">{email}</span>
                  <span className="text-[10px] text-slate-500">Official Inquiries & Booking Help</span>
                </div>
              </a>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 mt-0.5 shadow-2xs">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-slate-600 dark:text-slate-400 leading-snug">{address}</span>
              </div>
            </div>
          </div>

          {/* ──── Column 2: Popular Expeditions ──── */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Popular Expeditions</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              {colExpeditions.map((link) => (
                <li key={link.label}>
                  <Link
                    href={resolveHref(link.href)}
                    className="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5 group"
                  >
                    <span className="text-slate-400 dark:text-slate-600 group-hover:text-primary transition-colors text-[10px]">›</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ──── Column 3: Travel Modules & Services ──── */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Travel Services</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              {colModules.map((link) => (
                <li key={link.label}>
                  <Link
                    href={resolveHref(link.href)}
                    className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5 group"
                  >
                    <span className="text-slate-400 dark:text-slate-600 group-hover:text-emerald-500 transition-colors text-[10px]">›</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ──── Column 4: Corporate & MICE ──── */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Corporate & MICE</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              {colCorporate.map((link) => (
                <li key={link.label}>
                  <Link
                    href={resolveHref(link.href)}
                    className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5 group"
                  >
                    <span className="text-slate-400 dark:text-slate-600 group-hover:text-amber-500 transition-colors text-[10px]">›</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ──── Column 5: Guest Care & Trust ──── */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              <span>Guest Care & Legal</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              {colLegal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={resolveHref(link.href)}
                    className="text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5 group"
                  >
                    <span className="text-slate-400 dark:text-slate-600 group-hover:text-sky-500 transition-colors text-[10px]">›</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          4. PAYMENT METHODS & TRUST ACCREDITATION BAR
      ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/80 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Payment Badges */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-2">
              Supported Payments:
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
              VISA
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
              Mastercard
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
              American Express
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
              RuPay / UPI
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
              NetBanking
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
              Apple Pay
            </span>
          </div>

          {/* Security seals */}
          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 text-[11px]">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>256-Bit SSL Encrypted</span>
            </div>
            <div className="h-3 w-px bg-slate-300 dark:bg-slate-800" />
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>PCI-DSS Level 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          5. SUB-FOOTER / SOCIAL ICONS & COPYRIGHT
      ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-slate-200 dark:border-slate-800/90 bg-slate-100 dark:bg-[#060a12] py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright & registration */}
          <div className="text-center md:text-left">
            <p className="text-slate-700 dark:text-slate-400 font-medium">{copyright}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Authorized Travel Organizer • Secure & Verified Bookings Worldwide.
            </p>
          </div>

          {/* Social Icons with authentic SVGs */}
          <div className="flex items-center gap-2">
            {socialLinks.map((s) => {
              const p = s.platform.toLowerCase();
              return (
                <a
                  key={s.platform}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.platform}
                  className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary hover:bg-primary text-slate-600 dark:text-slate-400 hover:text-white transition-all duration-200 flex items-center justify-center shadow-2xs hover:scale-110 active:scale-95"
                  title={s.platform}
                >
                  {p.includes("facebook") && (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                  {p.includes("instagram") && (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  )}
                  {p.includes("youtube") && (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  )}
                  {(p.includes("twitter") || p.includes("x")) && (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  )}
                  {p.includes("linkedin") && (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  )}
                </a>
              );
            })}
          </div>

          {/* Right actions: ThemeToggle + Back to top */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Theme:</span>
              <ThemeToggle className="w-7 h-7" />
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1.5 text-xs group shadow-2xs"
              title="Back to top"
            >
              <svg className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="hidden sm:inline text-[11px] font-medium">Top</span>
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          6. FLOATING WHATSAPP SUPPORT CONCIERGE
      ─────────────────────────────────────────────────────────── */}
      <FloatingWhatsApp config={config} phone={phone} siteName={siteName} />
    </footer>
  );
}
