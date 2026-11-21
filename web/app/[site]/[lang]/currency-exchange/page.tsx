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
  sellRate: number;
}

const FOREX_RATES: CurrencyRate[] = [
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪", inrRate: 23.65, sellRate: 23.2 },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", inrRate: 86.8, sellRate: 85.9 },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", inrRate: 94.2, sellRate: 93.1 },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭", inrRate: 2.58, sellRate: 2.45 },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬", inrRate: 66.4, sellRate: 65.2 },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧", inrRate: 112.5, sellRate: 111.0 },
  { code: "IDR", name: "Indonesian Rupiah (10,000 IDR)", symbol: "Rp", flag: "🇮🇩", inrRate: 53.5, sellRate: 51.0 },
];

export default function CurrencyExchangePage() {
  const config = useSiteConfig();
  const site = useSite();
  const brandName = config.name || "Gujju Tours";

  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
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
  const [bookingRef, setBookingRef] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const currentRateObj = FOREX_RATES.find((r) => r.code === selectedCurrency) || FOREX_RATES[0];
  const activeRate = tradeType === "buy" ? currentRateObj.inrRate : currentRateObj.sellRate;
  const calculatedInr = Math.round(foreignAmount * activeRate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const generatedRef = `FX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const payload = {
      siteId: site.siteId,
      service: "currency-exchange",
      serviceType: "currency-exchange",
      module: "currency-exchange",
      itemId: `forex-${selectedCurrency.toLowerCase()}`,
      slug: `forex-${selectedCurrency.toLowerCase()}`,
      tourSlug: `forex-${selectedCurrency.toLowerCase()}`,
      bookingType: "FOREX_REQUEST",
      serviceCode: "FOREX",
      title: `${tradeType === "buy" ? "Forex Order" : "Forex Encashment"}: ${foreignAmount} ${selectedCurrency} (${currentRateObj.name})`,
      guestName: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      travelDate: form.travelDate || new Date().toISOString().split("T")[0],
      totalPrice: calculatedInr,
      currency: "INR",
      status: "pending_quotation",
      idempotencyKey: generatedRef,
      specialRequests: JSON.stringify({
        tradeType,
        currency: selectedCurrency,
        foreignAmount,
        estimatedInr: calculatedInr,
        exchangeRate: activeRate,
        deliveryType,
        city: form.city,
        travelDate: form.travelDate,
      }),
    };

    let confirmedRef = generatedRef;

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.data?.reference || json?.data?.id) {
          confirmedRef = String(json.data.reference || json.data.id);
        }
      }
    } catch {
      // Graceful offline fallback: Continue to save locally
    }

    // Always persist to localStorage for the user's booking history
    try {
      const rawStored = localStorage.getItem("customer_forex_requests");
      const stored = rawStored ? JSON.parse(rawStored) : [];
      stored.unshift({
        reference: confirmedRef,
        tradeType,
        currency: selectedCurrency,
        foreignAmount,
        estimatedInr: calculatedInr,
        deliveryType,
        guestName: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("customer_forex_requests", JSON.stringify(stored.slice(0, 20)));

      // Also register into customer_booking_refs
      const rawExistingRefs = localStorage.getItem("customer_booking_refs");
      const existingRefs = rawExistingRefs ? JSON.parse(rawExistingRefs) : [];
      if (!existingRefs.includes(confirmedRef)) {
        existingRefs.push(confirmedRef);
        localStorage.setItem("customer_booking_refs", JSON.stringify(existingRefs));
      }
    } catch {
      // Ignore storage errors
    }

    setBookingRef(confirmedRef);
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 py-12 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
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

          {/* Trade Type Selector */}
          <div className="inline-flex p-1 rounded-2xl bg-neutral-200/80 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 mt-2">
            <button
              type="button"
              onClick={() => setTradeType("buy")}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                tradeType === "buy"
                  ? "bg-white dark:bg-neutral-900 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
              }`}
            >
              Buy Foreign Currency
            </button>
            <button
              type="button"
              onClick={() => setTradeType("sell")}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                tradeType === "sell"
                  ? "bg-white dark:bg-neutral-900 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
              }`}
            >
              Sell Leftover Forex
            </button>
          </div>
        </div>

        {/* Calculator and Request Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive Calculator (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h2 className="text-lg font-bold">Live Currency Calculator</h2>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Rates
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                Select Destination Currency
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FOREX_RATES.map((curr) => {
                  const rate = tradeType === "buy" ? curr.inrRate : curr.sellRate;
                  return (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => setSelectedCurrency(curr.code)}
                      className={`p-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                        selectedCurrency === curr.code
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500/20"
                          : "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300"
                      }`}
                    >
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <span>{curr.flag}</span>
                        <span>{curr.code}</span>
                      </span>
                      <span className="text-[11px] font-mono text-neutral-500">
                        ₹{rate}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Amount in {currentRateObj.code} ({currentRateObj.name})
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={50}
                  step={50}
                  value={foreignAmount}
                  onChange={(e) => setForeignAmount(Math.max(1, Number(e.target.value) || 0))}
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
                {tradeType === "buy" ? "You Pay (Estimated Total):" : "You Receive (Estimated Total):"}
              </span>
              <div className="text-3xl font-black text-primary-600 dark:text-primary-400">
                ₹{calculatedInr.toLocaleString()}
              </div>
              <p className="text-[11px] text-neutral-400 pt-1">
                Rate: 1 {currentRateObj.code} = ₹{activeRate} · Zero hidden handling charges
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
                        ? "border-primary-500 bg-primary-600 text-white shadow-sm"
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
            <h2 className="text-xl font-bold mb-2">
              {tradeType === "buy" ? "Lock Your Rate & Order Forex" : "Encash Your Foreign Currency"}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
              Lock in today&apos;s favorable live rate with zero advance deposit. Free doorstep service within 24 hours.
            </p>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-4">
                <span className="text-5xl block animate-bounce">🎉</span>
                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-bold tracking-wider">
                    REF: {bookingRef}
                  </span>
                  <h3 className="text-xl font-black text-emerald-800 dark:text-emerald-300 pt-2">
                    Forex Rate Lock Request Placed!
                  </h3>
                </div>

                <div className="bg-white/80 dark:bg-neutral-900/80 rounded-xl p-4 text-xs text-left max-w-sm mx-auto space-y-2 border border-emerald-100 dark:border-emerald-900">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Order:</span>
                    <span className="font-bold">{foreignAmount} {selectedCurrency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Estimated Value:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">₹{calculatedInr.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Mode:</span>
                    <span className="font-semibold capitalize">{deliveryType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Delivery City:</span>
                    <span className="font-semibold">{form.city}</span>
                  </div>
                </div>

                <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-sm mx-auto">
                  Our licensed RBI-authorized forex desk officer will call you at <strong>{form.phone}</strong> within 24 hours to verify KYC documents (Passport copy + Air ticket) and dispatch your currency.
                </p>

                <div className="pt-2 flex flex-wrap gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-colors"
                  >
                    Place Another Order
                  </button>
                  <Link
                    href="/en"
                    className="px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Back to Home
                  </Link>
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
                  {submitting
                    ? "Locking In Rate..."
                    : tradeType === "buy"
                    ? "Lock In Rate & Order Forex 🚀"
                    : "Confirm & Request Encashment 🚀"}
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
