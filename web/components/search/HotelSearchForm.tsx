"use client";

import React from "react";
import DestinationPicker from "./DestinationPicker";
import DateRangePicker from "./DateRangePicker";
import GuestsPicker from "./GuestsPicker";
import { useHotelSearch } from "./useHotelSearch";

export interface HotelSearchFormProps {
  siteId?: string;
  accentColor?: string;
  className?: string;
}

export default function HotelSearchForm({
  siteId = "gujjutours",
  accentColor = "#2882c5",
  className = "",
}: HotelSearchFormProps) {
  const {
    destination,
    checkIn,
    checkOut,
    rooms,
    adults,
    children,
    childAges,
    pureVeg,
    errors,
    isSubmitting,
    setDestination,
    setDates,
    setGuests,
    handleSubmit,
  } = useHotelSearch(siteId);

  return (
    <form onSubmit={handleSubmit} noValidate className={`space-y-3.5 sm:space-y-4 ${className}`}>
      {/* ─── Search Fields Responsive Row/Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-3.5 items-start">
        {/* 1. Destination / Hotel Name Picker (Desktop: 5 cols, Tablet: 1 col, Mobile: 1 col) */}
        <div className="lg:col-span-5 w-full">
          <DestinationPicker
            value={destination}
            onChange={(val, item) => setDestination(val, item)}
            accentColor={accentColor}
            siteId={siteId}
            error={errors.destination}
          />
        </div>

        {/* 2. Check-In & Check-Out Range Picker (Desktop: 4 cols, Tablet: 1 col, Mobile: 1 col) */}
        <div className="lg:col-span-4 w-full">
          <DateRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={setDates}
            accentColor={accentColor}
            error={errors.dates}
          />
        </div>

        {/* 3. Rooms & Guests Picker (Desktop: 3 cols, Tablet: 2 cols, Mobile: 1 col) */}
        <div className="md:col-span-2 lg:col-span-3 w-full">
          <GuestsPicker
            rooms={rooms}
            adults={adults}
            childrenCount={children}
            childAges={childAges}
            pureVeg={pureVeg}
            onChange={setGuests}
            accentColor={accentColor}
          />
        </div>
      </div>

      {/* ─── Search CTA Button ─── */}
      <div className="pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
            boxShadow: `0 6px 20px ${accentColor}35`,
          }}
          className="w-full min-h-[52px] sm:min-h-[56px] py-3 px-6 rounded-2xl text-white font-black text-sm sm:text-base tracking-wide flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.99] hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Searching Hotels...</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span>Search Hotels</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
