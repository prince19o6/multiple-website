"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import type { Tour } from "@/lib/type";

interface ConfirmedBookingData {
  id: string;
  reference?: string;
  tourName: string;
  totalPrice: number;
  guestName: string;
  email: string;
  phone: string;
  travelers: number;
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

  const [tour, setTour] = useState<Tour | null | undefined>(undefined);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "paypal" | "pay_on_arrival">("card");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    travelers: 1,
    startDate: "",
    endDate: "",
  });

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

  useEffect(() => {
    let cancelled = false;

    // Fetch through localhost proxy route /api/tours/[id]
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

  if (tour === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 text-sm font-medium">Loading tour details…</p>
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      setError("Please fill in all traveler contact and travel date details.");
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError("Departure date cannot be earlier than start date.");
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

      const totalPrice = tour.price * formData.travelers;

      const bookingPayload = {
        tourId: tour.id,
        tourName: tour.name,
        totalPrice,
        guestName: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        travelers: Number(formData.travelers),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        paymentMethod,
        paymentReference:
          paymentMethod === "card"
            ? `CARD-••••-${cardData.cardNumber.replace(/\s/g, "").slice(-4)}`
            : paymentMethod === "upi"
            ? `UPI-${upiId}`
            : paymentMethod === "paypal"
            ? `PAYPAL-${Date.now().toString(36).toUpperCase()}`
            : undefined,
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process payment and confirm booking.");
      }

      setConfirmedBooking(data.data as ConfirmedBookingData);
      setBookingStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment processing error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = tour.price * formData.travelers;

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
                src={selectedImage || tour.image}
                alt={tour.name}
                className="w-full h-96 object-cover"
              />
              {tour.gallery && tour.gallery.length > 1 && (
                <div className="flex gap-3 p-4 bg-slate-100 overflow-x-auto">
                  {tour.gallery.map((img, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={idx}
                      src={img}
                      alt={`Gallery view ${idx + 1}`}
                      onClick={() => setSelectedImage(img)}
                      className={`h-16 w-24 object-cover rounded-lg cursor-pointer transition-opacity ${
                        selectedImage === img
                          ? "ring-2 ring-blue-600 opacity-100"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              )}
              <div className="p-8">
                <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                  <span>⭐ {tour.rating} ({tour.reviews} reviews)</span>
                  <span>•</span>
                  <span>📅 {tour.duration}</span>
                  <span>•</span>
                  <span>💪 {tour.difficulty}</span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-4">
                  {tour.name}
                </h1>
                <p className="text-slate-600 text-base leading-relaxed">
                  {tour.description}
                </p>
              </div>
            </div>

            {/* Highlights */}
            {tour.highlights && tour.highlights.length > 0 && (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Highlights</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tour.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Booking & Checkout Sidebar */}
          <div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl sticky top-28">
              {/* Header price banner */}
              <div className="flex justify-between items-baseline mb-5 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Expedition Price</span>
                  <div className="text-3xl font-extrabold text-slate-900" style={{ color: primary }}>
                    ${tour.price}
                    <span className="text-xs font-normal text-slate-500"> / person</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Instant Booking
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="flex items-center justify-between mb-6 pb-2 text-xs font-semibold">
                <div className={`flex items-center gap-1.5 ${bookingStep >= 1 ? "text-slate-900" : "text-slate-400"}`}>
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${
                      bookingStep >= 1 ? "bg-slate-900" : "bg-slate-300"
                    }`}
                  >
                    1
                  </span>
                  <span>Travelers</span>
                </div>
                <div className="flex-1 h-0.5 mx-2 bg-slate-200" />
                <div className={`flex items-center gap-1.5 ${bookingStep >= 2 ? "text-slate-900" : "text-slate-400"}`}>
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${
                      bookingStep >= 2 ? "bg-slate-900" : "bg-slate-300"
                    }`}
                  >
                    2
                  </span>
                  <span>Payment</span>
                </div>
                <div className="flex-1 h-0.5 mx-2 bg-slate-200" />
                <div className={`flex items-center gap-1.5 ${bookingStep === 3 ? "text-emerald-600" : "text-slate-400"}`}>
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${
                      bookingStep === 3 ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                  >
                    3
                  </span>
                  <span>Receipt</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {error}
                </div>
              )}

              {/* STEP 1: Traveler Details */}
              {bookingStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Lead Guest Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. John Doe"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address (for ticket receipt)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Number of Travelers
                    </label>
                    <input
                      type="number"
                      name="travelers"
                      min={1}
                      max={20}
                      value={formData.travelers}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>${tour.price} × {formData.travelers} guest{formData.travelers > 1 ? "s" : ""}</span>
                      <span className="font-semibold text-slate-900">${totalPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes & service fees</span>
                      <span className="text-emerald-600 font-medium">Included</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-bold text-slate-900">
                      <span>Total Amount:</span>
                      <span style={{ color: primary }}>${totalPrice}</span>
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
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>{tour.name}</span>
                      <span>${totalPrice}</span>
                    </div>
                    <div className="text-slate-500">
                      {formData.travelers} guest(s) • {formData.startDate} → {formData.endDate}
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
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
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
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
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
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
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
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
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
                      <p className="text-[11px] text-slate-500">
                        Supports Google Pay, PhonePe, Paytm, and BHIM UPI with instant zero-fee verification.
                      </p>
                    </div>
                  )}

                  {paymentMethod === "paypal" && (
                    <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1 text-center">
                      <p className="font-semibold">PayPal Express Checkout</p>
                      <p className="text-[11px] text-amber-700">
                        You will complete payment securely via PayPal encrypted portal upon pressing Pay Now.
                      </p>
                    </div>
                  )}

                  {paymentMethod === "pay_on_arrival" && (
                    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                      <p className="font-semibold flex items-center gap-1.5">
                        <span>✓</span> No Prepayment Required
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Your seats are guaranteed immediately. Settle balance in cash or credit card at hotel check-in.
                      </p>
                    </div>
                  )}

                  {/* Security Guarantee Badge */}
                  <div className="flex items-center justify-center gap-3 pt-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">🔒 256-bit SSL</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">🛡️ Protected Guarantee</span>
                  </div>

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
                          {paymentMethod === "pay_on_arrival" ? "Confirm & Guarantee Seats" : `Pay $${totalPrice} Now`}
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
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl shadow-sm">
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
                      <span className="text-slate-500">Payment Status</span>
                      <span className={`font-semibold capitalize px-2 py-0.5 rounded-full text-[10px] ${
                        confirmedBooking.paymentStatus === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {confirmedBooking.paymentStatus === "paid" ? "Paid in Full" : "Pay on Arrival"}
                      </span>
                    </div>
                    {confirmedBooking.paymentReference && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Transaction ID</span>
                        <span className="font-mono text-slate-600 text-[11px]">{confirmedBooking.paymentReference}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Lead Guest</span>
                      <span className="font-semibold text-slate-900">{confirmedBooking.guestName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Travelers</span>
                      <span className="font-semibold text-slate-900">{confirmedBooking.travelers} Guests</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900 text-sm">
                      <span>Total Paid</span>
                      <span style={{ color: primary }}>${confirmedBooking.totalPrice}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>🖨️</span>
                      <span>Print Receipt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBookingStep(1);
                        setConfirmedBooking(null);
                        setFormData({
                          name: "",
                          email: "",
                          phone: "",
                          travelers: 1,
                          startDate: "",
                          endDate: "",
                        });
                      }}
                      className="w-1/2 py-2.5 rounded-xl text-white font-semibold text-xs shadow-md hover:opacity-95 cursor-pointer"
                      style={{ backgroundColor: primary }}
                    >
                      Book Another
                    </button>
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