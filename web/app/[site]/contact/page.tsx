"use client";

import { useState } from "react";
import { useSiteConfig } from "@/lib/SiteConfigContext";

export default function ContactPage() {
  const config = useSiteConfig();
  const theme = config?.theme;
  const primary = theme?.primary || "#2563eb";
  const siteName = config?.name || "Travel Platform";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate inquiry submission
    await new Promise((r) => setTimeout(r, 600));
    setSubmitted(true);
    setSubmitting(false);
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Hero Header */}
      <section
        className="text-white py-16 px-4 sm:px-6 lg:px-8"
        style={{
          background: `linear-gradient(135deg, ${primary} 0%, #0f172a 100%)`,
        }}
      >
        <div className="max-w-5xl mx-auto text-center space-y-3">
          <span className="inline-block px-3 py-1 text-xs font-bold tracking-wider uppercase bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            24/7 Support Concierge
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Contact {siteName}
          </h1>
          <p className="text-base sm:text-lg text-slate-200 max-w-xl mx-auto font-medium">
            Have questions about custom itineraries, group bookings, or reservation details? Our dedicated team is here to help.
          </p>
        </div>
      </section>

      {/* Main Content Form */}
      <section className="max-w-4xl mx-auto py-14 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Message Dispatched!</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Thank you for contacting {siteName}. A travel specialist has received your inquiry and will respond within 24 business hours.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow"
                style={{ backgroundColor: primary }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="jane@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Phone / WhatsApp (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 555-0192"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Topic *
                  </label>
                  <select
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 bg-white"
                  >
                    <option value="">Select a topic</option>
                    <option value="tour_inquiry">Tour Package Details</option>
                    <option value="booking_help">Existing Reservation Assistance</option>
                    <option value="custom_group">Custom Group / Corporate Itinerary</option>
                    <option value="feedback">General Feedback</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your upcoming travel plans or questions..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl text-white font-bold text-sm shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: primary }}
              >
                {submitting ? "Sending Inquiry..." : "Submit Inquiry"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
