"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { SuggestionItem } from "@/app/api/destinations/suggest/route";

export interface HotelSearchState {
  destination: string;
  selectedDestination?: SuggestionItem | null;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  rooms: number;
  adults: number;
  children: number;
  childAges: number[];
  pureVeg: boolean;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

export function useHotelSearch(siteId = "gujjutours") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Initial State from URL params or smart defaults
  const [destination, setDestination] = useState<string>("Dubai, United Arab Emirates");
  const [selectedDestination, setSelectedDestination] = useState<SuggestionItem | null>(null);
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [rooms, setRooms] = useState<number>(1);
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [childAges, setChildAges] = useState<number[]>([]);
  const [pureVeg, setPureVeg] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync / prefill from URL search parameters on mount
  useEffect(() => {
    if (!searchParams) return;

    const destParam = searchParams.get("destination") || searchParams.get("city");
    if (destParam) setDestination(destParam);

    const checkInParam = searchParams.get("checkIn") || searchParams.get("start");
    if (checkInParam) setCheckIn(checkInParam);

    const checkOutParam = searchParams.get("checkOut") || searchParams.get("end");
    if (checkOutParam) setCheckOut(checkOutParam);

    const roomsParam = parseInt(searchParams.get("rooms") || "", 10);
    if (!isNaN(roomsParam) && roomsParam >= 1 && roomsParam <= 8) setRooms(roomsParam);

    const adultsParam = parseInt(searchParams.get("adults") || "", 10);
    if (!isNaN(adultsParam) && adultsParam >= 1) setAdults(adultsParam);

    const childrenParam = parseInt(searchParams.get("children") || "", 10);
    if (!isNaN(childrenParam) && childrenParam >= 0 && childrenParam <= 4) {
      setChildren(childrenParam);
      const agesStr = searchParams.get("childAges");
      if (agesStr) {
        const ages = agesStr.split(",").map((a) => parseInt(a.trim(), 10)).filter((a) => !isNaN(a));
        setChildAges(ages.slice(0, childrenParam));
      }
    }

    const vegParam = searchParams.get("veg");
    if (vegParam === "true" || vegParam === "1") setPureVeg(true);
  }, [searchParams]);

  // Compute stay duration in nights
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  // Clear specific error on change
  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleSetDestination = useCallback(
    (val: string, item?: SuggestionItem | null) => {
      setDestination(val);
      if (item !== undefined) setSelectedDestination(item);
      clearError("destination");
    },
    [clearError]
  );

  const handleSetDates = useCallback(
    (inDate: string, outDate: string) => {
      setCheckIn(inDate);
      setCheckOut(outDate);
      if (inDate && outDate) {
        clearError("dates");
      }
    },
    [clearError]
  );

  const handleSetGuests = useCallback(
    (newRooms: number, newAdults: number, newChildren: number, newChildAges: number[], veg: boolean) => {
      setRooms(newRooms);
      setAdults(newAdults);
      setChildren(newChildren);
      setChildAges(newChildAges);
      setPureVeg(veg);
    },
    []
  );

  // Form submit handler with validation
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      const newErrors: Record<string, string> = {};

      if (!destination.trim()) {
        newErrors.destination = "Please enter a destination or hotel name";
      }

      if (!checkIn || !checkOut) {
        newErrors.dates = "Please select both check-in and check-out dates";
      } else if (nights < 1) {
        newErrors.dates = "Check-out date must be at least 1 night after check-in";
      } else if (nights > 30) {
        newErrors.dates = "Maximum booking stay is 30 nights";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return false;
      }

      setIsSubmitting(true);

      const params = new URLSearchParams();
      params.set("destination", destination.trim());
      params.set("checkIn", checkIn);
      params.set("checkOut", checkOut);
      params.set("rooms", String(rooms));
      params.set("adults", String(adults));
      params.set("children", String(children));
      if (children > 0 && childAges.length > 0) {
        params.set("childAges", childAges.join(","));
      }
      if (pureVeg) {
        params.set("veg", "true");
      }

      // Multi-tenant localization routing
      const segments = pathname.split("/").filter(Boolean);
      let prefix = "/en";
      if (segments.length >= 2 && ["en", "gu", "hi"].includes(segments[1])) {
        prefix = `/${segments[0]}/${segments[1]}`;
      } else if (segments.length >= 1 && ["en", "gu", "hi"].includes(segments[0])) {
        prefix = `/${segments[0]}`;
      }

      const targetUrl = `${prefix}/hotels?${params.toString()}`;
      router.push(targetUrl);
      return true;
    },
    [destination, checkIn, checkOut, nights, rooms, adults, children, childAges, pureVeg, pathname, router]
  );

  return {
    destination,
    selectedDestination,
    checkIn,
    checkOut,
    nights,
    rooms,
    adults,
    children,
    childAges,
    pureVeg,
    errors,
    isSubmitting,
    setDestination: handleSetDestination,
    setDates: handleSetDates,
    setGuests: handleSetGuests,
    clearError,
    handleSubmit,
  };
}
