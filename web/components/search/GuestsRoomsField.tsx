"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import CounterRow from "./CounterRow";

export interface OccupancyState {
  rooms: number;
  adults: number;
  children: number;
  childAges: number[];
  pureVeg?: boolean;
}

export interface GuestsRoomsFieldProps {
  value: OccupancyState;
  onChange: (val: OccupancyState) => void;
  label?: string;
  hideRooms?: boolean;
  hideVegToggle?: boolean;
  className?: string;
}

export default function GuestsRoomsField({
  value,
  onChange,
  label = "ROOMS & GUESTS",
  hideRooms = false,
  hideVegToggle = false,
  className = "",
}: GuestsRoomsFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 320,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update coords on open
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = Math.min(320, window.innerWidth - 24);
      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 12) {
        left = window.innerWidth - popoverWidth - 12;
      }
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: Math.max(12, left),
        width: popoverWidth,
      });
    }
  }, [isOpen]);

  // Click outside & Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const totalGuests = value.adults + value.children;

  const updateRooms = (rooms: number) => {
    const nextAdults = Math.max(rooms, value.adults);
    onChange({ ...value, rooms, adults: nextAdults });
  };

  const updateAdults = (adults: number) => {
    onChange({ ...value, adults });
  };

  const updateChildren = (children: number) => {
    const nextAges = [...value.childAges];
    if (children > value.childAges.length) {
      for (let i = value.childAges.length; i < children; i++) {
        nextAges.push(7);
      }
    } else {
      nextAges.splice(children);
    }
    onChange({ ...value, children, childAges: nextAges });
  };

  const updateChildAge = (index: number, age: number) => {
    const nextAges = [...value.childAges];
    nextAges[index] = age;
    onChange({ ...value, childAges: nextAges });
  };

  const toggleVeg = () => {
    onChange({ ...value, pureVeg: !value.pureVeg });
  };

  const summary = React.useMemo(() => {
    const parts: string[] = [];
    if (!hideRooms) {
      parts.push(`${value.rooms} Room${value.rooms !== 1 ? "s" : ""}`);
    }
    parts.push(`${totalGuests} Guest${totalGuests !== 1 ? "s" : ""}`);
    if (value.pureVeg) {
      parts.push("(Pure Veg options)");
    }
    return parts.join(", ");
  }, [hideRooms, value.rooms, totalGuests, value.pureVeg]);

  return (
    <div className={`relative flex-1 min-w-[180px] ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
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
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {label}
          </span>
          <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {summary}
          </div>
        </div>
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "absolute",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 9999,
            }}
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 p-4 text-gray-900 dark:text-white animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="space-y-1">
              {!hideRooms && (
                <CounterRow
                  label="Rooms"
                  subtitle="Minimum 1 room"
                  value={value.rooms}
                  min={1}
                  max={8}
                  onChange={updateRooms}
                />
              )}

              <CounterRow
                label="Adults"
                subtitle="Age 12+ years"
                value={value.adults}
                min={hideRooms ? 1 : value.rooms}
                max={20}
                onChange={updateAdults}
              />

              <CounterRow
                label="Children"
                subtitle="Age 0-11 years"
                value={value.children}
                min={0}
                max={10}
                onChange={updateChildren}
              />

              {/* Child Ages if children > 0 */}
              {value.children > 0 && (
                <div className="py-2 border-b border-gray-100 dark:border-neutral-800">
                  <div className="text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-2">
                    Age of children at check-out
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {value.childAges.map((age, idx) => (
                      <div key={idx} className="flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold mb-0.5">
                          Child {idx + 1}
                        </span>
                        <select
                          value={age}
                          onChange={(e) => updateChildAge(idx, Number(e.target.value))}
                          className="px-2 py-1 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-xs font-semibold"
                        >
                          {Array.from({ length: 18 }).map((_, a) => (
                            <option key={a} value={a}>
                              {a === 0 ? "< 1 yr" : `${a} yrs`}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pure Veg options toggle */}
              {!hideVegToggle && (
                <div className="pt-3 pb-2 flex items-center justify-between border-b border-gray-100 dark:border-neutral-800">
                  <label
                    htmlFor="pureVegToggle"
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <div className="w-4 h-4 rounded border border-green-600 flex items-center justify-center p-0.5">
                      <div className="w-2 h-2 rounded-full bg-green-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        Pure Veg options
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Show stays with pure veg / Jain food
                      </div>
                    </div>
                  </label>
                  <input
                    id="pureVegToggle"
                    type="checkbox"
                    checked={Boolean(value.pureVeg)}
                    onChange={toggleVeg}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                </div>
              )}

              {/* Done button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full mt-3 py-2 bg-primary hover:opacity-90 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
