"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";

interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  inrRate: number; // 1 unit in INR
}

const FOREX_RATES: CurrencyRate[] = [
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪", inrRate: 23.65 },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", inrRate: 86.8 },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", inrRate: 94.2 },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭", inrRate: 2.58 },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬", inrRate: 66.4 },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧", inrRate: 112.5 },
  { code: "IDR", name: "Indonesian Rupiah (10,000 IDR)", symbol: "Rp", flag: "🇮🇩", inrRate: 53.5 },
];

export default function CurrencyExchangePage() {
  const config = useSiteConfig();
  const site = useSite();
  const brandName = config.name || "Gujju Tours";

  const [selectedCurrency, setSelectedCurrency] = useState<string>("AED");
  const [foreignAmount, setForeignAmount] = useState<number>(2000);
  const [deliveryType, setDeliveryType] = useState<"card" | "cash" | "both">("both");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "Ahmedabad",
    travelDate: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentRateObj = FOREX_RATES.find((r) => r.code === selectedCurrency) || FOREX_RATES[0];
  const calculatedInr = Math.round(foreignAmount * currentRateObj.inrRate);

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
          bookingType: "FOREX_REQUEST",
          serviceCode: "FOREX",
          title: `Forex Request: ${foreignAmount} ${selectedCurrency}`,
          guestName: form.name,
          email: form.email,
          phone: form.phone,
          totalPrice: calculatedInr,
          currency: "INR",
          status: "pending_quotation",
          specialRequests: JSON.stringify({
            currency: selectedCurrency,
            foreignAmount,
            estimatedInr: calculatedInr,
            deliveryType,
            city: form.city,
            travelDate: form.travelDate,
          }),
        }),
      });

      if (!res.ok) {
        throw new Error("Unable to place Forex rate lock request");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Error submitting Forex request");
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
            Currency Exchange &amp; Multi-Currency Travel Cards
          </span>
        </nav>

        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-primary-100 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider">
            Best Exchange Rate Guarantee
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
            Foreign Exchange &amp; Forex Travel Cards
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Zero markup multi-currency cards and genuine foreign currency notes delivered directly to your doorstep before departure by {brandName}.
          </p>
        </div>

        {/* Calculator and Request Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive Calculator (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
            <h2 className="text-lg font-bold border-b border-neutral-100 dark:border-neutral-800 pb-3">
              Live Currency Calculator
            </h2>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                Select Destination Currency
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FOREX_RATES.map((curr) => (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => setSelectedCurrency(curr.code)}
                    className={`p-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                      selectedCurrency === curr.code
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500/20"
                        : "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <span>{curr.flag}</span>
                      <span>{curr.code}</span>
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500">
                      ₹{curr.inrRate}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Amount in {currentRateObj.code} ({currentRateObj.name})
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={100}
                  step={50}
                  value={foreignAmount}
                  onChange={(e) => setForeignAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-bold outline-none focus:border-primary-500"
                />
                <span className="absolute right-4 top-3 text-xs font-bold text-neutral-400">
                  {currentRateObj.code}
                </span>
              </div>
            </div>

            {/* Total Estimated INR Card */}
            <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 space-y-1">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                You Pay (INR Estimate):
              </span>
              <div className="text-3xl font-black text-primary-600 dark:text-primary-400">
                ₹{calculatedInr.toLocaleString()}
              </div>
              <p className="text-[11px] text-neutral-400 pt-1">
                Rate: 1 {currentRateObj.code} = ₹{currentRateObj.inrRate} · Zero hidden handling charges
              </p>
            </div>

            {/* Delivery Preference */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                Preferred Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "both", label: "Card + Cash" },
                  { id: "card", label: "Forex Card Only" },
                  { id: "cash", label: "Cash Notes Only" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setDeliveryType(mode.id as any)}
                    className={`p-2 rounded-xl text-center text-xs font-bold border transition-all ${
                      deliveryType === mode.id
                        ? "border-primary-500 bg-primary-600 text-white"
                        : "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 text-neutral-600 dark:text-neutral-300"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Booking / Doorstep Delivery Form (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-10 border border-neutral-200 dark:border-neutral-800 shadow-xl">
            <h2 className="text-xl font-bold mb-2">Lock Your Rate &amp; Order Forex</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
              Lock in today&apos;s favorable live rate with zero advance deposit. Free doorstep delivery within 24 hours.
            </p>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                <span className="text-4xl block">🎉</span>
                <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                  Forex Rate Lock Request Placed!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-sm mx-auto">
                  Our licensed RBI-authorized forex desk officer will call you to verify KYC documents (Passport copy + Air ticket) and dispatch your currency.
                </p>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                  >
                    Calculate Another Currency
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Full Name (as per Passport) *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Ramesh Shah"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      WhatsApp / Mobile Number *
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="ramesh@example.com"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Delivery City
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="e.g. Ahmedabad, Surat, Mumbai"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Approximate Departure Date
                  </label>
                  <input
                    type="date"
                    value={form.travelDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setForm({ ...form, travelDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-primary-500"
                  />
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
                  {submitting ? "Locking In Rate..." : "Lock In Rate & Order Forex 🚀"}
                </button>

                <p className="text-[11px] text-neutral-400 text-center pt-1">
                  🔒 RBI Licensed Authorized Dealer Category II Partner · Authentic Clean Notes Guaranteed
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
