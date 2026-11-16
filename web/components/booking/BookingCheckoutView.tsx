"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Booking, BookingTraveler } from "@/lib/api";
import Footer from "@/components/footer";

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
  { code: "+61", country: "Australia", flag: "🇦🇺" },
];

const PROMO_COUPONS: Record<string, { label: string; percent?: number; fixed?: number }> = {
  GUJJU20: { label: "20% Festive Off", percent: 0.20 },
  TRIPGO15: { label: "15% Asia Explorer Off", percent: 0.15 },
  LUXURY50: { label: "$50 / ₹3,500 Luxury Credit", fixed: 50 },
  WELCOME: { label: "10% First Booking Off", percent: 0.10 },
  EXPLORE10: { label: "10% Explorer Savings", percent: 0.10 },
  VIPPASS: { label: "12% VIP Member Discount", percent: 0.12 },
};

function normalizeToIsoDate(raw?: string | null): string {
  if (!raw || typeof raw !== "string") {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  }
  const str = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  } catch {
    // ignore
  }

  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split("T")[0];
}

export default function BookingCheckoutView() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Preparing secure checkout…</p>
          </div>
        </div>
      }
    >
      <BookingCheckoutInner />
    </Suspense>
  );
}

function BookingCheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteConfig = useSiteConfig();
  const { user, resendVerification } = useAuth();
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleResendVerification = async () => {
    if (!user?.email || !resendVerification) return;
    setResendingVerification(true);
    setResendStatus(null);
    try {
      const res = await resendVerification(user.email);
      if (res.success) {
        setResendStatus("Verification email sent! Please check your inbox.");
      } else {
        setResendStatus(res.error || "Failed to resend verification link.");
      }
    } catch {
      setResendStatus("Failed to resend verification link.");
    } finally {
      setResendingVerification(false);
    }
  };

  const brandPrimary = siteConfig.theme?.primary || "#0d9488";
  const siteId: string = String((siteConfig as any)?.siteId || "gujjutours");
  const currencyParam = searchParams.get("currency");
  const currency =
    currencyParam === "INR" || currencyParam === "₹"
      ? "₹"
      : currencyParam === "USD" || currencyParam === "$"
      ? "$"
      : typeof siteConfig.currencySymbol === "string"
      ? siteConfig.currencySymbol
      : siteId === "gujjutours"
      ? "₹"
      : "$";

  const configAny = siteConfig as Record<string, any>;
  const supportPhone: string = String(configAny?.contact?.phone || configAny?.bot?.phone || "+91 9875095616");
  const supportEmail: string = String(configAny?.contact?.email || configAny?.footer?.supportEmail || "support@gujjutours.com");

  // Normalized Service Vertical
  const rawService = (
    searchParams.get("service") ||
    searchParams.get("serviceType") ||
    searchParams.get("type") ||
    "tour"
  ).toLowerCase();

  const service = useMemo(() => {
    if (rawService === "hotels" || rawService === "hotel") return "hotel";
    if (rawService === "restaurants" || rawService === "restaurant") return "restaurant";
    if (rawService === "flights" || rawService === "flight") return "flight";
    if (rawService === "transfers" || rawService === "transfer") return "transfer";
    if (rawService === "visas" || rawService === "visa") return "visa";
    if (rawService === "packages" || rawService === "package" || rawService === "holidays") return "package";
    if (rawService === "buildpackage" || rawService === "build-package" || rawService === "custom") return "buildpackage";
    return "tour";
  }, [rawService]);

  const rawId = searchParams.get("id") || searchParams.get("serviceId") || searchParams.get("tourId") || searchParams.get("slug") || "101";

  // Item Title
  const defaultTitle = useMemo(() => {
    switch (service) {
      case "hotel": return "Luxury Hotel Stay";
      case "restaurant": return "Gourmet Dining Experience";
      case "flight": return "Flight Reservation";
      case "transfer": return "Private Chauffeur Transfer";
      case "visa": return "Tourist / Business Visa";
      case "package": return "Holiday Package Tour";
      case "buildpackage": return "Custom Vacation Package";
      default: return "Guided Tour Experience";
    }
  }, [service]);

  const itemTitle = searchParams.get("title") || searchParams.get("name") || searchParams.get("tourName") || defaultTitle;

  // Option / Room / Tier / Cabin
  const defaultOption = useMemo(() => {
    switch (service) {
      case "hotel": return "Deluxe Room";
      case "restaurant": return "Standard Table";
      case "flight": return "Economy Class";
      case "transfer": return "Private Sedan";
      case "visa": return "Standard Processing";
      case "package": return "Standard Itinerary";
      case "buildpackage": return "Custom Package";
      default: return "Standard Admission";
    }
  }, [service]);

  const selectedOption =
    searchParams.get("option") ||
    searchParams.get("room") ||
    searchParams.get("roomName") ||
    searchParams.get("vehicle") ||
    searchParams.get("cabin") ||
    searchParams.get("cabinClass") ||
    searchParams.get("tier") ||
    defaultOption;

  // Dates
  const travelDateParam =
    searchParams.get("date") ||
    searchParams.get("travelDate") ||
    searchParams.get("startDate") ||
    searchParams.get("checkIn") ||
    "";
  const endDateParam =
    searchParams.get("endDate") ||
    searchParams.get("returnDate") ||
    searchParams.get("checkOut") ||
    "";

  // Counts & Nights
  const adultsParam = parseInt(
    searchParams.get("adults") ||
    searchParams.get("guests") ||
    searchParams.get("travelers") ||
    searchParams.get("passengers") ||
    "1",
    10
  );
  const childrenParam = parseInt(searchParams.get("children") || "0", 10);
  const nightsParam = parseInt(searchParams.get("nights") || "1", 10);

  // Raw Prices from URL
  const passedTotal = parseFloat(searchParams.get("total") || searchParams.get("totalPrice") || "0");
  const passedSubtotal = parseFloat(searchParams.get("subtotal") || "0");
  const passedUnitPrice = parseFloat(searchParams.get("unitPrice") || searchParams.get("price") || "0");
  const passedTax = parseFloat(searchParams.get("tax") || "0");

  // Specific Attributes
  const rawDietary = searchParams.get("dietary") || searchParams.get("vegMeal") || "";
  const pickup = searchParams.get("pickup") || "";
  const dropoff = searchParams.get("dropoff") || "";
  const diningTime = searchParams.get("time") || searchParams.get("departureTime") || "";
  const nationalityParam = searchParams.get("nationality") || "";
  const durationParam = searchParams.get("duration") || (nightsParam > 1 ? `${nightsParam} Nights` : "");
  const flightNumber = searchParams.get("flightNumber") || searchParams.get("flightNo") || "";

  // Image resolution with fallback
  const fallbackImage = useMemo(() => {
    switch (service) {
      case "hotel": return "/seed-images/hotels/hotel-apartment.svg";
      case "restaurant": return "/seed-images/restaurants/dining-gujarati-thali.svg";
      case "flight": return "/seed-images/flights/airline-skywings.svg";
      case "transfer": return "/seed-images/transfers/transfer-sedan.svg";
      case "visa": return "/seed-images/visas/visa-tourist.svg";
      case "package": return "/seed-images/packages/package-scenic.svg";
      case "buildpackage": return "/seed-images/buildpackage/build-destination.svg";
      default: return "/seed-images/activities/activity-desert-safari.svg";
    }
  }, [service]);

  const displayImage = searchParams.get("image") || searchParams.get("imageUrl") || searchParams.get("photo") || fallbackImage;

  // Date Formatting
  const defaultDateStr = useMemo(() => normalizeToIsoDate(travelDateParam), [travelDateParam]);

  const [travelDate, setTravelDate] = useState<string>(defaultDateStr);
  const [adults, setAdults] = useState<number>(Math.max(1, adultsParam));
  const [children, setChildren] = useState<number>(Math.max(0, childrenParam));

  // Form States
  const [guestName, setGuestName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phoneCountry, setPhoneCountry] = useState<string>("+91");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [dietaryChoice, setDietaryChoice] = useState<string>(
    rawDietary === "true" || rawDietary === "pureVeg" ? "pureVeg" : rawDietary || "pureVeg"
  );
  const [specialNotes, setSpecialNotes] = useState<string>("");

  // Payment Selection
  const [paymentPlan, setPaymentPlan] = useState<"full" | "later">("full");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "netbanking" | "pay_on_arrival">("card");

  // Promo Code
  const [promoCodeInput, setPromoCodeInput] = useState<string>("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscountAmount, setPromoDiscountAmount] = useState<number>(0);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Travelers List
  const totalTravelers = adults + children;
  const [travelersList, setTravelersList] = useState<BookingTraveler[]>([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fill logged in user info if available
  useEffect(() => {
    if (user) {
      if (user.fullName) setGuestName(user.fullName);
      if (user.email) setEmail(user.email);
      if (user.phoneCountryCode) setPhoneCountry(user.phoneCountryCode);
      if (user.phone) setPhoneNumber(user.phone);
      if (user.dietaryPreference && user.dietaryPreference !== "None") {
        setDietaryChoice(user.dietaryPreference);
      }
      return;
    }

    try {
      const storedUser = localStorage.getItem("customer_user") || localStorage.getItem("user_info");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.name && !guestName) setGuestName(parsed.name);
        if (parsed.email && !email) setEmail(parsed.email);
        if (parsed.phone && !phoneNumber) {
          const ph = String(parsed.phone).replace(/\s+/g, "");
          if (ph.startsWith("+91")) {
            setPhoneCountry("+91");
            setPhoneNumber(ph.slice(3));
          } else if (ph.startsWith("+971")) {
            setPhoneCountry("+971");
            setPhoneNumber(ph.slice(4));
          } else {
            setPhoneNumber(ph);
          }
        }
      } else {
        const storedEmail = localStorage.getItem("customer_email");
        if (storedEmail && !email) setEmail(storedEmail);
      }
    } catch {
      // ignore
    }
  }, [user]);

  // Sync travelers list when count changes
  useEffect(() => {
    setTravelersList((prev) => {
      const updated: BookingTraveler[] = [];
      for (let i = 0; i < totalTravelers; i++) {
        const isChild = i >= adults;
        const existing = prev[i];
        updated.push({
          id: existing?.id || `traveler_${i + 1}`,
          name: i === 0 && guestName ? guestName : existing?.name || "",
          type: isChild ? "Child" : "Adult",
          gender: existing?.gender || (i === 0 ? "Male" : ""),
        });
      }
      return updated;
    });
  }, [totalTravelers, adults, guestName]);

  const handleLeadNameChange = (val: string) => {
    setGuestName(val);
    setTravelersList((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      copy[0] = { ...copy[0], name: val };
      return copy;
    });
  };

  const handleTravelerChange = (index: number, field: keyof BookingTraveler, value: string) => {
    setTravelersList((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  };

  // Dynamic Pricing Calculation
  const { baseSubtotal, taxesAndFees, grandTotal, taxRatePercent } = useMemo(() => {
    const taxRate = (service === "hotel" || service === "flight") ? 0.12 : 0.05;
    let computedSubtotal = 0;

    if (service === "hotel") {
      // For hotels, unitPrice is room rate per night
      const effectiveNights = Math.max(1, nightsParam);
      const effectiveUnitPrice = passedUnitPrice > 0
        ? passedUnitPrice
        : (passedSubtotal > 0
          ? Math.round(passedSubtotal / effectiveNights)
          : (passedTotal > 0 ? Math.round((passedTotal / 1.12) / effectiveNights) : 4500));

      computedSubtotal = passedSubtotal > 0
        ? passedSubtotal
        : effectiveUnitPrice * effectiveNights;
    } else if (service === "restaurant") {
      const effectiveUnitPrice = passedUnitPrice > 0
        ? passedUnitPrice
        : (passedTotal > 0 ? Math.round(passedTotal / Math.max(1, adultsParam)) : 500);

      computedSubtotal = effectiveUnitPrice * adults;
    } else if (service === "visa") {
      const effectiveUnitPrice = passedUnitPrice > 0
        ? passedUnitPrice
        : (passedTotal > 0 ? Math.round(passedTotal / Math.max(1, adultsParam)) : 4500);

      computedSubtotal = effectiveUnitPrice * adults;
    } else if (service === "flight") {
      const effectiveUnitPrice = passedUnitPrice > 0
        ? passedUnitPrice
        : (passedTotal > 0 ? Math.round((passedTotal / 1.12) / Math.max(1, adultsParam)) : 4850);
      const childRate = Math.round(effectiveUnitPrice * 0.75);

      computedSubtotal = effectiveUnitPrice * adults + childRate * children;
    } else if (service === "transfer") {
      computedSubtotal = passedUnitPrice > 0 ? passedUnitPrice : (passedTotal > 0 ? passedTotal : 1250);
    } else if (service === "package") {
      const effectiveUnitPrice = passedUnitPrice > 0
        ? passedUnitPrice
        : (passedTotal > 0 ? Math.round(passedTotal / Math.max(1, adultsParam)) : 25000);
      const childRate = Math.round(effectiveUnitPrice * 0.65);

      computedSubtotal = effectiveUnitPrice * adults + childRate * children;
    } else if (service === "buildpackage") {
      computedSubtotal = passedSubtotal > 0
        ? passedSubtotal
        : (passedTotal > 0 ? Math.round(passedTotal / 1.05) : 35000);
    } else {
      // Default: Tour Experience
      const effectiveUnitPrice = passedUnitPrice > 0
        ? passedUnitPrice
        : (passedTotal > 0 ? Math.round(passedTotal / Math.max(1, adultsParam)) : 2450);
      const childRate = Math.round(effectiveUnitPrice * 0.7);

      computedSubtotal = effectiveUnitPrice * adults + childRate * children;
    }

    const discountedSubtotal = Math.max(0, computedSubtotal - promoDiscountAmount);
    const calculatedTax = passedTax > 0 && promoDiscountAmount === 0
      ? passedTax
      : Math.round(discountedSubtotal * taxRate);
    const calculatedGrandTotal = discountedSubtotal + calculatedTax;

    return {
      baseSubtotal: computedSubtotal,
      taxesAndFees: calculatedTax,
      grandTotal: calculatedGrandTotal,
      taxRatePercent: Math.round(taxRate * 100),
    };
  }, [
    service,
    nightsParam,
    passedUnitPrice,
    passedSubtotal,
    passedTotal,
    passedTax,
    adults,
    children,
    adultsParam,
    promoDiscountAmount,
  ]);

  const handleApplyPromo = (codeToApply?: string) => {
    const code = (codeToApply || promoCodeInput).trim().toUpperCase();
    if (!code) return;
    setPromoError(null);

    const match = PROMO_COUPONS[code];
    if (match) {
      let discount = 0;
      if (match.percent) {
        discount = Math.round(baseSubtotal * match.percent);
      } else if (match.fixed) {
        discount = Math.min(match.fixed, baseSubtotal * 0.5);
      }
      setAppliedPromo(code);
      setPromoDiscountAmount(discount);
    } else {
      setPromoError("Invalid coupon code. Try GUJJU20 or TRIPGO15.");
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoDiscountAmount(0);
    setPromoCodeInput("");
    setPromoError(null);
  };

  const payLaterAdvance = Math.round(grandTotal * 0.20);
  const payLaterRemaining = grandTotal - payLaterAdvance;
  const currentPayable = paymentPlan === "later" ? payLaterAdvance : grandTotal;

  // Form Validation and Booking Submission
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/booking";
      router.push(`/${siteId}/en/login?returnUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (!guestName.trim()) {
      setErrorMessage("Please enter the lead traveler's full name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address for receiving your booking confirmation voucher.");
      return;
    }

    if (!phoneNumber.trim() || phoneNumber.length < 6) {
      setErrorMessage("Please enter a valid mobile number for WhatsApp & SMS updates.");
      return;
    }

    if (service === "visa") {
      for (let i = 0; i < travelersList.length; i++) {
        const t = travelersList[i];
        if (!t.name || !t.name.trim()) {
          setErrorMessage(`Please enter the full name for Applicant ${i + 1} as per their passport.`);
          return;
        }
        if (!t.passportNumber || t.passportNumber.trim().length < 5) {
          setErrorMessage(`Please enter a valid passport number for Applicant ${i + 1}.`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const fullPhone = `${phoneCountry} ${phoneNumber.trim()}`;
      const isNumericId = /^\d+$/.test(rawId.trim());
      const numericTourId = isNumericId && service === "tour" ? parseInt(rawId, 10) : undefined;

      const resolvedDestination =
        searchParams.get("destination") ||
        searchParams.get("to") ||
        searchParams.get("city") ||
        searchParams.get("country") ||
        searchParams.get("dropoff") ||
        "Confirmed Destination";

      const resolvedLocation =
        searchParams.get("location") ||
        searchParams.get("from") ||
        searchParams.get("city") ||
        searchParams.get("pickup") ||
        "";

      const normTravelDate = normalizeToIsoDate(travelDate);
      const normEndDate = endDateParam ? normalizeToIsoDate(endDateParam) : normTravelDate;

      const payload = {
        tourId: numericTourId,
        id: rawId,
        itemId: rawId,
        slug: searchParams.get("slug") || rawId,
        tourSlug: searchParams.get("slug") || rawId,
        tourName: itemTitle,
        title: itemTitle,
        service: service,
        serviceType: service,
        module: service,
        option: selectedOption,
        flightNumber: flightNumber || undefined,
        category: badge.text,
        destination: resolvedDestination,
        location: resolvedLocation,
        duration: durationParam || (nightsParam > 1 ? `${nightsParam} Nights` : (service === "flight" ? (diningTime || "Direct Flight") : "Confirmed Reservation")),
        tourImage: displayImage,
        image: displayImage,
        imageUrl: displayImage,
        unitPrice: passedUnitPrice || Math.round(baseSubtotal / Math.max(1, adults)),
        subtotal: baseSubtotal,
        taxes: taxesAndFees,
        guestName: guestName.trim(),
        email: email.trim().toLowerCase(),
        phone: fullPhone,
        travelDate: normTravelDate,
        startDate: normTravelDate,
        endDate: normEndDate,
        nights: nightsParam,
        adults: adults,
        children: children,
        travelers: totalTravelers,
        travelersList: travelersList,
        specialRequests: [
          dietaryChoice ? `Dietary: ${dietaryChoice}` : "",
          specialNotes ? `Notes: ${specialNotes}` : "",
          pickup ? `Pickup: ${pickup}` : "",
          dropoff ? `Dropoff: ${dropoff}` : "",
          diningTime ? `Time: ${diningTime}` : "",
          nationalityParam ? `Nationality: ${nationalityParam}` : "",
          selectedOption ? `Option: ${selectedOption}` : "",
          durationParam ? `Duration: ${durationParam}` : "",
          flightNumber ? `Flight: ${flightNumber}` : "",
        ]
          .filter(Boolean)
          .join(" | "),
        paymentMethod: paymentMethod,
        paymentPlan: paymentPlan,
        paymentOption: paymentPlan === "later" ? "payLater" : "full",
        paymentStatus: paymentPlan === "later" ? "partially_paid" : paymentMethod === "pay_on_arrival" ? "unpaid" : "paid",
        promoCode: appliedPromo || undefined,
        couponCode: appliedPromo || undefined,
        discountAmount: promoDiscountAmount,
        totalPrice: grandTotal,
        amountPaid: currentPayable,
        amountDue: paymentPlan === "later" ? payLaterRemaining : 0,
        currency: currency,
        userId: user?.id || undefined,
      };

      const token = typeof window !== "undefined"
        ? localStorage.getItem(`auth_token_${siteId}`) ||
          localStorage.getItem("auth_token_gujjutours") ||
          localStorage.getItem("auth_token_tripgoasia") ||
          localStorage.getItem("auth_token_technoheaven") ||
          localStorage.getItem("token")
        : null;

      const reqHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Site-Id": siteId,
        "X-Website-Id": siteId,
      };
      if (token) {
        reqHeaders["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/bookings?site=${encodeURIComponent(siteId)}`, {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        if (json?.code === "LOGIN_REQUIRED" || res.status === 401) {
          const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/booking";
          router.push(`/${siteId}/en/login?returnUrl=${encodeURIComponent(currentUrl)}`);
          return;
        }
        throw new Error(json?.error || json?.message || "Reservation request could not be processed. Please try again.");
      }

      const booking: Booking = json.data || json;
      const ref = booking.reference || `GT-${Date.now().toString().slice(-6)}`;

      // Store in browser storage for instant retrieval
      try {
        sessionStorage.setItem("toursapp_latest_booking", JSON.stringify(booking));
        localStorage.setItem("toursapp_latest_booking", JSON.stringify(booking));
        localStorage.setItem("customer_email", email.trim().toLowerCase());

        const existingRefs = JSON.parse(localStorage.getItem("customer_booking_refs") || "[]");
        if (Array.isArray(existingRefs) && !existingRefs.includes(ref)) {
          existingRefs.unshift(ref);
          localStorage.setItem("customer_booking_refs", JSON.stringify(existingRefs));
        }

        // Cache customer name & phone
        localStorage.setItem(
          "customer_user",
          JSON.stringify({
            name: guestName.trim(),
            email: email.trim().toLowerCase(),
            phone: fullPhone,
          })
        );
      } catch {
        // ignore storage quota error
      }

      // Redirect immediately to confirmation page
      router.push(`/booking/confirmation?ref=${encodeURIComponent(ref)}`);
    } catch (err) {
      console.error("[BookingCheckout] Submission failed:", err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setErrorMessage(msg);
      setIsSubmitting(false);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  // Helper Badge Icon based on service vertical
  const getServiceBadge = () => {
    switch (service) {
      case "hotel":
        return { icon: "🏨", text: "Hotel Stay", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "flight":
        return { icon: "✈️", text: "Flight Booking", color: "bg-sky-50 text-sky-700 border-sky-200" };
      case "transfer":
        return { icon: "🚗", text: "Private Transfer", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "visa":
        return { icon: "📄", text: "Visa Application", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "restaurant":
        return { icon: "🍽️", text: "Dining Reservation", color: "bg-rose-50 text-rose-700 border-rose-200" };
      case "package":
        return { icon: "🎒", text: "Holiday Package", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "buildpackage":
        return { icon: "🛠️", text: "Custom Package", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      default:
        return { icon: "🎡", text: "Tour Experience", color: "bg-teal-50 text-teal-700 border-teal-200" };
    }
  };

  const badge = getServiceBadge();

  // Guest Label formatting based on vertical
  const travelerRoleLabel = useMemo(() => {
    switch (service) {
      case "hotel": return "Guest";
      case "restaurant": return "Diner";
      case "visa": return "Applicant";
      case "transfer": return "Passenger";
      case "flight": return "Passenger";
      default: return "Traveler";
    }
  }, [service]);

  // Base rate row label
  const baseRateLabel = useMemo(() => {
    switch (service) {
      case "hotel":
        return `Base Stay Rate (${nightsParam} Night${nightsParam > 1 ? "s" : ""}, ${adults} Guest${adults > 1 ? "s" : ""}):`;
      case "restaurant":
        return `Table Dining Cover (${adults} Diner${adults > 1 ? "s" : ""}):`;
      case "flight":
        return `Flight Airfare (${adults} Adult${adults > 1 ? "s" : ""}${children > 0 ? `, ${children} Child` : ""}):`;
      case "visa":
        return `Visa Processing Fee (${adults} Applicant${adults > 1 ? "s" : ""}):`;
      case "transfer":
        return "Private Chauffeur Fare (One-Way):";
      case "package":
        return `Holiday Package Fare (${adults} Adult${adults > 1 ? "s" : ""}${children > 0 ? `, ${children} Child` : ""}):`;
      case "buildpackage":
        return "Custom Vacation Package Fare:";
      default:
        return `Base Tour Rate (${adults} Adult${adults > 1 ? "s" : ""}${children > 0 ? `, ${children} Child` : ""}):`;
    }
  }, [service, nightsParam, adults, children]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-24 font-sans">
      {/* ─── Top Trust Header ─── */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
            >
              <span>← Back</span>
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>🔒</span> Secure 256-Bit SSL Checkout
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <span className="hidden sm:inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ✓ Instant Confirmation
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              🛡️ Zero Booking Fees
            </span>
          </div>
        </div>
      </div>

      {/* ─── Breadcrumb & Stepper ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Complete Your Reservation
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Confirm your details below. Your official voucher with QR code will be generated immediately.
            </p>
          </div>

          {/* Stepper Pill */}
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold text-slate-700">
            <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">1</span>
            <span>Details</span>
            <span className="text-slate-300">→</span>
            <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">2</span>
            <span>Preferences</span>
            <span className="text-slate-300">→</span>
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">3</span>
            <span>Confirmation</span>
          </div>
        </div>

        {/* ─── Error Alert ─── */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <p className="font-bold">Please check your reservation details</p>
              <p className="text-xs sm:text-sm mt-0.5 text-rose-600">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-600 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* ─── Main Two-Column Layout ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form (8 Cols) */}
          <form onSubmit={handleSubmitBooking} className="lg:col-span-8 space-y-6">
            {/* ─── Login Required Gate Banner ─── */}
            {!user && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-6 text-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    🔒 Account Required to Reserve
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">Please Sign In to Complete Your Reservation</h3>
                  <p className="text-xs text-slate-600 max-w-md">
                    Reservations are linked to your personal traveler profile for real-time tracking, e-ticket QR vouchers, and automated concierge updates.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/${siteId}/en/login?returnUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/booking")}`}
                    className="px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow hover:opacity-95 transition-all"
                    style={{ backgroundColor: brandPrimary }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href={`/${siteId}/en/register?returnUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/booking")}`}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}

            {/* ─── Email Verification Alert Banner ─── */}
            {user && !user.isEmailVerified && (
              <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 text-amber-900 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-0.5 text-center sm:text-left">
                  <div className="text-xs font-extrabold flex items-center justify-center sm:justify-start gap-1.5 text-amber-800">
                    <span>✉️</span> Email Verification Pending
                  </div>
                  <p className="text-xs text-amber-700">
                    A confirmation link was sent to <strong>{user.email}</strong>. Verify your email to activate all member benefits.
                  </p>
                  {resendStatus && (
                    <p className="text-[11px] font-bold text-emerald-700 mt-1">{resendStatus}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-bold text-amber-800 hover:bg-amber-100/60 shrink-0 shadow-2xs cursor-pointer"
                >
                  {resendingVerification ? "Sending..." : "Resend Link"}
                </button>
              </div>
            )}

            {/* 1. Trip / Item Summary Card with Real Photo */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Real Photo Thumbnail */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100 shadow-xs relative">
                    <img
                      src={displayImage}
                      alt={itemTitle}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = fallbackImage;
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border ${badge.color}`}>
                      <span>{badge.icon}</span>
                      <span>{badge.text}</span>
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                      {itemTitle}
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-teal-700">
                      Option / Tier: <span className="text-slate-700 font-normal">{selectedOption}</span>
                    </p>
                  </div>
                </div>

                <div className="sm:text-right shrink-0 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Fare</span>
                  <span className="text-2xl font-black text-teal-700">
                    {currency}{grandTotal.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400 block">Taxes included</span>
                </div>
              </div>

              {/* Dynamic Service Meta Info with interactive adjustments */}
              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block text-[11px] font-semibold mb-1">
                    {service === "hotel" ? "📅 Check-In Date" : service === "restaurant" ? "📅 Dining Date" : "📅 Travel Date"}
                  </label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-[11px] font-semibold mb-1">
                    👤 {travelerRoleLabel}s (12+ yrs)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-100 font-bold hover:bg-slate-200 flex items-center justify-center text-sm text-slate-700"
                    >
                      −
                    </button>
                    <span className="font-extrabold text-slate-900 text-sm px-2">{adults}</span>
                    <button
                      type="button"
                      onClick={() => setAdults((prev) => prev + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 font-bold hover:bg-slate-200 flex items-center justify-center text-sm text-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 block text-[11px] font-semibold mb-1">
                    👶 Children (2-11 yrs)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setChildren((prev) => Math.max(0, prev - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-100 font-bold hover:bg-slate-200 flex items-center justify-center text-sm text-slate-700"
                    >
                      −
                    </button>
                    <span className="font-extrabold text-slate-900 text-sm px-2">{children}</span>
                    <button
                      type="button"
                      onClick={() => setChildren((prev) => prev + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 font-bold hover:bg-slate-200 flex items-center justify-center text-sm text-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Extra vertical properties if available */}
              {(endDateParam || durationParam || pickup || dropoff || diningTime || nationalityParam || flightNumber) && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs">
                  {endDateParam && (
                    <div>
                      <span className="text-slate-400 block">Check-Out</span>
                      <span className="font-bold text-slate-800">{endDateParam}</span>
                    </div>
                  )}
                  {durationParam && (
                    <div>
                      <span className="text-slate-400 block">Duration / Nights</span>
                      <span className="font-bold text-slate-800">{durationParam}</span>
                    </div>
                  )}
                  {diningTime && (
                    <div>
                      <span className="text-slate-400 block">{service === "flight" ? "Departure Time" : "Dining / Pickup Time"}</span>
                      <span className="font-bold text-slate-800">{diningTime}</span>
                    </div>
                  )}
                  {flightNumber && (
                    <div>
                      <span className="text-slate-400 block">Flight Number</span>
                      <span className="font-bold text-slate-800">{flightNumber}</span>
                    </div>
                  )}
                  {pickup && (
                    <div>
                      <span className="text-slate-400 block">Pickup Location</span>
                      <span className="font-bold text-slate-800 truncate max-w-xs">{pickup}</span>
                    </div>
                  )}
                  {dropoff && (
                    <div>
                      <span className="text-slate-400 block">Drop-off Location</span>
                      <span className="font-bold text-slate-800 truncate max-w-xs">{dropoff}</span>
                    </div>
                  )}
                  {nationalityParam && (
                    <div>
                      <span className="text-slate-400 block">Nationality</span>
                      <span className="font-bold text-slate-800">{nationalityParam}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Lead Contact Information */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-black">1</span>
                  Lead Traveler Contact Details
                </h3>
                <span className="text-xs text-slate-400">Voucher will be emailed here</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Lead Guest Full Name (as per Passport / ID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => handleLeadNameChange(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address (for e-ticket &amp; voucher) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={user ? user.email : email}
                    readOnly={Boolean(user)}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 ${
                      user ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50/50 text-slate-900"
                    } text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all`}
                  />
                  {user && (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      ✓ Bound to your signed-in traveler account ({user.userCode || user.email})
                    </span>
                  )}
                </div>

                {/* Mobile Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Phone / WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={phoneCountry}
                      onChange={(e) => setPhoneCountry(e.target.value)}
                      className="px-2.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d]/g, ""))}
                      placeholder="9876543210"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Passenger / Traveler Names Breakdown */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-black">2</span>
                  {travelerRoleLabel}s Information ({totalTravelers} {travelerRoleLabel}{totalTravelers > 1 ? "s" : ""})
                </h3>
                <span className="text-xs text-slate-400">Required for voucher &amp; entry verification</span>
              </div>

              <div className="space-y-3">
                {travelersList.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                  >
                    <div className="w-28 shrink-0">
                      <span className="text-xs font-extrabold text-slate-700 block">
                        {travelerRoleLabel} {idx + 1}
                      </span>
                      <span className="text-[11px] text-teal-700 font-semibold">
                        {idx === 0 ? `★ Lead ${travelerRoleLabel}` : t.type}
                      </span>
                    </div>

                    {service === "visa" ? (
                      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-6">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Full Name (as per Passport) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={t.name}
                            onChange={(e) => handleTravelerChange(idx, "name", e.target.value)}
                            placeholder={`Full name for Applicant ${idx + 1}`}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Gender <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={t.gender || ""}
                            onChange={(e) => handleTravelerChange(idx, "gender", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="">Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={t.dateOfBirth || ""}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={(e) => handleTravelerChange(idx, "dateOfBirth", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Passport Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={t.passportNumber || ""}
                            onChange={(e) => handleTravelerChange(idx, "passportNumber", e.target.value.toUpperCase())}
                            placeholder="e.g. Z1234567"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-mono font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Passport Expiry Date <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={t.passportExpiry || ""}
                            min={travelDate}
                            onChange={(e) => handleTravelerChange(idx, "passportExpiry", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          {t.passportExpiry && travelDate && (() => {
                            const exp = new Date(t.passportExpiry).getTime();
                            const dep = new Date(travelDate).getTime();
                            const diffDays = Math.round((exp - dep) / (1000 * 60 * 60 * 24));
                            if (diffDays < 180) {
                              return (
                                <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                                  ⚠️ High Risk: &lt;6 months validity from departure date
                                </span>
                              );
                            }
                            return (
                              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                                ✓ Meets mandatory 6-month validity rule
                              </span>
                            );
                          })()}
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Nationality / Citizen of <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={t.nationality || nationalityParam || "India"}
                            onChange={(e) => handleTravelerChange(idx, "nationality", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            {COUNTRY_CODES.map((c) => (
                              <option key={c.country} value={c.country}>
                                {c.flag} {c.country}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => handleTravelerChange(idx, "name", e.target.value)}
                          placeholder={`Full name for ${travelerRoleLabel} ${idx + 1}`}
                          className="sm:col-span-8 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />

                        <select
                          value={t.gender || ""}
                          onChange={(e) => handleTravelerChange(idx, "gender", e.target.value)}
                          className="sm:col-span-4 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="">Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Special Requests & Preferences / Visa Documents */}
            {service === "visa" ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-black">3</span>
                    Visa Documentation Checklist &amp; Compliance Declarations
                  </h3>
                  <span className="text-xs text-blue-700 font-bold bg-blue-50 px-2.5 py-0.5 rounded-md">
                    100% Pre-Screen Guarantee
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <span className="text-emerald-600 font-bold text-sm">✓</span>
                    <div>
                      <span className="font-bold text-slate-800 block">Valid Passport Copy</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">Scanned color copy of first &amp; last page with 6+ months validity</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <span className="text-emerald-600 font-bold text-sm">✓</span>
                    <div>
                      <span className="font-bold text-slate-800 block">Passport-Sized Photograph</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">Recent photo with white background (taken within 3 months)</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <span className="text-emerald-600 font-bold text-sm">✓</span>
                    <div>
                      <span className="font-bold text-slate-800 block">Confirmed Flight Tickets</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">Round-trip ticket or onward journey itinerary</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <span className="text-emerald-600 font-bold text-sm">✓</span>
                    <div>
                      <span className="font-bold text-slate-800 block">Accommodation Proof</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">Hotel booking voucher or host invitation letter</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Special Notes or Embassy Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="e.g. Previous travel history, urgent departure date, or passport submitted for renewal."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-black">3</span>
                    Dietary &amp; Special Care Preferences
                  </h3>
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                    🌱 Pure Veg &amp; Jain Specialists
                  </span>
                </div>

                {/* Meal Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Select Meal &amp; Catering Preference:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-semibold">
                    {[
                      { id: "pureVeg", label: "🌱 Pure Vegetarian", desc: "100% Veg kitchen" },
                      { id: "jain", label: "🌿 Jain Meals", desc: "No onion, no garlic, no root veg" },
                      { id: "swaminarayan", label: "🕉️ Swaminarayan", desc: "Strict veg, no garlic" },
                      { id: "halal", label: "🍗 Halal", desc: "Certified Halal meals" },
                    ].map((meal) => (
                      <button
                        key={meal.id}
                        type="button"
                        onClick={() => setDietaryChoice(meal.id)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          dietaryChoice === meal.id
                            ? "border-teal-500 bg-teal-50/80 text-teal-900 ring-2 ring-teal-500/30"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span className="font-bold block">{meal.label}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{meal.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Special Notes Textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Special Requests / Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="e.g. High floor preference, airport pickup flight EK501 arriving at 14:30 Dubai T3, or wheelchair assistance required."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            {/* 5. Payment Options & Schedule */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-black">4</span>
                  Payment Schedule &amp; Method
                </h3>
                <span className="text-xs text-slate-400">100% Refundable Guarantee</span>
              </div>

              {/* Payment Plan: Full vs Book Now Pay Later */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Choose Payment Schedule:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentPlan("full")}
                    className={`p-4 rounded-2xl border text-left transition-all relative ${
                      paymentPlan === "full"
                        ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20 text-slate-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm">Pay In Full (100%)</span>
                      <span className="text-xs font-bold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Lock in your reservation instantly with zero pending balance on arrival.
                    </p>
                    <div className="mt-2 text-base font-black text-teal-800">
                      {currency}{grandTotal.toLocaleString()}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentPlan("later")}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      paymentPlan === "later"
                        ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 text-slate-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm">Book Now, Pay Later</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        20% Advance Token
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Pay only {currency}{payLaterAdvance.toLocaleString()} today. Pay balance {currency}{payLaterRemaining.toLocaleString()} on arrival.
                    </p>
                    <div className="mt-2 text-base font-black text-emerald-800">
                      Pay Today: {currency}{payLaterAdvance.toLocaleString()}
                    </div>
                  </button>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Payment Gateway:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold">
                  {[
                    { id: "card", title: "Credit / Debit Card", sub: "Visa, MC, RuPay, Amex", icon: "💳" },
                    { id: "upi", title: "UPI / QR Code", sub: "GPay, PhonePe, Paytm", icon: "⚡" },
                    { id: "netbanking", title: "Net Banking", sub: "All Major Banks", icon: "🏦" },
                    { id: "pay_on_arrival", title: "Pay on Arrival", sub: "Cash / Card at counter", icon: "💵" },
                  ].map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        paymentMethod === pm.id
                          ? "border-teal-500 bg-teal-50/70 text-teal-900 ring-2 ring-teal-500/30 font-bold"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-lg block mb-1">{pm.icon}</span>
                      <span className="block font-bold text-xs">{pm.title}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{pm.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Sticky CTA */}
            <div className="lg:hidden">
              {!user ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/booking";
                      router.push(`/${siteId}/en/login?returnUrl=${encodeURIComponent(currentUrl)}`);
                    }}
                    className="flex-1 py-3.5 rounded-2xl font-black text-white text-sm shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{ backgroundColor: brandPrimary }}
                  >
                    <span>🔒</span>
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/booking";
                      router.push(`/${siteId}/en/register?returnUrl=${encodeURIComponent(currentUrl)}`);
                    }}
                    className="flex-1 py-3.5 rounded-2xl font-bold border-2 border-slate-300 bg-white text-slate-800 text-sm shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Register</span>
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl font-black text-white text-base shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  style={{ backgroundColor: brandPrimary }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Reservation…</span>
                    </>
                  ) : (
                    <>
                      <span>🔒</span>
                      <span>Confirm &amp; Pay {currency}{currentPayable.toLocaleString()}</span>
                    </>
                  )}
                </button>
              )}
              {errorMessage && (
                <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <span className="text-sm">⚠️</span>
                  <span className="flex-1">{errorMessage}</span>
                </div>
              )}
            </div>
          </form>

          {/* Right Sticky Summary Sidebar (4 Cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
            {/* Order Breakdown Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Reservation Summary</span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                  Guaranteed Rate
                </span>
              </h3>

              {/* Item Overview with Real Image */}
              <div className="flex gap-3.5 items-start">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100 shadow-xs relative">
                  <img
                    src={displayImage}
                    alt={itemTitle}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = fallbackImage;
                    }}
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold border ${badge.color}`}>
                    <span>{badge.icon}</span>
                    <span>{badge.text}</span>
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                    {itemTitle}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    {selectedOption}
                  </p>
                  <p className="text-[11px] text-teal-700 font-semibold">
                    📅 {new Date(travelDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Promo Code Box */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Have a Promo / Coupon Code?
                </label>
                {appliedPromo ? (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-emerald-800 flex items-center gap-1">
                        <span>🏷️</span> {appliedPromo} APPLIED
                      </span>
                      <span className="text-[11px] text-emerald-600 font-semibold block">
                        Saved {currency}{promoDiscountAmount.toLocaleString()} on your order!
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder="e.g. GUJJU20 or TRIPGO15"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyPromo()}
                      className="px-3 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {promoError && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{promoError}</p>
                )}
                {/* Popular Coupons Pills */}
                {!appliedPromo && (
                  <div className="flex items-center gap-1.5 mt-2 overflow-x-auto text-[10px] text-slate-500 font-bold">
                    <span>Try:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyPromo("GUJJU20")}
                      className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 hover:bg-teal-100"
                    >
                      GUJJU20
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPromo("TRIPGO15")}
                      className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100"
                    >
                      TRIPGO15
                    </button>
                  </div>
                )}
              </div>

              {/* Itemized Calculation */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>{baseRateLabel}</span>
                  <span className="font-semibold text-slate-900">{currency}{baseSubtotal.toLocaleString()}</span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Promo Discount ({appliedPromo}):</span>
                    <span>−{currency}{promoDiscountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Taxes &amp; Tourism Service Fees ({taxRatePercent}%):</span>
                  <span className="font-semibold text-slate-900">{currency}{taxesAndFees.toLocaleString()}</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-sm font-extrabold text-slate-900">Total Price:</span>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black text-teal-700">
                      {currency}{grandTotal.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block">All Taxes &amp; Fees Included</span>
                  </div>
                </div>

                {paymentPlan === "later" && (
                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-amber-900">
                      <span>Due Today (20% Advance):</span>
                      <span>{currency}{payLaterAdvance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-amber-700">
                      <span>Due on Arrival (80%):</span>
                      <span>{currency}{payLaterRemaining.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop Submit CTA */}
              <div className="hidden lg:block pt-2">
                {!user ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/booking";
                        router.push(`/${siteId}/en/login?returnUrl=${encodeURIComponent(currentUrl)}`);
                      }}
                      className="w-full py-4 rounded-2xl font-black text-white text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 hover:opacity-95 cursor-pointer"
                      style={{ backgroundColor: brandPrimary }}
                    >
                      <span>🔒</span>
                      <span>Sign In to Complete Reservation</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/booking";
                        router.push(`/${siteId}/en/register?returnUrl=${encodeURIComponent(currentUrl)}`);
                      }}
                      className="w-full py-2.5 rounded-2xl font-bold border-2 border-slate-300 bg-white text-slate-700 text-xs shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 hover:bg-slate-50 cursor-pointer"
                    >
                      <span>New traveler? Register Account</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitBooking}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl font-black text-white text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 hover:opacity-95 cursor-pointer"
                    style={{ backgroundColor: brandPrimary }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing Reservation…</span>
                      </>
                    ) : (
                      <>
                        <span>🔒</span>
                        <span>Complete Reservation • {currency}{currentPayable.toLocaleString()}</span>
                      </>
                    )}
                  </button>
                )}
                {errorMessage && (
                  <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-700 text-xs font-semibold flex items-start gap-2">
                    <span className="text-sm">⚠️</span>
                    <span className="flex-1">{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Trust Badges Strip */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Free cancellation up to 48 hours prior</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-600 font-bold">✓</span>
                  <span>Instant e-ticket voucher issued with QR code</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>24/7 Concierge Hotline: {supportPhone}</span>
                </div>
              </div>
            </div>

            {/* Need Help Box */}
            <div className="p-5 rounded-3xl bg-slate-100/80 border border-slate-200/80 text-xs space-y-2">
              <span className="font-bold text-slate-800 block">Need help with this booking?</span>
              <p className="text-slate-600">
                Our reservation specialists are online 24/7 to assist with special dietary needs, flight connections, or group bookings.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <a
                  href={`tel:${supportPhone}`}
                  className="text-teal-700 font-bold hover:underline"
                >
                  📞 {supportPhone}
                </a>
                <span className="text-slate-300">|</span>
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-teal-700 font-bold hover:underline truncate"
                >
                  ✉️ {supportEmail}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer config={siteConfig} />
    </div>
  );
}
