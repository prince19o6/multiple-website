"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound, useSearchParams } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import EnquiryModal from "@/components/lead/EnquiryModal";
import { useFeature } from "@/lib/features/useFeature";

interface CarItem {
  id: string;
  name: string;
  type: string;
  destination: string;
  seats: number;
  doors: number;
  transmission: "Automatic" | "Manual";
  luggage: string;
  pricePerDay: number;
  rating: number;
  reviewsCount: number;
  image: string;
  features: string[];
  badge?: string;
}

const SAMPLE_CARS: CarItem[] = [
  {
    id: "perodua-myvi-langkawi",
    name: "Perodua Myvi 1.5 Advance",
    type: "Compact Hatchback",
    destination: "Langkawi",
    seats: 5,
    doors: 5,
    transmission: "Automatic",
    luggage: "2 Large Bags",
    pricePerDay: 28,
    rating: 4.8,
    reviewsCount: 312,
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500&q=80",
    features: ["Air Conditioning", "Bluetooth Audio", "Unlimited Mileage", "Collision Damage Waiver"],
    badge: "Most Popular",
  },
  {
    id: "toyota-vios-kl",
    name: "Toyota Vios 1.5G Sedan",
    type: "Sedan",
    destination: "Kuala Lumpur",
    seats: 5,
    doors: 4,
    transmission: "Automatic",
    luggage: "3 Bags",
    pricePerDay: 35,
    rating: 4.9,
    reviewsCount: 420,
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&q=80",
    features: ["Apple CarPlay", "Reverse Camera", "Full Insurance Cover", "Clean Sanitised"],
    badge: "Top Value",
  },
  {
    id: "honda-crv-phuket",
    name: "Honda CR-V 2.0 Turbo AWD",
    type: "Compact SUV",
    destination: "Phuket",
    seats: 5,
    doors: 5,
    transmission: "Automatic",
    luggage: "4 Bags",
    pricePerDay: 48,
    rating: 4.9,
    reviewsCount: 185,
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=500&q=80",
    features: ["GPS Navigation", "Panoramic Roof", "Child Seat Included", "24/7 Roadside Assistance"],
    badge: "Family SUV",
  },
  {
    id: "toyota-alphard-sg",
    name: "Toyota Alphard Executive Lounge 3.5",
    type: "Luxury MPV",
    destination: "Singapore",
    seats: 7,
    doors: 5,
    transmission: "Automatic",
    luggage: "5 Large Bags",
    pricePerDay: 120,
    rating: 5.0,
    reviewsCount: 94,
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=500&q=80",
    features: ["Captain Recliner Seats", "Chauffeur Option Available", "VIP Airport Pickup", "Complimentary Water"],
    badge: "VIP Luxury",
  },
];

export default function CarRentalPage() {
  const config = useSiteConfig();
  const site = useSite();
  const searchParams = useSearchParams();

  const { isEnabled: carRentalEnabled } = useFeature("car-rental");
  if (!carRentalEnabled) {
    notFound();
  }

  const currencySymbol = config?.currencySymbol || "$";
  const primaryColor = config?.theme?.colors?.primary || "#FF932C";

  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarItem | null>(null);

  const locationFilter = searchParams.get("location") || "";

  const cars = SAMPLE_CARS.filter((c) => {
    if (!locationFilter) return true;
    return (
      c.destination.toLowerCase().includes(locationFilter.toLowerCase()) ||
      c.name.toLowerCase().includes(locationFilter.toLowerCase())
    );
  });

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-neutral-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-6">
          <Link href="/en" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="font-semibold text-neutral-900 dark:text-white">Car Rental</span>
        </div>

        {/* Header */}
        <div className="bg-neutral-900 text-white rounded-3xl p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/10 shadow-xl">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
              Self-Drive &amp; Chauffeur Rentals
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
              Verified Car Rentals in Southeast Asia
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              Transparent daily pricing, clean verified fleet, comprehensive insurance, and instant pick-up at major airport terminals.
            </p>
          </div>
        </div>

        {/* Car Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <div
              key={car.id}
              className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-neutral-800 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 w-full bg-neutral-100 dark:bg-neutral-800">
                  <Image
                    src={car.image}
                    alt={car.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                  {car.badge && (
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wide bg-amber-400 text-black shadow-sm">
                      {car.badge}
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-xs font-bold bg-black/60 backdrop-blur-md text-white">
                    📍 {typeof (car.destination as any) === "object" && car.destination !== null ? ((car.destination as any).cityName || (car.destination as any).country || "Destination") : car.destination}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span className="font-semibold uppercase">{car.type}</span>
                    <span className="text-amber-500 font-bold">★ {car.rating} ({car.reviewsCount})</span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {car.name}
                  </h3>

                  {/* Specs */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3 pb-3 border-b border-gray-100 dark:border-neutral-800">
                    <span>👥 {car.seats} Seats</span>
                    <span>•</span>
                    <span>⚙️ {car.transmission}</span>
                    <span>•</span>
                    <span>🧳 {car.luggage}</span>
                  </div>

                  {/* Features */}
                  <ul className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    {car.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Price & Book CTA */}
              <div className="p-5 pt-0">
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <span className="text-xs text-muted-foreground">From</span>{" "}
                    <span className="text-xl font-black text-gray-900 dark:text-white">
                      {currencySymbol}{car.pricePerDay}
                    </span>
                    <span className="text-xs text-muted-foreground"> / day</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Zero Booking Fees
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCar(car);
                    setEnquiryOpen(true);
                  }}
                  className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide text-white shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 hover:opacity-95"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>Reserve Vehicle</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enquiry Modal */}
      {enquiryOpen && (
        <EnquiryModal
          isOpen={enquiryOpen}
          onClose={() => setEnquiryOpen(false)}
          serviceName={
            selectedCar
              ? `${selectedCar.name} (${typeof (selectedCar.destination as any) === "object" && selectedCar.destination !== null ? ((selectedCar.destination as any).cityName || (selectedCar.destination as any).country || "") : selectedCar.destination})`
              : "Car Rental Reservation"
          }
          defaultDestination={
            selectedCar && typeof (selectedCar.destination as any) === "object" && selectedCar.destination !== null
              ? ((selectedCar.destination as any).cityName || (selectedCar.destination as any).country || "")
              : (selectedCar?.destination || "")
          }
          siteId={site.siteId}
          currencySymbol={currencySymbol}
        />
      )}
    </main>
  );
}
