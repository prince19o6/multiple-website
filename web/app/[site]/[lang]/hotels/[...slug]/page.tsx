"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import EnquiryModal from "@/components/lead/EnquiryModal";

interface HotelRoomOption {
  id: string;
  name: string;
  bedConfiguration?: string;
  maxAdults?: number;
  maxChildren?: number;
  areaSqm?: number;
  pricePerNight: number;
  netPricePerNight?: number;
  freeBreakfast?: boolean;
  cancellationPolicy?: string;
  features?: string[];
  images?: string[];
}

interface HotelPolicies {
  checkInTime?: string;
  checkOutTime?: string;
  cancellation?: string;
}

interface HotelDetailEntity {
  id: string;
  slug: string;
  title: string;
  propertyType: string;
  destination: {
    cityName: string;
    country: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  starRating: number;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  compareAtPrice?: number;
  currency: string;
  images: string[];
  amenities: string[];
  dietaryFeatures?: {
    pureVeg: boolean;
    jainAvailable: boolean;
    halalCertified: boolean;
  };
  rooms: HotelRoomOption[];
  policies?: HotelPolicies;
  featured?: boolean;
}

export default function HotelDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const config = useSiteConfig();
  const site = useSite();

  const siteId = site.siteId || "gujjutours";
  const primaryColor = config.theme?.colors?.primary || "#2882c5";
  const currencySymbol = config.site?.currency?.symbol || config.currencySymbol || (siteId === "gujjutours" ? "₹" : "$");

  const slugParam = params?.slug;
  const slugParts = Array.isArray(slugParam) ? slugParam : [String(slugParam || "hotel")];
  const hotelSlug = slugParts[slugParts.length - 1];

  const startDateParam = searchParams?.get("start") || "";
  const endDateParam = searchParams?.get("end") || "";

