"use client";

import React, { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";

interface InsurancePlan {
  id: string;
  name: string;
  medicalCoverage: string;
  baggageLoss: string;
  tripCancellation: string;
  pricePerDay: number;
  schengenCompliant: boolean;
  popular?: boolean;
}

const PLANS: InsurancePlan[] = [
  {
    id: "schengen-standard",
    name: "Schengen & Asia Essential",
    medicalCoverage: "€30,000 / $50,000",
    baggageLoss: "Up to $750",
    tripCancellation: "Up to $1,000",
    pricePerDay: 85,
    schengenCompliant: true,
  },
  {
    id: "gold-worldwide",
    name: "Gold Worldwide Comprehensive",
    medicalCoverage: "$250,000",
    baggageLoss: "Up to $1,500",
    tripCancellation: "Up to $2,500",
    pricePerDay: 145,
    schengenCompliant: true,
    popular: true,
  },
  {
    id: "platinum-family",
    name: "Platinum Elite Family Cover",
    medicalCoverage: "$500,000",
    baggageLoss: "Up to $3,000",
    tripCancellation: "Up to $5,000",
    pricePerDay: 220,
    schengenCompliant: true,
  },
];

export default function TravelInsurancePage() {
  const config = useSiteConfig();
  const site = useSite();

  if (config.features && config.features.insurance === false) {
    notFound();
  }
  const brandName = config.name || "Gujju Tours";
  const currencySymbol = config.currencySymbol || "₹";

  const [selectedPlan, setSelectedPlan] = useState<string>("gold-worldwide");
  const [tripDays, setTripDays] = useState<number>(7);
  const [destinationRegion, setDestinationRegion] = useState<string>("Schengen / Europe");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    travelersCount: 2,
    passportNumber: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePlanObj = PLANS.find((p) => p.id === selectedPlan) || PLANS[1];
  const estimatedCost = activePlanObj.pricePerDay * tripDays * form.travelersCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: site.siteId,
          bookingType: "INSURANCE_REQUEST",
          serviceCode: "INSURANCE",
          title: `Travel Insurance: ${activePlanObj.name} (${destinationRegion})`,
          guestName: form.name,
          email: form.email,
          phone: form.phone,
          passengers: form.travelersCount,
          totalPrice: estimatedCost,
          currency: currencySymbol,
          status: "pending_quotation",
          specialRequests: JSON.stringify({
            planId: activePlanObj.id,
            planName: activePlanObj.name,
            tripDays,
            destinationRegion,
            travelersCount: form.travelersCount,
            passportNumber: form.passportNumber,
          }),
        }),
      });

      if (!res.ok) {
        throw new Error("Unable to submit insurance request");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Error submitting travel insurance request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 py-12 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <Link href="/en" className="hover:text-primary-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-neutral-800 dark:text-neutral-200 font-semibold">
            International Travel Insurance
          </span>
        </nav>

        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-primary-100 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider">
            100% Cashless Medical Hospitalization
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
            Comprehensive International Travel Insurance
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Schengen visa compliant policies covering emergency hospital care, trip cancellation, flight delay, and lost baggage with zero deductions by {brandName}.
          </p>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`rounded-3xl p-6 sm:p-8 cursor-pointer transition-all border-2 flex flex-col justify-between relative ${
                selectedPlan === plan.id
                  ? "border-primary-500 bg-white dark:bg-neutral-900 shadow-xl ring-2 ring-primary-500/20"
                  : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-sm hover:border-neutral-300"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary-600 text-white text-[10px] font-black uppercase tracking-wider shadow">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                    {plan.name}
                  </h3>
                  {plan.schengenCompliant && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Schengen Ready
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-neutral-400">Emergency Medical:</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{plan.medicalCoverage}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-neutral-400">Baggage Loss:</span>
                    <span className="font-semibold">{plan.baggageLoss}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-neutral-400">Trip Cancellation:</span>
                    <span className="font-semibold">{plan.tripCancellation}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-400">COVID-19 Hospitalization:</span>
                    <span className="font-semibold text-emerald-600">Included</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 mt-6 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 block">Rate per day</span>
                  <span className="text-2xl font-black text-neutral-900 dark:text-white">
                    {currencySymbol}{plan.pricePerDay}
                  </span>
                  <span className="text-[10px] text-neutral-400"> / person</span>
                </div>
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === plan.id ? "border-primary-600 bg-primary-600 text-white text-xs font-bold" : "border-neutral-300 dark:border-neutral-700"}`}>
                  {selectedPlan === plan.id && "✓"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quote Calculator & Application Form */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-10 border border-neutral-200 dark:border-neutral-800 shadow-xl max-w-3xl mx-auto">
          <h2 className="text-xl font-bold mb-2">Get Instant Insurance Policy Quote</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
            Instant digital policy PDF issued and emailed within 15 minutes.
          </p>

          {submitted ? (
            <div className="p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
              <span className="text-4xl block">🛡️</span>
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                Insurance Quotation Request Received!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-sm mx-auto">
                Our insurance issuing officer is generating your customized premium policy summary and will send the official PDF directly to your email and WhatsApp.
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  Request Another Policy
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Destination Region
                  </label>
                  <select
                    value={destinationRegion}
                    onChange={(e) => setDestinationRegion(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-primary-500 font-bold"
                  >
                    <option value="Schengen / Europe">Schengen / Europe (Visa Mandatory)</option>
                    <option value="UAE & Middle East">UAE / Dubai &amp; Middle East</option>
                    <option value="South East Asia (Bali, Thailand, Singapore)">South East Asia (Bali, Thailand, Singapore)</option>
                    <option value="USA & Canada">USA &amp; Canada</option>
                    <option value="Worldwide Excluding USA/Canada">Worldwide Excluding USA/Canada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Trip Duration (Days)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={180}
                    value={tripDays}
                    onChange={(e) => setTripDays(Number(e.target.value))}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-primary-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Primary Traveler Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full Name as per Passport"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    WhatsApp Phone *
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="name@example.com"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Total Insured Travelers
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={form.travelersCount}
                    onChange={(e) => setForm({ ...form, travelersCount: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-primary-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Passport Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.passportNumber}
                    onChange={(e) => setForm({ ...form, passportNumber: e.target.value })}
                    placeholder="e.g. Z1234567"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-primary-500 uppercase font-mono"
                  />
                </div>
              </div>

              {/* Estimated Premium Total */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Estimated Total Premium ({form.travelersCount} Travelers × {tripDays} Days):
                  </span>
                  <div className="text-2xl font-black text-primary-600 dark:text-primary-400">
                    {currencySymbol}{estimatedCost.toLocaleString()}
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-md">
                  Tax &amp; GST Included
                </span>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-colors"
              >
                {submitting ? "Issuing Quotation..." : "Get Instant Insurance Policy Quote 🛡️"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
