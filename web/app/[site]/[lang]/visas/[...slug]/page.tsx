"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { getActualImageUrl } from "@/lib/imageUtils";
import EnquiryModal from "@/components/lead/EnquiryModal";

interface VisaFaqItem {
  question: string;
  answer: string;
}

interface VisaDetail {
  id: number | string;
  visaNumericId?: number;
  visaId?: string;
  country: string;
  countryCode: string;
  countrySlug: string;
  flag: string;
  continent: string;
  title: string;
  name?: string;
  slug: string;
  visaType: string;
  visaTypeLabel: string;
  validity: string;
  stayDuration: string;
  processingTime: string;
  entryType: string;
  fastTrackAvailable: boolean;
  price: number;
  originalPrice?: number;
  currency: string;
  image: string;
  documentsRequired: string[];
  approvalRate: number;
  rating: number;
  reviews: number;
  featured?: boolean;
  overview?: string;
  faqs?: VisaFaqItem[];
  submissionSteps?: string[];
}

const FALLBACK_VISA: VisaDetail = {
  id: 1001,
  visaNumericId: 1001,
  country: "United Arab Emirates",
  countryCode: "AE",
  countrySlug: "united-arab-emirates",
  flag: "🇦🇪",
  continent: "Middle East",
  title: "United Arab Emirates: 30-Day Single Entry Tourist eVisa",
  name: "United Arab Emirates: 30-Day Single Entry Tourist eVisa",
  slug: "united-arab-emirates-tourist-30-1001",
  visaType: "tourist",
  visaTypeLabel: "Tourist eVisa",
  validity: "60 Days from Date of Issue",
  stayDuration: "30 Days",
  processingTime: "3-4 Working Days",
  entryType: "Single Entry",
  fastTrackAvailable: false,
  price: 6730,
  originalPrice: 8650,
  currency: "INR",
  image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=85",
  documentsRequired: [
    "Valid Passport Copy with minimum 6 months validity from date of travel",
    "Recent Passport-Sized Photograph (white background, taken within 3 months)",
    "Confirmed Round-Trip Flight Itinerary / Return Air Ticket",
    "Confirmed Hotel Voucher or Proof of Accommodation",
  ],
  approvalRate: 99.4,
  rating: 4.9,
  reviews: 340,
  overview:
    "Comprehensive visa facilitation service for travel to United Arab Emirates. Our dedicated visa desk conducts a full pre-screening of your passport, travel itinerary, and documentation to guarantee swift approval with zero embassy delays.",
  faqs: [
    {
      question: "How long does it take to process the United Arab Emirates eVisa?",
      answer: "Standard processing takes 3-4 Working Days. Once approved by official immigration authorities, your eVisa is instantly dispatched via email and WhatsApp.",
    },
    {
      question: "Can I extend my stay beyond 30 Days?",
      answer: "Extensions depend on local immigration regulations. You can consult our visa desk prior to departure for country-specific extension policies.",
    },
    {
      question: "What happens if there is an error in my uploaded documents?",
      answer: "Our pre-screening verification desk immediately checks your documents within 2 hours of upload and flags any issues before official embassy submission.",
    },
  ],
  submissionSteps: [
    "Submit Application Online: Fill traveler details and securely upload passport copy and photograph.",
    "Expert Pre-Screening: Our visa documentation specialist verifies every detail within 2 hours.",
    "Government / Immigration Submission: Application processed with official authorities.",
    "Receive Approved eVisa: Approved visa PDF delivered directly to email and WhatsApp.",
  ],
};

