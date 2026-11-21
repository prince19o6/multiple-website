"use client";

import React, { useRef } from "react";
import Link from "next/link";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";
import { useCurrency } from "@/lib/CurrencyContext";

interface CuratedPackagesSectionProps {
  config: MergedWebsiteConfig;
}

interface PackageItem {
  id: string;
  slug?: string;
  title: string;
  duration: string;
  price: number;
  image: string;
  badge: string;
  highlights: string[];
}

const DUBAI_PACKAGES: PackageItem[] = [
  {
    id: "dubai-holiday-package",
    title: "Dubai Highlights & Desert Safari",
    duration: "5 Days / 4 Nights",
    price: 38500,
    badge: "Bestseller",
    highlights: ["Burj Khalifa Level 124", "Marina Dhow Dinner Cruise", "4x4 Desert Safari"],
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=500&q=80",
  },
  {
    id: "dubai-honeymoon-package",
    title: "Dubai Romantic Luxury Honeymoon",
    duration: "6 Days / 5 Nights",
    price: 54900,
    badge: "Honeymoon Special",
    highlights: ["Atlantis The Palm Aquaventure", "Limousine Ride", "Candlelight Yacht Dinner"],
    image: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=500&q=80",
  },
  {
    id: "dubai-senior-citizen",
    title: "Dubai Senior Citizen Leisure Tour",
    duration: "5 Days / 4 Nights",
    price: 36000,
    badge: "Relaxed Pace",
    highlights: ["Miracle Garden", "Global Village", "Dedicated Wheelchair & Porter Support"],
    image: "https://images.unsplash.com/photo-1528702748617-c64d49f918af?w=500&q=80",
  },
  {
    id: "dubai-desert-safari",
    title: "Dubai Desert Safari VIP Experience",
    duration: "3 Days / 2 Nights",
    price: 22500,
    badge: "Adventure",
    highlights: ["Luxury Bedouin Camp", "Falcon Show", "Quad Biking & BBQ Buffet"],
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80",
  },
];

const JAIN_PACKAGES: PackageItem[] = [
  {
    id: "dubai-jain-package",
    title: "Dubai Jain Friendly Group Tour",
    duration: "6 Days / 5 Nights",
    price: 42000,
    badge: "Pure Jain Food",
    highlights: ["Chauviharr-friendly Dinner", "Mahavira Temple Visit", "Private Veg Chef Kitchen"],
    image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=500&q=80",
  },
  {
    id: "malaysia-jain-package",
    title: "Malaysia & Langkawi Jain Tour",
    duration: "5 Days / 4 Nights",
    price: 34500,
    badge: "Jain Kitchen",
    highlights: ["Batu Caves", "Langkawi Cable Car", "Curated Vegetarian & Jain Dining"],
    image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=500&q=80",
  },
  {
    id: "bangkok-jain-package",
    title: "Bangkok & Pattaya Jain Holiday",
    duration: "5 Days / 4 Nights",
    price: 29800,
    badge: "No Onion/Garlic",
    highlights: ["Coral Island Speedboat", "Safari World", "Pure Jain Gujarati Meals"],
    image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=500&q=80",
  },
  {
    id: "maldives-jain-package",
    title: "Maldives Luxury Jain Island Resort",
    duration: "4 Days / 3 Nights",
    price: 78000,
    badge: "Island Retreat",
    highlights: ["Water Villa Stay", "Seaplane Transfers", "Specialist Jain Chef Provision"],
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=500&q=80",
  },
];

const DOMESTIC_PACKAGES: PackageItem[] = [
  {
    id: "kashmir-tour-package",
    title: "Kashmir Paradise: Srinagar, Gulmarg & Pahalgam",
    duration: "6 Days / 5 Nights",
    price: 24500,
    badge: "Top Domestic",
    highlights: ["Gondola Ride Gulmarg", "Shikara Ride Dal Lake", "Betaab Valley Excursion"],
    image: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=500&q=80",
  },
  {
    id: "goa-tour-packages",
    title: "Goa Beach Holiday & Heritage Churches",
    duration: "4 Days / 3 Nights",
    price: 14500,
    badge: "Beach Getaway",
    highlights: ["North & South Goa Sightseeing", "Mandovi River Cruise", "Beachfront Resort"],
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=500&q=80",
  },
  {
    id: "rann-utsav-package",
    title: "Kutch Rann Utsav Tent City Experience",
    duration: "3 Days / 2 Nights",
    price: 19800,
    badge: "Cultural Festival",
    highlights: ["White Rann Sunset", "Kala Dungar Visit", "Live Kutchi Folk Dances"],
    image: "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?w=500&q=80",
  },
  {
    id: "kerala-tour-package",
    title: "Kerala Backwaters & Munnar Tea Estates",
    duration: "5 Days / 4 Nights",
    price: 21000,
    badge: "God's Own Country",
    highlights: ["Alleppey Houseboat Cruise", "Munnar Tea Plantations", "Periyar Wildlife"],
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=500&q=80",
  },
];

