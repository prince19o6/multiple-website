"use client";

import React from "react";
import Link from "next/link";
import { useSiteConfig } from "@/lib/SiteConfigContext";

export default function PrivacyPolicyPage() {
  const config = useSiteConfig();
  const brandName = config.name || "Gujju Tours";
  const contactEmail = config.contact?.email || "privacy@gujjutours.com";

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
            Privacy Policy
          </span>
        </nav>

        {/* Header */}
        <div className="space-y-2 border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Last Updated: January 2026 · Your personal information privacy at {brandName}
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-10 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-8 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              1. Information We Collect
            </h2>
            <p>
              When you use {brandName} to search, inquire, or book travel packages, we collect the necessary personal data to process your reservations safely:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600 dark:text-neutral-400">
              <li><strong>Contact Information:</strong> Full name, email address, mobile/WhatsApp telephone number, and residential mailing address.</li>
              <li><strong>Travel Documents:</strong> Passport numbers, nationality, date of birth, and visa details required by airlines and immigration agencies.</li>
              <li><strong>Payment Information:</strong> Card tokenizations, UPI handles, and transaction identifiers. We do not store full CVV codes on our servers.</li>
              <li><strong>Technical Identifiers:</strong> IP addresses, browser fingerprint, device operating system, and cookie identifiers to enhance session security.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              2. How We Use Your Data
            </h2>
            <p>
              We process your personal information strictly for legitimate commercial and travel operational reasons:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600 dark:text-neutral-400">
              <li>Issuing confirmed flight e-tickets, hotel booking vouchers, and attraction entrance passes.</li>
              <li>Dispatching critical itinerary updates, flight gate changes, and tour pickup notifications via SMS or WhatsApp.</li>
              <li>Providing dedicated on-trip concierge assistance and emergency consular coordination.</li>
              <li>Detecting and preventing fraudulent payment transactions.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              3. Data Sharing with Third-Party Providers
            </h2>
            <p>
              In order to fulfill your travel bookings, your relevant personal data is shared exclusively with verified suppliers involved in your itinerary (e.g. airlines, hotels, licensed transfer fleets, local excursion operators, and consular visa processing bureaus). We never sell or lease your personal information to unauthorized third-party advertising brokers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              4. Data Retention &amp; Security Standards
            </h2>
            <p>
              We enforce modern industry security safeguards including TLS 1.3 cryptographic transport, hashed databases, role-based administrative access, and regular vulnerability audits. Your personal data is retained only for the duration required by legal, taxation, and regulatory reporting mandates.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              5. Your Privacy Rights &amp; Contact Desk
            </h2>
            <p>
              You possess the right to access, rectify, or request the erasure of your personal data stored with {brandName}. To submit a data request or question regarding this policy, please reach out directly to our Data Privacy Officer at{" "}
              <a href={`mailto:${contactEmail}`} className="text-primary-600 font-bold hover:underline">
                {contactEmail}
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