export default function VisaDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const config = useSiteConfig();
  const site = useSite();
  const { user } = useAuth();

  const siteId = site.siteId || "gujjutours";
  const currencySymbol = config.currencySymbol || (siteId === "gujjutours" ? "₹" : "$");

  const slugParam = params?.slug;
  const visaPath = Array.isArray(slugParam)
    ? slugParam[slugParam.length - 1]
    : typeof slugParam === "string"
    ? slugParam
    : "";

  const [visa, setVisa] = useState<VisaDetail>(FALLBACK_VISA);
  const [siblingVisas, setSiblingVisas] = useState<VisaDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [travelers, setTravelers] = useState(1);
  const [travelDate, setTravelDate] = useState(() => {
    return searchParams.get("travelDate") || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      return d.toISOString().split("T")[0];
    })();
  });
  const nationality = searchParams.get("nationality") || (siteId === "gujjutours" ? "India" : "United States");
  const livingCountry = searchParams.get("livingCountry") || nationality;
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Fast-track Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicantName, setApplicantName] = useState(user?.fullName || "");
  const [applicantEmail, setApplicantEmail] = useState(user?.email || "");
  const [applicantPhone, setApplicantPhone] = useState(user?.phone || "");
  const [applicantDob, setApplicantDob] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [applicantNationality, setApplicantNationality] = useState(nationality);
  const [docConsent, setDocConsent] = useState(true);
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Passport Validity Tool State
  const [checkExpiryDate, setCheckExpiryDate] = useState("");
  const [isValidatingPassport, setIsValidatingPassport] = useState(false);
  const [passportCheckResult, setPassportCheckResult] = useState<{
    isValid?: boolean;
    status?: string;
    message?: string;
    monthsRemaining?: number;
    daysRemainingOnDeparture?: number;
  } | null>(null);

  // Auto-fill applicant details if user logs in
  useEffect(() => {
    if (user) {
      if (user.fullName && !applicantName) setApplicantName(user.fullName);
      if (user.email && !applicantEmail) setApplicantEmail(user.email);
      if (user.phone && !applicantPhone) setApplicantPhone(user.phone);
    }
  }, [user, applicantName, applicantEmail, applicantPhone]);

  useEffect(() => {
    if (!visaPath) return;

    let isMounted = true;
    async function loadVisaData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/visas/${encodeURIComponent(visaPath)}?site=${encodeURIComponent(siteId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.isCountry && Array.isArray(json.data) && json.data.length > 0) {
            if (isMounted) {
              setVisa(json.data[0]);
              setSiblingVisas(json.data);
            }
          } else if (json.data) {
            if (isMounted) {
              setVisa(json.data);
              // Fetch siblings for the same country
              if (json.data.countrySlug) {
                fetch(`/api/visas?country=${encodeURIComponent(json.data.countrySlug)}&site=${encodeURIComponent(siteId)}`)
                  .then((r) => r.json())
                  .then((sJson) => {
                    if (sJson.success && Array.isArray(sJson.data)) {
                      setSiblingVisas(sJson.data);
                    }
                  })
                  .catch(() => {});
              }
            }
          }
        }
      } catch (err) {
        console.error("[Visa Detail Load Error]", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadVisaData();
    return () => {
      isMounted = false;
    };
  }, [visaPath, siteId]);

  const totalPrice = visa.price * travelers;
  const totalOriginalPrice = visa.originalPrice ? visa.originalPrice * travelers : null;

  const handleApplyNow = () => {
    const tax = Math.round(totalPrice * 0.05);
    const grandTotal = totalPrice + tax;
    const primaryImg = visa.image || "";

    const bookingParams = new URLSearchParams({
      service: "visa",
      serviceType: "visa",
      id: String(visa.id || visa.slug),
      slug: visa.slug,
      title: visa.title || `${visa.country}: ${visa.visaTypeLabel}`,
      name: visa.title || `${visa.country}: ${visa.visaTypeLabel}`,
      country: visa.country,
      destination: visa.country,
      option: `${visa.visaTypeLabel} (${visa.validity || "Standard"})`,
      date: travelDate,
      travelDate: travelDate,
      travelers: String(travelers),
      adults: String(travelers),
      nationality: nationality,
      price: String(visa.price),
      unitPrice: String(visa.price),
      subtotal: String(totalPrice),
      tax: String(tax),
      total: String(grandTotal),
      totalPrice: String(grandTotal),
      currency: visa.currency || (siteId === "gujjutours" ? "INR" : "USD"),
      image: primaryImg,
      imageUrl: primaryImg,
    });
    router.push(`/booking?${bookingParams.toString()}`);
  };

  const handleCheckValidity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkExpiryDate) return;
    setIsValidatingPassport(true);
    setPassportCheckResult(null);

    try {
      const res = await fetch("/api/visa/check-validity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passportExpiryDate: checkExpiryDate,
          tripDepartureDate: travelDate,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setPassportCheckResult(json.data);
      } else {
        setPassportCheckResult({
          isValid: false,
          message: json.message || "Unable to determine passport validity.",
        });
      }
    } catch {
      setPassportCheckResult({
        isValid: false,
        message: "Failed to connect to passport validity clearance service.",
      });
    } finally {
      setIsValidatingPassport(false);
    }
  };

  const handleSubmitVisaApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppError(null);

    if (!applicantName.trim()) {
      setAppError("Please enter full name as printed on passport.");
      return;
    }
    if (!applicantEmail.trim() || !applicantEmail.includes("@")) {
      setAppError("Please enter a valid email address for receiving your visa.");
      return;
    }
    if (!applicantPhone.trim() || applicantPhone.length < 6) {
      setAppError("Please enter a valid WhatsApp & mobile number.");
      return;
    }
    if (!passportNumber.trim() || passportNumber.length < 5) {
      setAppError("Please enter a valid passport number (at least 6 characters).");
      return;
    }
    if (!passportExpiry) {
      setAppError("Please enter your passport expiration date.");
      return;
    }

    setIsSubmittingApp(true);
    try {
      const tax = Math.round(totalPrice * 0.05);
      const grandTotal = totalPrice + tax;

      const payload = {
        service: "visa",
        serviceType: "visa",
        module: "visa",
        itemId: String(visa.id || visa.slug),
        slug: visa.slug,
        title: visa.title || `${visa.country}: ${visa.visaTypeLabel}`,
        destination: visa.country,
        travelDate: travelDate,
        startDate: travelDate,
        travelers: travelers,
        adults: travelers,
        guestName: applicantName.trim(),
        email: applicantEmail.trim().toLowerCase(),
        phone: applicantPhone.trim(),
        unitPrice: visa.price,
        subtotal: totalPrice,
        taxes: tax,
        totalPrice: grandTotal,
        amountPaid: grandTotal,
        currency: visa.currency || (siteId === "gujjutours" ? "INR" : "USD"),
        travelersList: [
          {
            id: "lead_applicant",
            name: applicantName.trim(),
            type: "Adult",
            gender: "Male",
            passportNumber: passportNumber.trim().toUpperCase(),
            passportExpiry: passportExpiry,
            dateOfBirth: applicantDob || undefined,
            nationality: applicantNationality || nationality,
          },
        ],
        specialRequests: `Fast-Track Visa Online Application | Country: ${visa.country} | Passport: ${passportNumber.trim().toUpperCase()} | Expiry: ${passportExpiry} | Nationality: ${applicantNationality || nationality}`,
        paymentMethod: "card",
        paymentPlan: "full",
        paymentStatus: "paid",
        source: "web",
      };

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
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || json?.message || "Visa application could not be submitted. Please try again.");
      }

      const booking = json.data || json;
      setConfirmedBooking(booking);

      try {
        sessionStorage.setItem("toursapp_latest_booking", JSON.stringify(booking));
        localStorage.setItem("toursapp_latest_booking", JSON.stringify(booking));
        const refs = JSON.parse(localStorage.getItem("customer_booking_refs") || "[]");
        if (booking.reference && !refs.includes(booking.reference)) {
          refs.unshift(booking.reference);
          localStorage.setItem("customer_booking_refs", JSON.stringify(refs));
        }
      } catch {}
    } catch (err: any) {
      console.error("[Visa Application Submit Error]", err);
      setAppError(err.message || "Failed to submit visa application.");
    } finally {
      setIsSubmittingApp(false);
    }
  };

  if (loading && !visa) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const displayImg = getActualImageUrl(visa.image, {
    title: visa.title,
    city: visa.country,
    module: "visas",
    id: visa.id || visa.slug,
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* 1. Breadcrumbs */}
      <nav className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href="/visas" className="hover:text-blue-600">Visas</Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">{visa.country}</span>
          <span>/</span>
          <span className="text-slate-500 truncate max-w-xs">{visa.visaTypeLabel}</span>
        </div>
      </nav>

      {/* 2. Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Details, Tiers, Documents, Steps, FAQs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-2xl">{visa.flag}</span>
                <span className="bg-blue-50 text-blue-700 text-xs font-black uppercase px-2.5 py-0.5 rounded-full">
                  {visa.country}
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span>✓</span>
                  <span>{visa.approvalRate}% Approval Guarantee</span>
                </span>
                {visa.fastTrackAvailable && (
                  <span className="bg-amber-50 text-amber-700 text-xs font-black px-2.5 py-0.5 rounded-full">
                    ⚡ Fast-Track Available
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {visa.title}
              </h1>

              <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center text-amber-500 font-bold">
                  <span>★</span>
                  <span className="ml-1 text-slate-800">{visa.rating}</span>
                </div>
                <span>•</span>
                <span>{visa.reviews} verified applicants</span>
                <span>•</span>
                <span>Citizen of: <strong className="text-slate-700">{nationality}</strong> (Resident of {livingCountry})</span>
              </div>

              {/* Sibling Visa Tier Switcher Strip */}
              {siblingVisas.length > 1 && (
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Available Visa Options for {visa.country}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {siblingVisas.map((s) => {
                      const isActive = s.slug === visa.slug;
                      return (
                        <button
                          key={s.slug}
                          type="button"
                          onClick={() => setVisa(s)}
                          className={`p-3 rounded-xl border text-left transition ${
                            isActive
                              ? "border-blue-600 bg-blue-50/60 ring-1 ring-blue-600"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">{s.visaTypeLabel}</span>
                            <span className="text-xs font-extrabold text-blue-600">
                              {currencySymbol}{s.price.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                            <span>Stay: {s.stayDuration}</span>
                            <span>•</span>
                            <span>{s.processingTime}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Visual Overview Card */}
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="relative h-64 bg-slate-100">
                <Image
                  src={displayImg}
                  alt={visa.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-xs uppercase font-extrabold tracking-wider bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-md">
                    {visa.country} • {visa.visaTypeLabel}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-base font-bold text-slate-900 mb-2">Overview & Scope</h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {visa.overview}
                </p>

                {/* Key Specifications Grid */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Validity</span>
                    <strong className="text-slate-800">{visa.validity}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Max Stay</span>
                    <strong className="text-slate-800">{visa.stayDuration}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Turnaround</span>
                    <strong className="text-slate-800">{visa.processingTime}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Entry Permitted</span>
                    <strong className="text-slate-800">{visa.entryType}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Required Documents Checklist */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">📋</span>
                <h2 className="text-lg font-bold text-slate-900">Required Documents Checklist</h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                High-quality digital smartphone photos or scans are 100% acceptable. No physical courier needed.
              </p>

              <div className="space-y-3">
                {visa.documentsRequired?.map((doc, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="text-emerald-600 font-bold text-sm">✓</span>
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800">{doc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6-Month Passport Rule Eligibility Checker Tool */}
            <div className="bg-white rounded-2xl p-6 border border-blue-200 bg-gradient-to-br from-blue-50/40 via-white to-slate-50 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛂</span>
                  <h3 className="text-base font-bold text-slate-900">Verify Passport Eligibility (6-Month Rule)</h3>
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                  Live API Verification
                </span>
              </div>
              <p className="text-xs text-slate-600">
                International immigration regulations strictly mandate that your passport must have at least <strong>6 months of remaining validity</strong> from your expected travel date ({travelDate}). Check your passport clearance status below:
              </p>

              <form onSubmit={handleCheckValidity} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Your Passport Expiration Date
                  </label>
                  <input
                    type="date"
                    required
                    value={checkExpiryDate}
                    onChange={(e) => setCheckExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="sm:self-end">
                  <button
                    type="submit"
                    disabled={isValidatingPassport || !checkExpiryDate}
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {isValidatingPassport ? "Checking..." : "Verify Passport Status"}
                  </button>
                </div>
              </form>

              {passportCheckResult && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  passportCheckResult.isValid
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <span>{passportCheckResult.isValid ? "✓ PASS:" : "⚠️ WARNING:"}</span>
                    <span>{passportCheckResult.status || (passportCheckResult.isValid ? "Eligible" : "Risk Detected")}</span>
                    {typeof passportCheckResult.monthsRemaining === "number" && (
                      <span className="text-[11px] font-normal opacity-80">
                        ({passportCheckResult.monthsRemaining} months remaining)
                      </span>
                    )}
                  </div>
                  <p>{passportCheckResult.message}</p>
                </div>
              )}
            </div>

            {/* 4-Step Application Roadmap */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🚀</span>
                <h2 className="text-lg font-bold text-slate-900">Application & Approval Process</h2>
              </div>

              <div className="space-y-4">
                {(visa.submissionSteps || FALLBACK_VISA.submissionSteps!).map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="text-xs text-slate-700 mt-1 leading-relaxed">
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            {visa.faqs && visa.faqs.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">💬</span>
                  <h2 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h2>
                </div>

                <div className="space-y-2">
                  {visa.faqs.map((faq, idx) => {
                    const isOpen = activeFaq === idx;
                    return (
                      <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setActiveFaq(isOpen ? null : idx)}
                          className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 text-left text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer"
                        >
                          <span>{faq.question}</span>
                          <span className="text-slate-400 text-sm">{isOpen ? "−" : "+"}</span>
                        </button>
                        {isOpen && (
                          <div className="p-3.5 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Fare Card & Application Controls */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-lg space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">All-Inclusive Government &amp; Visa Fee</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-slate-900">
                    {currencySymbol}{visa.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ traveler</span>
                </div>
                {totalOriginalPrice && totalOriginalPrice > totalPrice && (
                  <div className="text-xs text-slate-400 line-through mt-0.5">
                    Original Fee: {currencySymbol}{totalOriginalPrice.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Form Controls */}
              <div className="space-y-4 text-xs">
                {/* Number of Travelers */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                    Number of Travelers
                  </label>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                    <span className="font-bold text-slate-800">{travelers} Traveler(s)</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTravelers((prev) => Math.max(1, prev - 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold hover:bg-slate-100 cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setTravelers((prev) => Math.min(10, prev + 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold hover:bg-slate-100 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expected Travel Date */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                    Expected Departure Date
                  </label>
                  <input
                    type="date"
                    value={travelDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Total Summary */}
                <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Fee ({travelers}x):</span>
                    <span>{currencySymbol}{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Pre-Screening Verification:</span>
                    <span className="text-emerald-700 font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>WhatsApp / SMS Alerts:</span>
                    <span className="text-emerald-700 font-bold">FREE</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between font-black text-slate-900 text-sm">
                    <span>Total Amount:</span>
                    <span className="text-blue-700">{currencySymbol}{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmedBooking(null);
                    setAppError(null);
                    setShowApplyModal(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>⚡ Apply Online (Fast-Track)</span>
                  <span>→</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyNow}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl border border-slate-200 transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Proceed to Full Checkout</span>
                  <span>↗</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEnquiry(true)}
                  className="w-full bg-white hover:bg-slate-50 text-slate-600 font-semibold py-2 px-4 rounded-xl border border-slate-200 transition text-[11px] cursor-pointer"
                >
                  Need Help? Request Callback
                </button>
              </div>

              {/* Trust badges */}
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>100% Pre-Screening Before Submission</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Official Embassy Receipt &amp; PDF Visa</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Full Refund if Pre-Screen Fails Eligibility</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fast-Track Online Visa Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-8">
            <button
              type="button"
              onClick={() => setShowApplyModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              ✕
            </button>

            {confirmedBooking ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 text-3xl flex items-center justify-center mx-auto">
                  ✓
                </div>
                <h3 className="text-2xl font-black text-slate-900">
                  Visa Application Submitted!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your electronic visa application for <strong>{visa.country}</strong> has been received by our consular facilitation desk.
                </p>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Booking Reference:</span>
                    <strong className="text-blue-700 font-mono text-sm">{confirmedBooking.reference}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Applicant:</span>
                    <span className="font-bold text-slate-800">{applicantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Turnaround:</span>
                    <span className="font-bold text-slate-800">{visa.processingTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <strong className="text-emerald-700">{currencySymbol}{(totalPrice + Math.round(totalPrice * 0.05)).toLocaleString()}</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Confirmation voucher dispatched to <strong>{applicantEmail}</strong>. Our documentation specialist will begin pre-screening within 2 hours.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApplyModal(false);
                      router.push(`/booking/confirmation?ref=${encodeURIComponent(confirmedBooking.reference)}`);
                    }}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                  >
                    View Full Booking Voucher →
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitVisaApplication} className="space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    {visa.country} • {visa.visaTypeLabel}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2">
                    Fast-Track Visa Online Application
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Total Fee: <strong>{currencySymbol}{(totalPrice + Math.round(totalPrice * 0.05)).toLocaleString()}</strong> (incl. government &amp; pre-screening fees)
                  </p>
                </div>

                {appError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                    {appError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Lead Applicant Full Name (as per Passport) *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Email Address (for eVisa PDF) *
                    </label>
                    <input
                      type="email"
                      required
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Passport Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. Z1234567"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Passport Expiration Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={passportExpiry}
                      min={travelDate}
                      onChange={(e) => setPassportExpiry(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={applicantDob}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setApplicantDob(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Passport Issuing Country / Nationality
                    </label>
                    <select
                      value={applicantNationality}
                      onChange={(e) => setApplicantNationality(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    >
                      {["India", "United States", "United Kingdom", "United Arab Emirates", "Canada", "Australia", "Singapore", "Malaysia", "Germany", "France"].map((nat) => (
                        <option key={nat} value={nat}>{nat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docConsent}
                      onChange={(e) => setDocConsent(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      I declare that I possess an original passport valid for at least 6 months, confirmed round-trip flight tickets, and hotel accommodation proof for immigration clearance.
                    </span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingApp || !docConsent}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmittingApp ? (
                      <span>Submitting to Consular Desk via API...</span>
                    ) : (
                      <span>Confirm &amp; Submit Visa Application →</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Enquiry Modal */}
      {showEnquiry && (
        <EnquiryModal
          isOpen={showEnquiry}
          onClose={() => setShowEnquiry(false)}
          serviceName={visa.title}
          defaultDestination={visa.country}
          siteId={siteId}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}
