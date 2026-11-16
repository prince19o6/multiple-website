"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import EnquiryModal from "@/components/lead/EnquiryModal";

interface DurationOption {
  id: string;
  nights: number;
  days: number;
  label: string;
  priceMultiplier: number;
}

interface FlightOption {
  id: string;
  name: string;
  type: string;
  airline: string;
  baggage: string;
  meals: string;
  pricePerPerson: number;
  netPricePerPerson?: number | null;
  image: string;
}

interface HotelTier {
  id: string;
  tierName: string;
  starRating: number;
  hotelName: string;
  highlights: string;
  inclusions: string[];
  pricePerPerson: number;
  netPricePerPerson?: number | null;
  image: string;
}

interface ActivityOption {
  id: string;
  name: string;
  duration: string;
  description: string;
  pricePerPerson: number;
  netPricePerPerson?: number | null;
  image: string;
  isRecommended: boolean;
}

interface TransferOption {
  id: string;
  name: string;
  vehicleClass: string;
  capacity: string;
  luggage: string;
  priceTotal: number;
  netPriceTotal?: number | null;
  image: string;
}

interface VisaOption {
  id: string;
  name: string;
  processingTime: string;
  validity: string;
  pricePerPerson: number;
  netPricePerPerson?: number | null;
  image: string;
  isRequired: boolean;
}

interface MealPlan {
  id: string;
  name: string;
  description: string;
  pricePerPerson: number;
  netPricePerPerson?: number | null;
}

interface DestinationTemplate {
  id: number;
  destinationNumericId: number;
  destinationId: string;
  destinationSlug: string;
  destinationName: string;
  country: string;
  flag: string;
  tagline: string;
  badge: string;
  overview: string;
  heroImage: string;
  image: string;
  images: string[];
  popular: boolean;
  featured: boolean;
  rating: number;
  reviews: number;
  startingPrice: number;
  netStartingPrice?: number | null;
  currency: string;
  currencySymbol: string;
  durations: DurationOption[];
  flightOptions: FlightOption[];
  hotelTiers: HotelTier[];
  activityOptions: ActivityOption[];
  transferOptions: TransferOption[];
  visaOptions: VisaOption[];
  mealPlans: MealPlan[];
  customInclusions: string[];
  customExclusions: string[];
}

