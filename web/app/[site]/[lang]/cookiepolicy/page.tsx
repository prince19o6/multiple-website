"use client";

import React from "react";
import Link from "next/link";
import { useSiteConfig } from "@/lib/SiteConfigContext";

export default function CookiePolicyPage() {
  const config = useSiteConfig();
  const brandName = config.name || "Gujju Tours";

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 py-12 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <Link href="/en" className="hover:text-primary-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-neutral-800 dark:text-neutral-200 font-semibold">
            Cookie Policy
          </span>
        </nav>

        {/* Header */}
        <div className="space-y-2 border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
            Cookie Policy
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Last Updated: January 2026 · Understanding how {brandName} uses cookies and tracking technologies
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-10 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-8 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small text files placed on your computer, tablet, or smartphone when you visit a website. They allow the website to recognize your browser, remember your language preferences, currency choices, and keep you securely logged into your booking portal across browsing sessions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              2. Categories of Cookies We Use
            </h2>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                <span className="font-bold text-neutral-900 dark:text-white block mb-1">
                  1. Essential &amp; Functional Cookies (Strictly Necessary)
                </span>
                <p className="text-neutral-600 dark:text-neutral-400">
                  These cookies are vital for the proper operation of the website, such as managing your shopping cart, preserving selected hotel room rates during checkout, and maintaining authenticated session states. You cannot disable these cookies without breaking core site functionality.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                <span className="font-bold text-neutral-900 dark:text-white block mb-1">
                  2. Performance &amp; Analytics Cookies
                </span>
                <p className="text-neutral-600 dark:text-neutral-400">
                  These cookies gather anonymous aggregated metrics on how visitors navigate through our platform (e.g. popular search terms, error pages, and average page load speeds) to help us refine and improve our services.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                <span className="font-bold text-neutral-900 dark:text-white block mb-1">
                  3. Personalization &amp; Preference Cookies
                </span>
                <p className="text-neutral-600 dark:text-neutral-400">
                  These cookies store your customized preferences such as dark mode toggle, recent destination searches, and regional currency settings so you don&apos;t have to reconfigure them on every visit.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              3. Managing Your Cookie Preferences
            </h2>
            <p>
              Most web browsers (Google Chrome, Apple Safari, Mozilla Firefox, Microsoft Edge) allow you to control or block cookies through their system settings. Please note that if you choose to reject or disable cookies, certain interactive tools (such as recent search history and instant checkout) may not function as intended.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
