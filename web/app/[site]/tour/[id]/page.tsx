"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import type { Tour } from "@/lib/type";
import type { BookingTraveler } from "@/lib/api";
import { getActualImageUrl } from "@/lib/imageUtils";

interface ConfirmedBookingData {
  id: string;
  reference?: string;
  tourName: string;
  totalPrice: number;
  guestName: string;
  email: string;
  phone: string;
  travelers: number;
  adults?: number;
  children?: number;
  travelersList?: BookingTraveler[];
  startDate: string;
  endDate: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentReference?: string;
  paidAt?: string;
}

export default function TourDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const config = useSiteConfig();
  const theme = config.theme || {};
  const primary = theme.primary || "#2563eb";
  const currency = typeof config.currencySymbol === "string" ? config.currencySymbol : "$";

  const [tour, setTour] = useState<Tour | null | undefined>(undefined);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "paypal" | "pay_on_arrival">("card");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    adults: 1,
    children: 0,
    startDate: "",
    endDate: "",
    specialRequests: "",
  });

  // Individual traveler list state
  const [travelers, setTravelers] = useState<BookingTraveler[]>([
    { id: "trv-adult-1", name: "", type: "Adult", gender: "", age: undefined },
  ]);

  const [cardData, setCardData] = useState({
    nameOnCard: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const [upiId, setUpiId] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBookingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Prefill contact details from logged-in account if present
  useEffect(() => {
    try {
      const stored =
        localStorage.getItem("admin_user") ||
        localStorage.getItem("user_info") ||
        localStorage.getItem("customer_user");
      if (stored) {
        const u = JSON.parse(stored);
        setFormData((prev) => ({
          ...prev,
          name: prev.name || u.name || "",
          email: prev.email || u.email || "",
          phone: prev.phone || u.phone || "",
        }));
      }
    } catch {
      // ignore parsing error
    }
  }, []);

  // Set default travel dates (+7d to +10d)
  useEffect(() => {
    const start = new Date(Date.now() + 7 * 86400000);
    const end = new Date(start.getTime() + 3 * 86400000);
    setFormData((prev) => ({
      ...prev,
      startDate: prev.startDate || start.toISOString().split("T")[0],
      endDate: prev.endDate || end.toISOString().split("T")[0],
    }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/tours/${id}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const result = (json?.data as Tour) ?? null;
        setTour(result);
        if (result?.image) setSelectedImage(result.image);
      })
      .catch(() => {
        if (!cancelled) setTour(null);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Synchronize individual travelers with Adults and Children counts
  useEffect(() => {
    setTravelers((prev) => {
      const next: BookingTraveler[] = [];
      const currentAdults = Math.max(1, formData.adults);
      const currentChildren = Math.max(0, formData.children);

      const prevAdults = prev.filter((t) => t.type === "Adult");
      for (let i = 0; i < currentAdults; i++) {
        if (i === 0) {
          next.push({
            id: prevAdults[0]?.id || "trv-adult-1",
            name: prevAdults[0]?.name || formData.name,
            type: "Adult",
            gender: prevAdults[0]?.gender || "",
            age: prevAdults[0]?.age,
            passportOrId: prevAdults[0]?.passportOrId,
          });
        } else if (prevAdults[i]) {
          next.push(prevAdults[i]);
        } else {
          next.push({
            id: `trv-adult-${i + 1}`,
            name: "",
            type: "Adult",
            gender: "",
            age: undefined,
          });
        }
      }

      const prevChildren = prev.filter((t) => t.type === "Child");
      for (let i = 0; i < currentChildren; i++) {
        if (prevChildren[i]) {
          next.push(prevChildren[i]);
        } else {
          next.push({
            id: `trv-child-${i + 1}`,
            name: "",
            type: "Child",
            gender: "",
            age: undefined,
          });
        }
      }
      return next;
    });
  }, [formData.adults, formData.children]);

  if (tour === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div
            className="w-10 h-10 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto"
            style={{ borderTopColor: primary }}
          />
          <p className="text-slate-600 text-sm font-medium">Loading experience details…</p>
        </div>
      </main>
    );
  }

  if (tour === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Tour not found</h1>
          <p className="text-slate-600 text-sm mb-6">
            The requested tour itinerary does not exist or has been retired.
          </p>
          <Link
            href="/explore"
            className="inline-block px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-md hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            Browse All Tours
          </Link>
        </div>
      </main>
    );
  }

  const unitRate = tour.discountedPrice && tour.discountedPrice > 0 ? tour.discountedPrice : tour.price;
  const childRate = Math.round(unitRate * 0.70);
  const totalTravelers = Math.max(1, formData.adults + formData.children);
  const subtotal = (formData.adults * unitRate) + (formData.children * childRate);
  const taxes = Math.round(subtotal * 0.05);
  const totalPrice = subtotal + taxes;

  const handleTravelerFieldChange = (index: number, field: keyof BookingTraveler, val: any) => {
    setTravelers((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], [field]: val };
        // Sync contact name if updating primary traveler's name
        if (index === 0 && field === "name") {
          setFormData((f) => ({ ...f, name: val }));
        }
      }
      return copy;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "name") {
      setTravelers((prev) => {
        if (prev.length === 0) return [{ id: "trv-adult-1", name: value, type: "Adult" }];
        return [{ ...prev[0], name: value }, ...prev.slice(1)];
      });
    }
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (e.target.name === "cardNumber") {
      val = val.replace(/\D/g, "").replace(/(\d{4})/g, "$1 ").trim().slice(0, 19);
    } else if (e.target.name === "expiry") {
      val = val.replace(/\D/g, "").replace(/(\d{2})(\d{1,2})/, "$1/$2").slice(0, 5);
    } else if (e.target.name === "cvv") {
      val = val.replace(/\D/g, "").slice(0, 4);
    }
    setCardData({ ...cardData, [e.target.name]: val });
  };

  const handleProceedToPayment = () => {
    setError("");
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.startDate || !formData.endDate) {
      setError("Please fill in contact info and travel dates.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Please provide a valid contact email address.");
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError("Departure date cannot be earlier than start date.");
      return;
    }

    // Validate that each individual traveler has a name entered
    const missingTraveler = travelers.find((t) => !t.name.trim());
    if (missingTraveler) {
      setError(`Please enter full name for every individual traveler (${travelers.length} guests).`);
      return;
    }

    if (!cardData.nameOnCard) {
      setCardData({ ...cardData, nameOnCard: formData.name });
    }
    setBookingStep(2);
  };

  const handleProcessPayment = async () => {
    try {
      setLoading(true);
      setError("");

      if (paymentMethod === "card") {
        if (!cardData.nameOnCard.trim() || cardData.cardNumber.replace(/\s/g, "").length < 13 || cardData.expiry.length < 5 || cardData.cvv.length < 3) {
          setError("Please complete all credit/debit card information.");
          setLoading(false);
          return;
        }
      } else if (paymentMethod === "upi") {
        if (!upiId.trim() || !upiId.includes("@")) {
          setError("Please provide a valid UPI Virtual Payment Address (e.g., name@okaxis).");
          setLoading(false);
          return;
        }
      }

      // Generate client-side idempotency key to prevent double charges/bookings
      const idempotencyKey = `WEB-IDEMP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const bookingPayload = {
        tourId: Number(tour.id) || 1,
        tourName: tour.name,
        tourSlug: tour.slug,
        guestName: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        adults: formData.adults,
        children: formData.children,
        travelers: totalTravelers,
        travelersList: travelers.map((t, idx) => ({
          id: t.id || `trv-${idx + 1}`,
          name: t.name.trim(),
          type: t.type,
          age: t.age ? Number(t.age) : undefined,
          gender: t.gender || "",
          passportOrId: t.passportOrId?.trim() || undefined,
        })),
        travelDate: new Date(formData.startDate).toISOString(),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        specialRequest: formData.specialRequests.trim() || undefined,
        paymentMethod,
        paymentReference:
          paymentMethod === "card"
            ? `CARD-••••-${cardData.cardNumber.replace(/\s/g, "").slice(-4)}`
            : paymentMethod === "upi"
            ? `UPI-${upiId}`
            : paymentMethod === "paypal"
            ? `PAYPAL-${Date.now().toString(36).toUpperCase()}`
            : undefined,
        idempotencyKey,
        source: "web",
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey,
          "X-Client-Source": "web",
        },
        body: JSON.stringify(bookingPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process payment and confirm booking.");
      }

      const confirmed = data.data as ConfirmedBookingData;
      setConfirmedBooking(confirmed);

      // Persist in session storage and localStorage for user isolation & lookup
      try {
        sessionStorage.setItem("toursapp_latest_booking", JSON.stringify(data.data));
        localStorage.setItem(
          "customer_user",
          JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
          })
        );
        localStorage.setItem("customer_email", formData.email.trim());
        const rawExisting = localStorage.getItem("customer_booking_refs");
        const existingRefs = rawExisting ? JSON.parse(rawExisting) : [];
        const refId = confirmed.reference || confirmed.id;
        if (refId && !existingRefs.includes(refId)) {
          existingRefs.push(refId);
          localStorage.setItem("customer_booking_refs", JSON.stringify(existingRefs));
        }
      } catch {
        // ignore
      }

      setBookingStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment processing error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/explore"
            className="text-sm font-semibold hover:underline inline-flex items-center gap-1"
            style={{ color: primary }}
          >
            ← Back to Tours
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getActualImageUrl(selectedImage || tour.image, {
                  title: tour.name,
                  category: tour.category,
                  module: "tours",
                  id: tour.id,
                })}
                alt={tour.name}
                className="w-full h-96 object-cover"
              />
              {tour.gallery && tour.gallery.length > 1 && (
                <div className="flex gap-3 p-4 bg-slate-100 overflow-x-auto">
                  {tour.gallery.map((img, idx) => {
                    const actualImg = getActualImageUrl(img, {
                      title: tour.name,
                      category: tour.category,
                      module: "tours",
                      id: `${tour.id}_gallery_${idx}`,
                    });
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImage(actualImg)}
                        className={`relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                          selectedImage === img || selectedImage === actualImg ? "border-blue-600 scale-105" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={actualImg} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Title & Key Highlights */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {tour.category}
                </span>
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                  <span className="text-amber-500">★</span>
                  <span>{tour.rating}</span>
                  <span className="text-slate-400 font-normal">({tour.reviews} reviews)</span>
                </div>
              </div>

              <h1 className="text-3xl font-extrabold text-slate-900">{tour.name}</h1>
              <p className="text-slate-600 text-sm leading-relaxed">{tour.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                <div>
                  <span className="font-semibold block text-slate-900">Duration</span>
                  <span>{tour.duration}</span>
                </div>
                <div>
                  <span className="font-semibold block text-slate-900">Destination</span>
                  <span>{typeof (tour.destination as any) === "object" && tour.destination !== null ? ((tour.destination as any).cityName || (tour.destination as any).country || "Destination") : tour.destination}</span>
                </div>
                <div>
                  <span className="font-semibold block text-slate-900">Group Size</span>
                  <span>{tour.groupSize || "Max 12"}</span>
                </div>
                <div>
                  <span className="font-semibold block text-slate-900">Difficulty</span>
                  <span>{tour.difficulty || "Moderate"}</span>
                </div>
              </div>
            </div>

            {/* Highlights */}
            {tour.highlights && tour.highlights.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Experience Highlights</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tour.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Itinerary */}
            {tour.itinerary && tour.itinerary.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Detailed Day-by-Day Schedule</h2>
                <div className="space-y-4">
                  {tour.itinerary.map((day) => (
                    <div key={day.day} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2.5 py-0.5 rounded text-xs font-bold text-white"
                          style={{ backgroundColor: primary }}
                        >
                          Day {day.day}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900">{day.title}</h3>
                      </div>
                      <p className="text-xs text-slate-600 pl-11">{day.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Booking Sidebar */}
          <div>
            <div className="sticky top-24 bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-5">
              {/* Header Price pill */}
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">From</span>
                  <div className="text-2xl font-black text-slate-900">
                    {currency}{unitRate}
                    <span className="text-xs font-normal text-slate-500 ml-1">/ person</span>
                  </div>
                </div>
                {tour.originalPrice && (
                  <span className="text-xs line-through text-slate-400 font-medium">
                    {currency}{tour.originalPrice}
                  </span>
                )}
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-100 pb-3">
                <span className={bookingStep >= 1 ? "text-blue-600 font-extrabold" : ""}>1. Details</span>
                <span>→</span>
                <span className={bookingStep >= 2 ? "text-blue-600 font-extrabold" : ""}>2. Payment</span>
                <span>→</span>
                <span className={bookingStep === 3 ? "text-emerald-600 font-extrabold" : ""}>3. E-Ticket</span>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {error}
                </div>
              )}

              {/* STEP 1: Traveler Details & Guests */}
              {bookingStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Contact Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. John Doe"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. john@example.com"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. +1 555 123 4567"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Adults and Children Counters */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[11px] font-bold text-slate-700 block">Adults (12+ yrs)</span>
                      <div className="flex items-center justify-between mt-2">
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, adults: Math.max(1, p.adults - 1) }))}
                          className="w-7 h-7 bg-white rounded-lg border border-slate-300 font-bold text-slate-700"
                        >
                          -
                        </button>
                        <span className="font-extrabold text-sm">{formData.adults}</span>
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, adults: p.adults + 1 }))}
                          className="w-7 h-7 bg-white rounded-lg border border-slate-300 font-bold text-slate-700"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[11px] font-bold text-slate-700 block">Children (30% off)</span>
                      <div className="flex items-center justify-between mt-2">
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, children: Math.max(0, p.children - 1) }))}
                          className="w-7 h-7 bg-white rounded-lg border border-slate-300 font-bold text-slate-700"
                        >
                          -
                        </button>
                        <span className="font-extrabold text-sm">{formData.children}</span>
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, children: p.children + 1 }))}
                          className="w-7 h-7 bg-white rounded-lg border border-slate-300 font-bold text-slate-700"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Travel Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Departure Date</label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Return Date</label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Individual Traveler Information */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">
                        Individual Passenger Details ({travelers.length})
                      </label>
                      <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        {formData.adults} Adult(s){formData.children > 0 ? `, ${formData.children} Child(ren)` : ""}
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {travelers.map((trv, idx) => (
                        <div
                          key={trv.id || idx}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                              <span
                                className="w-4 h-4 rounded-full text-white flex items-center justify-center text-[9px] font-bold"
                                style={{ backgroundColor: primary }}
                              >
                                {idx + 1}
                              </span>
                              Traveler {idx + 1}
                              <span className="text-slate-400 font-normal">
                                {idx === 0
                                  ? "(Primary Contact)"
                                  : trv.type === "Adult"
                                  ? "(Adult 12+)"
                                  : "(Child)"}
                              </span>
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                              {trv.type}
                            </span>
                          </div>

                          <div>
                            <input
                              type="text"
                              value={trv.name}
                              onChange={(e) => handleTravelerFieldChange(idx, "name", e.target.value)}
                              placeholder={
                                idx === 0
                                  ? "Primary passenger full name"
                                  : `Traveler ${idx + 1} full name`
                              }
                              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <select
                                value={trv.gender || ""}
                                onChange={(e) => handleTravelerFieldChange(idx, "gender", e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                              >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div>
                              <input
                                type="number"
                                min={trv.type === "Child" ? 1 : 12}
                                max={120}
                                value={trv.age ?? ""}
                                onChange={(e) =>
                                  handleTravelerFieldChange(
                                    idx,
                                    "age",
                                    e.target.value ? parseInt(e.target.value, 10) : undefined
                                  )
                                }
                                placeholder="Age (years)"
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Special Requests (Optional)</label>
                    <textarea
                      name="specialRequests"
                      rows={2}
                      value={formData.specialRequests}
                      onChange={handleChange}
                      placeholder="Dietary preferences, pickup requirements, etc."
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Price breakdown */}
                  <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>{currency}{unitRate} × {formData.adults} adult(s)</span>
                      <span className="font-semibold text-slate-900">{currency}{formData.adults * unitRate}</span>
                    </div>
                    {formData.children > 0 && (
                      <div className="flex justify-between">
                        <span>{currency}{childRate} × {formData.children} child(ren)</span>
                        <span className="font-semibold text-slate-900">{currency}{formData.children * childRate}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Taxes & Service Fees (5%)</span>
                      <span className="font-semibold text-slate-900">{currency}{taxes}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-bold text-slate-900">
                      <span>Total Estimated:</span>
                      <span style={{ color: primary }}>{currency}{totalPrice}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    className="w-full py-3.5 rounded-xl text-white font-semibold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    style={{ backgroundColor: primary }}
                  >
                    <span>Proceed to Payment</span>
                    <span>→</span>
                  </button>
                </div>
              )}

              {/* STEP 2: Payment & Checkout */}
              {bookingStep === 2 && (
                <div className="space-y-4">
                  {/* Summary Review pill */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>{tour.name}</span>
                      <span>{currency}{totalPrice}</span>
                    </div>
                    <div className="text-slate-500">
                      {totalTravelers} guest(s) ({formData.adults}A, {formData.children}C) • {formData.startDate} → {formData.endDate}
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Choose Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("card")}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                          paymentMethod === "card"
                            ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>💳</span>
                        <span>Credit / Debit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("upi")}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                          paymentMethod === "upi"
                            ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>⚡</span>
                        <span>UPI / QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("paypal")}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                          paymentMethod === "paypal"
                            ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>🅿️</span>
                        <span>PayPal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("pay_on_arrival")}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                          paymentMethod === "pay_on_arrival"
                            ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>🏨</span>
                        <span>Pay on Arrival</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Inputs per Method */}
                  {paymentMethod === "card" && (
                    <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          name="nameOnCard"
                          value={cardData.nameOnCard}
                          onChange={handleCardChange}
                          placeholder="Name as printed on card"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Card Number</label>
                        <input
                          type="text"
                          name="cardNumber"
                          value={cardData.cardNumber}
                          onChange={handleCardChange}
                          placeholder="4000 1234 5678 9010"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Expiry Date</label>
                          <input
                            type="text"
                            name="expiry"
                            value={cardData.expiry}
                            onChange={handleCardChange}
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">CVV / CVC</label>
                          <input
                            type="password"
                            name="cvv"
                            value={cardData.cvv}
                            onChange={handleCardChange}
                            placeholder="123"
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "upi" && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                      <label className="block font-semibold text-slate-700">UPI ID / VPA</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okaxis or mobile@upi"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  )}

                  {paymentMethod === "pay_on_arrival" && (
                    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                      <p className="font-semibold flex items-center gap-1.5">
                        <span>✓</span> Guaranteed Immediate Confirmation
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Zero prepayment required today. Settle balance in cash or credit card upon arrival.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      className="w-1/3 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleProcessPayment}
                      className="w-2/3 py-3 rounded-xl text-white font-semibold text-xs shadow-md hover:opacity-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                      style={{ backgroundColor: primary }}
                    >
                      {loading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing…</span>
                        </>
                      ) : (
                        <span>
                          {paymentMethod === "pay_on_arrival" ? "Confirm & Reserve Seats" : `Pay ${currency}${totalPrice} Now`}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Confirmed Booking Receipt */}
              {bookingStep === 3 && confirmedBooking && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="text-center py-2">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl shadow-sm font-bold">
                      ✓
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900">Booking Confirmed!</h3>
                    <p className="text-xs text-slate-500">
                      Receipt sent to <span className="font-semibold text-slate-700">{confirmedBooking.email}</span>
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="text-slate-500">Booking Reference</span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {confirmedBooking.reference || confirmedBooking.id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>
                      <span className="font-semibold capitalize px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
                        {confirmedBooking.paymentStatus === "paid" ? "Paid in Full" : "Guaranteed (Pay on Arrival)"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Passenger</span>
                      <span className="font-semibold text-slate-900">{confirmedBooking.guestName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total</span>
                      <span className="font-extrabold text-slate-900" style={{ color: primary }}>
                        {currency}{confirmedBooking.totalPrice}
                      </span>
                    </div>

                    {/* Individual Passenger Manifest */}
                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-800">
                          Individual Passenger Manifest
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {confirmedBooking.travelersList?.length || confirmedBooking.travelers || 1} guest(s)
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                        {(confirmedBooking.travelersList && confirmedBooking.travelersList.length > 0
                          ? confirmedBooking.travelersList
                          : [{ name: confirmedBooking.guestName, type: "Adult" as const }]
                        ).map((trv, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-4 h-4 rounded-full text-white font-bold flex items-center justify-center text-[9px]"
                                style={{ backgroundColor: primary }}
                              >
                                {idx + 1}
                              </span>
                              <span className="font-semibold text-slate-900">{trv.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 font-medium">
                                {trv.type}
                              </span>
                              {trv.gender && <span className="capitalize">{trv.gender}</span>}
                              {trv.age ? <span>{trv.age}y</span> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Direct Action Links */}
                  <div className="space-y-2 pt-2">
                    <Link
                      href={`/booking/confirmation?ref=${confirmedBooking.reference || confirmedBooking.id}`}
                      className="w-full py-2.5 rounded-xl text-white font-semibold text-xs shadow hover:opacity-95 text-center block"
                      style={{ backgroundColor: primary }}
                    >
                      View Full E-Ticket & Itinerary
                    </Link>

                    <Link
                      href="/my-bookings"
                      className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 text-center block"
                    >
                      Go to My Bookings
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}