export default function BuildPackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const config = useSiteConfig();
  const site = useSite();

  const siteId = site.siteId || "gujjutours";
  const currencySymbol = config.currencySymbol || (siteId === "gujjutours" ? "₹" : siteId === "technoheaven" ? "AED " : "$");
  const isTechnoheaven = siteId === "technoheaven";

  // Slug extraction
  const slugArray = (params?.slug as string[]) || [];
  const targetSlug = slugArray[slugArray.length - 1] || slugArray[0] || "";

  // Data state
  const [destination, setDestination] = useState<DestinationTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configuration wizard state
  const [selectedDurationId, setSelectedDurationId] = useState<string>("");
  const [selectedFlightId, setSelectedFlightId] = useState<string>("");
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [selectedTransferId, setSelectedTransferId] = useState<string>("");
  const [selectedVisaId, setSelectedVisaId] = useState<string>("");
  const [selectedMealId, setSelectedMealId] = useState<string>("");

  // Travelers & Dates
  const [adultsCount, setAdultsCount] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [travelDate, setTravelDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });

  const [enquiryOpen, setEnquiryOpen] = useState(false);

  // Fetch destination template details
  useEffect(() => {
    let mounted = true;
    async function loadOption() {
      if (!targetSlug) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/buildpackage/${encodeURIComponent(targetSlug)}`);
        if (!res.ok) throw new Error("Custom package template not found");
        const json = await res.json();
        if (mounted && json.success && json.data) {
          const dest = json.data as DestinationTemplate;
          setDestination(dest);
          setSelectedDurationId(dest.durations[0]?.id || "");
          setSelectedFlightId(dest.flightOptions[0]?.id || "");
          setSelectedHotelId(dest.hotelTiers[1]?.id || dest.hotelTiers[0]?.id || "");
          setSelectedActivityIds(dest.activityOptions.filter((a) => a.isRecommended).map((a) => a.id));
          setSelectedTransferId(dest.transferOptions[0]?.id || "");
          setSelectedVisaId(dest.visaOptions[0]?.id || "");
          setSelectedMealId(dest.mealPlans[0]?.id || "");
        }
      } catch (err: any) {
        if (mounted) setError(err.message || "Unable to load custom package");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadOption();
    return () => {
      mounted = false;
    };
  }, [targetSlug]);

  const toggleActivity = useCallback((actId: string) => {
    setSelectedActivityIds((prev) =>
      prev.includes(actId) ? prev.filter((id) => id !== actId) : [...prev, actId]
    );
  }, []);

  const totalTravelers = Math.max(1, adultsCount + childrenCount);

  const priceBreakdown = useMemo(() => {
    if (!destination) {
      return {
        flightsTotal: 0,
        hotelTotal: 0,
        activitiesTotal: 0,
        transfersTotal: 0,
        visaTotal: 0,
        mealsTotal: 0,
        grandTotal: 0,
        netGrandTotal: 0,
        perTravelerPrice: 0,
      };
    }

    const duration = destination.durations.find((d) => d.id === selectedDurationId) || destination.durations[0];
    const durationMult = duration ? duration.priceMultiplier : 1.0;

    const flight = destination.flightOptions.find((f) => f.id === selectedFlightId);
    const flightPerPerson = flight ? flight.pricePerPerson : 0;
    const flightNetPerPerson = flight?.netPricePerPerson ?? flightPerPerson;
    const flightsTotal = flightPerPerson * totalTravelers;
    const flightsNetTotal = flightNetPerPerson * totalTravelers;

    const hotel = destination.hotelTiers.find((h) => h.id === selectedHotelId);
    const hotelBase = hotel ? hotel.pricePerPerson : 0;
    const hotelNetBase = hotel?.netPricePerPerson ?? hotelBase;
    const hotelPerPerson = Math.round(hotelBase * durationMult);
    const hotelNetPerPerson = Math.round(hotelNetBase * durationMult);
    const hotelTotal = hotelPerPerson * totalTravelers;
    const hotelNetTotal = hotelNetPerPerson * totalTravelers;

    let activitiesTotal = 0;
    let activitiesNetTotal = 0;
    selectedActivityIds.forEach((actId) => {
      const act = destination.activityOptions.find((a) => a.id === actId);
      if (act) {
        activitiesTotal += act.pricePerPerson * totalTravelers;
        activitiesNetTotal += (act.netPricePerPerson ?? act.pricePerPerson) * totalTravelers;
      }
    });

    const transfer = destination.transferOptions.find((t) => t.id === selectedTransferId);
    const transfersTotal = transfer ? transfer.priceTotal : 0;
    const transfersNetTotal = transfer?.netPriceTotal ?? transfersTotal;

    const visa = destination.visaOptions.find((v) => v.id === selectedVisaId);
    const visaPerPerson = visa ? visa.pricePerPerson : 0;
    const visaNetPerPerson = visa?.netPricePerPerson ?? visaPerPerson;
    const visaTotal = visaPerPerson * totalTravelers;
    const visaNetTotal = visaNetPerPerson * totalTravelers;

    const meal = destination.mealPlans.find((m) => m.id === selectedMealId);
    const mealPerPerson = meal ? Math.round(meal.pricePerPerson * durationMult) : 0;
    const mealNetPerPerson = meal?.netPricePerPerson ? Math.round(meal.netPricePerPerson * durationMult) : mealPerPerson;
    const mealsTotal = mealPerPerson * totalTravelers;
    const mealsNetTotal = mealNetPerPerson * totalTravelers;

    const grandTotal = flightsTotal + hotelTotal + activitiesTotal + transfersTotal + visaTotal + mealsTotal;
    const netGrandTotal = flightsNetTotal + hotelNetTotal + activitiesNetTotal + transfersNetTotal + visaNetTotal + mealsNetTotal;
    const perTravelerPrice = Math.round(grandTotal / totalTravelers);

    return {
      flightsTotal,
      hotelTotal,
      activitiesTotal,
      transfersTotal,
      visaTotal,
      mealsTotal,
      grandTotal,
      netGrandTotal,
      perTravelerPrice,
    };
  }, [
    destination,
    selectedDurationId,
    selectedFlightId,
    selectedHotelId,
    selectedActivityIds,
    selectedTransferId,
    selectedVisaId,
    selectedMealId,
    totalTravelers,
  ]);

  const handleProceedBooking = () => {
    if (!destination) return;
    const subtotal = Math.round(priceBreakdown.grandTotal / 1.05);
    const tax = priceBreakdown.grandTotal - subtotal;
    const primaryImg = destination.image || destination.heroImage || destination.images?.[0] || "";

    const query = new URLSearchParams({
      service: "buildpackage",
      serviceType: "buildpackage",
      destination: destination.destinationSlug,
      title: `${destination.destinationName} Custom Package`,
      name: `${destination.destinationName} Custom Package`,
      option: `${selectedDurationId} Custom Vacation Package`,
      duration: selectedDurationId,
      hotel: selectedHotelId,
      flight: selectedFlightId,
      activities: selectedActivityIds.join(","),
      transfer: selectedTransferId,
      visa: selectedVisaId,
      meal: selectedMealId,
      travelers: String(totalTravelers),
      adults: String(adultsCount),
      children: String(childrenCount),
      date: travelDate,
      price: String(subtotal),
      unitPrice: String(subtotal),
      subtotal: String(subtotal),
      tax: String(tax),
      total: String(priceBreakdown.grandTotal),
      totalPrice: String(priceBreakdown.grandTotal),
      currency: destination.currency || "INR",
      image: primaryImg,
      imageUrl: primaryImg,
    });
    router.push(`/booking?${query.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-3"></div>
          <p className="text-slate-600 font-medium">Configuring Custom Package...</p>
        </div>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 text-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <div className="text-4xl mb-3">🧭</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Package Template Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">{error || "Destination not available"}</p>
          <Link
            href="/buildpackage"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm shadow hover:bg-blue-700"
          >
            ← View All Custom Packages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Breadcrumbs & Header */}
      <section className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <nav className="text-xs text-slate-300 flex items-center gap-2 mb-3">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/buildpackage" className="hover:text-white">Build Package</Link>
            <span>/</span>
            <span className="text-white font-semibold">{destination.destinationName}</span>
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-sky-200 border border-sky-400/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
                <span>{destination.flag} {destination.country}</span>
                <span>•</span>
                <span>{destination.badge}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                Customize {destination.destinationName} Package
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl">
                {destination.tagline}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-300 block">Starting From</span>
              <span className="text-3xl font-extrabold text-amber-300">
                {currencySymbol}{destination.startingPrice.toLocaleString()}
              </span>
              <span className="text-xs text-slate-300 block">/ person</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 8 cols: Customization components */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Duration & Travelers */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">1. Duration & Schedule</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Duration</label>
                  <div className="grid grid-cols-2 gap-2">
                    {destination.durations.map((dur) => (
                      <button
                        key={dur.id}
                        type="button"
                        onClick={() => setSelectedDurationId(dur.id)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                          selectedDurationId === dur.id
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Date</label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full text-xs font-medium p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Travelers</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-between">
                      <span className="text-xs text-slate-600 pl-2">Adults</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{adultsCount}</span>
                        <button
                          type="button"
                          onClick={() => setAdultsCount(adultsCount + 1)}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-between">
                      <span className="text-xs text-slate-600 pl-2">Kids</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{childrenCount}</span>
                        <button
                          type="button"
                          onClick={() => setChildrenCount(childrenCount + 1)}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Flights */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3">2. Air Travel</h3>
              <div className="space-y-3">
                {destination.flightOptions.map((flight) => {
                  const isSelected = selectedFlightId === flight.id;
                  return (
                    <div
                      key={flight.id}
                      onClick={() => setSelectedFlightId(flight.id)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="flightChoiceDetail"
                          checked={isSelected}
                          onChange={() => setSelectedFlightId(flight.id)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{flight.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {flight.airline} • {flight.baggage} • {flight.meals}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-extrabold text-blue-700">
                        {flight.pricePerPerson > 0 ? `+ ${currencySymbol}${flight.pricePerPerson.toLocaleString()} / pax` : "Included (0 Cost)"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Hotel */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3">3. Accommodation Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {destination.hotelTiers.map((tier) => {
                  const isSelected = selectedHotelId === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedHotelId(tier.id)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-sm"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-blue-700 uppercase">{tier.tierName}</span>
                          <span className="text-amber-500 text-xs">{"★".repeat(tier.starRating)}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{tier.hotelName}</h4>
                        <p className="text-xs text-slate-500 mt-1 italic">{tier.highlights}</p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {currencySymbol}{tier.pricePerPerson.toLocaleString()} / pax
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Activities */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900">4. Sightseeing Experiences</h3>
                <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-semibold">
                  {selectedActivityIds.length} Selected
                </span>
              </div>
              <div className="space-y-3">
                {destination.activityOptions.map((act) => {
                  const isChecked = selectedActivityIds.includes(act.id);
                  return (
                    <div
                      key={act.id}
                      onClick={() => toggleActivity(act.id)}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isChecked
                          ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleActivity(act.id)}
                          className="mt-1 w-4 h-4 text-emerald-600 rounded"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{act.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">⏱️ {act.duration}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-slate-900">
                          +{currencySymbol}{act.pricePerPerson.toLocaleString()} / pax
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 5: Transfers */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3">5. Airport & Local Transfers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {destination.transferOptions.map((tr) => {
                  const isSelected = selectedTransferId === tr.id;
                  return (
                    <div
                      key={tr.id}
                      onClick={() => setSelectedTransferId(tr.id)}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{tr.name}</div>
                        <div className="text-xs text-slate-500 mt-1">👥 {tr.capacity} • 🧳 {tr.luggage}</div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-700">
                          {tr.priceTotal > 0 ? `+ ${currencySymbol}${tr.priceTotal.toLocaleString()} total` : "Self Managed (0 Cost)"}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 4 cols: Sticky summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Package Summary</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">{destination.destinationName}</h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  {travelDate} • {totalTravelers} Travelers
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Flights ({totalTravelers} Pax):</span>
                  <span className="font-semibold text-slate-900">{currencySymbol}{priceBreakdown.flightsTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hotel Stay:</span>
                  <span className="font-semibold text-slate-900">{currencySymbol}{priceBreakdown.hotelTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sightseeing Tours:</span>
                  <span className="font-semibold text-slate-900">{currencySymbol}{priceBreakdown.activitiesTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ground Transfers:</span>
                  <span className="font-semibold text-slate-900">{currencySymbol}{priceBreakdown.transfersTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Visa Assistance:</span>
                  <span className="font-semibold text-slate-900">{currencySymbol}{priceBreakdown.visaTotal.toLocaleString()}</span>
                </div>
                {isTechnoheaven && (
                  <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between text-emerald-700 font-semibold">
                    <span>B2B Agency Net Total:</span>
                    <span>{currencySymbol}{priceBreakdown.netGrandTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-700">Total Price:</span>
                  <span className="text-2xl font-extrabold text-blue-700">
                    {currencySymbol}{priceBreakdown.grandTotal.toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 text-right mb-4">
                  ≈ {currencySymbol}{priceBreakdown.perTravelerPrice.toLocaleString()} / person
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleProceedBooking}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md text-sm"
                  >
                    Book Customized Package
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnquiryOpen(true)}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-semibold border border-slate-300 rounded-xl text-xs"
                  >
                    Request Custom Agent Quote
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {enquiryOpen && (
        <EnquiryModal
          isOpen={enquiryOpen}
          onClose={() => setEnquiryOpen(false)}
          serviceName={`${destination.destinationName} Custom Package`}
          defaultDestination={destination.country}
          siteId={siteId}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}
