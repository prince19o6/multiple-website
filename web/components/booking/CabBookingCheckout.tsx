"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSite } from "@/lib/SiteContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { useCurrency } from "@/lib/CurrencyContext";

interface VehicleClass {
  id: string;
  name: string;
  model: string;
  capacity: number;
  luggage: number;
  baseMultiplier: number;
  badge?: string;
  image: string;
}

const VEHICLE_FLEET: VehicleClass[] = [
  {
    id: "sedan",
    name: "Comfort Executive Sedan",
    model: "Toyota Etios / Suzuki Dzire or equivalent",
    capacity: 4,
    luggage: 2,
    baseMultiplier: 1.0,
    badge: "Most Popular",
    image: "/seed-images/transfers/transfer-sedan.svg",
  },
  {
    id: "suv",
    name: "Spacious Multi-Utility SUV",
    model: "Toyota Innova Crysta / Ertiga",
    capacity: 6,
    luggage: 4,
    baseMultiplier: 1.6,
    badge: "Family Choice",
    image: "/seed-images/transfers/transfer-suv.svg",
  },
  {
    id: "luxury",
    name: "VIP Executive Luxury Chauffeur",
    model: "Toyota Camry / Mercedes E-Class",
    capacity: 3,
    luggage: 3,
    baseMultiplier: 3.2,
    badge: "VIP Luxury",
    image: "/seed-images/transfers/transfer-luxury.svg",
  },
  {
    id: "tempo",
    name: "Group Tempo Traveller (12-16 Seater)",
    model: "Force Tempo Traveller / Executive Coach",
    capacity: 14,
    luggage: 10,
    baseMultiplier: 2.5,
    badge: "Group Travel",
    image: "/seed-images/transfers/transfer-van.svg",
  },
];

const COUNTRY_CODES = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
];

const CAB_COUPONS: Record<string, { label: string; percent?: number; fixed?: number }> = {
  CAB15: { label: "15% Airport Transfer Off", percent: 0.15 },
  GUJJUCAB: { label: "Flat ₹250 / $5 Off", fixed: 250 },
  WELCOME: { label: "10% First Cab Booking", percent: 0.10 },
};

