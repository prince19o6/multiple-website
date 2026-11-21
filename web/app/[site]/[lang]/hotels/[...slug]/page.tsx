"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useParams, useRouter, notFound } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import { getHotelBySlug } from "@/lib/api/hotels";
import { LoadingSkeleton, ErrorState } from "@/components/common";
import EnquiryModal from "@/components/lead/EnquiryModal";

interface HotelRoomOption {
  id: string;
  name: string;
  roomType?: string;
  bedConfiguration?: string;
  maxAdults?: number;
  maxChildren?: number;
  capacityAdults?: number;
  capacityChildren?: number;
  areaSqm?: number;
  pricePerNight: number;
  netPricePerNight?: number;
  freeBreakfast?: boolean;
  cancellationPolicy?: string;
  features?: string[];
  amenities?: string[];
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
  name?: string;
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
  reviews?: number;
  reviewsCount?: number;
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

  const fetchHotel = useCallback(async () => {
    if (!hotelSlug) return;
    setLoading(true);
    setError(null);
    try {
      let data: any = null;
      try {
        data = await getHotelBySlug(hotelSlug, { siteId });
      } catch {
        // Direct call failed — query same-origin Next.js proxy
        const res = await fetch(`/api/hotels/${encodeURIComponent(hotelSlug)}?site=${encodeURIComponent(siteId)}`);
        if (res.ok) {
          const json = await res.json();
          data = json?.data ?? json;
        }
      }

      if (!data || (!data.title && !data.name && !data.id)) {
        const localRes = await fetch(`/api/hotels/${encodeURIComponent(hotelSlug)}?site=${encodeURIComponent(siteId)}`);
        if (localRes.ok) {
          const localJson = await localRes.json();
          data = localJson?.data ?? localJson;
        }
      }

      if (data && (data.title || data.name || data.id)) {
        const title = data.title || data.name || "Hotel";
        const rooms: HotelRoomOption[] = (data.rooms || []).map((r: any, idx: number) => ({
          id: (r as any).id || (r as any).roomType || `room-${idx}`,
          name: r.name || r.roomType || "Deluxe Room",
          roomType: r.roomType,
          pricePerNight: r.pricePerNight || data.price || 5000,
          bedConfiguration: (r as any).bedConfiguration || "1 King Bed or 2 Twin Beds",
          maxAdults: r.capacityAdults ?? (r as any).maxAdults ?? 2,
          maxChildren: r.capacityChildren ?? (r as any).maxChildren ?? 1,
          areaSqm: (r as any).areaSqm ?? 32,
          freeBreakfast: (r as any).freeBreakfast ?? true,
          cancellationPolicy: (r as any).cancellationPolicy ?? "Free cancellation up to 48 hours prior to check-in",
          features: r.amenities || (r as any).features || ["Air Conditioned", "Free High-Speed WiFi"],
        }));

        const rawImages = Array.isArray(data.images) && data.images.length > 0
          ? data.images
          : data.image
          ? [data.image]
          : [];

        const normalizedHotel: HotelDetailEntity = {
          id: data.id,
          slug: data.slug || hotelSlug,
          title,
          name: title,
          propertyType: (data as any).propertyType || "Luxury Hotel",
          destination: {
            cityName: data.destination?.cityName || "Destination",
            country: data.destination?.country || "Country",
            address: data.destination?.address || `${data.destination?.cityName || ""}, ${data.destination?.country || ""}`,
            latitude: data.destination?.latitude,
            longitude: data.destination?.longitude,
          },
          starRating: data.starRating || 4,
          rating: data.rating || 4.5,
          reviewCount: data.reviewsCount || data.reviews || 85,
          reviewsCount: data.reviewsCount || data.reviews || 85,
          pricePerNight: data.price || (rooms[0]?.pricePerNight ?? 5000),
          compareAtPrice: (data as any).compareAtPrice,
          currency: data.currency || (siteId === "gujjutours" ? "INR" : "USD"),
          images: rawImages,
          amenities: data.amenities || [],
          dietaryFeatures: (data as any).dietaryFeatures || {
            pureVeg: true,
            jainAvailable: true,
            halalCertified: false,
          },
          rooms: rooms.length > 0 ? rooms : [
            {
              id: "room-deluxe",
              name: "Deluxe King Room",
              bedConfiguration: "1 King Bed or 2 Twin Beds",
              maxAdults: 2,
              maxChildren: 1,
              areaSqm: 32,
              pricePerNight: data.price || 5000,
              freeBreakfast: true,
              cancellationPolicy: "Free cancellation up to 48 hours prior to check-in",
              features: ["City Skyline View", "Ensuite Bathroom", "Free WiFi"],
            }
          ],
          policies: (data as any).policies || {
            checkInTime: "14:00",
            checkOutTime: "11:00",
            cancellation: "Free cancellation up to 48 hours before check-in",
          },
          featured: data.featured,
        };

        setHotel(normalizedHotel);
        setSelectedRoomId(normalizedHotel.rooms[0]?.id || "");
      } else {
        setError("Hotel accommodation not found");
      }
    } catch (err: any) {
      if (err?.digest?.includes("NEXT_NOT_FOUND") || err?.message === "NEXT_NOT_FOUND") {
        throw err;
      }
      if (err?.status === 404 || err?.isNotFound) {
        setError("Hotel accommodation not found");
      } else {
        setError(err?.message || "Failed to load hotel details");
      }
    } finally {
      setLoading(false);
    }
  }, [hotelSlug, siteId]);

