"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";

export interface GuestsPickerProps {
  rooms: number;
  adults: number;
  childrenCount: number;
  childAges: number[];
  pureVeg?: boolean;
  onChange: (
    rooms: number,
    adults: number,
    children: number,
    childAges: number[],
    pureVeg: boolean
  ) => void;
  accentColor?: string;
  className?: string;
}

export default function GuestsPicker({
  rooms,
  adults,
  childrenCount,
  childAges,
  pureVeg = false,
  onChange,
  accentColor = "#2882c5",
  className = "",
}: GuestsPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localRooms, setLocalRooms] = useState(rooms);
  const [localAdults, setLocalAdults] = useState(adults);
  const [localChildren, setLocalChildren] = useState(childrenCount);
  const [localChildAges, setLocalChildAges] = useState<number[]>(childAges);
  const [localPureVeg, setLocalPureVeg] = useState(pureVeg);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync draft on open or prop change
  useEffect(() => {
    if (isOpen) {
      setLocalRooms(rooms);
      setLocalAdults(adults);
      setLocalChildren(childrenCount);
      setLocalChildAges(childAges);
      setLocalPureVeg(pureVeg);
    }
  }, [isOpen, rooms, adults, childrenCount, childAges, pureVeg]);

  // Click outside and Esc key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        handleApply();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleApply = () => {
    onChange(localRooms, localAdults, localChildren, localChildAges, localPureVeg);
    setIsOpen(false);
  };

  // Stepper handlers with boundary enforcement
  const handleRoomsChange = (delta: number) => {
    setLocalRooms((prev) => {
      const next = prev + delta;
      if (next < 1 || next > 8) return prev;
      // Ensure adults is at least equal to rooms
      if (localAdults < next) {
        setLocalAdults(next);
      }
      return next;
    });
  };

  const handleAdultsChange = (delta: number) => {
    setLocalAdults((prev) => {
      const next = prev + delta;
      // Min 1 adult per room, max 6 per room
      if (next < localRooms || next > localRooms * 6) return prev;
      return next;
    });
  };

  const handleChildrenChange = (delta: number) => {
    setLocalChildren((prev) => {
      const next = prev + delta;
      if (next < 0 || next > 4) return prev;

      // Adjust childAges array length
      setLocalChildAges((prevAges) => {
        if (next > prevAges.length) {
          const diff = next - prevAges.length;
          return [...prevAges, ...Array(diff).fill(5)]; // Default age 5
        } else {
          return prevAges.slice(0, next);
        }
      });

      return next;
    });
  };

  const handleAgeChange = (index: number, age: number) => {
    setLocalChildAges((prev) => {
      const next = [...prev];
      next[index] = age;
      return next;
    });
  };

  // Summary Text
  const summaryText = useMemo(() => {
    const parts = [
      `${rooms} ${rooms === 1 ? "Room" : "Rooms"}`,
      `${adults} ${adults === 1 ? "Adult" : "Adults"}`,
    ];
    if (childrenCount > 0) {
      parts.push(`${childrenCount} ${childrenCount === 1 ? "Child" : "Children"}`);
    }
    if (pureVeg) {
      parts.push("🌱 Pure Veg");
    }
    return parts.join(", ");
  }, [rooms, adults, childrenCount, pureVeg]);

  return (
    <div ref={containerRef} className={`relative flex-1 min-w-0 ${className}`}>
      {/* ─── Field Trigger ─── */}
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="Rooms and guests selection"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[64px] py-2.5 px-3.5 sm:px-4 rounded-2xl border text-left flex items-center gap-3 transition-all duration-200 active:scale-[0.99] cursor-pointer bg-white dark:bg-neutral-900 ${
          isOpen
            ? "border-primary ring-2 ring-primary/20 shadow-sm"
            : "border-neutral-200/90 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm"
        }`}
      >
        {/* Leading Icon in tinted circle */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
          style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </div>

        {/* Text Container */}
        <div className="flex-1 min-w-0">
          <span className="block text-[11px] font-bold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-0.5">
            Rooms & Guests
          </span>
          <div className="text-sm sm:text-[15px] font-bold text-neutral-900 dark:text-white truncate">
            {summaryText}
          </div>
        </div>

        {/* Trailing Chevron */}
        <div className="shrink-0 text-neutral-400 dark:text-neutral-500">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`}
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>

      {/* ─── Bottom Sheet (Mobile) & Popover (Desktop) ─── */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden animate-in fade-in duration-200"
            onClick={handleApply}
          />

          <div
            ref={popoverRef}
            className={`
              fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl border-t border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250
              md:absolute md:inset-auto md:top-[calc(100%+8px)] md:right-0 md:w-[380px] md:rounded-2xl md:border md:shadow-2xl md:slide-in-from-top-2 md:z-50
            `}
          >
            {/* Mobile Sheet Handle */}
            <div className="flex md:hidden items-center justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            </div>

            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Rooms & Guests</h3>
                <p className="text-[11px] text-neutral-400">Max 8 rooms and 6 adults per room</p>
              </div>
              <button
                type="button"
                onClick={handleApply}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stepper Rows Body */}
            <div className="p-3 sm:p-4 space-y-4 overflow-y-auto max-h-[60vh] md:max-h-[380px]">
              {/* Row 1: Rooms */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white">Rooms</div>
                  <div className="text-xs text-neutral-400">Minimum 1 room</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoomsChange(-1)}
                    disabled={localRooms <= 1}
                    aria-label="Decrease rooms"
                    className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-black text-neutral-900 dark:text-white">
                    {localRooms}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRoomsChange(1)}
                    disabled={localRooms >= 8}
                    aria-label="Increase rooms"
                    className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Row 2: Adults */}
              <div className="flex items-center justify-between py-1 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                <div>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white">Adults</div>
                  <div className="text-xs text-neutral-400">Age 18+ years</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAdultsChange(-1)}
                    disabled={localAdults <= localRooms}
                    aria-label="Decrease adults"
                    className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-black text-neutral-900 dark:text-white">
                    {localAdults}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdultsChange(1)}
                    disabled={localAdults >= localRooms * 6}
                    aria-label="Increase adults"
                    className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Row 3: Children */}
              <div className="flex items-center justify-between py-1 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                <div>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white">Children</div>
                  <div className="text-xs text-neutral-400">Ages 0 to 17 years (Max 4)</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleChildrenChange(-1)}
                    disabled={localChildren <= 0}
                    aria-label="Decrease children"
                    className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-black text-neutral-900 dark:text-white">
                    {localChildren}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleChildrenChange(1)}
                    disabled={localChildren >= 4}
                    aria-label="Increase children"
                    className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Dynamic Child Age Selectors */}
              {localChildren > 0 && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-850 rounded-xl space-y-2.5 animate-in fade-in">
                  <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Child Ages at Check-out:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: localChildren }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                          Child {i + 1}
                        </span>
                        <select
                          value={localChildAges[i] ?? 5}
                          onChange={(e) => handleAgeChange(i, parseInt(e.target.value, 10))}
                          className="bg-transparent text-xs font-bold text-neutral-900 dark:text-white outline-none cursor-pointer"
                        >
                          {Array.from({ length: 18 }).map((_, age) => (
                            <option key={age} value={age} className="bg-white dark:bg-neutral-800">
                              {age === 0 ? "Under 1" : `${age} yrs`}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pure Veg Option Toggle */}
              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPureVeg}
                    onChange={(e) => setLocalPureVeg(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                      🌱 Pure Veg / Jain Dining
                    </span>
                    <span className="text-[10px] text-neutral-400 block">
                      Prioritize hotels with 100% vegetarian kitchens
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer with Done button */}
            <div className="p-3 sm:p-4 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500">
                {localRooms}R · {localAdults}A {localChildren > 0 ? `· ${localChildren}C` : ""}
              </span>
              <button
                type="button"
                onClick={handleApply}
                style={{ backgroundColor: accentColor }}
                className="px-6 py-2 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-95 transition-opacity cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