export default function CabBookingCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const site = useSite();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const siteId = site?.siteId || "gujjutours";

  // Parse Initial Cab Parameters from URL
  const initialTitle = searchParams.get("title") || searchParams.get("name") || "";
  const initialPickup = searchParams.get("pickup") || searchParams.get("location") || "Jaipur International Airport (Arrivals Gate)";
  const initialDropoff = searchParams.get("dropoff") || searchParams.get("destination") || "City Center & Verified Hotels";
  const initialDate = searchParams.get("date") || searchParams.get("travelDate") || new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0];
  const initialTime = searchParams.get("time") || "10:00";
  const initialFlightNo = searchParams.get("flightNo") || searchParams.get("flightNumber") || "";
  const initialVehicle = searchParams.get("vehicle") || "Sedan";
  const rawBaseFare = parseFloat(searchParams.get("price") || searchParams.get("unitPrice") || "1250");

  // Determine initial selected vehicle
  const matchedVehicle = VEHICLE_FLEET.find((v) =>
    initialVehicle.toLowerCase().includes(v.id) || v.name.toLowerCase().includes(initialVehicle.toLowerCase())
  ) || VEHICLE_FLEET[0];

  // Ride State
  const [tripType, setTripType] = useState<"airport_pickup" | "airport_drop" | "city_point" | "hourly_rental">("airport_pickup");
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleClass>(matchedVehicle);
  const [pickupAddress, setPickupAddress] = useState<string>(initialPickup);
  const [dropoffAddress, setDropoffAddress] = useState<string>(initialDropoff);
  const [pickupDate, setPickupDate] = useState<string>(initialDate);
  const [pickupTime, setPickupTime] = useState<string>(initialTime);
  const [flightArrivalNo, setFlightArrivalNo] = useState<string>(initialFlightNo);
  const [placardName, setPlacardName] = useState<string>("");
  const [passengersCount, setPassengersCount] = useState<number>(2);
  const [luggageCount, setLuggageCount] = useState<number>(2);

  // Driver preferences
  const [needChildSeat, setNeedChildSeat] = useState<boolean>(false);
  const [needLuggageAssist, setNeedLuggageAssist] = useState<boolean>(true);
  const [driverLanguage, setDriverLanguage] = useState<string>("Hindi / English");
  const [specialInstructions, setSpecialInstructions] = useState<string>("");

  // Contact Info
  const [guestName, setGuestName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phoneCountry, setPhoneCountry] = useState<string>("+91");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  // Promo code
  const [promoCodeInput, setPromoCodeInput] = useState<string>("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "pay_on_arrival">("pay_on_arrival");

  // Submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Autofill user details
  useEffect(() => {
    if (user) {
      if (user.fullName && !guestName) {
        setGuestName(user.fullName);
        setPlacardName(user.fullName);
      }
      if (user.email && !email) setEmail(user.email);
      if (user.phoneCountryCode) setPhoneCountry(user.phoneCountryCode);
      if (user.phone && !phoneNumber) setPhoneNumber(user.phone);
    } else {
      try {
        const stored = localStorage.getItem("customer_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.name && !guestName) {
            setGuestName(parsed.name);
            setPlacardName(parsed.name);
          }
          if (parsed.email && !email) setEmail(parsed.email);
          if (parsed.phone && !phoneNumber) {
            const p = String(parsed.phone);
            if (p.startsWith("+91")) {
              setPhoneCountry("+91");
              setPhoneNumber(p.replace("+91", "").trim());
            } else {
              setPhoneNumber(p.trim());
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }, [user]);

  // Fare calculations
  const calculatedBaseFare = Math.round(rawBaseFare * selectedVehicle.baseMultiplier);
  const childSeatCost = needChildSeat ? 250 : 0;
  const subtotalBeforeDiscount = calculatedBaseFare + childSeatCost;
  const grandTotal = Math.max(0, subtotalBeforeDiscount - promoDiscount);

  const handleApplyPromo = () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;
    setPromoError(null);
    const match = CAB_COUPONS[code];
    if (match) {
      const discount = match.percent ? Math.round(calculatedBaseFare * match.percent) : match.fixed || 200;
      setAppliedPromo(code);
      setPromoDiscount(discount);
    } else {
      setPromoError("Invalid cab coupon code. Try CAB15 or GUJJUCAB.");
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoDiscount(0);
    setPromoCodeInput("");
    setPromoError(null);
  };

  // Submit Cab Booking
  const handleSubmitCabBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage("Please sign in to your account before proceeding to booking checkout.");
      return;
    }

    if (!pickupAddress.trim()) {
      setErrorMessage("Please enter the pickup location or airport terminal gate.");
      return;
    }
    if (!dropoffAddress.trim()) {
      setErrorMessage("Please enter the drop-off destination address or hotel name.");
      return;
    }
    if (!guestName.trim()) {
      setErrorMessage("Please enter the passenger's full contact name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email to receive your cab booking confirmation voucher.");
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 7) {
      setErrorMessage("Please enter a valid mobile number for chauffeur SMS and live tracking link.");
      return;
    }

    setIsSubmitting(true);

    const bookingRef = `CAB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const fullPhone = `${phoneCountry} ${phoneNumber.trim()}`;

    const cabTitle = initialTitle
      ? `${initialTitle} (${selectedVehicle.name})`
      : `${selectedVehicle.name} (${selectedVehicle.model}) - ${pickupAddress} to ${dropoffAddress}`;

    const bookingPayload = {
      service: "transfer",
      serviceType: "transfer",
      module: "transfer",
      bookingType: "CAB_TRANSFER",
      title: cabTitle,
      tourName: cabTitle,
      name: cabTitle,
      option: `${selectedVehicle.name} (${selectedVehicle.model})`,
      vehicle: selectedVehicle.model,
      destination: dropoffAddress,
      location: pickupAddress,
      guestName: guestName.trim(),
      email: email.trim().toLowerCase(),
      phone: fullPhone,
      travelDate: pickupDate,
      startDate: pickupDate,
      endDate: pickupDate,
      adults: passengersCount,
      children: 0,
      travelers: passengersCount,
      totalPrice: grandTotal,
      currency: "INR",
      paymentMethod,
      paymentStatus: paymentMethod === "pay_on_arrival" ? "unpaid" : "paid",
      idempotencyKey: bookingRef,
      specialRequest: [
        `Pickup Time: ${pickupTime} on ${pickupDate}`,
        `Pickup Address: ${pickupAddress}`,
        `Drop-off Address: ${dropoffAddress}`,
        `Vehicle: ${selectedVehicle.name} (${selectedVehicle.model})`,
        tripType.includes("airport") && flightArrivalNo ? `Flight Arrival: ${flightArrivalNo} (Free Delay Tracking)` : "",
        placardName ? `Greeting Placard: "${placardName}"` : "",
        `Passengers: ${passengersCount} | Luggage: ${luggageCount} bags`,
        needChildSeat ? "Baby Booster Seat Requested" : "",
        `Language: ${driverLanguage}`,
        `Toll & Parking: 100% INCLUDED`,
        specialInstructions ? `Notes: ${specialInstructions}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
      snapshot: {
        title: cabTitle,
        category: "PRIVATE CAB & CHAUFFEUR DISPATCH",
        coverImage: selectedVehicle.image,
        destination: dropoffAddress,
        duration: "Direct Transfer",
        pickupAddress,
        dropoffAddress,
        pickupTime,
        pickupDate,
        vehicleModel: selectedVehicle.model,
        vehicleClass: selectedVehicle.name,
        flightNumber: flightArrivalNo,
        placardName: placardName || guestName,
      },
    };

    let confirmedRef = bookingRef;

    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem(`auth_token_${siteId}`) ||
        localStorage.getItem("auth_token_gujjutours") ||
        localStorage.getItem("auth_token_tripgoasia") ||
        localStorage.getItem("auth_token_technoheaven") ||
        localStorage.getItem("token")
        : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Site-Id": siteId,
        "X-Website-Id": siteId,
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/bookings?site=${encodeURIComponent(siteId)}`, {
        method: "POST",
        headers,
        body: JSON.stringify(bookingPayload),
      });

      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.data?.reference || json?.data?.id) {
          confirmedRef = String(json.data.reference || json.data.id);
        }
      }
    } catch {
      // Offline fallback: save locally
    }

    const storedBooking = {
      ...bookingPayload,
      id: confirmedRef,
      reference: confirmedRef,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      priceBreakdown: {
        subtotal: calculatedBaseFare,
        taxes: 0,
        total: grandTotal,
      },
    };

    try {
      sessionStorage.setItem("toursapp_latest_booking", JSON.stringify(storedBooking));
      localStorage.setItem("toursapp_latest_booking", JSON.stringify(storedBooking));
      localStorage.setItem("customer_email", email.trim().toLowerCase());

      const rawRefs = localStorage.getItem("customer_booking_refs");
      const existingRefs = rawRefs ? JSON.parse(rawRefs) : [];
      if (!existingRefs.includes(confirmedRef)) {
        existingRefs.unshift(confirmedRef);
        localStorage.setItem("customer_booking_refs", JSON.stringify(existingRefs));
      }

      localStorage.setItem(
        "customer_user",
        JSON.stringify({
          name: guestName.trim(),
          email: email.trim().toLowerCase(),
          phone: fullPhone,
        })
      );
    } catch {
      // ignore
    }

    setIsSubmitting(false);
    router.push(`/booking/confirmation?ref=${encodeURIComponent(confirmedRef)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 py-8 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500">
          <Link href="/en" className="hover:text-teal-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/en/transfers" className="hover:text-teal-600 transition-colors">Cabs &amp; Transfers</Link>
          <span>/</span>
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
            Private Chauffeur Cab Reservation
          </span>
        </nav>

        {/* ─── Header: Cab Fleet Banner ─── */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <span>🚖</span> Guaranteed AC &amp; Sanitized Fleet
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Private Cab &amp; Airport Chauffeur Booking
              </h1>
              <p className="text-teal-100 text-xs sm:text-sm">
                Doorstep pickup with professional verified chauffeur • All toll taxes &amp; airport parking fees 100% included.
              </p>
            </div>

            {/* Fleet Assurance Badges */}
            <div className="flex flex-wrap gap-2 text-xs font-semibold self-start md:self-auto">
              <span className="px-3 py-1.5 rounded-xl bg-white/15 border border-white/20 backdrop-blur-md">
                🛡️ 60 Mins Free Airport Waiting
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white/15 border border-white/20 backdrop-blur-md">
                🏷️ Zero Hidden Cash Surcharges
              </span>
            </div>
          </div>
        </div>

        {/* ─── Main Form & Sidebar Grid ─── */}
        <form onSubmit={handleSubmitCabBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Trip Type & Vehicle Class Selection */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h2 className="text-base font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                  <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 flex items-center justify-center text-xs font-black">1</span>
                  Select Vehicle Category &amp; Fleet Size
                </h2>
                <span className="text-xs text-neutral-400">All vehicles commercial license</span>
              </div>

              {/* Ride Type Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                  Trip Service Type:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "airport_pickup", label: "Airport Pickup ✈️", desc: "Airport to Hotel" },
                    { id: "airport_drop", label: "Airport Drop 🛫", desc: "Hotel to Airport" },
                    { id: "city_point", label: "Point-to-Point 📍", desc: "City Door-to-Door" },
                    { id: "hourly_rental", label: "Hourly Chauffeur ⏱️", desc: "Sightseeing Rental" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTripType(t.id as any)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${tripType === t.id
                        ? "border-teal-500 bg-teal-50/80 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20"
                        : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                        }`}
                    >
                      <span className="text-xs font-bold block">{t.label}</span>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle Fleet Cards */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Select Vehicle Fleet:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {VEHICLE_FLEET.map((v) => {
                    const isSelected = selectedVehicle.id === v.id;
                    const fare = Math.round(rawBaseFare * v.baseMultiplier);
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVehicle(v)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${isSelected
                          ? "border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 ring-2 ring-teal-500/20 shadow-sm"
                          : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300"
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            {v.badge && (
                              <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-[10px] font-bold uppercase tracking-wider mb-1 inline-block">
                                {v.badge}
                              </span>
                            )}
                            <h3 className="text-sm font-bold">{v.name}</h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{v.model}</p>
                          </div>
                          <span className="text-sm font-black text-teal-700 dark:text-teal-400">
                            {formatPrice(fare, "INR")}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-neutral-500 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700/60">
                          <span>👤 Up to {v.capacity} Passengers</span>
                          <span>🧳 {v.luggage} Bags</span>
                          <span>❄️ AC</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Route, Pickup Address & Timing */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h2 className="text-base font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                  <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 flex items-center justify-center text-xs font-black">2</span>
                  Pickup Route &amp; Scheduling Details
                </h2>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Free Cancellation</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    📍 Exact Pickup Address / Airport Terminal Gate *
                  </label>
                  <input
                    type="text"
                    required
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="e.g. Ahmedabad Airport Terminal 2 Arrivals Gate 3 or Hotel Grand Mercure"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm font-semibold outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    🏁 Drop-off Destination Address / Hotel *
                  </label>
                  <input
                    type="text"
                    required
                    value={dropoffAddress}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                    placeholder="e.g. Hyatt Regency, Ashram Road, Ahmedabad or Specific Residence"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm font-semibold outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    📅 Pickup Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm font-semibold outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    ⏰ Exact Pickup Time (24h or AM/PM) *
                  </label>
                  <input
                    type="time"
                    required
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm font-semibold outline-none focus:border-teal-500"
                  />
                </div>

                {/* Airport Flight Delay Tracking & Nameboard */}
                {tripType.includes("airport") && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        ✈️ Inbound Flight Number (for Live Delay Tracking)
                      </label>
                      <input
                        type="text"
                        value={flightArrivalNo}
                        onChange={(e) => setFlightArrivalNo(e.target.value.toUpperCase())}
                        placeholder="e.g. AI-802 or 6E-205"
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono font-bold uppercase outline-none focus:border-teal-500"
                      />
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 mt-1 block">
                        ✓ Chauffeur tracks your flight; zero extra charge if flight is delayed!
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        🏷️ Name on Greeting Signboard (Placard)
                      </label>
                      <input
                        type="text"
                        value={placardName}
                        onChange={(e) => setPlacardName(e.target.value)}
                        placeholder="e.g. Ramesh Shah"
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold outline-none focus:border-teal-500"
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block">
                        Driver will hold this nameboard at the airport arrival exit gate.
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 3. Passenger & Luggage Specs, Chauffeur Preferences */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <h2 className="text-base font-bold flex items-center gap-2 text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 flex items-center justify-center text-xs font-black">3</span>
                Passenger Count, Luggage &amp; Driver Preferences
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300 block mb-2">
                    👤 Passengers Count (Max {selectedVehicle.capacity})
                  </span>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPassengersCount(Math.max(1, passengersCount - 1))}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-700 font-bold border border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-sm"
                    >
                      −
                    </button>
                    <span className="font-extrabold text-base">{passengersCount}</span>
                    <button
                      type="button"
                      onClick={() => setPassengersCount(Math.min(selectedVehicle.capacity, passengersCount + 1))}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-700 font-bold border border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300 block mb-2">
                    🧳 Luggage Bags (Max {selectedVehicle.luggage})
                  </span>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setLuggageCount(Math.max(0, luggageCount - 1))}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-700 font-bold border border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-sm"
                    >
                      −
                    </button>
                    <span className="font-extrabold text-base">{luggageCount}</span>
                    <button
                      type="button"
                      onClick={() => setLuggageCount(Math.min(selectedVehicle.luggage + 2, luggageCount + 1))}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-700 font-bold border border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300 block mb-2">
                    🗣️ Chauffeur Language
                  </span>
                  <select
                    value={driverLanguage}
                    onChange={(e) => setDriverLanguage(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-xs font-semibold"
                  >
                    <option value="Hindi / English">Hindi / English</option>
                    <option value="Gujarati / Hindi">Gujarati / Hindi</option>
                    <option value="English Fluent">English Fluent</option>
                    <option value="Arabic / English">Arabic / English</option>
                  </select>
                </div>
              </div>

              {/* Special options */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needChildSeat}
                    onChange={(e) => setNeedChildSeat(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Install Baby / Child Booster Seat (+{formatPrice(250, "INR")})</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needLuggageAssist}
                    onChange={(e) => setNeedLuggageAssist(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Chauffeur Luggage Porter Support (Free)</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Specific Driver Instructions or Landmark Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Call 10 minutes before arrival, or meet at Pillar 14 near the taxi pickup stand."
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* 4. Lead Passenger Contact */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <h2 className="text-base font-bold flex items-center gap-2 text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 flex items-center justify-center text-xs font-black">4</span>
                Lead Passenger Contact Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Lead Passenger Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => {
                      setGuestName(e.target.value);
                      if (!placardName) setPlacardName(e.target.value);
                    }}
                    placeholder="e.g. Ramesh Shah"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm font-semibold outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Email Address (for Cab Booking Voucher) *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ramesh@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm font-semibold outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    WhatsApp Number (for Driver SMS &amp; GPS Link) *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={phoneCountry}
                      onChange={(e) => setPhoneCountry(e.target.value)}
                      className="px-2.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-bold"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d]/g, ""))}
                      placeholder="98765 43210"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm font-semibold outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Payment Preference */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <h2 className="text-base font-bold flex items-center gap-2 text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 flex items-center justify-center text-xs font-black">5</span>
                Select Payment Mode
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "pay_on_arrival", title: "Pay Driver Directly", icon: "💵", desc: "Cash / UPI to Chauffeur on drop" },
                  { id: "upi", title: "Instant UPI Pre-pay", icon: "⚡", desc: "Google Pay, PhonePe, Paytm" },
                  { id: "card", title: "Credit / Debit Card", icon: "💳", desc: "Visa, Mastercard, RuPay" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPaymentMethod(mode.id as any)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${paymentMethod === mode.id
                      ? "border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20"
                      : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                      }`}
                  >
                    <span className="text-lg block mb-1">{mode.icon}</span>
                    <span className="text-xs font-bold block">{mode.title}</span>
                    <span className="text-[10px] text-neutral-500 block mt-0.5">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-semibold">
                ⚠️ {errorMessage}
              </div>
            )}
          </div>

          {/* ─── Right Column: Sticky Fare Breakdown ─── */}
          <div className="lg:col-span-4 sticky top-20 space-y-5">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-5">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3">
                Cab Fare Breakdown
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Vehicle: {selectedVehicle.name}:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{formatPrice(calculatedBaseFare, "INR")}</span>
                </div>

                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Toll Taxes &amp; State Permits:</span>
                  <span>INCLUDED (₹0)</span>
                </div>

                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Airport Parking &amp; Driver Batta:</span>
                  <span>INCLUDED (₹0)</span>
                </div>

                {childSeatCost > 0 && (
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Child Booster Seat:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{formatPrice(childSeatCost, "INR")}</span>
                  </div>
                )}

                {appliedPromo && promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Promo Discount ({appliedPromo}):</span>
                    <span>−{formatPrice(promoDiscount, "INR")}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">Total Amount</span>
                  <span className="text-2xl font-black text-teal-700 dark:text-teal-400">
                    {formatPrice(grandTotal, "INR")}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 text-right">No additional driver tips or cash surcharges</p>
              </div>

              {/* Promo Code Input */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Have a Cab Promo Code?
                </span>
                {appliedPromo ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-700">✓ {appliedPromo} applied!</span>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-neutral-400 hover:text-neutral-700 text-xs font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. CAB15"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-bold outline-none uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {promoError && <p className="text-[10px] text-rose-500 font-semibold mt-1">{promoError}</p>}
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-teal-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Dispatching Chauffeur Reservation...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Cab Booking 🚖</span>
                  </>
                )}
              </button>

              <div className="space-y-1.5 text-center text-[11px] text-neutral-400">
                <p>🛡️ 100% On-Time Guarantee • Free cancellation up to 6h before pickup</p>
                <p>Driver contact &amp; GPS live tracking sent via SMS 2h before ride</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