  useEffect(() => {
    fetchHotel();
  }, [fetchHotel]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <LoadingSkeleton variant="detail" count={1} />
        </div>
      </main>
    );
  }

  if (error || !hotel) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-neutral-950 py-16 px-4">
        <div className="max-w-md mx-auto">
          <ErrorState message={error || "Hotel not found"} onRetry={fetchHotel} />
        </div>
      </main>
    );
  }

  const selectedRoom = hotel.rooms.find((r) => r.id === selectedRoomId) || hotel.rooms[0];
  const roomPricePerNight = selectedRoom?.pricePerNight || hotel.pricePerNight;
  const totalPrice = roomPricePerNight * nights;
  const taxes = Math.round(totalPrice * 0.12);
  const grandTotal = totalPrice + taxes;

  const images = hotel.images.length > 0
    ? hotel.images
    : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85"];

  const handleBookNow = () => {
    const primaryImg = images[activeImageIndex] || images[0] || "";
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
                {(hotel.amenities.length > 0
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

              {hotel.rooms.map((room) => {
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
                          <span>👥 Up to {room.maxAdults || 2} Adults</span>
                          {room.freeBreakfast && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              🥞 Breakfast Included
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-neutral-400">
                          {room.cancellationPolicy}
                        </p>

                        {room.features && room.features.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {room.features.map((feat, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-[11px] text-slate-600 dark:text-neutral-300 font-medium"
                              >
                                {feat}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-right sm:border-l border-slate-100 dark:border-neutral-800 sm:pl-6 shrink-0">
                        <div className="text-xs text-slate-400">per night</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">
                          {currencySymbol}{room.pricePerNight.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                          +12% taxes &amp; fees
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hotel Policies */}
            {hotel.policies && (
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xs">
                <h2 className="text-base font-black uppercase tracking-wider mb-4">
                  Check-in Policies &amp; Terms
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-800/60">
                    <div className="font-bold text-slate-900 dark:text-white mb-1">Check-in Time</div>
                    <div className="text-slate-600 dark:text-neutral-300">From {hotel.policies.checkInTime || "14:00"} onwards</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-800/60">
                    <div className="font-bold text-slate-900 dark:text-white mb-1">Check-out Time</div>
                    <div className="text-slate-600 dark:text-neutral-300">Until {hotel.policies.checkOutTime || "11:00"}</div>
                  </div>
                  {hotel.policies.cancellation && (
                    <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-neutral-800/60">
                      <div className="font-bold text-slate-900 dark:text-white mb-1">Cancellation Rule</div>
                      <div className="text-slate-600 dark:text-neutral-300">{hotel.policies.cancellation}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── Sticky Booking Summary Sidebar ─── */}
          <div className="lg:col-span-4 sticky top-24">
            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Selected Room
                </div>
                <div className="text-base font-black mt-1 text-slate-900 dark:text-white">
                  {selectedRoom?.name || "Standard Room"}
                </div>
                <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  {currencySymbol}{roomPricePerNight.toLocaleString()} / night
                </div>
              </div>

              {/* Nights selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Length of Stay
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNights(Math.max(1, nights - 1))}
                    className="w-10 h-10 rounded-xl border border-slate-200 dark:border-neutral-700 font-bold hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center text-base"
                  >
                    -
                  </button>
                  <div className="flex-1 py-2 text-center font-bold text-sm bg-slate-50 dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700">
                    {nights} {nights === 1 ? "Night" : "Nights"}
                  </div>
                  <button
                    type="button"
                    onClick={() => setNights(nights + 1)}
                    className="w-10 h-10 rounded-xl border border-slate-200 dark:border-neutral-700 font-bold hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center text-base"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-neutral-800 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-neutral-300">
                  <span>Room Charge ({nights}N)</span>
                  <span className="font-semibold">{currencySymbol}{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-neutral-300">
                  <span>Taxes &amp; Service (12%)</span>
                  <span className="font-semibold">{currencySymbol}{taxes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-3 border-t border-slate-200 dark:border-neutral-700">
                  <span>Total Amount</span>
                  <span>{currencySymbol}{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Reserve Button */}
              <button
                type="button"
                onClick={handleBookNow}
                className="w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-xl hover:brightness-110 active:scale-95 transition-all text-center block"
                style={{ backgroundColor: primaryColor }}
              >
                Proceed to Checkout
              </button>

              <div className="text-[11px] text-center text-slate-400">
                🔒 Instant Booking Confirmation • No Hidden Charges
              </div>
            </div>
          </div>
        </div>
      </div>

      <EnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        serviceTitle={hotel.title}
        serviceType="hotel"
      />
    </main>
  );
}
