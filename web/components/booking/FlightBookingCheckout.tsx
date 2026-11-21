"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSite } from "@/lib/SiteContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { useCurrency } from "@/lib/CurrencyContext";

interface FlightPassenger {
  id: string;
  title: "Mr" | "Mrs" | "Ms" | "Master";
  firstName: string;
  lastName: string;
  type: "Adult" | "Child" | "Infant";
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;
  idType: "passport" | "national_id" | "driving_license";
  idNumber: string;
  passportExpiry?: string;
  nationality: string;
  seatPreference: "Window" | "Aisle" | "Middle" | "Any";
  mealChoice: string;
  frequentFlyerNo?: string;
}

const COUNTRY_CODES = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+968", country: "Oman", flag: "🇴🇲" },
  { code: "+974", country: "Qatar", flag: "🇶🇦" },
];

const PROMO_COUPONS: Record<string, { label: string; percent?: number; fixed?: number }> = {
  FLYGUJJU: { label: "15% Flight Discount", percent: 0.15 },
  SKYHIGH: { label: "Flat ₹1,000 / $15 Airfare Credit", fixed: 1000 },
  WELCOME: { label: "10% First Flight Booking", percent: 0.10 },
};

export default function FlightBookingCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const site = useSite();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const siteId = site?.siteId || "gujjutours";

  // Parse Flight Parameters from URL
  const flightNumber = searchParams.get("flightNumber") || searchParams.get("flightNo") || "SW-302";
  const airline = searchParams.get("airline") || "SkyWings Airlines";
  const fromCode = (searchParams.get("from") || "DEL").toUpperCase();
  const toCode = (searchParams.get("to") || "BOM").toUpperCase();
  const fromCity = searchParams.get("location") || (fromCode === "DEL" ? "Delhi" : fromCode === "DXB" ? "Dubai" : "Origin City");
  const toCity = searchParams.get("destination") || (toCode === "BOM" ? "Mumbai" : toCode === "BKK" ? "Bangkok" : "Destination City");
  const departureTime = searchParams.get("departureTime") || searchParams.get("time") || "06:15 AM";
  const arrivalTime = searchParams.get("arrivalTime") || "08:35 AM";
  const flightDuration = searchParams.get("duration") || "2h 20m";
  const cabinClass = searchParams.get("cabinClass") || searchParams.get("option") || "Economy";
  const departDate = searchParams.get("date") || searchParams.get("travelDate") || new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0];
  const flightImage = searchParams.get("image") || searchParams.get("imageUrl") || "/seed-images/flights/airline-skywings.svg";

  const adults = Math.max(1, parseInt(searchParams.get("adults") || "1", 10));
  const children = Math.max(0, parseInt(searchParams.get("children") || "0", 10));

  const rawUnitPrice = parseFloat(searchParams.get("unitPrice") || searchParams.get("price") || "4850");

  // Contact Info
  const [leadName, setLeadName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phoneCountry, setPhoneCountry] = useState<string>("+91");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [needGst, setNeedGst] = useState<boolean>(false);
  const [gstNumber, setGstNumber] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");

  // Flight Add-ons
  const [baggageUpgrade, setBaggageUpgrade] = useState<"standard" | "plus5" | "plus10">("standard");
  const [hasFlightInsurance, setHasFlightInsurance] = useState<boolean>(true);
  const [specialAssistance, setSpecialAssistance] = useState<string>("none");

  // Passengers list
  const totalPassengers = adults + children;
  const [passengers, setPassengers] = useState<FlightPassenger[]>([]);

  // Promo code
  const [promoCodeInput, setPromoCodeInput] = useState<string>("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "netbanking" | "pay_on_arrival">("card");

  // Submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Autofill user details
  useEffect(() => {
    if (user) {
      if (user.fullName && !leadName) setLeadName(user.fullName);
      if (user.email && !email) setEmail(user.email);
      if (user.phoneCountryCode) setPhoneCountry(user.phoneCountryCode);
      if (user.phone && !phoneNumber) setPhoneNumber(user.phone);
    } else {
      try {
        const stored = localStorage.getItem("customer_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.name && !leadName) setLeadName(parsed.name);
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

  // Sync passengers list with count
  useEffect(() => {
    setPassengers((prev) => {
      const updated: FlightPassenger[] = [];
      for (let i = 0; i < totalPassengers; i++) {
        const isChild = i >= adults;
        const existing = prev[i];
        updated.push({
          id: existing?.id || `pax-${i + 1}`,
          title: existing?.title || (isChild ? "Master" : i === 0 ? "Mr" : "Mrs"),
          firstName: i === 0 && leadName ? (existing?.firstName || leadName.split(" ")[0] || "") : existing?.firstName || "",
          lastName: i === 0 && leadName ? (existing?.lastName || leadName.split(" ").slice(1).join(" ") || "") : existing?.lastName || "",
          type: isChild ? "Child" : "Adult",
          gender: existing?.gender || (i === 0 ? "Male" : "Female"),
          dateOfBirth: existing?.dateOfBirth || (isChild ? "2018-05-10" : "1992-04-15"),
          idType: existing?.idType || "national_id",
          idNumber: existing?.idNumber || "",
          passportExpiry: existing?.passportExpiry || "",
          nationality: existing?.nationality || "Indian",
          seatPreference: existing?.seatPreference || "Window",
          mealChoice: existing?.mealChoice || "Pure Vegetarian Meal (AVML/PVML)",
          frequentFlyerNo: existing?.frequentFlyerNo || "",
        });
      }
      return updated;
    });
  }, [totalPassengers, adults, leadName]);

  const handlePassengerChange = (index: number, field: keyof FlightPassenger, value: any) => {
    setPassengers((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], [field]: value };
        if (index === 0 && (field === "firstName" || field === "lastName")) {
          const fn = field === "firstName" ? value : copy[0].firstName;
          const ln = field === "lastName" ? value : copy[0].lastName;
          setLeadName(`${fn} ${ln}`.trim());
        }
      }
      return copy;
    });
  };

  // Pricing calculations
  const adultFare = rawUnitPrice;
  const childFare = Math.round(rawUnitPrice * 0.75);
  const baseAirfare = adultFare * adults + childFare * children;
  const airportTaxAndUdf = Math.round(baseAirfare * 0.12); // Aviation Security & UDF Tax

  const baggageCost = baggageUpgrade === "plus5" ? 1800 * totalPassengers : baggageUpgrade === "plus10" ? 3400 * totalPassengers : 0;
  const insuranceCost = hasFlightInsurance ? 349 * totalPassengers : 0;

  const subtotalBeforeDiscount = baseAirfare + airportTaxAndUdf + baggageCost + insuranceCost;
  const grandTotal = Math.max(0, subtotalBeforeDiscount - promoDiscount);

  const handleApplyPromo = () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;
    setPromoError(null);
    const match = PROMO_COUPONS[code];
    if (match) {
      const discount = match.percent ? Math.round(baseAirfare * match.percent) : match.fixed || 500;
      setAppliedPromo(code);
      setPromoDiscount(discount);
    } else {
      setPromoError("Invalid flight coupon code. Try FLYGUJJU or SKYHIGH.");
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoDiscount(0);
    setPromoCodeInput("");
    setPromoError(null);
  };

  // Submit Flight Booking
  const handleSubmitFlightBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage("Please sign in to your account before proceeding to flight booking checkout.");
      return;
    }

    // Form validations
    if (!leadName.trim()) {
      setErrorMessage("Please enter the lead passenger's full name as per Govt Photo ID / Passport.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address to receive your E-Ticket Boarding Pass.");
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 7) {
      setErrorMessage("Please enter a valid mobile number for gate and flight status SMS alerts.");
      return;
    }

    // Check passenger names
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.firstName.trim() || !p.lastName.trim()) {
        setErrorMessage(`Please enter both First Name and Last Name for Passenger ${i + 1} (as on official ID).`);
        return;
      }
    }

    setIsSubmitting(true);

    // Generate authentic Flight PNR (6 chars) & Ticket Number
    const pnrLetters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pnrSuffix = "";
    for (let i = 0; i < 4; i++) {
      pnrSuffix += pnrLetters.charAt(Math.floor(Math.random() * pnrLetters.length));
    }
    const generatedPnr = `SW-${pnrSuffix}`;
    const generatedTicketNo = `098-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const bookingRef = `FL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const flightTitle = `${airline} ${flightNumber}: ${fromCode} (${fromCity}) → ${toCode} (${toCity})`;

    const bookingPayload = {
      service: "flight",
      serviceType: "flight",
      module: "flight",
      bookingType: "FLIGHT_RESERVATION",
      flightNumber,
      airline,
      title: flightTitle,
      tourName: flightTitle,
      name: flightTitle,
      destination: `${toCity} (${toCode})`,
      location: `${fromCity} (${fromCode})`,
      option: `${cabinClass} Class (${flightDuration})`,
      cabinClass,
      guestName: leadName.trim(),
      email: email.trim().toLowerCase(),
      phone: `${phoneCountry} ${phoneNumber.trim()}`,
      travelDate: departDate,
      startDate: departDate,
      endDate: departDate,
      adults,
      children,
      travelers: totalPassengers,
      totalPrice: grandTotal,
      currency: "INR",
      paymentMethod,
      paymentStatus: paymentMethod === "pay_on_arrival" ? "unpaid" : "paid",
      idempotencyKey: bookingRef,
      travelersList: passengers.map((p, idx) => ({
        id: p.id || `pax-${idx + 1}`,
        name: `${p.title} ${p.firstName.trim()} ${p.lastName.trim()}`,
        type: p.type,
        gender: p.gender,
        age: p.type === "Child" ? 7 : 32,
        passportOrId: p.idNumber ? `${p.idType.toUpperCase()}: ${p.idNumber}` : undefined,
      })),
      specialRequest: [
        `PNR: ${generatedPnr}`,
        `E-Ticket: ${generatedTicketNo}`,
        `Flight: ${airline} ${flightNumber} (${fromCode} to ${toCode})`,
        `Departure: ${departureTime} on ${departDate}`,
        `Baggage: ${baggageUpgrade === "plus10" ? "+10kg (25kg Total)" : baggageUpgrade === "plus5" ? "+5kg (20kg Total)" : "15kg Standard"}`,
        `Insurance: ${hasFlightInsurance ? "Covered" : "Declined"}`,
        specialAssistance !== "none" ? `Assistance: ${specialAssistance}` : "",
        needGst && gstNumber ? `GST: ${gstNumber} (${companyName})` : "",
      ]
        .filter(Boolean)
        .join(" | "),
      snapshot: {
        title: flightTitle,
        category: "FLIGHT RESERVATION",
        coverImage: flightImage,
        destination: `${toCity} (${toCode})`,
        duration: flightDuration,
        pnr: generatedPnr,
        ticketNo: generatedTicketNo,
        flightNumber,
        airline,
        fromCode,
        toCode,
        departureTime,
        arrivalTime,
        cabinClass,
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

    // Always persist to local and session storage
    const storedBooking = {
      ...bookingPayload,
      id: confirmedRef,
      reference: confirmedRef,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      priceBreakdown: {
        subtotal: baseAirfare,
        taxes: airportTaxAndUdf + baggageCost + insuranceCost,
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
          name: leadName.trim(),
          email: email.trim().toLowerCase(),
          phone: `${phoneCountry} ${phoneNumber.trim()}`,
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
          <Link href="/en" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/en/flights" className="hover:text-blue-600 transition-colors">Flights</Link>
          <span>/</span>
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
            Aviation E-Ticket Checkout ({fromCode} → {toCode})
          </span>
        </nav>

        {/* ─── Header: Flight Itinerary Banner ─── */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <span>✈️</span> Scheduled Flight Booking
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {airline} • {flightNumber}
              </h1>
              <p className="text-blue-100 text-xs sm:text-sm">
                Cabin Class: <strong className="text-white">{cabinClass}</strong> • Travel Date: <strong className="text-white">{departDate}</strong>
              </p>
            </div>

            {/* Flight Route Visual Badge */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-6 sm:gap-8 self-start md:self-auto">
              <div className="text-center">
                <span className="text-2xl sm:text-3xl font-black block">{fromCode}</span>
                <span className="text-[11px] text-blue-200 block">{fromCity}</span>
                <span className="text-[10px] font-mono text-white/90">{departureTime}</span>
              </div>
              <div className="text-center flex flex-col items-center">
                <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">{flightDuration}</span>
                <div className="w-16 sm:w-20 h-0.5 bg-blue-300/60 my-1 relative">
                  <span className="absolute -top-1.5 right-0 text-xs">✈</span>
                </div>
                <span className="text-[10px] text-emerald-300 font-bold">Non-Stop</span>
              </div>
              <div className="text-center">
                <span className="text-2xl sm:text-3xl font-black block">{toCode}</span>
                <span className="text-[11px] text-blue-200 block">{toCity}</span>
                <span className="text-[10px] font-mono text-white/90">{arrivalTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Main Form & Sidebar Grid ─── */}
        <form onSubmit={handleSubmitFlightBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Primary Contact Information */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h2 className="text-base font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-black">1</span>
                  Primary Passenger Contact Details
                </h2>
                <span className="text-xs text-neutral-400">E-Ticket &amp; PNR will be dispatched here</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Lead Traveler Full Name (as per Passport / Govt Photo ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="e.g. Rameshchandra Shah"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm font-semibold outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Email Address (for instant boarding pass) *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ramesh@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm font-semibold outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    WhatsApp / Mobile Number (for gate change alerts) *
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
                      className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm font-semibold outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Optional GST Invoice */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  <input
                    type="checkbox"
                    checked={needGst}
                    onChange={(e) => setNeedGst(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Add Corporate GST details for tax invoice credit (Optional)</span>
                </label>
                {needGst && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <input
                      type="text"
                      placeholder="GSTIN Number (e.g. 24AAACG1234F1Z5)"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 2. Passenger Manifest (Aviation Government Compliant) */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h2 className="text-base font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-black">2</span>
                  Flight Passenger Details ({totalPassengers} Traveler{totalPassengers > 1 ? "s" : ""})
                </h2>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Airline Verification Form</span>
              </div>

              <div className="space-y-4">
                {passengers.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                        {idx === 0 ? "★ Lead Passenger (Primary)" : `Passenger ${idx + 1}`} ({p.type})
                      </span>
                      <span className="text-[11px] font-semibold text-neutral-500">
                        {p.type === "Adult" ? "Adult (12+ yrs)" : "Child (2-11 yrs)"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-neutral-500 mb-1">Title *</label>
                        <select
                          value={p.title}
                          onChange={(e) => handlePassengerChange(idx, "title", e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-xs font-bold"
                        >
                          <option value="Mr">Mr</option>
                          <option value="Mrs">Mrs</option>
                          <option value="Ms">Ms</option>
                          <option value="Master">Master</option>
                        </select>
                      </div>

                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold text-neutral-500 mb-1">First &amp; Middle Name *</label>
                        <input
                          type="text"
                          required
                          value={p.firstName}
                          onChange={(e) => handlePassengerChange(idx, "firstName", e.target.value)}
                          placeholder="e.g. Ramesh"
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-xs font-semibold"
                        />
                      </div>

                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold text-neutral-500 mb-1">Last Name *</label>
                        <input
                          type="text"
                          required
                          value={p.lastName}
                          onChange={(e) => handlePassengerChange(idx, "lastName", e.target.value)}
                          placeholder="e.g. Shah"
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-xs font-semibold"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-neutral-500 mb-1">Gender *</label>
                        <select
                          value={p.gender}
                          onChange={(e) => handlePassengerChange(idx, "gender", e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-xs font-semibold"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-neutral-500 mb-1">Date of Birth *</label>
                        <input
                          type="date"
                          value={p.dateOfBirth}
                          max={new Date().toISOString().split("T")[0]}
                          onChange={(e) => handlePassengerChange(idx, "dateOfBirth", e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-xs font-semibold"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-neutral-500 mb-1">Govt ID / Passport No.</label>
                        <input
                          type="text"
                          value={p.idNumber}
                          onChange={(e) => handlePassengerChange(idx, "idNumber", e.target.value.toUpperCase())}
                          placeholder="ID / Passport"
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-xs font-mono font-bold uppercase"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-neutral-500 mb-1">Seat Preference</label>
                        <select
                          value={p.seatPreference}
                          onChange={(e) => handlePassengerChange(idx, "seatPreference", e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-xs font-semibold"
                        >
                          <option value="Window">Window Seat 🪟</option>
                          <option value="Aisle">Aisle Seat 🚶</option>
                          <option value="Middle">Middle Seat</option>
                          <option value="Any">Any Available</option>
                        </select>
                      </div>

                      <div className="sm:col-span-12">
                        <label className="block text-[10px] font-bold text-neutral-500 mb-1">Complimentary In-Flight Meal</label>
                        <select
                          value={p.mealChoice}
                          onChange={(e) => handlePassengerChange(idx, "mealChoice", e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-xs font-semibold"
                        >
                          <option value="Pure Vegetarian Meal (AVML/PVML)">🌱 Asian Vegetarian / Pure Veg Meal (No meat/fish/eggs)</option>
                          <option value="Jain Vegetarian Meal (VJML)">🌿 Strictly Verified Jain Meal (No root vegetables, no onion, no garlic)</option>
                          <option value="Hindu Non-Vegetarian Meal (HNML)">🍱 Standard Non-Veg Meal (Chicken/Fish - Halal)</option>
                          <option value="Diabetic Meal (DBML)">🥗 Diabetic / Low Calorie Healthy Option</option>
                          <option value="Child Meal (CHML)">👶 Nutritious Child Meal Box</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Flight Add-ons & Baggage Options */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <h2 className="text-base font-bold flex items-center gap-2 text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-black">3</span>
                Baggage Allowance &amp; Flight Protection Add-ons
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setBaggageUpgrade("standard")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${baggageUpgrade === "standard"
                    ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20"
                    : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300"
                    }`}
                >
                  <span className="text-xs font-bold block">15 kg Standard Check-in</span>
                  <span className="text-[11px] text-neutral-500 block mt-1">+ 7 kg Cabin Handbag</span>
                  <span className="text-xs font-black text-emerald-600 block mt-2">INCLUDED FREE</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBaggageUpgrade("plus5")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${baggageUpgrade === "plus5"
                    ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20"
                    : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300"
                    }`}
                >
                  <span className="text-xs font-bold block">Extra 5 kg (+5 kg Check-in)</span>
                  <span className="text-[11px] text-neutral-500 block mt-1">20 kg Total check-in allowance</span>
                  <span className="text-xs font-black text-blue-600 block mt-2">{formatPrice(1800, "INR")} / pax</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBaggageUpgrade("plus10")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${baggageUpgrade === "plus10"
                    ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20"
                    : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300"
                    }`}
                >
                  <span className="text-xs font-bold block">Extra 10 kg (+10 kg Check-in)</span>
                  <span className="text-[11px] text-neutral-500 block mt-1">25 kg Total check-in allowance</span>
                  <span className="text-xs font-black text-blue-600 block mt-2">{formatPrice(3400, "INR")} / pax</span>
                </button>
              </div>

              {/* Comprehensive Flight Delay & Baggage Insurance */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="flight-ins"
                  checked={hasFlightInsurance}
                  onChange={(e) => setHasFlightInsurance(e.target.checked)}
                  className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="flight-ins" className="cursor-pointer text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">
                      Comprehensive Aviation Travel &amp; Delay Insurance
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-black">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-300 text-[11px]">
                    Includes up to ₹15,000 flight cancellation/delay allowance, ₹25,000 lost baggage reimbursement, and ₹2,50,000 emergency medical assistance. Only <strong>{formatPrice(349, "INR")}</strong> per passenger.
                  </p>
                </label>
              </div>

              {/* Special Airport Assistance */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold block text-neutral-800 dark:text-neutral-200">
                    Special Assistance at Airport
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Wheelchair, elderly support or unaccompanied minor assistance
                  </span>
                </div>
                <select
                  value={specialAssistance}
                  onChange={(e) => setSpecialAssistance(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200"
                >
                  <option value="none">None required</option>
                  <option value="wheelchair_ramp">Wheelchair (Ramp assistance)</option>
                  <option value="wheelchair_cabin">Wheelchair (Cabin seat assistance)</option>
                  <option value="senior_support">Senior Citizen Escort</option>
                </select>
              </div>
            </div>

            {/* 4. Payment Methods */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <h2 className="text-base font-bold flex items-center gap-2 text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-black">4</span>
                Select Payment Mode for Immediate Ticket Issuance
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: "card", title: "Credit / Debit Card", icon: "💳", desc: "Visa, Mastercard, RuPay, Amex" },
                  { id: "upi", title: "Instant UPI", icon: "⚡", desc: "GPay, PhonePe, Paytm QR" },
                  { id: "netbanking", title: "Net Banking", icon: "🏦", desc: "All 50+ Major Indian Banks" },
                  { id: "pay_on_arrival", title: "Hold & Pay Later", icon: "⏳", desc: "Reserve Fare for 24h" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPaymentMethod(mode.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all ${paymentMethod === mode.id
                      ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20"
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
                Airfare Summary
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Base Airfare ({adults} Adult{adults > 1 ? "s" : ""}{children > 0 ? `, ${children} Child` : ""}):</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{formatPrice(baseAirfare, "INR")}</span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Aviation Security &amp; UDF Taxes:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{formatPrice(airportTaxAndUdf, "INR")}</span>
                </div>

                {baggageCost > 0 && (
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Extra Baggage Allowance:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{formatPrice(baggageCost, "INR")}</span>
                  </div>
                )}

                {insuranceCost > 0 && (
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Flight Delay Insurance ({totalPassengers} pax):</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{formatPrice(insuranceCost, "INR")}</span>
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
                  <span className="text-2xl font-black text-blue-700 dark:text-blue-400">
                    {formatPrice(grandTotal, "INR")}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 text-right">All taxes &amp; airline fees included</p>
              </div>

              {/* Promo Code Input */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Have an Airline Promo Code?
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
                      placeholder="e.g. FLYGUJJU"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-bold outline-none uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs"
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
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Issuing Flight PNR &amp; E-Ticket...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm &amp; Issue Flight E-Ticket ✈️</span>
                  </>
                )}
              </button>

              <div className="space-y-1.5 text-center text-[11px] text-neutral-400">
                <p>🔒 256-bit Bank Grade SSL Encryption • Official IATA Direct Ticketing</p>
                <p>Digital PNR &amp; QR Boarding Pass issued instantly upon booking</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
