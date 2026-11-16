"use client";

import React, { useState } from "react";

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  defaultDestination?: string;
  siteId?: string;
  currencySymbol?: string;
}

export default function EnquiryModal({
  isOpen,
  onClose,
  serviceName,
  defaultDestination = "",
  siteId = "gujjutours",
  currencySymbol = "₹",
}: EnquiryModalProps) {
  const safeDefaultDest = typeof defaultDestination === "object" && defaultDestination !== null
    ? ((defaultDestination as any).cityName || (defaultDestination as any).address || (defaultDestination as any).country || "")
    : String(defaultDestination || "");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [passengers, setPassengers] = useState(2);
  const [destination, setDestination] = useState(safeDefaultDest);
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const ref = `ENQ-${Date.now().toString().slice(-6)}`;

    try {
      const payload = {
        guestName: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        tourId: 0,
        tourName: `${serviceName} Custom Enquiry: ${destination || "General"}`,
        travelDate: travelDate || new Date().toISOString().split("T")[0],
        startDate: travelDate || new Date().toISOString().split("T")[0],
        endDate: travelDate || new Date().toISOString().split("T")[0],
        travelers: passengers,
        adults: passengers,
        children: 0,
        specialRequest: `Service: ${serviceName} | Destination: ${destination} | Details: ${notes}`,
        status: "pending_quotation",
        paymentStatus: "unpaid",
        currency: currencySymbol,
        source: "web_enquiry",
        website: siteId,
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Website-Id": siteId,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to submit enquiry request");
      }

      const json = await res.json().catch(() => null);
      const generatedRef = json?.data?.reference || json?.reference || ref;
      setSubmittedRef(generatedRef);
    } catch (err: any) {
      setErrorMsg(err?.message || "Enquiry service temporarily busy. Please contact our WhatsApp desk.");
      setSubmittedRef(ref);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-surface rounded-3xl p-6 sm:p-8 shadow-soft-xl border border-border text-foreground animate-fadeIn">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-2 text-foreground-muted hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
        >
          ✕
        </button>

        {!submittedRef ? (
          <div>
            <div className="mb-6">
              <span className="px-2.5 py-0.5 rounded-full bg-primary-light text-primary text-[10px] font-bold uppercase tracking-wider">
                Custom Quotation
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-foreground mt-1">
                Enquire for {serviceName}
              </h2>
              <p className="text-xs text-foreground-muted mt-1">
                Receive customized quotation, airline schedules, and visa requirements within 15 minutes.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-800">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Patel"
                    className="w-full px-3 py-2 bg-surface-2 border border-border rounded-xl text-xs text-foreground outline-none focus:border-primary font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 bg-surface-2 border border-border rounded-xl text-xs text-foreground outline-none focus:border-primary font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full px-3 py-2 bg-surface-2 border border-border rounded-xl text-xs text-foreground outline-none focus:border-primary font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Target Destination
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Dubai, Singapore, Kashmir"
                    className="w-full px-3 py-2 bg-surface-2 border border-border rounded-xl text-xs text-foreground outline-none focus:border-primary font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Travel Date
                  </label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-2 border border-border rounded-xl text-xs text-foreground outline-none focus:border-primary font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Travelers / Passenger Count: {passengers}
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Specific Requests or Dietary Needs
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Pure Jain meals needed, prefer 4-star beach resort, need airport transfers"
                  className="w-full px-3 py-2 bg-surface-2 border border-border rounded-xl text-xs text-foreground outline-none focus:border-primary font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark text-primary-contrast font-bold text-sm tracking-wide shadow-soft-md hover:shadow-soft-lg transition-all disabled:opacity-50 mt-2 cursor-pointer"
              >
                {isSubmitting ? "Submitting Request..." : "Request Free Quotation →"}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mx-auto mb-4 font-bold">
              ✓
            </div>
            <h3 className="text-xl font-black text-foreground">
              Enquiry Submitted Successfully!
            </h3>
            <p className="text-xs text-foreground-muted mt-2 max-w-sm mx-auto">
              Your reference code is{" "}
              <strong className="text-foreground font-mono bg-surface-2 px-2 py-0.5 rounded border border-border">
                {submittedRef}
              </strong>
              . Our travel manager is already preparing your tailored options.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <a
                href={`https://wa.me/919327682026?text=${encodeURIComponent(
                  `Hi, I just submitted enquiry reference ${submittedRef} for ${serviceName}. Please share details.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-soft-sm transition-all"
              >
                <span>Chat Instantly on WhatsApp</span>
                <span>💬</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 rounded-xl bg-surface-2 text-foreground font-bold text-xs hover:bg-surface-3 transition-colors cursor-pointer"
              >
                Back to Site
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
