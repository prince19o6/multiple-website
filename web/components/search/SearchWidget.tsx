"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import DestinationAutocomplete from "./DestinationAutocomplete";
import DateRangePicker from "./DateRangePicker";
import OccupancySelector, { type OccupancyState } from "./OccupancySelector";
import FiltersPanel, { type SearchFilterState } from "./FiltersPanel";
import { useFeatures } from "@/lib/features/useFeature";

interface SearchWidgetProps {
  activeModuleCode?: string;
  siteId?: string;
  accentColor?: string;
  hideQuickSwitcher?: boolean;
}

const AIRPORTS = [
  { code: "STV", name: "Surat Gujarat Airport", city: "Surat", country: "India" },
  { code: "BOM", name: "Chhatrapati Shivaji Maharaj Intl", city: "Mumbai", country: "India" },
  { code: "DEL", name: "Indira Gandhi International Airport", city: "Delhi", country: "India" },
  { code: "AMD", name: "Sardar Vallabhbhai Patel Intl", city: "Ahmedabad", country: "India" },
  { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "UAE" },
  { code: "BLR", name: "Kempegowda International Airport", city: "Bengaluru", country: "India" },
  { code: "GOI", name: "Goa Dabolim Airport", city: "Goa", country: "India" },
  { code: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand" },
  { code: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore" },
  { code: "LHR", name: "London Heathrow Airport", city: "London", country: "United Kingdom" },
];

const AIRLINES = [
  "All Airlines",
  "IndiGo",
  "Air India",
  "Emirates",
  "SpiceJet",
  "Akasa Air",
  "Vistara",
  "Etihad Airways",
  "Flydubai",
];

const NATIONALITIES = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "United Arab Emirates",
  "Singapore",
  "Germany",
  "France",
];

const VISA_DESTINATIONS = [
  "United Arab Emirates (UAE)",
  "Thailand",
  "Singapore",
  "Malaysia",
  "Schengen (Europe)",
  "United Kingdom",
  "United States",
  "Indonesia (Bali)",
  "Vietnam",
  "Egypt",
  "Turkey",
];

export default function SearchWidget({
  activeModuleCode = "HOTEL",
  siteId = "gujjutours",
  accentColor = "#2882c5",
  hideQuickSwitcher = false,
}: SearchWidgetProps) {
  const router = useRouter();

  // General state
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [occupancy, setOccupancy] = useState<OccupancyState>({
    rooms: 1,
    adults: 2,
    children: 0,
    childAges: [],
  });

  // Flight specific state
  const [tripType, setTripType] = useState<"oneWay" | "roundTrip" | "multiCity">("oneWay");
  const [cabinClass, setCabinClass] = useState("Economy");
  const [directFlightsOnly, setDirectFlightsOnly] = useState(false);
  const [fromAirport, setFromAirport] = useState(AIRPORTS[0]);
  const [toAirport, setToAirport] = useState(AIRPORTS[4]);
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [selectedAirline, setSelectedAirline] = useState("All Airlines");
  const [passengerDropdownOpen, setPassengerDropdownOpen] = useState(false);
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [infantCount, setInfantCount] = useState(0);

  // Car Rental specific state (TripGo Asia)
  const [carLocation, setCarLocation] = useState("");
  const [carPickupDate, setCarPickupDate] = useState("");
  const [carReturnDate, setCarReturnDate] = useState("");
  const [carDriverAge, setCarDriverAge] = useState("25-70");

  // Transfers specific state
  const [transferPickup, setTransferPickup] = useState("");
  const [transferDropoff, setTransferDropoff] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [transferTime, setTransferTime] = useState("10:00");
  const [transferPassengers, setTransferPassengers] = useState(2);

  // Visa specific state
  const [visaNationality, setVisaNationality] = useState("India");
  const [visaDestination, setVisaDestination] = useState("United Arab Emirates (UAE)");
  const [visaType, setVisaType] = useState("Tourist Visa (30 Days)");

  // Restaurant specific state
  const [restaurantCity, setRestaurantCity] = useState("Dubai");
  const [restaurantDate, setRestaurantDate] = useState("");
  const [restaurantTime, setRestaurantTime] = useState("19:30");
  const [restaurantGuests, setRestaurantGuests] = useState(2);

  // Build Package specific state
  const [bpFrom, setBpFrom] = useState("Mumbai");
  const [bpDestination, setBpDestination] = useState("Dubai");
  const [bpDays, setBpDays] = useState("5 Days / 4 Nights");

  // Filters state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilterState>({
    starRatings: [],
    categories: [],
    nationality: "Indian",
  });

  const handleSwapAirports = () => {
    const temp = fromAirport;
    setFromAirport(toAirport);
    setToAirport(temp);
  };

  const { searchFeatures } = useFeatures();

  // Internal active vertical tab state synchronized with prop
  const [selectedVertical, setSelectedVertical] = useState(activeModuleCode || "HOTEL");

  React.useEffect(() => {
    if (activeModuleCode) {
      setSelectedVertical(activeModuleCode);
    }
  }, [activeModuleCode]);

  const rawCode = (selectedVertical || activeModuleCode || "HOTEL").toUpperCase();
  const code = rawCode.replace(/[-_\s]/g, "");
  const isHotel = code === "HOTEL" || code === "HOTELS";
  const isTour =
    code === "TOUR" ||
    code === "TOURS" ||
    code === "ACTIVITY" ||
    code === "ACTIVITIES" ||
    code === "ATTRACTION" ||
    code === "ATTRACTIONS" ||
    code === "SIGHTSEEING";
  const isPackage =
    code === "PACKAGE" ||
    code === "PACKAGES" ||
    code === "HOLIDAY" ||
    code === "HOLIDAYS";
  const isFlight = code === "FLIGHT" || code === "FLIGHTS";
  const isCarRental =
    code === "CAR" ||
    code === "CARRENTAL" ||
    code === "CAR-RENTAL" ||
    code === "RENTAL";
  const isTransfer =
    (code === "TRANSFER" || code === "TRANSFERS" || code === "AIRPORTTRANSFER" || code === "AIRPORT-TRANSFER") &&
    !isCarRental;
  const isVisa = code === "VISA" || code === "VISAS";
  const isRestaurant = code === "RESTAURANT" || code === "RESTAURANTS";
  const isBuildPackage =
    code === "BUILDPACKAGE" ||
    code === "BUILD-PACKAGE" ||
    code === "BUILD_PACKAGE";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (isCarRental) {
      const params = new URLSearchParams();
      if (carLocation) params.set("location", carLocation);
      if (carPickupDate) params.set("pickup", carPickupDate);
      if (carReturnDate) params.set("return", carReturnDate);
      if (carDriverAge) params.set("age", carDriverAge);
      router.push(`/en/car-rental?${params.toString()}`);
      return;
    }

    if (isFlight) {
      const params = new URLSearchParams({
        tripType,
        from: fromAirport.code,
        to: toAirport.code,
        departure: departureDate,
        passengers: String(adultCount + childCount + infantCount),
        cabin: cabinClass,
        direct: String(directFlightsOnly),
        airline: selectedAirline,
      });
      if (tripType === "roundTrip") {
        params.set("return", returnDate);
      }
      router.push(`/en/flights?${params.toString()}`);
      return;
    }

    if (isTransfer) {
      const params = new URLSearchParams({
        pickup: transferPickup,
        dropoff: transferDropoff,
        date: transferDate,
        time: transferTime,
        passengers: String(transferPassengers),
      });
      router.push(`/en/transfers?${params.toString()}`);
      return;
    }

    if (isVisa) {
      const params = new URLSearchParams({
        nationality: visaNationality,
        destination: visaDestination,
        type: visaType,
      });
      router.push(`/en/visas?${params.toString()}`);
      return;
    }

    if (isRestaurant) {
      const params = new URLSearchParams({
        city: restaurantCity,
        date: restaurantDate,
        time: restaurantTime,
        guests: String(restaurantGuests),
      });
      router.push(`/en/restaurants?${params.toString()}`);
      return;
    }

    if (isBuildPackage) {
      const params = new URLSearchParams({
        from: bpFrom,
        destination: bpDestination,
        days: bpDays,
      });
      router.push(`/en/buildpackage?${params.toString()}`);
      return;
    }

    // Default Hotel / Tour / Package
    const params = new URLSearchParams();
    if (destination.trim()) params.set("destination", destination.trim());
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);
    if (occupancy.rooms > 1) params.set("rooms", String(occupancy.rooms));
    if (occupancy.adults > 0) params.set("adults", String(occupancy.adults));
    if (occupancy.children > 0) {
      params.set("children", String(occupancy.children));
      params.set("childAges", occupancy.childAges.join(","));
    }
    if (filters.starRatings.length > 0) {
      params.set("stars", filters.starRatings.join(","));
    }
    if (filters.categories.length > 0) {
      params.set("categories", filters.categories.join(","));
    }

    let targetRoute = "/en/hotels";
    if (isTour) targetRoute = "/en/tours";
    else if (isPackage) targetRoute = "/en/holidays";

    router.push(`${targetRoute}?${params.toString()}`);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 p-3 sm:p-5 rounded-b-2xl shadow-2xl border border-white/20 dark:border-neutral-800 transition-all text-gray-900 dark:text-white">
      {/* ─── ALL-FEATURE QUICK SWITCHER TABS ─── */}
      {!hideQuickSwitcher && searchFeatures.length > 0 && (
        <div
          className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-3 mb-4 border-b border-gray-100 dark:border-neutral-800"
          style={{ scrollbarWidth: "none" }}
        >
          {searchFeatures.map((feat, idx) => {
            const featCode = feat.id.toUpperCase();
            const isSelected =
              code === featCode ||
              (code === "TOUR" && (featCode === "ATTRACTIONS" || featCode === "ACTIVITY" || featCode === "ACTIVITIES")) ||
              (code === "PACKAGE" && (featCode === "HOLIDAYS" || featCode === "PACKAGES"));

            return (
              <button
                key={`${feat.id}-${idx}`}
                type="button"
                onClick={() => setSelectedVertical(featCode)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                  isSelected
                    ? "shadow-sm text-white scale-[1.02]"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700 hover:text-gray-900 dark:hover:text-white"
                }`}
                style={
                  isSelected && accentColor
                    ? { backgroundColor: accentColor, color: "#ffffff" }
                    : undefined
                }
              >
                <span>{feat.label?.en || feat.id}</span>
              </button>
            );
          })}
        </div>
      )}

      <form onSubmit={handleSearch}>
        {/* ─── 1. FLIGHT DEDICATED SEARCH FORM ─── */}
        {isFlight && (
          <div className="space-y-4">
            {/* Top Sub-Options: Radios + Cabin + Direct checkbox */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-neutral-800">
              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-200">
                  <input
                    type="radio"
                    name="flightTripType"
                    checked={tripType === "oneWay"}
                    onChange={() => setTripType("oneWay")}
                    className="w-4 h-4 text-primary accent-primary"
                  />
                  <span>One-Way</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-200">
                  <input
                    type="radio"
                    name="flightTripType"
                    checked={tripType === "roundTrip"}
                    onChange={() => setTripType("roundTrip")}
                    className="w-4 h-4 text-primary accent-primary"
                  />
                  <span>Round Trip</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-200">
                  <input
                    type="radio"
                    name="flightTripType"
                    checked={tripType === "multiCity"}
                    onChange={() => setTripType("multiCity")}
                    className="w-4 h-4 text-primary accent-primary"
                  />
                  <span>Multi City</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <select
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
                >
                  <option value="Economy">Economy</option>
                  <option value="Premium Economy">Premium Economy</option>
                  <option value="Business">Business</option>
                  <option value="First Class">First Class</option>
                </select>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={directFlightsOnly}
                    onChange={(e) => setDirectFlightsOnly(e.target.checked)}
                    className="rounded text-primary focus:ring-primary w-4 h-4 accent-primary"
                  />
                  <span>Direct Flights Only</span>
                </label>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
              {/* From Airport */}
              <div className="relative p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 hover:border-primary transition-colors min-h-[58px]">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Where from?</span>
                <select
                  value={fromAirport.code}
                  onChange={(e) => {
                    const found = AIRPORTS.find((a) => a.code === e.target.value);
                    if (found) setFromAirport(found);
                  }}
                  className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer truncate"
                >
                  {AIRPORTS.map((a) => (
                    <option key={a.code} value={a.code} className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">
                      {a.code} - {a.city} ({a.name})
                    </option>
                  ))}
                </select>

                {/* Swap Button */}
                <button
                  type="button"
                  onClick={handleSwapAirports}
                  title="Swap departure & destination"
                  className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 shadow-sm items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 hover:scale-110 active:rotate-180 transition-all"
                >
                  ⇄
                </button>
              </div>

              {/* To Airport */}
              <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 hover:border-primary transition-colors min-h-[58px]">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Flying to</span>
                <select
                  value={toAirport.code}
                  onChange={(e) => {
                    const found = AIRPORTS.find((a) => a.code === e.target.value);
                    if (found) setToAirport(found);
                  }}
                  className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer truncate"
                >
                  {AIRPORTS.map((a) => (
                    <option key={a.code} value={a.code} className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">
                      {a.code} - {a.city} ({a.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Departure & Return Dates */}
              <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 hover:border-primary transition-colors min-h-[58px]">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {tripType === "roundTrip" ? "Departure - Return" : "Travel Date"}
                </span>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
                />
                {tripType === "roundTrip" && (
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer mt-1 pt-1 border-t border-gray-200 dark:border-neutral-700"
                  />
                )}
              </div>

              {/* Passengers Selector */}
              <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 relative hover:border-primary transition-colors min-h-[58px]">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Passengers</span>
                <button
                  type="button"
                  onClick={() => setPassengerDropdownOpen(!passengerDropdownOpen)}
                  className="w-full text-left font-bold text-sm text-gray-900 dark:text-white outline-none flex items-center justify-between"
                >
                  <span>{adultCount + childCount + infantCount} Passenger{(adultCount + childCount + infantCount) > 1 ? "s" : ""}</span>
                  <span className="text-xs text-gray-400">▾</span>
                </button>

                {passengerDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-700 z-50 text-gray-900 dark:text-white">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs">Adults</div>
                          <div className="text-[10px] text-gray-400">12+ years</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => adultCount > 1 && setAdultCount(adultCount - 1)}
                            className="w-6 h-6 rounded-full border border-gray-300 dark:border-neutral-600 flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{adultCount}</span>
                          <button
                            type="button"
                            onClick={() => setAdultCount(adultCount + 1)}
                            className="w-6 h-6 rounded-full border border-gray-300 dark:border-neutral-600 flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs">Children</div>
                          <div className="text-[10px] text-gray-400">2-12 years</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => childCount > 0 && setChildCount(childCount - 1)}
                            className="w-6 h-6 rounded-full border border-gray-300 dark:border-neutral-600 flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{childCount}</span>
                          <button
                            type="button"
                            onClick={() => setChildCount(childCount + 1)}
                            className="w-6 h-6 rounded-full border border-gray-300 dark:border-neutral-600 flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs">Infants</div>
                          <div className="text-[10px] text-gray-400">Under 2 years</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => infantCount > 0 && setInfantCount(infantCount - 1)}
                            className="w-6 h-6 rounded-full border border-gray-300 dark:border-neutral-600 flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{infantCount}</span>
                          <button
                            type="button"
                            onClick={() => setInfantCount(infantCount + 1)}
                            className="w-6 h-6 rounded-full border border-gray-300 dark:border-neutral-600 flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPassengerDropdownOpen(false)}
                        className="w-full py-1.5 bg-primary hover:opacity-90 text-white rounded-lg text-xs font-bold mt-2 shadow-sm transition-all"
                        style={accentColor ? { backgroundColor: accentColor } : undefined}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full h-[58px] px-6 rounded-xl bg-primary hover:opacity-90 text-white font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
                style={accentColor ? { backgroundColor: accentColor } : undefined}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
                <span>Search Flights</span>
              </button>
            </div>

            {/* Preferred Airline row */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Preferred Airline:</span>
              <select
                value={selectedAirline}
                onChange={(e) => setSelectedAirline(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
              >
                {AIRLINES.map((a) => (
                  <option key={a} value={a} className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ─── CAR RENTAL SEARCH FORM (TripGo Asia) ─── */}
        {isCarRental && (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 flex-1 hover:border-primary transition-colors min-h-[58px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pick-up Location</span>
              <input
                type="text"
                value={carLocation}
                onChange={(e) => setCarLocation(e.target.value)}
                placeholder="Airport, City or Station (e.g. Langkawi, KL)"
                className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 hover:border-primary transition-colors min-h-[58px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pick-up Date</span>
              <input
                type="date"
                value={carPickupDate}
                onChange={(e) => setCarPickupDate(e.target.value)}
                className="bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 hover:border-primary transition-colors min-h-[58px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Return Date</span>
              <input
                type="date"
                value={carReturnDate}
                onChange={(e) => setCarReturnDate(e.target.value)}
                className="bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 hover:border-primary transition-colors min-h-[58px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Driver Age</span>
              <select
                value={carDriverAge}
                onChange={(e) => setCarDriverAge(e.target.value)}
                className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="25-70" className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">25 - 70 years</option>
                <option value="21-24" className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">21 - 24 years</option>
                <option value="70+" className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">70+ years</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full lg:w-auto py-3 px-6 sm:px-8 rounded-xl text-white font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 active:scale-98 shrink-0 min-h-[52px] sm:min-h-[58px] transition-all hover:opacity-95"
              style={accentColor ? { backgroundColor: accentColor } : undefined}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
              <span>Search Cars</span>
            </button>
          </div>
        )}

        {/* ─── 2. TRANSFER SEARCH FORM ─── */}
        {isTransfer && (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 flex-1 hover:border-primary transition-colors min-h-[58px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pickup Location</span>
              <input
                type="text"
                value={transferPickup}
                onChange={(e) => setTransferPickup(e.target.value)}
                placeholder="Airport, Hotel or Station"
                className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 flex-1 hover:border-primary transition-colors min-h-[58px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Dropoff Location</span>
              <input
                type="text"
                value={transferDropoff}
                onChange={(e) => setTransferDropoff(e.target.value)}
                placeholder="Destination Hotel or Address"
                className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 hover:border-primary transition-colors min-h-[58px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Date &amp; Time</span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
                />
                <input
                  type="time"
                  value={transferTime}
                  onChange={(e) => setTransferTime(e.target.value)}
                  className="bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 hover:border-primary transition-colors min-h-[58px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Passengers</span>
              <select
                value={transferPassengers}
                onChange={(e) => setTransferPassengers(Number(e.target.value))}
                className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 10, 15].map((num) => (
                  <option key={num} value={num} className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">
                    {num} Passenger{num > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full lg:w-auto py-3 px-6 sm:px-8 rounded-xl bg-primary hover:opacity-90 text-white font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 active:scale-98 shrink-0 min-h-[52px] sm:min-h-[58px] transition-all"
              style={accentColor ? { backgroundColor: accentColor } : undefined}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
              <span>Search Transfers</span>
            </button>
          </div>
        )}

        {/* ─── 3. VISA SEARCH FORM ─── */}
        {isVisa && (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 flex-1 hover:border-primary transition-colors min-h-[58px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Citizen Of</span>
              <select
                value={visaNationality}
                onChange={(e) => setVisaNationality(e.target.value)}
                className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
              >
                {NATIONALITIES.map((n) => (
                  <option key={n} value={n} className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 flex-1 hover:border-primary transition-colors min-h-[58px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Traveling To</span>
              <select
                value={visaDestination}
                onChange={(e) => setVisaDestination(e.target.value)}
                className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
              >
                {VISA_DESTINATIONS.map((d) => (
                  <option key={d} value={d} className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 flex-1 hover:border-primary transition-colors min-h-[58px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Visa Type</span>
              <select
                value={visaType}
                onChange={(e) => setVisaType(e.target.value)}
                className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="Tourist Visa (30 Days)" className="bg-white dark:bg-neutral-800">Tourist Visa (30 Days)</option>
                <option value="Tourist Visa (60 Days)" className="bg-white dark:bg-neutral-800">Tourist Visa (60 Days)</option>
                <option value="Business Visa" className="bg-white dark:bg-neutral-800">Business Visa</option>
                <option value="Express Visa" className="bg-white dark:bg-neutral-800">Express Visa (24 Hours)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full lg:w-auto py-3 px-6 sm:px-8 rounded-xl bg-primary hover:opacity-90 text-white font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 active:scale-98 shrink-0 min-h-[52px] sm:min-h-[58px] transition-all"
              style={accentColor ? { backgroundColor: accentColor } : undefined}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
              <span>Find Visa Requirements</span>
            </button>
          </div>
        )}

        {/* ─── 4. RESTAURANT SEARCH FORM ─── */}
        {isRestaurant && (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 flex-1 hover:border-primary transition-colors min-h-[58px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">City / Cuisine</span>
              <input
                type="text"
                value={restaurantCity}
                onChange={(e) => setRestaurantCity(e.target.value)}
                placeholder="City or Cuisine (e.g. Dubai, Italian)"
                className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 hover:border-primary transition-colors min-h-[58px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Reservation Date &amp; Time</span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={restaurantDate}
                  onChange={(e) => setRestaurantDate(e.target.value)}
                  className="bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
                />
                <input
                  type="time"
                  value={restaurantTime}
                  onChange={(e) => setRestaurantTime(e.target.value)}
                  className="bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 hover:border-primary transition-colors min-h-[58px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Table For</span>
              <select
                value={restaurantGuests}
                onChange={(e) => setRestaurantGuests(Number(e.target.value))}
                className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                  <option key={num} value={num} className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">
                    {num} People
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full lg:w-auto py-3 px-6 sm:px-8 rounded-xl bg-primary hover:opacity-90 text-white font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 active:scale-98 shrink-0 min-h-[52px] sm:min-h-[58px] transition-all"
              style={accentColor ? { backgroundColor: accentColor } : undefined}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
              <span>Find Restaurants</span>
            </button>
          </div>
        )}

        {/* ─── 5. BUILD PACKAGE SEARCH FORM ─── */}
        {isBuildPackage && (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 flex-1 hover:border-primary transition-colors min-h-[58px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Starting City</span>
              <input
                type="text"
                value={bpFrom}
                onChange={(e) => setBpFrom(e.target.value)}
                placeholder="Where do you start from? (e.g. Mumbai)"
                className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 flex-1 hover:border-primary transition-colors min-h-[58px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Destination</span>
              <input
                type="text"
                value={bpDestination}
                onChange={(e) => setBpDestination(e.target.value)}
                placeholder="Where do you want to go? (e.g. Dubai)"
                className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-[#f8f9fa] dark:bg-neutral-800/80 flex-1 hover:border-primary transition-colors min-h-[58px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Duration</span>
              <select
                value={bpDays}
                onChange={(e) => setBpDays(e.target.value)}
                className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="3 Days / 2 Nights" className="bg-white dark:bg-neutral-800">3 Days / 2 Nights</option>
                <option value="5 Days / 4 Nights" className="bg-white dark:bg-neutral-800">5 Days / 4 Nights</option>
                <option value="7 Days / 6 Nights" className="bg-white dark:bg-neutral-800">7 Days / 6 Nights</option>
                <option value="10 Days / 9 Nights" className="bg-white dark:bg-neutral-800">10 Days / 9 Nights</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full lg:w-auto py-3 px-6 sm:px-8 rounded-xl bg-primary hover:opacity-90 text-white font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 active:scale-98 shrink-0 min-h-[52px] sm:min-h-[58px] transition-all"
              style={accentColor ? { backgroundColor: accentColor } : undefined}
            >
              <span>✨ Build Custom Package</span>
            </button>
          </div>
        )}

        {/* ─── 6. HOTEL / TOUR / PACKAGE / GENERAL SEARCH FORM (Matching Screenshot) ─── */}
        {!isFlight && !isTransfer && !isCarRental && !isVisa && !isRestaurant && !isBuildPackage && (
          <div>
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
              {/* Destination Autocomplete */}
              <DestinationAutocomplete
                value={destination}
                onChange={setDestination}
                siteId={siteId}
                label={
                  isHotel
                    ? "DESTINATION / HOTEL"
                    : isTour
                    ? "DESTINATION / ACTIVITY"
                    : "HOLIDAY DESTINATION"
                }
                placeholder={
                  isHotel
                    ? "City, Landmark or Hotel name"
                    : isTour
                    ? "City or Activity name (e.g. Langkawi, Dubai)"
                    : isPackage
                    ? "Search holiday destination (e.g. Bali, Kashmir)"
                    : "Destination"
                }
              />

              {/* Date Range Picker */}
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                label={
                  isHotel
                    ? "CHECK-IN — CHECK-OUT"
                    : isTour
                    ? "TRAVEL DATE"
                    : "TRAVEL DATES"
                }
                isSingleDate={isTour}
                onChange={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                }}
              />

              {/* Occupancy Selector */}
              <OccupancySelector
                value={occupancy}
                onChange={setOccupancy}
                label={
                  isHotel
                    ? "GUESTS & ROOMS"
                    : "TRAVELERS"
                }
                hideRooms={isTour || isPackage}
              />

              {/* Filters Toggle Button */}
              <button
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-gray-400 bg-white dark:bg-neutral-800 text-sm font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors shrink-0 min-h-[58px]"
                aria-label="Toggle Filters"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500 dark:text-gray-400">
                  <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z" clipRule="evenodd" />
                </svg>
                <span>Filters</span>
                {(filters.starRatings.length > 0 || filters.categories.length > 0) && (
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                )}
              </button>

              {/* Search Submit Button */}
              <button
                type="submit"
                className="py-3 px-8 rounded-xl bg-primary hover:opacity-90 text-white font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 active:scale-98 shrink-0 min-h-[58px] transition-all"
                style={accentColor ? { backgroundColor: accentColor } : undefined}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
                <span>
                  {isHotel
                    ? "Search Hotels"
                    : isTour
                    ? "Search Attractions"
                    : isPackage
                    ? "Search Packages"
                    : "Search"}
                </span>
              </button>
            </div>

            {/* Expandable Filters Panel */}
            <FiltersPanel
              filters={filters}
              onChange={setFilters}
              isOpen={filtersOpen}
              onClose={() => setFiltersOpen(false)}
            />
          </div>
        )}
      </form>
    </div>
  );
}
