"use client";

import React from "react";
import Link from "next/link";
import { useSiteConfig } from "@/lib/SiteConfigContext";

export default function AboutUsPage() {
  const config = useSiteConfig();
  const brandName = config.name || "Gujju Tours";

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 py-12 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <Link href="/en" className="hover:text-primary-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-neutral-800 dark:text-neutral-200 font-semibold">
            About Us
          </span>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-3.5 py-1 rounded-full bg-primary-100 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider">
            Our Story &amp; Values
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
            Crafting Unforgettable Journeys with {brandName}
          </h1>
          <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            From humble beginnings in Gujarat to becoming a premier international travel brand, {brandName} has brought joy, discovery, and effortless travel to hundreds of thousands of holidaymakers worldwide.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { value: "250,000+", label: "Delighted Travelers", icon: "✈️" },
            { value: "45+", label: "Global Destinations", icon: "🌍" },
            { value: "15+ Years", label: "Industry Leadership", icon: "🏆" },
            { value: "4.9 / 5", label: "Trustpilot & Google Rating", icon: "⭐" },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="text-2xl block mb-2">{stat.icon}</span>
              <div className="text-2xl sm:text-3xl font-black text-primary-600 dark:text-primary-400">
                {stat.value}
              </div>
              <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mt-1 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Editorial Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white">
              Why Travelers Choose Us
            </h2>
            <p>
              We believe that vacations should be inspiring, not stressful. When you book with {brandName}, you are backed by our direct local supplier partnerships in Dubai, Singapore, Bali, Thailand, Europe, and India.
            </p>
            <p>
              Unlike generic aggregators, we operate on-ground logistics ourselves. We hold our own fleet of luxury vehicles, direct allotments in premier star hotels, licensed desert safari camps, and dedicated chefs for authentic Pure Vegetarian and Jain cuisine.
            </p>
            <p>
              Whether it is securing exclusive access to iconic landmarks, designing family reunions with special dietary care, or organizing smooth corporate MICE tours, our passion is your complete peace of mind.
            </p>
          </div>

          <div className="rounded-3xl overflow-hidden shadow-2xl relative h-80 sm:h-96 bg-neutral-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1000&q=80"
              alt="Travel Planning Team"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
              <span className="text-white text-sm font-bold">
                Direct Contracts · Zero Hidden Fees · Dedicated 24/7 Support
              </span>
            </div>
          </div>
        </div>

        {/* Four Core Pillars */}
        <div>
          <h2 className="text-2xl font-black text-center text-neutral-900 dark:text-white mb-8">
            Our Commitment to Excellence
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "💎",
                title: "Direct Supplier Rates",
                desc: "We negotiate directly with hotel chains and airlines so you never pay intermediary markups.",
              },
              {
                icon: "🥗",
                title: "Authentic Jain & Veg Meals",
                desc: "Never compromise your values. We guarantee pure vegetarian and Jain food options at every stage.",
              },
              {
                icon: "🛡️",
                title: "24/7 Concierge Support",
                desc: "A dedicated destination manager is available via WhatsApp and phone from arrival to departure.",
              },
              {
                icon: "✨",
                title: "Bespoke Customization",
                desc: "Every traveler is unique. Tailor your schedule, room category, and activities with complete flexibility.",
              },
            ].map((pillar, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2.5"
              >
                <span className="text-3xl block">{pillar.icon}</span>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {pillar.title}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="rounded-3xl bg-primary-600 text-white p-8 sm:p-12 text-center space-y-4 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-black">
            Ready to Plan Your Next Journey?
          </h2>
          <p className="text-sm max-w-xl mx-auto opacity-90">
            Speak directly with our destination travel consultants or design your custom holiday package online in minutes.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 justify-center">
            <Link
              href="/en/buildpackage"
              className="px-6 py-3 rounded-xl bg-white text-primary-600 font-extrabold text-xs shadow-md hover:bg-neutral-100 transition-colors"
            >
              Build Custom Package
            </Link>
            <Link
              href="/en/contact-us"
              className="px-6 py-3 rounded-xl border border-white text-white font-extrabold text-xs hover:bg-white/10 transition-colors"
            >
              Contact Travel Desk
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
