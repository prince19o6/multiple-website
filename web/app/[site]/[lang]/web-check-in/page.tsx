"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSiteConfig } from "@/lib/SiteConfigContext";

interface AirlineCheckin {
  name: string;
  code: string;
  logoText: string;
  checkInOpens: string;
  checkInCloses: string;
  officialUrl: string;
  baggagePolicy: string;
}

const AIRLINES: AirlineCheckin[] = [
  {
    name: "IndiGo",
    code: "6E",
    logoText: "6E",
    checkInOpens: "48 hours before departure",
    checkInCloses: "60 minutes before departure",
    officialUrl: "https://www.goindigo.in/web-check-in.html",
    baggagePolicy: "15 kg Check-in (Domestic) / 7 kg Cabin",
  },
  {
    name: "Air India",
    code: "AI",
    logoText: "AI",
    checkInOpens: "48 hours before departure",
    checkInCloses: "2 hours before departure",
    officialUrl: "https://www.airindia.com/in/en/manage/web-checkin.html",
    baggagePolicy: "25-30 kg Check-in / 7 kg Cabin",
  },
  {
    name: "Emirates",
    code: "EK",
    logoText: "EK",
    checkInOpens: "48 hours before departure",
    checkInCloses: "90 minutes before departure",
    officialUrl: "https://www.emirates.com/in/english/manage-booking/online-check-in/",
    baggagePolicy: "25-35 kg Check-in / 7 kg Cabin",
  },
  {
    name: "Air Arabia",
    code: "G9",
    logoText: "G9",
    checkInOpens: "36 hours before departure",
    checkInCloses: "60 minutes before departure",
    officialUrl: "https://www.airarabia.com/en/check-in-online",
    baggagePolicy: "Pre-booked Baggage / 10 kg Cabin",
  },
  {
    name: "Flydubai",
    code: "FZ",
    logoText: "FZ",
    checkInOpens: "48 hours before departure",
    checkInCloses: "90 minutes before departure",
    officialUrl: "https://www.flydubai.com/en/check-in/online-check-in",
    baggagePolicy: "20-30 kg Check-in / 7 kg Cabin",
  },
  {
    name: "Singapore Airlines",
    code: "SQ",
    logoText: "SQ",
    checkInOpens: "48 hours before departure",
    checkInCloses: "90 minutes before departure",
    officialUrl: "https://www.singaporeair.com/en_UK/in/plan-travel/checkin/",
    baggagePolicy: "30 kg Check-in / 7 kg Cabin",
  },
  {
    name: "SpiceJet",
    code: "SG",
    logoText: "SG",
    checkInOpens: "48 hours before departure",
    checkInCloses: "60 minutes before departure",
    officialUrl: "https://www.spicejet.com/webcheckin",
    baggagePolicy: "15 kg Check-in / 7 kg Cabin",
  },
  {
    name: "Qatar Airways",
    code: "QR",
    logoText: "QR",
    checkInOpens: "48 hours before departure",
    checkInCloses: "90 minutes before departure",
    officialUrl: "https://www.qatarairways.com/en-in/services-checking-in.html",
    baggagePolicy: "30-35 kg Check-in / 7 kg Cabin",
  },
];

export default function WebCheckInPage() {
  const config = useSiteConfig();
  const brandName = config.name || "Gujju Tours";

  const [query, setQuery] = useState("");

  const filtered = AIRLINES.filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 py-12 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <Link href="/en" className="hover:text-primary-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-neutral-800 dark:text-neutral-200 font-semibold">
            Online Airline Web Check-In
          </span>
        </nav>

        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-primary-100 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider">
            Traveler Tools
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
            Airline Web Check-In Portal
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Skip the airport lines. Direct check-in links and window opening times curated for {brandName} travelers.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search airline name or IATA code (e.g. IndiGo, 6E, Emirates)..."
            className="w-full px-4 py-3 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs outline-none focus:border-primary-500 shadow-sm"
          />
        </div>

        {/* Airlines Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((airline) => (
            <div
              key={airline.code}
              className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 font-black flex items-center justify-center text-sm border border-primary-200 dark:border-primary-800">
                    {airline.logoText}
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    {airline.code}
                  </span>
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {airline.name}
                </h3>
                <div className="mt-3 space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                  <p>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">Opens:</span>{" "}
                    {airline.checkInOpens}
                  </p>
                  <p>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">Closes:</span>{" "}
                    {airline.checkInCloses}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    🧳 {airline.baggagePolicy}
                  </p>
                </div>
              </div>

              <a
                href={airline.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block py-2.5 text-center rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-sm transition-colors"
              >
                Proceed to Web Check-in ↗
              </a>
            </div>
          ))}
        </div>

        {/* Important Tips Alert */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-3xl p-6 text-xs text-amber-900 dark:text-amber-200 space-y-2">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <span>💡</span> Important Check-In Guidelines
          </h3>
          <ul className="list-disc pl-5 space-y-1 leading-relaxed">
            <li>Have your 6-character PNR / Booking Reference and passenger last name ready.</li>
            <li>For international flights, ensure your passport details match your airline reservation exactly.</li>
            <li>Boarding gates close strictly 25 minutes prior to scheduled departure time.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
