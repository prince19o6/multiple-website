"use client";

import React, { useState, useRef, useEffect } from "react";

export interface OccupancyState {
  rooms: number;
  adults: number;
  children: number;
  childAges: number[];
}

interface OccupancySelectorProps {
  value: OccupancyState;
  onChange: (value: OccupancyState) => void;
  label?: string;
  hideRooms?: boolean;
}

export default function OccupancySelector({
  value,
  onChange,
  label = "GUESTS & ROOMS",
  hideRooms = false,
}: OccupancySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalGuests = value.adults + value.children;

  const updateRooms = (delta: number) => {
    const next = Math.max(1, Math.min(6, value.rooms + delta));
    const nextAdults = Math.max(next, value.adults);
    onChange({ ...value, rooms: next, adults: nextAdults });
  };

  const updateAdults = (delta: number) => {
    const next = Math.max(value.rooms, Math.min(20, value.adults + delta));
    onChange({ ...value, adults: next });
  };

  const updateChildren = (delta: number) => {
    const next = Math.max(0, Math.min(10, value.children + delta));
    const nextAges = [...value.childAges];
    if (next > value.childAges.length) {
      for (let i = value.childAges.length; i < next; i++) {
        nextAges.push(7);
      }
    } else {
      nextAges.splice(next);
    }
    onChange({ ...value, children: next, childAges: nextAges });
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 bg-[#f8f9fa] dark:bg-neutral-800/80 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-primary transition-colors min-h-[58px]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
          />
        </svg>

        <div className="flex-1 overflow-hidden">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {label}
          </label>
          <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {totalGuests} Guest{totalGuests !== 1 ? "s" : ""}
            {!hideRooms && `, ${value.rooms} Room${value.rooms !== 1 ? "s" : ""}`}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-700 p-3 sm:p-4 z-50 text-gray-800 dark:text-gray-100">
          <div className="space-y-4">
            {/* Rooms Row */}
            {!hideRooms && (
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-700">
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">Rooms</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Max 6 rooms</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateRooms(-1)}
                    disabled={value.rooms <= 1}
                    className="w-7 h-7 rounded-full border border-gray-200 dark:border-neutral-700 flex items-center justify-center text-sm font-bold disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-bold text-xs">{value.rooms}</span>
                  <button
                    type="button"
                    onClick={() => updateRooms(1)}
                    disabled={value.rooms >= 6}
                    className="w-7 h-7 rounded-full border border-gray-200 dark:border-neutral-700 flex items-center justify-center text-sm font-bold disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Adults Row */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-700">
              <div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">Adults</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Ages 12+ years</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateAdults(-1)}
                  disabled={value.adults <= (hideRooms ? 1 : value.rooms)}
                  className="w-7 h-7 rounded-full border border-gray-200 dark:border-neutral-700 flex items-center justify-center text-sm font-bold disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-neutral-700"
                >
                  -
                </button>
                <span className="w-5 text-center font-bold text-xs">{value.adults}</span>
                <button
                  type="button"
                  onClick={() => updateAdults(1)}
                  disabled={value.adults >= 20}
                  className="w-7 h-7 rounded-full border border-gray-200 dark:border-neutral-700 flex items-center justify-center text-sm font-bold disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-neutral-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Children Row */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">Children</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Ages 0 to 11</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateChildren(-1)}
                  disabled={value.children <= 0}
                  className="w-7 h-7 rounded-full border border-gray-200 dark:border-neutral-700 flex items-center justify-center text-sm font-bold disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-neutral-700"
                >
                  -
                </button>
                <span className="w-5 text-center font-bold text-xs">{value.children}</span>
                <button
                  type="button"
                  onClick={() => updateChildren(1)}
                  disabled={value.children >= 10}
                  className="w-7 h-7 rounded-full border border-gray-200 dark:border-neutral-700 flex items-center justify-center text-sm font-bold disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-neutral-700"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2 bg-[#ff7a00] hover:bg-[#e66e00] text-white rounded-lg text-xs font-bold shadow-sm transition-all"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
