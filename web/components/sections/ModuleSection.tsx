"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { getActualImageUrl } from "@/lib/imageUtils";
import {
  useActiveModule,
  type CanonicalModule,
} from "@/lib/context/ModuleContext";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useCurrency } from "@/lib/CurrencyContext";
import FooterSection from "./FooterSection";

export type ModuleSectionType =
  | "featured"
  | "cities"
  | "categories"
  | "offers"
  | "videos"
  | "faq"
  | "packages"
  | "reviews"
  | "trusted"
  | "partners"
  | "seoLinks"
  | "trustBadges"
  | "footer";

interface ModuleSectionProps {
  module?: CanonicalModule;
  type: ModuleSectionType;
  className?: string;
  titleOverride?: string;
  subtitleOverride?: string;
}

export function ModuleSection({
  module: propModule,
  type,
  className = "",
  titleOverride,
  subtitleOverride,
}: ModuleSectionProps) {
  const {
    activeModule: contextModule,
    activeModuleCode,
    moduleData,
    isLoading,
    isError,
    error,
    refetch,
  } = useActiveModule();

  const config = useSiteConfig();
  const currentModule = propModule || contextModule;
  const currentModuleCode = activeModuleCode || currentModule;
  const primaryColor =
    config?.theme?.colors?.primary || config?.theme?.primary || "#2882c5";
  const { currencySymbol } = useCurrency();

  const scrollRef = useRef<HTMLDivElement>(null);
  const catScrollRef = useRef<HTMLDivElement>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [collapsedSeoGroup, setCollapsedSeoGroup] = useState<Record<string, boolean>>({});

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -340 : 340;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const handleCatScroll = (direction: "left" | "right") => {
    if (catScrollRef.current) {
      const offset = direction === "left" ? -240 : 240;
      catScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // ─── Loading Skeleton State ───
  if (isLoading && !moduleData) {
    return (
      <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-4 w-72 bg-neutral-100 dark:bg-neutral-850 rounded animate-pulse" />
          </div>
          <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse hidden sm:block" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
              <div className="h-44 w-full bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
              <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-neutral-100 dark:bg-neutral-850 rounded animate-pulse" />
              <div className="h-8 w-full bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ─── Error State With Retry ───
  if (isError && !moduleData) {
    return (
      <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
            {error || "Unable to load data for this section."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
          >
            Retry Loading
          </button>
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 1. CATEGORIES QUICK CHIP STRIP
  // ─────────────────────────────────────────────────────────────
  if (type === "categories") {
    const categoriesList = moduleData?.categories || [];
    if (categoriesList.length === 0) return null;

    return (
      <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
              Browse by Category
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleCatScroll("left")}
              aria-label="Scroll categories left"
              className="w-7 h-7 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => handleCatScroll("right")}
              aria-label="Scroll categories right"
              className="w-7 h-7 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              →
            </button>
          </div>
        </div>

        <div
          ref={catScrollRef}
          className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide py-1"
          style={{ scrollbarWidth: "none" }}
        >
          {categoriesList.map((cat: any, idx: number) => {
            const catName =
              typeof cat.name === "object" && cat.name !== null
                ? cat.name.en || cat.name.gu || cat.name.ms || Object.values(cat.name)[0] || cat.slug || "Category"
                : typeof cat.title === "object" && cat.title !== null
                ? cat.title.en || Object.values(cat.title)[0] || cat.slug || "Category"
                : cat.name || cat.title || cat.label || cat.slug || "Category";

            return (
              <Link
                key={cat.slug || idx}
                href={`/en/${currentModule}?category=${encodeURIComponent(cat.slug)}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 text-xs sm:text-sm font-bold whitespace-nowrap hover:border-primary hover:text-primary dark:hover:border-primary transition-all shadow-xs hover:shadow-md shrink-0 group"
              >
                <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-700 group-hover:scale-125 transition-transform" style={{ backgroundColor: primaryColor }} />
                <span>{catName}</span>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. FEATURED ITEMS (Cards Grid)
  // ─────────────────────────────────────────────────────────────
  if (type === "featured") {
    const featuredList = moduleData?.featured || [];
    const sectionTitle =
      titleOverride ||
      moduleData?.meta?.title ||
      "Featured Highlights";
    const sectionSubtitle =
      subtitleOverride ||
      moduleData?.meta?.subtitle ||
      "Handpicked selections with best rate guarantee and flexible cancellation.";
    const viewMoreUrl = moduleData?.meta?.viewMoreUrl || `/en/${currentModule}`;

    if (featuredList.length === 0) {
      return (
        <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
          <div className="p-8 text-center rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
            <p className="text-sm text-neutral-500">No items currently available in this section.</p>
          </div>
        </section>
      );
    }

    return (
      <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 ${className}`}>
        {/* Header with Title and "View all" link */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase mb-2 bg-primary/10 text-primary">
              {moduleData?.meta?.badge || "HANDPICKED"}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {sectionTitle}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
              {sectionSubtitle}
            </p>
          </div>

          <Link
            href={viewMoreUrl}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline shrink-0 group min-h-[44px]"
          >
            <span>View all in {currentModule}</span>
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>

        {/* Card Grid: 1 col on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredList.slice(0, 6).map((item: any) => (
            <div
              key={item.id}
              className="group rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image with fixed aspect ratio */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                <Image
                  src={getActualImageUrl(item.imageUrl, {
                    title: item.title,
                    city: item.city,
                    module: currentModuleCode,
                    id: item.id,
                  })}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {item.badge && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-sm">
                    {item.badge}
                  </span>
                )}
                {item.starRating && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-0.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-amber-400 text-xs">
                    {"★".repeat(Math.min(item.starRating, 5))}
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      {typeof item.city === "object" && item.city !== null
                        ? item.city.cityName || item.city.name || "City"
                        : item.city}
                      {item.country && typeof item.country === "string" ? `, ${item.country}` : ""}
                    </span>
                    {item.rating && (
                      <span className="flex items-center gap-1 font-bold text-neutral-800 dark:text-neutral-200">
                        <span className="text-amber-500">★</span> {item.rating}
                        <span className="text-neutral-400 font-normal">
                          ({item.reviewCount || 100})
                        </span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  {/* Feature Tags (Pure Veg, Jain Meals, etc.) */}
                  {Array.isArray(item.features) && item.features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {item.features.slice(0, 3).map((feat: string, fIdx: number) => (
                        <span
                          key={fIdx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price & Action */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Starting from</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-extrabold text-neutral-900 dark:text-white leading-tight">
                        {currencySymbol}
                        {(() => {
                          const raw = item.costForTwo ?? item.price ?? item.netCost ?? item.pricePerPerson;
                          const n = Number(raw);
                          return (!isNaN(n) && n > 0) ? n.toLocaleString("en-IN") : null;
                        })()}
                        {(() => {
                          const raw = item.costForTwo ?? item.price ?? item.netCost ?? item.pricePerPerson;
                          const n = Number(raw);
                          return (!isNaN(n) && n > 0) ? null : (item.priceRange || "—");
                        })()}
                      </span>
                      {item.originalPrice && (Number(item.originalPrice) > 0) && (
                        <span className="text-xs text-neutral-400 line-through">
                          {currencySymbol}
                          {Number(item.originalPrice).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={item.detailUrl || `/en/${currentModule}/${item.slug}`}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm hover:scale-105 active:scale-95 min-h-[44px] flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. CITY DESTINATIONS GRID
  // ─────────────────────────────────────────────────────────────
  if (type === "cities") {
    const destinations = moduleData?.destinations || [];
    const sectionTitle =
      titleOverride ||
      moduleData?.meta?.citySectionTitle ||
      "Find Top Stays in Popular Cities";

    return (
      <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {sectionTitle}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Explore handpicked locations with verified inventory and direct local support.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {destinations.map((dest: any) => (
            <Link
              key={dest.id || dest.name}
              href={dest.detailUrl || `/en/${currentModule}?destination=${encodeURIComponent(dest.name)}`}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-neutral-900 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <Image
                src={getActualImageUrl(dest.imageUrl, {
                  title: dest.name,
                  city: dest.name,
                  module: currentModuleCode,
                })}
                alt={dest.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover opacity-85 transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="text-[10px] uppercase font-bold tracking-wider text-white/80 block">
                  {dest.country}
                </span>
                <h3 className="text-base font-extrabold leading-tight group-hover:text-amber-300 transition-colors">
                  {dest.name}
                </h3>
                <span className="text-xs text-white/90 font-medium block mt-0.5">
                  {dest.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 4. OFFER BANNERS
  // ─────────────────────────────────────────────────────────────
  if (type === "offers") {
    const fallbackBannersByModule: Record<string, any[]> = {
      flights: [
        {
          id: "banner-flight-1",
          title: "Surat & Mumbai to Dubai Direct Airfares",
          subtitle: "Special group airfares with 30kg luggage allowance and confirmed 100% Pure Veg dining.",
          tag: "Direct Flights",
          buttonText: "Book Airfare",
          buttonUrl: "/en/flights",
          imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=85",
          gradient: "linear-gradient(135deg, #0369a1 0%, #1e40af 60%, #312e81 100%)",
        },
        {
          id: "banner-flight-2",
          title: "Emirates & Air India Special Holiday Fares",
          subtitle: "Save up to 15% on return tickets with flexible date change and zero hidden booking fees.",
          tag: "Limited Offer",
          buttonText: "View Flight Deals",
          buttonUrl: "/en/flights",
          imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=85",
          gradient: "linear-gradient(135deg, #991b1b 0%, #881337 60%, #451a03 100%)",
        },
      ],
      hotels: [
        {
          id: "banner-hotel-1",
          title: "Book Now, Pay Later on Luxury Stays",
          subtitle: "Reserve 4-star and 5-star verified hotels with zero upfront advance payment.",
          tag: "Zero Down Payment",
          buttonText: "Explore Stays",
          buttonUrl: "/en/hotels",
          imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=85",
          gradient: "linear-gradient(135deg, #0284c7 0%, #1d4ed8 60%, #312e81 100%)",
        },
        {
          id: "banner-hotel-2",
          title: "Complimentary Pure Veg Breakfast & Upgrades",
          subtitle: "Exclusive member perks on top family hotels across Dubai & global destinations.",
          tag: "Member Perk",
          buttonText: "View Hotel Deals",
          buttonUrl: "/en/hotels",
          imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85",
          gradient: "linear-gradient(135deg, #047857 0%, #0f766e 60%, #0e7490 100%)",
        },
      ],
      tours: [
        {
          id: "banner-tour-1",
          title: "Red Dune Desert Safari & BBQ Dinner Combo",
          subtitle: "4x4 Land Cruiser dune bashing, sandboarding, camel rides, and vegetarian BBQ buffet.",
          tag: "Top Rated",
          buttonText: "Book Safari Deal",
          buttonUrl: "/en/tours",
          imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=85",
          gradient: "linear-gradient(135deg, #b45309 0%, #c2410c 60%, #9f1239 100%)",
        },
        {
          id: "banner-tour-2",
          title: "Burj Khalifa 124th + Dubai Aquarium Combo",
          subtitle: "Save up to 25% with the official fast-track combo pass. Instant mobile voucher.",
          tag: "Super Saver",
          buttonText: "Get Combo Pass",
          buttonUrl: "/en/tours",
          imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85",
          gradient: "linear-gradient(135deg, #1d4ed8 0%, #0284c7 60%, #1e1b4b 100%)",
        },
      ],
      packages: [
        {
          id: "banner-pkg-1",
          title: "All-Inclusive Dubai Family Holidays with Jain Food",
          subtitle: "5D/4N luxury package with 4-star stays, desert safari, Burj Khalifa, and private cabs.",
          tag: "Family Special",
          buttonText: "Explore Packages",
          buttonUrl: "/en/packages",
          imageUrl: "https://images.unsplash.com/photo-1546412414-e1885259563a?w=1200&q=85",
          gradient: "linear-gradient(135deg, #047857 0%, #0f766e 60%, #0891b2 100%)",
        },
        {
          id: "banner-pkg-2",
          title: "Bali Private Pool Villa 6D/5N Honeymoon Escape",
          subtitle: "Includes floating breakfast, Nusa Penida speedboat tour, and daily dedicated chauffeur.",
          tag: "Romantic Escape",
          buttonText: "Discover Bali",
          buttonUrl: "/en/packages",
          imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=85",
          gradient: "linear-gradient(135deg, #6d28d9 0%, #7e22ce 60%, #312e81 100%)",
        },
      ],
      transfers: [
        {
          id: "banner-trf-1",
          title: "Airport Roundtrip Transfers: Flat 20% Off",
          subtitle: "Book airport arrival pickup and return transfer together for guaranteed lowest fares.",
          tag: "Airport Special",
          buttonText: "Book Transfer",
          buttonUrl: "/en/transfers",
          imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=85",
          gradient: "linear-gradient(135deg, #262626 0%, #171717 60%, #0a0a0a 100%)",
        },
        {
          id: "banner-trf-2",
          title: "Dubai to Abu Dhabi Intercity Flat Rates",
          subtitle: "Private luxury sedans and family SUVs with English-speaking chauffeurs and free waiting.",
          tag: "Fixed Fares",
          buttonText: "View Cab Routes",
          buttonUrl: "/en/transfers",
          imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85",
          gradient: "linear-gradient(135deg, #b45309 0%, #854d0e 60%, #1c1917 100%)",
        },
      ],
      visas: [
        {
          id: "banner-visa-1",
          title: "Express 24-Hour UAE Tourist Visa Guaranteed",
          subtitle: "Rapid document pre-verification and fast-track immigration submission with 99.4% approval.",
          tag: "Express Service",
          buttonText: "Apply Visa",
          buttonUrl: "/en/visas",
          imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&q=85",
          gradient: "linear-gradient(135deg, #1e40af 0%, #0369a1 60%, #1e1b4b 100%)",
        },
        {
          id: "banner-visa-2",
          title: "Family Visa Combo - Free Travel Insurance",
          subtitle: "Apply for 3 or more family tourist visas and receive free medical & baggage travel insurance.",
          tag: "Family Offer",
          buttonText: "Start Application",
          buttonUrl: "/en/visas",
          imageUrl: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&q=85",
          gradient: "linear-gradient(135deg, #065f46 0%, #115e59 60%, #0f172a 100%)",
        },
      ],
      restaurants: [
        {
          id: "banner-res-1",
          title: "Unlimited Gujarati & Jain Thali Dining Pass",
          subtitle: "Pre-book authentic 100% Pure Veg and Jain dining experiences in Dubai with guaranteed seating.",
          tag: "Pure Veg & Jain",
          buttonText: "View Menus",
          buttonUrl: "/en/restaurants",
          imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&q=85",
          gradient: "linear-gradient(135deg, #b45309 0%, #9a3412 60%, #881337 100%)",
        },
        {
          id: "banner-res-2",
          title: "Dubai Marina Pure Veg Dinner Cruise",
          subtitle: "Enjoy a lavish vegetarian buffet and live entertainment while cruising past the illuminated skyline.",
          tag: "Special Evening",
          buttonText: "Book Dinner Cruise",
          buttonUrl: "/en/restaurants",
          imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=85",
          gradient: "linear-gradient(135deg, #3730a3 0%, #5b21b6 60%, #3b0764 100%)",
        },
      ],
    };

    const moduleKey = String(currentModule || "hotels").toLowerCase().trim();
    const serverBanners = (Array.isArray(moduleData?.banners) && moduleData.banners.length > 0)
      ? moduleData.banners
      : (Array.isArray(moduleData?.offers) && moduleData.offers.length > 0)
      ? moduleData.offers
      : [];

    const fallbackList = fallbackBannersByModule[moduleKey] || fallbackBannersByModule.hotels;
    const banners = serverBanners.length > 0 ? serverBanners : fallbackList;

    return (
      <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((b: any, idx: number) => {
            const rawTitle = b.title || b.name || "Special Travel Offer";
            const rawSubtitle =
              b.subtitle ||
              b.description ||
              "Enjoy exclusive member rates, flexible cancellations, and guaranteed departures.";
            const rawTag =
              b.tag ||
              b.badge ||
              b.tagline ||
              (b.code ? `CODE: ${b.code}` : "SPECIAL DEAL");
            const rawBtnText = b.buttonText || b.ctaText || "Explore Deals";
            const rawBtnUrl = b.buttonUrl || b.ctaLink || `/en/${currentModule}`;
            const fallbackItem = fallbackList[idx % fallbackList.length] || fallbackList[0];
            const rawImage =
              b.imageUrl ||
              b.image ||
              b.bannerImage ||
              fallbackItem.imageUrl;
            const finalImage = getActualImageUrl(rawImage, {
              title: rawTitle,
              module: currentModuleCode,
              id: b.id || `offer-${idx}`,
            });
            const inlineGradient =
              b.gradient ||
              fallbackItem.gradient ||
              "linear-gradient(135deg, #0369a1 0%, #1e40af 60%, #312e81 100%)";

            return (
              <div
                key={b.id || idx}
                className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between min-h-[200px] sm:min-h-[220px] group border border-neutral-200/20 dark:border-neutral-800"
                style={{ background: inlineGradient }}
              >
                {/* Background Image with layered gradient overlays */}
                {finalImage && (
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={finalImage}
                      alt={rawTitle}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority={idx === 0}
                    />
                    {/* Dark gradient overlay to guarantee high-contrast readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-900/80 to-neutral-900/40" />
                  </div>
                )}

                {/* Card Header Content */}
                <div className="space-y-2.5 relative z-10">
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-white/20 text-white backdrop-blur-md border border-white/25 shadow-xs">
                    {rawTag}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-sm max-w-xl">
                    {rawTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-200 line-clamp-2 max-w-md drop-shadow-xs">
                    {rawSubtitle}
                  </p>
                </div>

                {/* Call to Action Button */}
                <div className="pt-4 relative z-10">
                  <Link
                    href={rawBtnUrl}
                    className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white text-neutral-900 font-extrabold text-xs sm:text-sm hover:bg-neutral-100 hover:shadow-lg transition-all shadow-md active:scale-95 min-h-[44px] group/btn"
                  >
                    <span>{rawBtnText}</span>
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4 transition-transform group-hover/btn:translate-x-1"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 5. WATCH TOP TRAVEL EXPERIENCES (Video Row)
  // ─────────────────────────────────────────────────────────────
  if (type === "videos") {
    const videos = moduleData?.videos || [];
    return (
      <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 ${className}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Watch Top Travel Experiences
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Immerse yourself in real traveler captures and destination highlights.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((vid: any) => (
            <div
              key={vid.id}
              className="group relative rounded-2xl overflow-hidden aspect-[16/9] bg-neutral-900 shadow-sm"
            >
              <Image
                src={getActualImageUrl(vid.thumbnail, {
                  title: vid.title,
                  module: currentModuleCode,
                })}
                alt={vid.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              {/* Play Button Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white border border-white/40 group-hover:scale-110 transition-transform shadow-lg">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                    <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                  </svg>
                </div>
              </div>

              <div className="absolute bottom-3 left-4 right-4 text-white">
                <span className="text-[11px] font-semibold text-white/80 block">
                  {vid.location} • {vid.duration}
                </span>
                <h3 className="text-sm sm:text-base font-bold leading-snug drop-shadow-sm mt-0.5">
                  {vid.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 6. FAQ ACCORDION
  // ─────────────────────────────────────────────────────────────
  if (type === "faq") {
    const faqList = moduleData?.faq || [];
    return (
      <section className={`w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 ${className}`}>
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Everything you need to know about {currentModule} bookings, dietary arrangements, and 24/7 care.
          </p>
        </div>

        <div className="space-y-3">
          {faqList.map((item: any, idx: number) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={item.id || idx}
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left text-sm sm:text-base font-bold text-neutral-900 dark:text-white hover:text-primary transition-colors min-h-[44px]"
                >
                  <span>{item.question}</span>
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : "text-neutral-400"}`}
                  >
                    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 7. CURATED COLLECTIONS / PACKAGES ROW (Horizontal Scroll)
  // ─────────────────────────────────────────────────────────────
  if (type === "packages") {
    const pkgList = moduleData?.packages || [];
    const sectionTitle =
      titleOverride ||
      moduleData?.meta?.collectionTitle ||
      "Curated Holiday Packages";
    const sectionSubtitle =
      subtitleOverride ||
      moduleData?.meta?.collectionSubtitle ||
      "Handcrafted selections with verified service guarantee.";

    return (
      <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {sectionTitle}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {sectionSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              aria-label="Scroll left"
              className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              aria-label="Scroll right"
              className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              →
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex items-center gap-5 overflow-x-auto scrollbar-hide py-2"
          style={{ scrollbarWidth: "none" }}
        >
          {pkgList.map((p: any) => (
            <div
              key={p.id}
              className="group w-72 sm:w-80 shrink-0 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div className="relative aspect-[16/10] w-full bg-neutral-100 dark:bg-neutral-800">
                <Image
                  src={getActualImageUrl(p.imageUrl, {
                    title: p.title,
                    city: p.city,
                    module: currentModuleCode,
                    id: p.id,
                  })}
                  alt={p.title}
                  fill
                  sizes="320px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {p.category && (
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-md">
                    {typeof p.category === "object" && p.category !== null ? (p.category.en || p.category.gu || p.category.ms || Object.values(p.category)[0]) : p.category}
                  </span>
                )}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-1">
                  {p.title}
                </h3>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="font-extrabold text-neutral-900 dark:text-white">
                    {currencySymbol}{Number(p.price).toLocaleString()}
                  </span>
                  <Link
                    href={p.detailUrl || `/en/${currentModule}/${p.slug}`}
                    className="font-bold text-primary hover:underline"
                  >
                    Explore
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 8. TRAVELER REVIEWS
  // ─────────────────────────────────────────────────────────────
  if (type === "reviews") {
    const reviews = moduleData?.reviews || [];
    return (
      <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 ${className}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 mb-1">
            <span>★★★★★</span>
            <span className="text-neutral-700 dark:text-neutral-300 font-semibold">
              4.9/5 from 1,200+ Verified Reviews
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            What Our Travelers Say
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Authentic guest feedback across Google Reviews, TripAdvisor, and Trustpilot.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {reviews.map((r: any) => {
            const isExpanded = Boolean(expandedReviews[r.id]);
            return (
              <div
                key={r.id}
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="font-bold text-amber-500">{"★".repeat(r.rating || 5)}</span>
                    <span className="font-semibold text-neutral-500">{r.platform ?? r.source ?? (r.verified ? "Verified" : "")}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {(() => { const txt = r.comment ?? r.text ?? r.body ?? r.review ?? ""; return isExpanded ? txt : `${txt.slice(0, 120)}...`; })()}
                  </p>
                  {((r.comment ?? r.text ?? r.body ?? r.review ?? "").length > 120) && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedReviews((prev) => ({ ...prev, [r.id]: !isExpanded }))
                      }
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      {isExpanded ? "Read less" : "Read more"}
                    </button>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-neutral-900 dark:text-white">{r.author}</div>
                    <div className="text-neutral-400">{r.location ?? r.city ?? ""}</div>
                  </div>
                  <span className="text-neutral-400 text-[11px]">{r.date ?? r.tourName ?? r.createdAt?.slice(0, 10) ?? ""}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 9. YOUR TRUSTED PARTNER (Stats / Why Us)
  // ─────────────────────────────────────────────────────────────
  if (type === "trusted") {
    const stats = [
      { label: "Happy Travelers", value: "50,000+" },
      { label: "Destinations Covered", value: "45+" },
      { label: "Verified Service Partners", value: "3,500+" },
      { label: "24/7 Concierge Support", value: "100%" },
    ];

    return (
      <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 ${className}`}>
        <div className="rounded-3xl bg-neutral-900 text-white p-8 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3 mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              WHY TRAVEL WITH US
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Your Trusted Partner for Memorable Journeys
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              From verified luxury stays and thrill-filled desert safaris to pure vegetarian and Jain meal guarantees, we make family and business travel effortlessly smooth.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-6 border-t border-white/10">
            {stats.map((s, idx) => (
              <div key={idx} className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-amber-400">
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm text-neutral-400 font-medium">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 10. OFFICIAL PARTNERS & MEMBERSHIPS
  // ─────────────────────────────────────────────────────────────
  if (type === "partners") {
    const partners = [
      "Gujarat Tourism",
      "TAAI (Travel Agents Association of India)",
      "TAFI (Travel Agents Federation)",
      "TAG (Tourism Advisory Group)",
      "IAAPI (Indian Association of Amusement Parks)",
    ];

    return (
      <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
        <div className="text-center mb-6">
          <span className="text-xs font-bold tracking-widest uppercase text-neutral-400">
            OFFICIAL ACCREDITATIONS &amp; MEMBERSHIPS
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 lg:gap-10 opacity-75 grayscale hover:grayscale-0 transition-all">
          {partners.map((p, idx) => (
            <div
              key={idx}
              className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs font-bold text-neutral-700 dark:text-neutral-300"
            >
              {p}
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 11. SEO LINK GROUPS (Dynamic per Module)
  // ─────────────────────────────────────────────────────────────
  if (type === "seoLinks") {
    const seoGroupsMap: Record<string, { title: string; links: string[] }[]> = {
      hotels: [
        {
          title: "Explore India's Best Hill Station Hotels",
          links: ["Shimla Luxury Resorts", "Manali Valley Views", "Ooty Heritage Cottages", "Munnar Tea Garden Stays"],
        },
        {
          title: "Most Loved Destinations",
          links: ["Dubai Marina Hotels", "Goa Beachfront Villas", "Singapore Orchard Stays", "Bangkok Riverfront Stays"],
        },
        {
          title: "Pilgrimage & Heritage Circuits",
          links: ["Somnath Temple Stays", "Dwarka Holy Hotels", "Varanasi Ghat Haveli", "Tirupati Executive Suites"],
        },
        {
          title: "Iconic Stays & Luxury Escapes",
          links: ["Atlantis The Palm Dubai", "Burj Al Arab Suites", "Marina Bay Sands", "Banyan Tree Bangkok"],
        },
      ],
      tours: [
        {
          title: "Top Dubai Attractions",
          links: ["Burj Khalifa Observation Deck", "Evening Red Dune Desert Safari", "Dubai Frame Fast-Track", "Museum of the Future"],
        },
        {
          title: "Adventure & Excursions",
          links: ["4x4 Dune Bashing & BBQ", "Dubai Marina Luxury Yacht Cruise", "Sky Views Glass Slide", "Flyboarding at JBR"],
        },
        {
          title: "Family Theme Parks",
          links: ["Ferrari World Abu Dhabi", "Atlantis Aquaventure Waterpark", "IMG Worlds of Adventure", "Warner Bros World"],
        },
        {
          title: "Sightseeing Circuits",
          links: ["Abu Dhabi Full Day City Tour", "Dubai City Half-Day Tour", "Al Ain Oasis Tour", "Musandam Dhow Cruise"],
        },
      ],
      packages: [
        {
          title: "Dubai Holiday Packages",
          links: ["5D/4N Dubai Grand Tour", "6D/5N Dubai with Abu Dhabi", "Luxury Dubai Shopping Festival", "Dubai Honeymoon Special"],
        },
        {
          title: "Southeast Asia Packages",
          links: ["Singapore & Malaysia Combo", "Bali Island Paradise 6D", "Thailand Beach Escape", "Vietnam Heritage Trail"],
        },
        {
          title: "Jain-Friendly Domestic Tours",
          links: ["Gujarat Pilgrimage Tour", "Kashmir Paradise 7D", "Kerala Backwaters & Hills", "Golden Triangle Delhi-Agra-Jaipur"],
        },
        {
          title: "International Escapes",
          links: ["Swiss & Paris Explorer", "London & Scotland Highlights", "Mauritius Luxury Beach", "Australia Gold Coast Tour"],
        },
      ],
      flights: [
        {
          title: "Top Flights to Dubai",
          links: ["Ahmedabad to Dubai Flights", "Mumbai to Dubai Airfares", "Delhi to Dubai Direct", "Surat to Dubai Non-Stop"],
        },
        {
          title: "Southeast Asia Routes",
          links: ["Delhi to Singapore Flights", "Mumbai to Bangkok Direct", "Bangalore to Bali Flights", "Chennai to Kuala Lumpur"],
        },
        {
          title: "Domestic Flights India",
          links: ["Ahmedabad to Goa Flights", "Delhi to Mumbai Flights", "Bangalore to Delhi", "Mumbai to Srinagar Flights"],
        },
        {
          title: "European & Long Haul",
          links: ["Ahmedabad to London Direct", "Delhi to New York Direct", "Mumbai to Paris Airfare", "Bangalore to Frankfurt"],
        },
      ],
      transfers: [
        {
          title: "Airport Transfers",
          links: ["Dubai DXB Airport Pickup", "Abu Dhabi Airport to Dubai", "Sharjah Airport Transfers", "DXB to Palm Jumeirah Cabs"],
        },
        {
          title: "Intercity Cabs",
          links: ["Dubai to Abu Dhabi Sedan", "Dubai to Ras Al Khaimah", "Dubai to Al Ain Chauffeur", "Sharjah to Dubai Marina"],
        },
        {
          title: "Vehicle Fleets",
          links: ["Private Executive Sedan", "Spacious Family SUV (Yukon)", "Mercedes S-Class VIP Chauffeur", "14-Seater Passenger Van"],
        },
        {
          title: "Special Services",
          links: ["10-Hour City Chauffeur Drive", "Dubai Stretch Limousine Tour", "Meet & Greet Airport Host", "Inter-Emirate Day Rental"],
        },
      ],
      visas: [
        {
          title: "UAE Visa Services",
          links: ["Dubai 30 Days Tourist Visa", "Dubai 60 Days Tourist Visa", "14 Days Express Transit Visa", "UAE 60 Days Multiple Entry"],
        },
        {
          title: "Express Processing",
          links: ["24-Hour Urgent Dubai Visa", "Same-Day Emergency Visa", "Weekend Visa Approval", "Family Tourist Visa Package"],
        },
        {
          title: "International E-Visas",
          links: ["Singapore Tourist E-Visa", "Thailand Fast-Track E-Visa", "Malaysia eVisa for Indians", "Vietnam E-Visa Assistance"],
        },
        {
          title: "Visa Guides & Requirements",
          links: ["Dubai Visa Document Checklist", "Photo Specifications Guide", "Immigration Smart Gate Tips", "Visa Extension Rules"],
        },
      ],
      restaurants: [
        {
          title: "Pure Veg Dining in Dubai",
          links: ["Rasoi Ghar Pure Veg Thali", "Maharaja Pure Veg Karama", "Govinda's Vegetarian Dining", "Kamat Pure Veg Restaurant"],
        },
        {
          title: "Jain Friendly Dining",
          links: ["Swagath Pure Veg & Jain", "Jain Meals Without Root Veg", "Jain Food in Dubai Marina", "Jain Buffets at Desert Camp"],
        },
        {
          title: "Thali & Traditional Dining",
          links: ["Unlimited Gujarati Thalis", "Kathiyawadi Food in Dubai", "Rajasthani Royal Thalis", "South Indian Breakfast Places"],
        },
        {
          title: "Dining Experiences",
          links: ["Dubai Marina Dhow Dinner", "Desert Camp Pure Veg Buffet", "Rooftop Veg Skyline Lounges", "Family Dining Banquet Halls"],
        },
      ],
      buildpackage: [
        {
          title: "Custom Dubai Trips",
          links: ["Build 5D Dubai Itinerary", "Custom Dubai & Abu Dhabi", "Family Theme Park Plan", "Bespoke Luxury Dubai Trip"],
        },
        {
          title: "Multi-City Explorer",
          links: ["Singapore + Bali Custom Plan", "Thailand 3-Island Explorer", "Swiss + Paris Custom Tour", "Vietnam & Cambodia Plan"],
        },
        {
          title: "Personalized Domestic Plans",
          links: ["Custom Goa Villa & Cabs", "Custom Kerala Houseboat Plan", "Custom Kashmir Valley Tour", "Rajasthan Heritage Custom Drive"],
        },
        {
          title: "Planning Tools",
          links: ["Real-Time Trip Cost Calculator", "Dynamic Hotel + Tour Bundler", "Private Cab Route Sync", "Free Itinerary Specialist Review"],
        },
      ],
    };

    const groups = seoGroupsMap[currentModule] || seoGroupsMap.hotels;

    return (
      <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {groups.map((grp, gIdx) => {
            const isCollapsed = collapsedSeoGroup[grp.title];
            return (
              <div
                key={gIdx}
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-2 bg-neutral-50/50 dark:bg-neutral-900/50"
              >
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedSeoGroup((prev) => ({
                      ...prev,
                      [grp.title]: !isCollapsed,
                    }))
                  }
                  className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold text-neutral-900 dark:text-white"
                >
                  <span>{grp.title}</span>
                  <span className="text-neutral-400 text-xs">{isCollapsed ? "+" : "−"}</span>
                </button>
                {!isCollapsed && (
                  <ul className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    {grp.links.map((lnk, lIdx) => (
                      <li key={lIdx}>
                        <Link
                          href={`/en/${currentModule}?q=${encodeURIComponent(lnk)}`}
                          className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-primary transition-colors"
                        >
                          {lnk}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 12. TRUST BADGES
  // ─────────────────────────────────────────────────────────────
  if (type === "trustBadges") {
    const badges = [
      { title: "No Booking Fees", desc: "100% transparent pricing with zero surprise surcharges." },
      { title: "Best Price Guarantee", desc: "Matched or beaten rates across top verified hotels and tours." },
      { title: "10,000+ Happy Customers", desc: "Rated 4.9/5 stars with authentic Gujarati & Jain food care." },
    ];

    return (
      <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {badges.map((b, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 text-center space-y-1"
            >
              <div className="text-sm font-extrabold text-neutral-900 dark:text-white">
                {b.title}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {b.desc}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 13. FOOTER SECTION
  // ─────────────────────────────────────────────────────────────
  if (type === "footer") {
    return <FooterSection config={config} />;
  }

  return null;
}
export default ModuleSection;
