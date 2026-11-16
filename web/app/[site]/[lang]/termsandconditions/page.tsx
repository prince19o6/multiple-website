"use client";

import React from "react";
import Link from "next/link";
import { useSiteConfig } from "@/lib/SiteConfigContext";

export default function TermsAndConditionsPage() {
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
            Terms and Conditions
          </span>
        </nav>

        {/* Header */}
        <div className="space-y-2 border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Last Updated: January 2026 · Governing booking agreements with {brandName}
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-10 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-8 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or booking travel services through {brandName} (including websites, mobile applications, and customer support channels), you acknowledge having read, understood, and agreed to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              2. Booking &amp; Reservation Policies
            </h2>
            <p>
              All bookings are subject to availability and formal confirmation by {brandName}. Once a booking confirmation voucher is issued, it constitutes a binding contract between the traveler and {brandName}.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600 dark:text-neutral-400">
              <li>Guests must provide accurate passenger names as shown on official government passports/IDs.</li>
              <li>{brandName} is not liable for denied boarding or hotel check-in refusal arising from inaccurate names or invalid identification provided by travelers.</li>
              <li>Special dietary requests (such as Jain, Pure Vegetarian, Halal, or Gluten-Free) must be communicated during booking and will be reconfirmed with providers.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              3. Pricing, Taxes &amp; Currency
            </h2>
            <p>
              All prices quoted on the platform are in the designated tenant currency and inclusive of applicable government value added taxes (VAT/GST) unless specifically indicated otherwise. Tourist city taxes (such as Tourism Dirham in Dubai or City Tax in European cities) are regulated by municipal authorities and must be settled directly with hotels at check-in.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              4. Cancellations, Modifications &amp; Refunds
            </h2>
            <p>
              Cancellation and modification fees depend on specific service tiers and partner conditions:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600 dark:text-neutral-400">
              <li><strong>Day Tours &amp; Excursions:</strong> Cancellations made at least 24 hours prior to the scheduled pickup time are eligible for a 100% refund.</li>
              <li><strong>Custom Packages &amp; Multi-Day Itineraries:</strong> Non-refundable flight sectors, peak season hotel commitments, and processed visas cannot be refunded once issued.</li>
              <li>Approved refunds will be processed back to the original mode of payment within 5 to 7 business banking days.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              5. Passports, Visas &amp; Health Regulations
            </h2>
            <p>
              It is the primary responsibility of the traveler to ensure that their passport possesses at least 6 months validity from the scheduled date of return, and that they obtain all required transit, entry, and tourist visas. {brandName} provides document assistance and submission guidance but cannot guarantee visa approval, which remains the sole prerogative of the respective sovereign immigration authorities.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              6. Limitation of Liability
            </h2>
            <p>
              {brandName} acts as an intermediary travel organizer. We are not liable for delays, losses, accidents, flight cancellations, or modifications resulting from weather events, mechanical breakdowns, acts of God (force majeure), strikes, civil unrest, or sovereign government directives. We strongly advise all travelers to purchase comprehensive travel insurance.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
