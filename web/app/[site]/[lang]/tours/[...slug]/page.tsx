"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import EnquiryModal from "@/components/lead/EnquiryModal";

interface PackageOption {
  id: string;
  title: string;
  description: string;
  price: number;
  hotelPickup?: boolean;
  mealsIncluded?: boolean;
}

interface TourDetail {
  id: string;
  tourNumericId?: number;
  name: string;
  title: string;
  category: string;
  categorySlug?: string;
  destination: string;
  city: string;
  location: string;
  duration: string;
  price: number;
  originalPrice?: number;
  currency: string;
  rating: number;
  reviewsCount: number;
  images: string[];
  highlights: string[];
  overview: string;
  itinerary: { title: string; desc: string; time?: string }[];
  inclusions: string[];
  exclusions: string[];
  importantNotes: string[];
  cancellationPolicy: string;
  packageOptions?: PackageOption[];
  dietaryFeatures?: {
    pureVeg?: boolean;
    jainAvailable?: boolean;
    halalCertified?: boolean;
  };
}

const FALLBACK_TOUR: TourDetail = {
  id: "dubai-desert-safari",
  name: "Dubai Premium Red Dune Desert Safari & BBQ Dinner",
  title: "Dubai Premium Red Dune Desert Safari & BBQ Dinner",
  category: "Desert Safari",
  categorySlug: "desert-safari",
  destination: "Dubai",
  city: "Dubai",
  location: "Lahbab Red Dunes, Dubai, UAE",
  duration: "6 - 7 Hours",
  price: 2450,
  originalPrice: 3800,
  currency: "INR",
  rating: 4.9,
  reviewsCount: 384,
  images: [
    "/seed-images/activities/activity-desert-safari.svg",
    "/seed-images/activities/activity-city-tour.svg",
    "/seed-images/activities/activity-boat-tour.svg",
  ],
  highlights: [
    "Thrilling 4x4 Dune Bashing in Lahbab Red Dunes",
    "Sunset photo-stop across rolling desert sands",
    "Camel ride, Sandboarding & Henna painting",
    "Buffet BBQ dinner with dedicated Pure Veg & Jain food counters",
    "Live entertainment: Belly dance, Tanoura & Fire show",
    "Round-trip hotel pickup and drop-off included",
  ],
  overview:
    "Experience the raw magic of the Arabian desert with our highest-rated safari. Venture deep into the legendary Lahbab dunes with an expert licensed desert safari driver. As dusk descends, arrive at our atmospheric Bedouin camp where refreshing Arabian coffee and dates await, followed by a lavish barbecue dinner and cultural performances under starlit skies.",
  itinerary: [
    {
      time: "14:30 - 15:30",
      title: "Hotel Pickup & Scenic Transfer",
      desc: "Pickup from your hotel or residence in a fully air-conditioned 4x4 Land Cruiser. Journey toward the high red dunes of Lahbab.",
    },
    {
      time: "16:00 - 17:00",
      title: "Red Dune Bashing & Sandboarding",
      desc: "An adrenaline-pumping 45-minute dune bashing adventure guided by master safari drivers. Stop at the highest dune peak for photos and try sandboarding.",
    },
    {
      time: "17:30 - 18:30",
      title: "Arrival at Bedouin Safari Camp",
      desc: "Welcome with authentic Arabic Gahwa (coffee), dates, and falafel. Enjoy short camel rides, henna body art, and capture the desert twilight.",
    },
    {
      time: "19:00 - 21:00",
      title: "BBQ Feast & Live Stage Shows",
      desc: "Sumptuous buffet barbecue dinner featuring grilled meats, vegetarian delicacies, and Jain food counter. Watch traditional Tanoura twirl, mesmerizing fire acrobatics, and live belly dance.",
    },
    {
      time: "21:30",
      title: "Drop-off at Hotel",
      desc: "Safe and comfortable return transfer directly to your hotel or residence.",
    },
  ],
  inclusions: [
    "Hotel pickup and drop-off in 4x4 Cruiser",
    "45 minutes dune bashing across Lahbab high dunes",
    "Sandboarding experience",
    "Short camel riding experience",
    "Welcome tea, Arabic coffee and dates",
    "Unlimited water, soft drinks and refreshments",
    "Henna designing for ladies and children",
    "International BBQ buffet dinner (Veg, Non-Veg, Jain counter)",
    "Live Tanoura dance, Fire show, and Belly dancing performance",
  ],
  exclusions: [
    "Quad bike / Dune buggy rental (optional add-on at camp)",
    "Alcoholic beverages (available for purchase)",
    "Souvenir photos and falcon photography",
    "Personal expenses and gratuities",
  ],
  importantNotes: [
    "Not recommended for pregnant travelers or guests with severe back conditions during dune bashing (gentle drive available on request).",
    "Comfortable casual clothing and open shoes/sandals are recommended.",
    "Jain meals and strictly vegetarian food are clearly labeled and catered at dedicated counters.",
  ],
  cancellationPolicy: "Free cancellation up to 24 hours prior to scheduled pickup time with 100% refund.",
  packageOptions: [
    {
      id: "opt_1",
      title: "Standard Admission Pass",
      description: "Direct entry ticket with self-guided tour access.",
      price: 2450,
      hotelPickup: false,
      mealsIncluded: false,
    },
    {
      id: "opt_2",
      title: "Admission with Hotel Transfers",
      description: "Entry ticket plus door-to-door air-conditioned hotel transfers.",
      price: 3450,
      hotelPickup: true,
      mealsIncluded: false,
    },
    {
      id: "opt_3",
      title: "VIP Fast-Track with Gourmet Dining",
      description: "Priority VIP entry, dedicated guide & multi-course gourmet dining voucher.",
      price: 4650,
      hotelPickup: true,
      mealsIncluded: true,
    },
  ],
  dietaryFeatures: {
    pureVeg: true,
    jainAvailable: true,
    halalCertified: true,
  },
};