  // Data fetching
  const [hotel, setHotel] = useState<HotelDetailEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking selection state
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [nights, setNights] = useState<number>(3);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [enquiryOpen, setEnquiryOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadHotelDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/hotels/${encodeURIComponent(hotelSlug)}?site=${encodeURIComponent(siteId)}`);
        if (!res.ok) {
          throw new Error("Hotel not found");
        }
        const json = await res.json();
        if (json.data) {
          setHotel(json.data);
          if (json.data.rooms && json.data.rooms.length > 0) {
            setSelectedRoomId(json.data.rooms[0].id);
          }
        } else {
          throw new Error("Hotel data unavailable");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load hotel");
      } finally {
        setLoading(false);
      }
    }

    if (hotelSlug) {
      loadHotelDetail();
    }
  }, [hotelSlug, siteId]);

  const selectedRoom = hotel?.rooms?.find((r) => r.id === selectedRoomId) || hotel?.rooms?.[0];

  const roomPricePerNight = selectedRoom?.pricePerNight || hotel?.pricePerNight || 6000;
  const totalPrice = roomPricePerNight * nights;
  const taxes = Math.round(totalPrice * 0.12);
  const grandTotal = totalPrice + taxes;

  const images = hotel?.images && hotel.images.length > 0
    ? hotel.images
    : [
        "/seed-images/hotels/hotel-1.svg",
        "/seed-images/hotels/hotel-2.svg",
        "/seed-images/hotels/hotel-3.svg",
        "/seed-images/hotels/hotel-4.svg",
      ];

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-6 w-48 bg-slate-200 dark:bg-neutral-800 rounded-md" />
          <div className="h-10 w-96 bg-slate-200 dark:bg-neutral-800 rounded-md" />
          <div className="h-96 w-full bg-slate-200 dark:bg-neutral-800 rounded-2xl" />
        </div>
      </main>
    );
  }

  if (error || !hotel) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-neutral-950 py-16 px-4 text-center">
        <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-3xl mx-auto mb-4">
            🏨
          </div>
          <h1 className="text-xl font-bold">Accommodation Not Found</h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-2 mb-6">
            The hotel details you requested could not be found or may have been updated.
          </p>
          <Link
            href="/en/hotels"
            className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow hover:brightness-110"
            style={{ backgroundColor: primaryColor }}
          >
            Browse All Hotels
          </Link>
        </div>
      </main>
    );
  }

  const handleBookNow = () => {
    const primaryImg = images[activeImageIndex] || images[0] || hotel.images?.[0] || "";
    const bookingParams = new URLSearchParams({
      service: "hotel",
      serviceType: "hotel",
      id: hotel.id,
      serviceId: hotel.id,
      slug: hotel.slug,
      title: `${hotel.title} - ${selectedRoom?.name || "Standard Room"}`,
      name: `${hotel.title} - ${selectedRoom?.name || "Standard Room"}`,
      city: hotel.destination?.cityName || "",
      date: startDateParam || new Date().toISOString().split("T")[0],
      startDate: startDateParam || new Date().toISOString().split("T")[0],
      endDate: endDateParam || "",
      nights: String(nights),
      option: selectedRoom?.name || "Standard Room",
      room: selectedRoom?.name || "Standard Room",
      roomName: selectedRoom?.name || "Standard Room",
      price: String(roomPricePerNight),
      unitPrice: String(roomPricePerNight),
      subtotal: String(totalPrice),
      tax: String(taxes),
      total: String(grandTotal),
      totalPrice: String(grandTotal),
      currency: hotel.currency || (siteId === "gujjutours" ? "INR" : "USD"),
      image: primaryImg,
      imageUrl: primaryImg,
    });

    router.push(`/booking?${bookingParams.toString()}`);
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-slate-100 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Breadcrumb ─── */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400 mb-4">
          <Link href="/en" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/en/hotels" className="hover:text-primary transition-colors">Hotels</Link>
          <span>/</span>
          <Link
            href={`/en/hotels?destination=${encodeURIComponent(hotel.destination?.cityName || "")}`}
            className="hover:text-primary transition-colors"
          >
            {hotel.destination?.cityName}
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">
            {hotel.title}
          </span>
        </nav>

        {/* ─── Hotel Header & Badges ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                {hotel.propertyType}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <span>{"★".repeat(hotel.starRating)}</span>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-neutral-300">
                  {hotel.starRating}-Star Rated
                </span>
              </span>

              {hotel.dietaryFeatures?.pureVeg && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span>🌱</span> Pure Veg Kitchen
                </span>
              )}
              {hotel.dietaryFeatures?.jainAvailable && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Jain Meals Available
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              {hotel.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.533l.068.034.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
              </svg>
              <span>{hotel.destination?.address || `${hotel.destination?.cityName}, ${hotel.destination?.country}`}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setEnquiryOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-bold text-xs hover:border-primary transition-all shadow-xs"
            >
              Enquire Custom Dates
            </button>
            <a
              href="#rooms-selection"
              className="px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all"
              style={{ backgroundColor: primaryColor }}
            >
              Select Room &amp; Rates
            </a>
          </div>
        </div>

        {/* ─── Photo Gallery Grid ─── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-10 rounded-2xl overflow-hidden shadow-md h-[340px] sm:h-[440px] border border-slate-200 dark:border-neutral-800">
          <div className="md:col-span-2 relative h-full bg-slate-100 dark:bg-neutral-900">
            <Image
              src={images[activeImageIndex] || images[0]}
              alt={hotel.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div className="hidden md:flex flex-col gap-3 h-full">
            {images.slice(1, 3).map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx + 1)}
                className="relative w-full h-[calc(50%-6px)] overflow-hidden rounded-xl border border-white/20 bg-slate-100 dark:bg-neutral-900 hover:opacity-90 transition-opacity"
              >
                <Image
                  src={img}
                  alt={`Gallery ${idx + 2}`}
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          <div className="hidden md:block relative h-full bg-slate-100 dark:bg-neutral-900">
            <Image
              src={images[3] || images[0]}
              alt="Hotel highlight"
              fill
              sizes="25vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* ─── Content Grid & Sticky Booking Summary ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            {/* Property Overview */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xs">
              <h2 className="text-base font-black uppercase tracking-wider mb-3">
                Property Overview
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                Experience authentic world-class hospitality at {hotel.title}. Located conveniently in {hotel.destination?.cityName}, this {hotel.propertyType.toLowerCase()} offers meticulously appointed suites, full concierge connectivity, daily sanitization standards, and dedicated dining arrangements tailored for your travel comfort.
              </p>
            </div>

            {/* Property Amenities */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xs">
              <h2 className="text-base font-black uppercase tracking-wider mb-4">
                Popular Property Amenities
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold text-slate-700 dark:text-neutral-300">
                {(hotel.amenities && hotel.amenities.length > 0
                  ? hotel.amenities
                  : [
                      "Free High-Speed WiFi",
                      "Swimming Pool",
                      "Pure Veg & Jain Options",
                      "Airport Transfers",
                      "Spa & Wellness Center",
                      "24/7 Room Service",
                      "Central Climate Control",
                      "Complimentary Parking",
                    ]
                ).map((amenity, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-100 dark:border-neutral-700/50"
                  >
                    <span className="text-primary font-bold">✓</span>
                    <span className="truncate">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Room Options & Rates Section ─── */}
            <div id="rooms-selection" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tight">
                    Select Your Room &amp; Rate Plan
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    All rate plans include taxes and instant reservation confirmation
                  </p>
                </div>
              </div>

              {(hotel.rooms && hotel.rooms.length > 0 ? hotel.rooms : [
                {
                  id: "room-deluxe",
                  name: "Deluxe King Room",
                  bedConfiguration: "1 King Bed or 2 Twin Beds",
                  maxAdults: 2,
                  maxChildren: 1,
                  areaSqm: 32,
                  pricePerNight: hotel.pricePerNight,
                  freeBreakfast: true,
                  cancellationPolicy: "Free cancellation up to 48 hours prior to check-in",
                  features: ["City Skyline View", "Ensuite Marble Bathroom", "Free WiFi", "Minibar"],
                },
                {
                  id: "room-executive",
                  name: "Executive Balcony Suite",
                  bedConfiguration: "1 Extra-Large Double Bed",
                  maxAdults: 3,
                  maxChildren: 1,
                  areaSqm: 48,
                  pricePerNight: Math.round(hotel.pricePerNight * 1.35),
                  freeBreakfast: true,
                  cancellationPolicy: "Free cancellation up to 24 hours prior to check-in",
                  features: ["Private Balcony", "Executive Lounge Access", "Nespresso Machine", "Bathtub"],
                },
                {
                  id: "room-family",
                  name: "Family Two-Bedroom Suite",
                  bedConfiguration: "2 King Beds",
                  maxAdults: 4,
                  maxChildren: 2,
                  areaSqm: 72,
                  pricePerNight: Math.round(hotel.pricePerNight * 1.8),
                  freeBreakfast: true,
                  cancellationPolicy: "Flexible Cancellation",
                  features: ["Connecting Rooms Guaranteed", "Separate Living Room", "Dining Table", "2 Ensuites"],
                },
              ]).map((room) => {
                const isSelected = selectedRoomId === room.id;
                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white dark:bg-neutral-900 border-primary ring-2 ring-primary/20 shadow-lg"
                        : "bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 hover:border-slate-300 shadow-xs"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold">
                            {room.name}
                          </h3>
                          {isSelected && (
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-white"
                              style={{ backgroundColor: primaryColor }}
                            >
                              Selected ✓
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-neutral-400">
                          {room.bedConfiguration && (
                            <span>🛏️ {room.bedConfiguration}</span>
                          )}
                          {room.areaSqm && (
                            <span>📐 {room.areaSqm} m²</span>
                          )}
                          <span>👥 Max {room.maxAdults ?? 2} Adults</span>
                        </div>

                        {/* Room Features */}
                        {room.features && room.features.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {room.features.map((feat, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300"
                              >
                                ✓ {feat}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                          ✓ {room.cancellationPolicy || "Free cancellation up to 48 hours before check-in"}
                        </div>
                      </div>

                      {/* Pricing Column */}
                      <div className="text-right sm:border-l sm:pl-6 border-slate-100 dark:border-neutral-800 shrink-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Price per night
                        </span>
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                          {currencySymbol}{room.pricePerNight.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-400 block mb-2">+ taxes &amp; fees</span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRoomId(room.id);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? "text-white shadow-xs"
                              : "bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-200"
                          }`}
                          style={isSelected ? { backgroundColor: primaryColor } : undefined}
                        >
                          {isSelected ? "Selected ✓" : "Choose Room"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Check-in Policies */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xs">
              <h2 className="text-base font-black uppercase tracking-wider mb-4">
                Hotel Policies &amp; Guidelines
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-neutral-300">
                <div className="p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-xl">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">Check-in / Check-out</div>
                  <p>Check-in from: {hotel.policies?.checkInTime || "14:00"}</p>
                  <p>Check-out until: {hotel.policies?.checkOutTime || "11:00"}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-xl">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">Cancellation &amp; Refunds</div>
                  <p>{hotel.policies?.cancellation || "Free cancellation up to 48 hours prior to check-in."}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Sticky Booking Summary Sidebar ─── */}
          <div className="lg:col-span-4 sticky top-24 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xl space-y-5">
            <h3 className="text-base font-black uppercase tracking-wider border-b border-slate-100 dark:border-neutral-800 pb-3">
              Reservation Summary
            </h3>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Selected Room</div>
              <div className="text-sm font-bold mt-0.5">
                {selectedRoom?.name || "Standard Room"}
              </div>
              <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                {currencySymbol}{roomPricePerNight.toLocaleString()} × {nights} nights
              </div>
            </div>

