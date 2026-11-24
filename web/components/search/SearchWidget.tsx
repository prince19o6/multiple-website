"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import AutocompleteField from "./AutocompleteField";
import DateField from "./DateField";
import DateRangeField from "./DateRangeField";
import GuestsRoomsField, { type OccupancyState } from "./GuestsRoomsField";
import PassengersField from "./PassengersField";
import SelectField from "./SelectField";
import MultiSelectChips from "./MultiSelectChips";
import SearchButton from "./SearchButton";
import CounterRow from "./CounterRow";
import HotelSearchForm from "./HotelSearchForm";

export interface SearchWidgetProps {
  activeTab?: string;
  activeModule?: string;
  activeModuleCode?: string;
  siteId?: string;
  accentColor?: string;
  hideQuickSwitcher?: boolean;
}

const CABIN_OPTIONS = [
  { label: "Economy", value: "Economy" },
  { label: "Premium Economy", value: "Premium Economy" },
  { label: "Business", value: "Business" },
  { label: "First Class", value: "First Class" },
];

const DURATION_OPTIONS = [
  { label: "3 - 5 Days", value: "3-5" },
  { label: "5 - 7 Days", value: "5-7" },
  { label: "7 - 10 Days", value: "7-10" },
  { label: "10+ Days", value: "10+" },
];

const MEAL_PREFERENCE_OPTIONS = [
  { label: "Any Meal Plan", value: "any" },
  { label: "Pure Veg / Jain Friendly", value: "pure_veg_jain" },
  { label: "Halal Certified", value: "halal" },
  { label: "Breakfast Included", value: "breakfast_included" },
];

const TIME_SLOT_OPTIONS = [
  { label: "Lunch: 12:00 PM", value: "12:00" },
  { label: "Lunch: 12:30 PM", value: "12:30" },
  { label: "Lunch: 01:00 PM", value: "13:00" },
  { label: "Lunch: 01:30 PM", value: "13:30" },
  { label: "Dinner: 07:00 PM", value: "19:00" },
  { label: "Dinner: 07:30 PM", value: "19:30" },
  { label: "Dinner: 08:00 PM", value: "20:00" },
  { label: "Dinner: 08:30 PM", value: "20:30" },
  { label: "Dinner: 09:00 PM", value: "21:00" },
];

const NATIONALITY_OPTIONS = [
  "India",
  "United Arab Emirates",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Singapore",
  "Germany",
  "France",
  "Saudi Arabia",
  "Qatar",
  "Oman",
  "Kuwait",
  "Bahrain",
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
  "Japan",
  "Sri Lanka",
  "Georgia",
  "Azerbaijan",
  "Oman",
];

const DIET_CHIPS = ["All", "Pure Veg", "Jain", "Vegetarian", "Halal"];