export default function TourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const config = useSiteConfig();
  const site = useSite();

  const slugParam = params?.slug;
  const slugArray = Array.isArray(slugParam) ? slugParam : [String(slugParam || "")];
  const tourPath = slugArray.join("/");

  const siteId = site.siteId || "gujjutours";
  const currencySymbol = config.currencySymbol || (siteId === "gujjutours" ? "₹" : "$");
  const primaryColor = config.theme?.colors?.primary || "#2882c5";

  const [tour, setTour] = useState<TourDetail>(FALLBACK_TOUR);
  const [selectedImage, setSelectedImage] = useState<string>(FALLBACK_TOUR.images[0]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [dietaryChoice, setDietaryChoice] = useState<string>("pureVeg");
  const [activeTab, setActiveTab] = useState<"overview" | "options" | "itinerary" | "inclusions" | "policy">("overview");
  const [isEnquiryOpen, setIsEnquiryOpen] = useState<boolean>(false);

  // Set tomorrow as default date
  useEffect(() => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    setSelectedDate(tmrw.toISOString().split("T")[0]);
  }, []);

  // Fetch tour details from API
  useEffect(() => {
    if (!tourPath) return;

    const fetchTour = async () => {
      try {
        const res = await fetch(`/api/tours/${tourPath}?site=${encodeURIComponent(siteId)}`);
        if (res.ok) {
          const json = await res.json();
          const t = json?.data || json;
          if (t && (t.name || t.title)) {
            const rawImages = Array.isArray(t.images) && t.images.length > 0
              ? t.images
              : t.image
              ? [t.image]
              : FALLBACK_TOUR.images;

            const opts: PackageOption[] = Array.isArray(t.packageOptions) && t.packageOptions.length > 0
              ? t.packageOptions
              : (FALLBACK_TOUR.packageOptions || []);

            const destStr = typeof t.destination === "object" && t.destination !== null
              ? (t.destination.cityName || t.destination.name || t.destination.address || "Dubai")
              : String(t.destination || t.city || "Dubai");
            const cityStr = typeof t.city === "object" && t.city !== null
              ? (t.city.cityName || t.city.name || destStr)
              : String(t.city || destStr);

            setTour({
              id: String(t.id || t.tourNumericId || tourPath),
              tourNumericId: t.tourNumericId,
              name: String(t.title || t.name),
              title: String(t.title || t.name),
              category: String(t.category || "Sightseeing"),
              categorySlug: String(t.categorySlug || "city-tours"),
              destination: destStr,
              city: cityStr,
              location: String(t.location || `${cityStr}, ${t.country || ""}`),
              duration: String(t.duration || "Half Day"),
              price: Number(t.price || 199),
              originalPrice: t.originalPrice ? Number(t.originalPrice) : undefined,
              currency: String(t.currency || currencySymbol),
              rating: Number(t.rating || 4.8),
              reviewsCount: Number(t.reviews || t.reviewCount || 120),
              images: rawImages,
              highlights: Array.isArray(t.highlights) && t.highlights.length > 0 ? t.highlights : FALLBACK_TOUR.highlights,
              overview: String(t.overview || t.description || FALLBACK_TOUR.overview),
              itinerary: Array.isArray(t.itinerary) && t.itinerary.length > 0 ? t.itinerary : FALLBACK_TOUR.itinerary,
              inclusions: Array.isArray(t.included) && t.included.length > 0 ? t.included : FALLBACK_TOUR.inclusions,
              exclusions: Array.isArray(t.excluded) && t.excluded.length > 0 ? t.excluded : FALLBACK_TOUR.exclusions,
              importantNotes: Array.isArray(t.importantNotes) && t.importantNotes.length > 0 ? t.importantNotes : FALLBACK_TOUR.importantNotes,
              cancellationPolicy: String(t.cancellationPolicy || FALLBACK_TOUR.cancellationPolicy),
              packageOptions: opts,
              dietaryFeatures: t.dietaryFeatures || FALLBACK_TOUR.dietaryFeatures,
            });

            if (rawImages[0]) {
              setSelectedImage(rawImages[0]);
            }
          }
        }
      } catch {
        // Fallback remains active
      }
    };

    fetchTour();
  }, [tourPath, siteId, currencySymbol]);

  const activeOption = tour.packageOptions?.[selectedOptionIndex] || {
    id: "std",
    title: "Standard Admission",
    description: "Standard ticket",
    price: tour.price,
  };

  const currentUnitPrice = activeOption.price || tour.price;
  const totalPrice = currentUnitPrice * adults + Math.round(currentUnitPrice * 0.7) * children;
  const tax = Math.round(totalPrice * 0.05);
  const grandTotal = totalPrice + tax;
  const primaryImg = tour.images?.[0] || tour.images?.[selectedOptionIndex] || "";

  const handleBookNow = () => {
    const bookingParams = new URLSearchParams({
      service: "tour",
      serviceType: "tour",
      id: String(tour.id),
      slug: tourPath,
      title: tour.title || tour.name,
      name: tour.title || tour.name,
      city: tour.city,
      destination: tour.destination,
      option: activeOption.title,
      date: selectedDate,
      adults: String(adults),
      children: String(children),
      dietary: dietaryChoice,
      price: String(currentUnitPrice),
      unitPrice: String(currentUnitPrice),
      subtotal: String(totalPrice),
      tax: String(tax),
      total: String(grandTotal),
      totalPrice: String(grandTotal),
      currency: tour.currency || (siteId === "gujjutours" ? "INR" : "USD"),
      image: primaryImg,
      imageUrl: primaryImg,
    });

    router.push(`/booking?${bookingParams.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#fafbfc] dark:bg-neutral-950 text-gray-900 dark:text-gray-100 pb-20 font-sans">
      {/* ─── Breadcrumbs ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Link href="/en" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/en/tours" className="hover:text-primary transition-colors">
            Tours &amp; Activities
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-xs">
            {tour.city}
          </span>
          <span>/</span>
          <span className="font-semibold text-gray-900 dark:text-white truncate max-w-sm">
            {tour.title}
          </span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Header Info ─── */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-white text-xs font-bold uppercase tracking-wider shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              {tour.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-gray-300">
              📍 {tour.location}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-gray-300">
              ⏱️ {tour.duration}
            </span>

            {/* Dietary Badge */}
            {tour.dietaryFeatures?.pureVeg && (
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                🌱 100% Pure Veg Dinner Included
              </span>
            )}
            {tour.dietaryFeatures?.jainAvailable && (
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                🌿 Jain Food Counter Available
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
            {tour.title}
          </h1>

          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-xs">
              <span>★</span>
              <span>{tour.rating}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Based on {tour.reviewsCount} verified traveler reviews
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hidden sm:inline">
              ✓ Instant Confirmation Voucher
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-bold hidden sm:inline">
              ✓ Free Cancellation up to 24 hours
            </span>
          </div>
        </div>

        {/* ─── Media Gallery ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2 h-[340px] sm:h-[440px] rounded-2xl overflow-hidden relative shadow-lg bg-neutral-900 border border-gray-200 dark:border-neutral-800">
            <Image
              src={selectedImage}
              alt={tour.title}
              fill
              unoptimized
              className="object-cover transition-all duration-300"
            />
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-bold">
              Top Rated in {tour.city}
            </div>
          </div>

          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 h-[100px] lg:h-[440px]">
            {tour.images.slice(0, 3).map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(img)}
                className={`relative rounded-xl overflow-hidden h-full group border-2 transition-all ${
                  selectedImage === img
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-gray-200 dark:border-neutral-800 opacity-80 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </button>
            ))}
          </div>
        </div>

        {/* ─── Main Content & Sticky Booking Box ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Details, Options, Schedule */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-neutral-800 gap-6 text-sm font-bold overflow-x-auto scrollbar-hide">
              {[
                { id: "overview", label: "Overview & Highlights" },
                { id: "options", label: "Tour Options (3)" },
                { id: "itinerary", label: "Schedule / Itinerary" },
                { id: "inclusions", label: "What's Included" },
                { id: "policy", label: "Policies & Terms" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-3 border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                  style={activeTab === tab.id ? { borderColor: primaryColor, color: primaryColor } : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold mb-3">Key Highlights</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tour.highlights.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-xs"
                      >
                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                          {h}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold mb-3">About This Experience</h2>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {tour.overview}
                  </p>
                </div>
              </div>
            )}

            {/* Tab: Options */}
            {activeTab === "options" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold mb-2">Available Package Options</h2>
                <div className="space-y-3">
                  {tour.packageOptions?.map((opt, idx) => {
                    const isSelected = selectedOptionIndex === idx;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedOptionIndex(idx)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                            : "border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="packageOpt"
                                checked={isSelected}
                                onChange={() => setSelectedOptionIndex(idx)}
                                className="w-4 h-4 text-primary accent-primary"
                              />
                              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                                {opt.title}
                              </h3>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-6">
                              {opt.description}
                            </p>
                            <div className="flex gap-2 pl-6 mt-2">
                              {opt.hotelPickup && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                  🚗 Hotel Transfers Included
                                </span>
                              )}
                              {opt.mealsIncluded && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                  🍽️ Meals Included
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-base font-black text-gray-900 dark:text-white">
                              {currencySymbol}{opt.price.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-gray-400 block">per adult</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab: Itinerary */}
            {activeTab === "itinerary" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold mb-4">Tour Schedule &amp; Itinerary Stops</h2>
                <div className="relative pl-6 border-l-2 border-primary/40 space-y-6 ml-2">
                  {tour.itinerary.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div
                        className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-4 border-white dark:border-neutral-950 shadow-xs"
                        style={{ backgroundColor: primaryColor }}
                      />
                      {item.time && (
                        <span className="text-[11px] font-bold block mb-1 text-primary">
                          {item.time}
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Inclusions */}
            {activeTab === "inclusions" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                  <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
                    <span>✓</span> What is Included
                  </h3>
                  <ul className="space-y-2 text-xs text-emerald-900 dark:text-emerald-200">
                    {tour.inclusions.map((inc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40">
                  <h3 className="text-sm font-bold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
                    <span>✕</span> What is Not Included
                  </h3>
                  <ul className="space-y-2 text-xs text-red-900 dark:text-red-200">
                    {tour.exclusions.map((exc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-500 font-bold">✕</span>
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tab: Policy */}
            {activeTab === "policy" && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span>🛡️</span> Cancellation &amp; Refund Policy
                  </h3>
                  <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                    {tour.cancellationPolicy}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span>⚠️</span> Important Traveler Guidelines
                  </h3>
                  <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                    {tour.importantNotes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Right 1 Col: Sticky Booking Box */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-200 dark:border-neutral-800 shadow-xl space-y-5">
              <div className="flex items-baseline justify-between border-b border-gray-100 dark:border-neutral-800 pb-4">
                <div>
                  <span className="text-xs text-gray-400 block">Selected Option</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                    {activeOption.title}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                      {currencySymbol}{currentUnitPrice.toLocaleString()}
                    </span>
                    {tour.originalPrice && (
                      <span className="text-xs line-through text-gray-400">
                        {currencySymbol}{tour.originalPrice.toLocaleString()}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">/ adult</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                  Guaranteed
                </span>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Select Experience Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white outline-none cursor-pointer font-semibold"
                />
              </div>

              {/* Guest Counts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Adults (12+ yrs)
                  </label>
                  <div className="flex items-center border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-neutral-800">
                    <button
                      type="button"
                      disabled={adults <= 1}
                      onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 text-xs font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-xs font-bold">{adults}</span>
                    <button
                      type="button"
                      onClick={() => setAdults((prev) => prev + 1)}
                      className="px-3 py-1.5 text-xs font-bold hover:bg-gray-200 dark:hover:bg-neutral-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Children (3-11 yrs)
                  </label>
                  <div className="flex items-center border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-neutral-800">
                    <button
                      type="button"
                      disabled={children <= 0}
                      onClick={() => setChildren((prev) => Math.max(0, prev - 1))}
                      className="px-3 py-1.5 text-xs font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-xs font-bold">{children}</span>
                    <button
                      type="button"
                      onClick={() => setChildren((prev) => prev + 1)}
                      className="px-3 py-1.5 text-xs font-bold hover:bg-gray-200 dark:hover:bg-neutral-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Dietary Preference Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Meal / Dining Preference
                </label>
                <select
                  value={dietaryChoice}
                  onChange={(e) => setDietaryChoice(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white outline-none cursor-pointer font-semibold"
                >
                  <option value="pureVeg">🌱 100% Pure Vegetarian Meal</option>
                  <option value="jain">🌿 Jain Meal (No Onion / No Garlic)</option>
                  <option value="standard">Standard International Meal</option>
                </select>
              </div>

              {/* Price Breakdown */}
              <div className="bg-gray-50 dark:bg-neutral-800 p-3.5 rounded-2xl space-y-2 text-xs border border-gray-100 dark:border-neutral-700">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{adults} Adult(s) × {currencySymbol}{currentUnitPrice}</span>
                  <span>{currencySymbol}{(currentUnitPrice * adults).toLocaleString()}</span>
                </div>
                {children > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{children} Child(ren) × {currencySymbol}{Math.round(currentUnitPrice * 0.7)}</span>
                    <span>{currencySymbol}{(Math.round(currentUnitPrice * 0.7) * children).toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 dark:border-neutral-700 flex justify-between font-black text-sm text-gray-900 dark:text-white">
                  <span>Total Amount</span>
                  <span style={{ color: primaryColor }}>
                    {currencySymbol}{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleBookNow}
                  className="w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-md transition-all hover:opacity-95 active:scale-98"
                  style={{ backgroundColor: primaryColor }}
                >
                  Instant Book Now
                </button>
                <button
                  type="button"
                  onClick={() => setIsEnquiryOpen(true)}
                  className="w-full py-2.5 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 font-bold text-xs hover:bg-gray-50 transition-colors"
                >
                  Request Custom Group Quote
                </button>
              </div>

              <div className="text-[11px] text-gray-400 text-center space-y-1 pt-1">
                <p>🔒 256-Bit SSL Encrypted Direct Checkout</p>
                <p>📞 24/7 Dedicated Concierge Support via WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry Modal */}
      <EnquiryModal
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
        serviceName={tour.title}
        defaultDestination={tour.destination}
        siteId={siteId}
        currencySymbol={currencySymbol}
      />
    </main>
  );
}
