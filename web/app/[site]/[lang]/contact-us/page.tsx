"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";

export default function ContactUsPage() {
  const config = useSiteConfig();
  const site = useSite();

  const brandName = config.name || "Gujju Tours";
  const phone = config.contact?.phone || "+91 9875095616";
  const email = config.contact?.email || "booking@gujjutours.com";
  const address = config.contact?.address || "Navsari District, Gujarat, India";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Trip Inquiry",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          bookingType: "GENERAL_INQUIRY",
          serviceCode: "CONTACT",
          title: `Contact Inquiry: ${form.subject}`,
          guestName: form.name,
          email: form.email,
          phone: form.phone,
          status: "pending_quotation",
          specialRequests: JSON.stringify({
            subject: form.subject,
            message: form.message,
          }),
        }),
      });

      if (!res.ok) {
        throw new Error("Unable to send inquiry message right now");
      }

      setSubmitted(true);
      setForm({ name: "", email: "", phone: "", subject: "General Trip Inquiry", message: "" });
    } catch (err: any) {
      setError(err?.message || "Error submitting inquiry");
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
            Contact Us
          </span>
        </nav>

        {/* Hero Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-primary-100 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider">
            We Are Here For You
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
            Get in Touch with Our Travel Specialists
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Have questions about a destination, an existing reservation, or need help creating a custom itinerary? Our team is always ready to assist.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
            <span className="text-3xl block">📞</span>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Phone &amp; WhatsApp</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Speak directly with a holiday consultant or chat on WhatsApp.
            </p>
            <a
              href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
              className="text-sm font-extrabold text-primary-600 dark:text-primary-400 block pt-1 hover:underline"
            >
              {phone}
            </a>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
            <span className="text-3xl block">✉️</span>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Email Inquiries</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Send us RFP, group proposals, or flight &amp; hotel requirements.
            </p>
            <a
              href={`mailto:${email}`}
              className="text-sm font-extrabold text-primary-600 dark:text-primary-400 block pt-1 hover:underline"
            >
              {email}
            </a>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
            <span className="text-3xl block">📍</span>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Office Headquarters</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {brandName} Corporate Operations
            </p>
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block pt-1">
              {address}
            </span>
          </div>
        </div>

        {/* Contact Form & Support Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Form Col (3 Cols) */}
          <div className="lg:col-span-3 bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-10 border border-neutral-200 dark:border-neutral-800 shadow-xl">
            <h2 className="text-xl font-bold mb-2">Send an Instant Message</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
              Fill in your details below and an advisor will respond within 2 hours.
            </p>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                <span className="text-4xl block">✅</span>
                <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                  Message Sent Successfully!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Thank you for reaching out. A travel specialist will contact you shortly via email and WhatsApp.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow hover:bg-emerald-500"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Amit Patel"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Mobile / WhatsApp Number *
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
                      placeholder="amit@example.com"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Inquiry Topic
                    </label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-primary-500"
                    >
                      <option value="Holiday Package Inquiry">Holiday Package Inquiry</option>
                      <option value="Hotel Booking Support">Hotel Booking Support</option>
                      <option value="Tour / Attraction Tickets">Tour / Attraction Tickets</option>
                      <option value="Visa Assistance">Visa Assistance</option>
                      <option value="Airport Transfer Request">Airport Transfer Request</option>
                      <option value="Corporate / MICE Group">Corporate / MICE Group</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Your Message / Requirements *
                  </label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about your travel dates, number of travelers, budget, or any specific questions..."
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-primary-500 resize-none"
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
                  {submitting ? "Sending..." : "Submit Inquiry"}
                </button>
              </form>
            )}
          </div>

          {/* Help & Hours Col (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Working Hours
              </h3>
              <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                  <span>Monday - Saturday</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">09:30 AM - 08:00 PM IST</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                  <span>Sunday</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">10:00 AM - 04:00 PM IST</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>On-Trip Emergency Hotline</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">24/7 Available</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Need Faster Answers?
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Check our Frequently Asked Questions for quick answers on booking changes, payments, baggage limits, and visa requirements.
              </p>
              <Link
                href="/en/faq"
                className="inline-block px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-colors"
              >
                Browse FAQ Section →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