export default function SearchWidget({
  activeTab,
  activeModule,
  activeModuleCode = "HOTEL",
  siteId = "gujjutours",
  accentColor = "#2882c5",
}: SearchWidgetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Resolve current active module code
  const currentTab = (
    activeTab ||
    activeModule ||
    searchParams.get("tab") ||
    searchParams.get("module") ||
    activeModuleCode ||
    "hotels"
  ).toLowerCase();

  // Helper for multi-tenant prefix navigation
  const getLocalizedUrl = (subRoute: string, params: URLSearchParams) => {
    const segments = pathname.split("/").filter(Boolean);
    let prefix = "/en";
    if (segments.length >= 2 && ["en", "gu", "hi"].includes(segments[1])) {
      prefix = `/${segments[0]}/${segments[1]}`;
    } else if (segments.length >= 1 && ["en", "gu", "hi"].includes(segments[0])) {
      prefix = `/${segments[0]}`;
    }
    const cleanRoute = subRoute.replace(/^\/(en|gu|hi)/, "").replace(/^\/+/, "");
    const qStr = params.toString();
    return `${prefix}/${cleanRoute}${qStr ? `?${qStr}` : ""}`;
  };

  // ─── 1. HOTELS STATE ───
  const [hotelDestination, setHotelDestination] = useState("Dubai, United Arab Emirates");
  const [hotelStartDate, setHotelStartDate] = useState("");
  const [hotelEndDate, setHotelEndDate] = useState("");
  const [hotelOccupancy, setHotelOccupancy] = useState<OccupancyState>({
    rooms: 1,
    adults: 2,
    children: 0,
    childAges: [],
    pureVeg: false,
  });

  // ─── 2. TOURS STATE ───
  const [tourDestination, setTourDestination] = useState("Dubai, Desert Safari, Burj Khalifa");
  const [tourDate, setTourDate] = useState("");
  const [tourTravelers, setTourTravelers] = useState<OccupancyState>({
    rooms: 1,
    adults: 2,
    children: 0,
    childAges: [],
  });

  // ─── 3. PACKAGES STATE ───
  const [packageDestinations, setPackageDestinations] = useState<string[]>([
    "Dubai & Abu Dhabi",
  ]);
  const [packageDuration, setPackageDuration] = useState("5-7");
  const [packageMeal, setPackageMeal] = useState("pure_veg_jain");

  // ─── 4. FLIGHTS STATE ───
  const [flightTripType, setFlightTripType] = useState<"oneWay" | "roundTrip" | "multiCity">("oneWay");
  const [flightCabin, setFlightCabin] = useState("Economy");
  const [flightDirectOnly, setFlightDirectOnly] = useState(false);
  const [flightFrom, setFlightFrom] = useState("Surat (STV)");
  const [flightTo, setFlightTo] = useState("Dubai (DXB)");
  const [flightDepartureDate, setFlightDepartureDate] = useState("");
  const [flightReturnDate, setFlightReturnDate] = useState("");
  const [flightAdults, setFlightAdults] = useState(1);
  const [flightChildren, setFlightChildren] = useState(0);
  const [flightInfants, setFlightInfants] = useState(0);

  // ─── 5. TRANSFERS STATE ───
  const [transferPickup, setTransferPickup] = useState("Dubai International Airport (DXB)");
  const [transferDropoff, setTransferDropoff] = useState("Downtown Dubai Hotel / Resort");
  const [transferDate, setTransferDate] = useState("");
  const [transferTime, setTransferTime] = useState("10:00");
  const [transferPassengers, setTransferPassengers] = useState(2);
  const [transferRoundTrip, setTransferRoundTrip] = useState(false);
  const [transferReturnDate, setTransferReturnDate] = useState("");
  const [transferReturnTime, setTransferReturnTime] = useState("18:00");

  // ─── 6. VISAS STATE ───
  const [visaCitizen, setVisaCitizen] = useState("India");
  const [visaDestination, setVisaDestination] = useState("United Arab Emirates (UAE)");

  // ─── 7. RESTAURANTS STATE ───
  const [restaurantCity, setRestaurantCity] = useState("Dubai, UAE");
  const [restaurantDiet, setRestaurantDiet] = useState("Pure Veg");
  const [restaurantDate, setRestaurantDate] = useState("");
  const [restaurantTimeSlot, setRestaurantTimeSlot] = useState("19:30");
  const [restaurantGuests, setRestaurantGuests] = useState(2);

  // ─── 8. BUILD PACKAGE STATE ───
  const [bpStartingCity, setBpStartingCity] = useState("Mumbai");
  const [bpDestination, setBpDestination] = useState("Dubai");
  const [bpDays, setBpDays] = useState("5-7");

  // ─── 9. CAR RENTAL STATE (TripGo Asia) ───
  const [carLocation, setCarLocation] = useState("Langkawi Airport (LGK)");
  const [carPickupDate, setCarPickupDate] = useState("");
  const [carReturnDate, setCarReturnDate] = useState("");
  const [carDriverAge, setCarDriverAge] = useState("25-70");

  // Reset errors when tab changes
  useEffect(() => {
    setErrors({});
  }, [currentTab]);

  // Airport Swap handler
  const handleSwapAirports = () => {
    const temp = flightFrom;
    setFlightFrom(flightTo);
    setFlightTo(temp);
  };

  // ─── SUBMISSION HANDLERS ───

  const handleSearchHotels = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!hotelDestination.trim()) newErrors.hotelDestination = "Destination is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    if (hotelDestination.trim()) params.set("destination", hotelDestination.trim());
    if (hotelStartDate) params.set("checkIn", hotelStartDate);
    if (hotelEndDate) params.set("checkOut", hotelEndDate);
    params.set("rooms", String(hotelOccupancy.rooms));
    params.set("adults", String(hotelOccupancy.adults));
    params.set("children", String(hotelOccupancy.children));
    if (hotelOccupancy.childAges.length > 0) {
      params.set("childAges", hotelOccupancy.childAges.join(","));
    }
    if (hotelOccupancy.pureVeg) {
      params.set("veg", "true");
    }

    router.push(getLocalizedUrl("/hotels", params));
  };

  const handleSearchTours = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!tourDestination.trim()) newErrors.tourDestination = "Destination or tour name is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    params.set("destination", tourDestination.trim());
    if (tourDate) params.set("date", tourDate);
    params.set("travelers", String(tourTravelers.adults + tourTravelers.children));
    params.set("adults", String(tourTravelers.adults));
    params.set("children", String(tourTravelers.children));

    router.push(getLocalizedUrl("/tours", params));
  };

  const handleSearchPackages = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (packageDestinations.length === 0) {
      newErrors.packageDestinations = "Please select or type at least one destination";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    params.set("destinations", packageDestinations.join(","));
    params.set("duration", packageDuration);
    params.set("meal", packageMeal);

    router.push(getLocalizedUrl("/packages", params));
  };

  const handleSearchFlights = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!flightFrom.trim()) newErrors.flightFrom = "Departure airport is required";
    if (!flightTo.trim()) newErrors.flightTo = "Arrival airport is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams({
      tripType: flightTripType,
      from: flightFrom,
      to: flightTo,
      cabin: flightCabin,
      direct: String(flightDirectOnly),
      adults: String(flightAdults),
      children: String(flightChildren),
      infants: String(flightInfants),
      passengers: String(flightAdults + flightChildren + flightInfants),
    });
    if (flightDepartureDate) params.set("departure", flightDepartureDate);
    if (flightTripType === "roundTrip" && flightReturnDate) {
      params.set("return", flightReturnDate);
    }

    router.push(getLocalizedUrl("/flights", params));
  };

  const handleSearchTransfers = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!transferPickup.trim()) newErrors.transferPickup = "Pick-up location is required";
    if (!transferDropoff.trim()) newErrors.transferDropoff = "Drop-off destination is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams({
      pickup: transferPickup,
      dropoff: transferDropoff,
      date: transferDate,
      time: transferTime,
      passengers: String(transferPassengers),
      roundTrip: String(transferRoundTrip),
    });
    if (transferRoundTrip) {
      if (transferReturnDate) params.set("returnDate", transferReturnDate);
      if (transferReturnTime) params.set("returnTime", transferReturnTime);
    }

    router.push(getLocalizedUrl("/transfers", params));
  };

  const handleSearchVisas = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams({
      citizen: visaCitizen,
      to: visaDestination,
    });
    router.push(getLocalizedUrl("/visas", params));
  };

  const handleSearchRestaurants = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!restaurantCity.trim()) newErrors.restaurantCity = "City or cuisine is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams({
      city: restaurantCity,
      diet: restaurantDiet,
      date: restaurantDate,
      time: restaurantTimeSlot,
      guests: String(restaurantGuests),
    });
    router.push(getLocalizedUrl("/restaurants", params));
  };

  const handleSearchBuildPackage = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams({
      from: bpStartingCity,
      destination: bpDestination,
      days: bpDays,
    });
    router.push(getLocalizedUrl("/buildpackage", params));
  };

  const handleSearchCars = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams({
      location: carLocation,
      pickup: carPickupDate,
      return: carReturnDate,
      age: carDriverAge,
    });
    router.push(getLocalizedUrl("/car-rental", params));
  };

  const isHotels = currentTab === "hotels" || currentTab === "hotel";
  const isTours = currentTab === "tours" || currentTab === "tour";
  const isPackages = currentTab === "packages" || currentTab === "package";
  const isFlights = currentTab === "flights" || currentTab === "flight";
  const isTransfers = currentTab === "transfers" || currentTab === "transfer";
  const isVisas = currentTab === "visas" || currentTab === "visa";
  const isRestaurants = currentTab === "restaurants" || currentTab === "restaurant";
  const isBuildPackage = currentTab === "buildpackage" || currentTab === "build-package";
  const isCars = currentTab === "car-rental" || currentTab === "car" || currentTab === "rental";

  return (
    <div className="bg-white dark:bg-neutral-900 p-3.5 sm:p-5 rounded-b-3xl shadow-2xl border border-neutral-100/90 dark:border-neutral-800 transition-all text-neutral-900 dark:text-white overflow-hidden w-full max-w-full">
      {/* ─── 1. HOTELS MODULE (Modern Selection System) ─── */}
      {isHotels && (
        <HotelSearchForm
          siteId={siteId}
          accentColor={accentColor}
        />
      )}

      {/* ─── 2. TOURS MODULE ─── */}
      {isTours && (
        <form onSubmit={handleSearchTours} className="space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <AutocompleteField
              label="DESTINATION OR SIGHTSEEING"
              placeholder="City, attraction, or sightseeing name"
              value={tourDestination}
              onChange={setTourDestination}
              type="tour"
              siteId={siteId}
              required
              error={errors.tourDestination}
            />

            <DateField
              label="TOUR DATE"
              placeholder="Select tour date"
              value={tourDate}
              onChange={setTourDate}
            />

            <GuestsRoomsField
              value={tourTravelers}
              onChange={setTourTravelers}
              label="TRAVELERS"
              hideRooms={true}
              hideVegToggle={true}
            />

            <SearchButton
              title="Search Handcrafted Tours"
              loading={loading}
              accentColor={accentColor}
            />
          </div>
        </form>
      )}

      {/* ─── 3. PACKAGES MODULE ─── */}
      {isPackages && (
        <form onSubmit={handleSearchPackages} className="space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <MultiSelectChips
              label="DREAM HOLIDAY DESTINATIONS"
              selected={packageDestinations}
              onChange={setPackageDestinations}
              error={errors.packageDestinations}
              className="lg:flex-[2]"
            />

            <SelectField
              label="DURATION"
              value={packageDuration}
              options={DURATION_OPTIONS}
              onChange={setPackageDuration}
              className="lg:flex-1"
            />

            <SelectField
              label="MEAL PREFERENCE"
              value={packageMeal}
              options={MEAL_PREFERENCE_OPTIONS}
              onChange={setPackageMeal}
              className="lg:flex-1"
            />

            <SearchButton
              title="Search Holiday Packages"
              loading={loading}
              accentColor={accentColor}
            />
          </div>
        </form>
      )}

      {/* ─── 4. FLIGHTS MODULE ─── */}
      {isFlights && (
        <form onSubmit={handleSearchFlights} className="space-y-4">
          {/* Top Options Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-200">
                <input
                  type="radio"
                  name="flightTripType"
                  checked={flightTripType === "oneWay"}
                  onChange={() => setFlightTripType("oneWay")}
                  className="w-4 h-4 text-primary accent-primary"
                />
                <span>One-Way</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-200">
                <input
                  type="radio"
                  name="flightTripType"
                  checked={flightTripType === "roundTrip"}
                  onChange={() => setFlightTripType("roundTrip")}
                  className="w-4 h-4 text-primary accent-primary"
                />
                <span>Round Trip</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-200">
                <input
                  type="radio"
                  name="flightTripType"
                  checked={flightTripType === "multiCity"}
                  onChange={() => setFlightTripType("multiCity")}
                  className="w-4 h-4 text-primary accent-primary"
                />
                <span>Multi City</span>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={flightCabin}
                onChange={(e) => setFlightCabin(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
              >
                {CABIN_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={flightDirectOnly}
                  onChange={(e) => setFlightDirectOnly(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4 accent-primary"
                />
                <span>Direct Flights Only</span>
              </label>
            </div>
          </div>

          {/* Flight Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
            {/* From Airport */}
            <div className="relative">
              <AutocompleteField
                label="WHERE FROM?"
                placeholder="Airport or City"
                value={flightFrom}
                onChange={setFlightFrom}
                type="airport"
                siteId={siteId}
                required
                error={errors.flightFrom}
              />
              <button
                type="button"
                onClick={handleSwapAirports}
                title="Swap departure and destination"
                className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 shadow-sm items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 hover:scale-110 active:rotate-180 transition-all"
              >
                ⇄
              </button>
            </div>

            {/* To Airport */}
            <AutocompleteField
              label="FLYING TO"
              placeholder="Airport or Destination"
              value={flightTo}
              onChange={setFlightTo}
              type="airport"
              siteId={siteId}
              required
              error={errors.flightTo}
            />

            {/* Departure / Return Date */}
            {flightTripType === "roundTrip" ? (
              <DateRangeField
                startDate={flightDepartureDate}
                endDate={flightReturnDate}
                checkInLabel="DEPARTURE"
                checkOutLabel="RETURN"
                onChange={(start, end) => {
                  setFlightDepartureDate(start);
                  setFlightReturnDate(end);
                }}
              />
            ) : (
              <DateField
                label="DEPARTURE DATE"
                placeholder="Select date"
                value={flightDepartureDate}
                onChange={setFlightDepartureDate}
              />
            )}

            {/* Passengers Selector */}
            <PassengersField
              adults={flightAdults}
              children={flightChildren}
              infants={flightInfants}
              cabinClass={flightCabin}
              onChange={(a, c, i) => {
                setFlightAdults(a);
                setFlightChildren(c);
                setFlightInfants(i);
              }}
            />

            {/* Search Flights CTA */}
            <SearchButton
              title="Search Flights"
              loading={loading}
              accentColor={accentColor}
            />
          </div>
        </form>
      )}

      {/* ─── 5. TRANSFERS MODULE ─── */}
      {isTransfers && (
        <form onSubmit={handleSearchTransfers} className="space-y-3">
          {/* Top Row: Locations (Pick-up & Drop-off) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AutocompleteField
              label="PICK-UP AIRPORT OR HOTEL"
              placeholder="Airport, Hotel or Station"
              value={transferPickup}
              onChange={setTransferPickup}
              type="all"
              siteId={siteId}
              required
              error={errors.transferPickup}
            />

            <AutocompleteField
              label="DROP-OFF DESTINATION"
              placeholder="Destination Hotel or Address"
              value={transferDropoff}
              onChange={setTransferDropoff}
              type="all"
              siteId={siteId}
              required
              error={errors.transferDropoff}
            />
          </div>

          {/* Bottom Row: Date, Time, Passengers & Search Action */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
            <DateField
              label="TRANSFER DATE"
              placeholder="Select date"
              value={transferDate}
              onChange={setTransferDate}
            />

            {/* Time Picker */}
            <div className="flex items-center gap-2 p-2.5 bg-[#f8f9fa] dark:bg-neutral-800/80 rounded-xl border border-gray-200 dark:border-neutral-700 min-h-[58px]">
              <div className="w-full">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  TIME
                </span>
                <input
                  type="time"
                  value={transferTime}
                  onChange={(e) => setTransferTime(e.target.value)}
                  className="bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer w-full"
                />
              </div>
            </div>

            {/* Passengers Counter */}
            <div className="p-2.5 bg-[#f8f9fa] dark:bg-neutral-800/80 rounded-xl border border-gray-200 dark:border-neutral-700 min-h-[58px] flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  PASSENGERS
                </span>
                <div className="text-xs font-bold text-gray-900 dark:text-white">
                  {transferPassengers} Guests
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => transferPassengers > 1 && setTransferPassengers(transferPassengers - 1)}
                  className="w-6 h-6 rounded-full border border-gray-300 dark:border-neutral-600 flex items-center justify-center text-xs font-bold"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => transferPassengers < 15 && setTransferPassengers(transferPassengers + 1)}
                  className="w-6 h-6 rounded-full border border-gray-300 dark:border-neutral-600 flex items-center justify-center text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <SearchButton
              title="Search Transfers"
              loading={loading}
              accentColor={accentColor}
              className="w-full"
            />
          </div>

          {/* Round-Trip Checkbox & Return Fields */}
          <div className="pt-2 border-t border-gray-100 dark:border-neutral-800 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={transferRoundTrip}
                onChange={(e) => setTransferRoundTrip(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
              />
              <span>Add Return Transfer (Round-Trip)</span>
            </label>

            {transferRoundTrip && (
              <div className="flex items-center gap-3 animate-in fade-in">
                <DateField
                  label="RETURN DATE"
                  placeholder="Select return date"
                  value={transferReturnDate}
                  onChange={setTransferReturnDate}
                />
                <div className="flex items-center gap-2 p-2 bg-[#f8f9fa] dark:bg-neutral-800/80 rounded-xl border border-gray-200 dark:border-neutral-700 min-h-[58px]">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      RETURN TIME
                    </span>
                    <input
                      type="time"
                      value={transferReturnTime}
                      onChange={(e) => setTransferReturnTime(e.target.value)}
                      className="bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      )}

      {/* ─── 6. VISAS MODULE ─── */}
      {isVisas && (
        <form onSubmit={handleSearchVisas} className="space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <SelectField
              label="CITIZEN OF"
              value={visaCitizen}
              options={NATIONALITY_OPTIONS}
              onChange={setVisaCitizen}
              searchable
              className="lg:flex-1"
            />

            <SelectField
              label="DESTINATION COUNTRY"
              value={visaDestination}
              options={VISA_DESTINATIONS}
              onChange={setVisaDestination}
              searchable
              className="lg:flex-1"
            />

            <SearchButton
              title="Check Visa Requirements"
              loading={loading}
              accentColor={accentColor}
            />
          </div>
        </form>
      )}

      {/* ─── 7. RESTAURANTS MODULE ─── */}
      {isRestaurants && (
        <form onSubmit={handleSearchRestaurants} className="space-y-3">
          {/* Diet Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pb-1">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mr-1">
              Diet Filter:
            </span>
            {DIET_CHIPS.map((chip) => {
              const isSelected = restaurantDiet === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setRestaurantDiet(chip)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-primary text-white shadow-sm"
                      : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                  }`}
                  style={isSelected ? { backgroundColor: accentColor } : undefined}
                >
                  {chip === "Pure Veg" ? "🌱 Pure Veg" : chip === "Jain" ? "☸️ Jain" : chip}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
            <AutocompleteField
              label="CITY OR CUISINE"
              placeholder="City or Cuisine (e.g. Dubai, Indian, Italian)"
              value={restaurantCity}
              onChange={setRestaurantCity}
              type="city"
              siteId={siteId}
              required
              error={errors.restaurantCity}
            />

            <DateField
              label="RESERVATION DATE"
              placeholder="Select date"
              value={restaurantDate}
              onChange={setRestaurantDate}
            />

            <SelectField
              label="TIME SLOT"
              value={restaurantTimeSlot}
              options={TIME_SLOT_OPTIONS}
              onChange={setRestaurantTimeSlot}
            />

            {/* Guests Counter */}
            <div className="p-2.5 bg-[#f8f9fa] dark:bg-neutral-800/80 rounded-xl border border-gray-200 dark:border-neutral-700 min-h-[58px] flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  TABLE FOR
                </span>
                <div className="text-xs font-bold text-gray-900 dark:text-white">
                  {restaurantGuests} Guests
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => restaurantGuests > 1 && setRestaurantGuests(restaurantGuests - 1)}
                  className="w-6 h-6 rounded-full border border-gray-300 dark:border-neutral-600 flex items-center justify-center text-xs font-bold"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => restaurantGuests < 20 && setRestaurantGuests(restaurantGuests + 1)}
                  className="w-6 h-6 rounded-full border border-gray-300 dark:border-neutral-600 flex items-center justify-center text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <SearchButton
              title="Find Dining Tables"
              loading={loading}
              accentColor={accentColor}
              className="w-full"
            />
          </div>
        </form>
      )}

      {/* ─── 8. BUILD PACKAGE MODULE ─── */}
      {isBuildPackage && (
        <form onSubmit={handleSearchBuildPackage} className="space-y-4">
          <div className="p-4 rounded-xl bg-primary/5 dark:bg-neutral-800/50 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-primary dark:text-sky-400 mb-1">
                Custom Tour Itinerary Builder
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Design your multi-city package with custom flights, stays, and activities.
              </p>
            </div>
            <SearchButton
              title="Start Custom Package Builder"
              loading={loading}
              accentColor={accentColor}
            />
          </div>

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <AutocompleteField
              label="STARTING POINT"
              placeholder="City of departure (e.g. Mumbai, Delhi)"
              value={bpStartingCity}
              onChange={setBpStartingCity}
              type="city"
              siteId={siteId}
            />

            <AutocompleteField
              label="PRIMARY DESTINATION"
              placeholder="Where do you want to go? (e.g. Dubai, Bali)"
              value={bpDestination}
              onChange={setBpDestination}
              type="city"
              siteId={siteId}
            />

            <SelectField
              label="TRIP DURATION"
              value={bpDays}
              options={DURATION_OPTIONS}
              onChange={setBpDays}
            />
          </div>
        </form>
      )}

      {/* ─── 9. CAR RENTAL MODULE (TripGo Asia) ─── */}
      {isCars && (
        <form onSubmit={handleSearchCars} className="space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <AutocompleteField
              label="PICK-UP LOCATION"
              placeholder="Airport, City or Station (e.g. Langkawi, KL)"
              value={carLocation}
              onChange={setCarLocation}
              type="city"
              siteId={siteId}
            />

            <DateRangeField
              startDate={carPickupDate}
              endDate={carReturnDate}
              checkInLabel="PICK-UP DATE"
              checkOutLabel="RETURN DATE"
              onChange={(start, end) => {
                setCarPickupDate(start);
                setCarReturnDate(end);
              }}
            />

            <div className="p-2.5 bg-[#f8f9fa] dark:bg-neutral-800/80 rounded-xl border border-gray-200 dark:border-neutral-700 min-h-[58px] min-w-[140px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                DRIVER AGE
              </span>
              <select
                value={carDriverAge}
                onChange={(e) => setCarDriverAge(e.target.value)}
                className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="25-70" className="bg-white dark:bg-neutral-800">25 - 70 years</option>
                <option value="21-24" className="bg-white dark:bg-neutral-800">21 - 24 years</option>
                <option value="70+" className="bg-white dark:bg-neutral-800">70+ years</option>
              </select>
            </div>

            <SearchButton
              title="Search Cars"
              loading={loading}
              accentColor={accentColor}
            />
          </div>
        </form>
      )}
    </div>
  );
}