            {/* Nights Duration Stepper */}
            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-neutral-800">
              <span className="font-bold text-slate-600 dark:text-neutral-300">Duration</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={nights <= 1}
                  onClick={() => setNights(Math.max(1, nights - 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-neutral-700 flex items-center justify-center font-bold disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-neutral-800"
                >
                  -
                </button>
                <span className="font-bold px-2">{nights} Nights</span>
                <button
                  type="button"
                  onClick={() => setNights(nights + 1)}
                  className="w-7 h-7 rounded-lg border border-slate-200 dark:border-neutral-700 flex items-center justify-center font-bold hover:bg-slate-100 dark:hover:bg-neutral-800"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 text-xs pt-3 border-t border-slate-100 dark:border-neutral-800">
              <div className="flex justify-between text-slate-500 dark:text-neutral-400">
                <span>Room Charges</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {currencySymbol}{totalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-neutral-400">
                <span>Estimated Taxes &amp; Fees</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {currencySymbol}{taxes.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-base font-black pt-3 border-t border-slate-100 dark:border-neutral-800">
                <span>Grand Total</span>
                <span className="text-xl font-black" style={{ color: primaryColor }}>
                  {currencySymbol}{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              ✓ Instant confirmation &amp; zero credit card fees
            </div>

            <button
              type="button"
              onClick={handleBookNow}
              className="w-full py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <span>Instant Reserve Room</span>
              <span>→</span>
            </button>

            <button
              type="button"
              onClick={() => setEnquiryOpen(true)}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 font-bold text-xs hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Enquire or Custom Dates
            </button>
          </div>
        </div>
      </div>

      <EnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        serviceName={`Hotel Booking: ${hotel.title}`}
        defaultDestination={hotel.title}
        currencySymbol={currencySymbol}
      />
    </main>
  );
}
