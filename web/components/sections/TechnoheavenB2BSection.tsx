"use client";

import React, { useState } from "react";
import Link from "next/link";

interface TechnoheavenB2BSectionProps {
  onLoginSuccess?: (agent: any) => void;
}

export default function TechnoheavenB2BSection({ onLoginSuccess }: TechnoheavenB2BSectionProps) {
  const [agentCode, setAgentCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [agentMarkup, setAgentMarkup] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsLoggedIn(true);
      if (onLoginSuccess) {
        onLoginSuccess({
          agentCode: agentCode || "TH-AG-782",
          email: email || "agent@technoheaven.com",
          agencyName: "Global Travel Partners LLC",
          creditLimit: 50000,
          currency: "USD"
        });
      }
    }, 600);
  };

  return (
    <div className="relative min-h-[85vh] w-full flex items-center justify-center bg-neutral-950 overflow-hidden">
      {/* Background Desert / Camel Sunset Backdrop */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://d3bfv5x1dw8ekm.cloudfront.net/next-js-chunks/prod/v125/_next/static/media/cemalimage.2_54ymrda8upw.webp"
        alt="Technoheaven Travel Marketplace"
        className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/85" />

      <div className="relative z-10 max-w-6xl w-full mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Headline and Portal Info */}
        <div className="lg:col-span-7 text-white space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00aacf]/20 border border-[#00aacf]/40 text-[#00aacf] text-xs font-bold uppercase tracking-wider">
            <span>🛡️</span>
            <span>B2B Travel Partner Gateway</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Your global marketplace for unforgettable travel experiences.
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 max-w-lg leading-relaxed">
            Exclusive net-rate inventory across 50,000+ verified hotels, private airport transfers, curated holiday packages, and attraction vouchers for registered travel agencies.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 text-neutral-300">
            <div>
              <div className="text-2xl font-black text-white">50K+</div>
              <div className="text-xs text-neutral-400">Direct Hotel Contracts</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">120+</div>
              <div className="text-xs text-neutral-400">Countries Covered</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">24/7</div>
              <div className="text-xs text-neutral-400">B2B Helpdesk</div>
            </div>
          </div>
        </div>

        {/* Right Column: Agent Sign In or Agent Dashboard */}
        <div className="lg:col-span-5">
          {!isLoggedIn ? (
            <div className="bg-white rounded-2xl p-7 sm:p-8 shadow-2xl border border-neutral-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-neutral-900">Agent Sign In</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Enter your verified partner credentials</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#00aacf]/10 flex items-center justify-center text-[#00aacf] font-bold">
                  B2B
                </div>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Agent Code
                  </label>
                  <input
                    type="text"
                    required
                    value={agentCode}
                    onChange={(e) => setAgentCode(e.target.value)}
                    placeholder="Enter Agent Code (e.g. TH-002)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aacf] text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Agency Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aacf] text-neutral-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Password
                    </label>
                    <Link href="/en/agent/forgot-password" className="text-xs font-semibold text-[#00aacf] hover:underline">
                      Forgot Password?
                    </Link>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#00aacf] text-neutral-900"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-neutral-300 text-[#00aacf] focus:ring-[#00aacf]"
                  />
                  <label htmlFor="remember" className="text-xs text-neutral-600">
                    Keep me signed in on this device
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#00aacf] hover:bg-[#0092b3] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? "Authenticating..." : "Sign In to B2B Portal"}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-neutral-100 text-center">
                <span className="text-xs text-neutral-500">Don’t have an agent account? </span>
                <Link href="/en/agent/register" className="text-xs font-bold text-[#00aacf] hover:underline">
                  Become an Agent / Join Now!
                </Link>
              </div>
            </div>
          ) : (
            /* Authenticated Agent Dashboard */
            <div className="bg-white rounded-2xl p-7 shadow-2xl border border-neutral-100 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div>
                  <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Agent Session Active
                  </div>
                  <h3 className="text-lg font-black text-neutral-900 mt-0.5">
                    {agentCode || "TH-AG-782"} — Global Travel
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLoggedIn(false)}
                  className="text-xs font-semibold text-neutral-500 hover:text-neutral-800"
                >
                  Sign Out
                </button>
              </div>

              {/* Wallet and Credit Widget */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-neutral-500 font-semibold uppercase">Credit Limit / Balance</div>
                  <div className="text-xl font-black text-neutral-900">$50,000.00 USD</div>
                </div>
                <div className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
                  Post-Paid
                </div>
              </div>

              {/* Commission / Markup Control */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  B2B Price Markup (% added to Net Rate)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={agentMarkup}
                    onChange={(e) => setAgentMarkup(parseInt(e.target.value, 10))}
                    className="flex-1 accent-[#00aacf]"
                  />
                  <span className="w-12 text-center text-sm font-extrabold text-neutral-900 px-2 py-1 bg-neutral-100 rounded-md">
                    +{agentMarkup}%
                  </span>
                </div>
              </div>

              {/* Fast Inventory Search */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Search Net Hotel & Activity Rates
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="City, Hotel or Activity..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900"
                  />
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-[#00aacf] text-white text-xs font-bold hover:bg-[#0092b3]"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