function PackageSliderRow({
  title,
  subtitle,
  packages,
  categoryHref,
}: {
  title: string;
  subtitle: string;
  packages: PackageItem[];
  categoryHref: string;
  currencySymbol?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { formatPrice } = useCurrency();

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -320 : 320;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <div className="py-6 border-b border-border last:border-0 text-foreground">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-foreground-muted">{subtitle}</p>
        </div>
        <Link
          href={categoryHref}
          className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
        >
          <span>View All</span>
          <span>→</span>
        </Link>
      </div>

      <div className="relative group">
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Scroll row left"
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-surface shadow-soft-sm border border-border items-center justify-center text-foreground hover:bg-surface-2 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ◀
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-1"
          style={{ scrollbarWidth: "none" }}
        >
          {packages.map((pkg, idx) => (
            <div
              key={`${pkg.id}-${idx}`}
              className="min-w-[85%] sm:min-w-[45%] md:min-w-[30%] lg:min-w-[23%] snap-start bg-surface rounded-xl overflow-hidden shadow-soft-sm hover:shadow-soft-lg border border-border transition-all duration-300 flex flex-col justify-between group/card"
            >
              <div>
                <div className="relative h-44 w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pkg.image}
                    alt={pkg.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-primary text-primary-contrast text-[10px] font-bold uppercase tracking-wider shadow-soft-sm">
                    {pkg.badge}
                  </span>
                  <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold">
                    {pkg.duration}
                  </span>
                </div>

                <div className="p-4">
                  <h4 className="text-sm font-bold text-foreground line-clamp-1 group-hover/card:text-primary transition-colors">
                    {pkg.title}
                  </h4>

                  <ul className="mt-2 space-y-1 text-[11px] text-foreground-muted">
                    {pkg.highlights.slice(0, 2).map((h, i) => (
                      <li key={i} className="flex items-center gap-1.5 truncate">
                        <span className="text-emerald-500">✓</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-border mt-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-foreground-subtle block">Starts from</span>
                  <span className="text-base font-black text-foreground">
                    {formatPrice(pkg.price, "INR")}
                  </span>
                  <span className="text-[10px] text-foreground-subtle"> / person</span>
                </div>

                <Link
                  href={`/en/holidays/${pkg.slug || pkg.id}`}
                  className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-primary-contrast text-xs font-bold transition-colors shadow-soft-sm"
                >
                  Book
                </Link>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Scroll row right"
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-surface shadow-soft-sm border border-border items-center justify-center text-foreground hover:bg-surface-2 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ▶
        </button>
      </div>
    </div>
  );
}

export default function CuratedPackagesSection({ config }: CuratedPackagesSectionProps) {
  const currencySymbol = config?.currencySymbol || "₹";

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <PackageSliderRow
        title="Dubai Packages"
        subtitle="Exclusive flight-inclusive holiday packages, desert safaris & city experiences"
        packages={DUBAI_PACKAGES}
        categoryHref="/en/holidays?destination=Dubai"
        currencySymbol={currencySymbol}
      />

      <PackageSliderRow
        title="Jain Packages"
        subtitle="Specially curated tours with 100% certified vegetarian & Jain meal provisions"
        packages={JAIN_PACKAGES}
        categoryHref="/en/holidays?category=jain"
        currencySymbol={currencySymbol}
      />

      <PackageSliderRow
        title="Domestic Packages"
        subtitle="India’s grand circuits: Kashmir, Goa, Rann Utsav, Kerala & spiritual getaways"
        packages={DOMESTIC_PACKAGES}
        categoryHref="/en/holidays?category=domestic"
        currencySymbol={currencySymbol}
      />
    </section>
  );
}
