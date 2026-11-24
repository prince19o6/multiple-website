"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export interface DateRangeFieldProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  label?: string;
  checkInLabel?: string;
  checkOutLabel?: string;
  className?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISODate(iso: string): Date | null {
  if (!iso) return null;
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export default function DateRangeField({
  startDate,
  endDate,
  onChange,
  label = "CHECK-IN — CHECK-OUT",
  checkInLabel = "CHECK-IN",
  checkOutLabel = "CHECK-OUT",
  className = "",
}: DateRangeFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 340,
  });

  const today = new Date();
  const todayISO = toISODate(today);

  // Default initial range: today + 7 days to today + 10 days
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  const defaultEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10);

  const startObj = parseISODate(startDate) || defaultStart;
  const endObj = parseISODate(endDate) || defaultEnd;

  const [currentYear, setCurrentYear] = useState(startObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(startObj.getMonth());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update coords on open
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = Math.min(360, window.innerWidth - 24);
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

  const nightsCount = React.useMemo(() => {
    const s = parseISODate(startDate);
    const e = parseISODate(endDate);
    if (!s || !e) return 0;
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  const formatDateDisplay = (iso: string) => {
    const d = parseISODate(iso);
    if (!d) return "Select date";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const clicked = new Date(currentYear, currentMonth, day);
    const clickedISO = toISODate(clicked);

    // If no start date or both already selected, start a fresh range
    if (!startDate || (startDate && endDate)) {
      onChange(clickedISO, "");
    } else {
      // We already have startDate
      const s = parseISODate(startDate);
      if (s && clicked < s) {
        // Clicked before start, make it new start
        onChange(clickedISO, "");
      } else {
        // Clicked after start, finalize range
        onChange(startDate, clickedISO);
        setIsOpen(false);
      }
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  return (
    <div ref={triggerRef} className={`relative flex-1 ${className}`}>
      {/* Dual Column or Single Trigger */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="grid grid-cols-2 gap-2 cursor-pointer w-full select-none"
      >
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#f8f9fa] dark:bg-neutral-800/80 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-primary transition-colors min-h-[58px]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
          <div className="overflow-hidden flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {checkInLabel}
            </span>
            <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
              {formatDateDisplay(startDate)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#f8f9fa] dark:bg-neutral-800/80 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-primary transition-colors min-h-[58px]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
          <div className="overflow-hidden flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <span>{checkOutLabel}</span>
              {nightsCount > 0 && (
                <span className="text-primary font-black lowercase text-[9px]">
                  {nightsCount} {nightsCount === 1 ? "nt" : "nts"}
                </span>
              )}
            </span>
            <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
              {formatDateDisplay(endDate)}
            </div>
          </div>
        </div>
      </div>

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
            {/* Header & Month Navigation */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-300"
              >
                ‹
              </button>
              <div className="text-xs font-bold text-gray-900 dark:text-white">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-300"
              >
                ›
              </button>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-1">
              {DAY_LABELS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dObj = new Date(currentYear, currentMonth, day);
                const dISO = toISODate(dObj);
                const isPast = dISO < todayISO;

                const isStart = startDate === dISO;
                const isEnd = endDate === dISO;
                const inRange = Boolean(
                  startDate &&
                    endDate &&
                    dISO > startDate &&
                    dISO < endDate
                );

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    disabled={isPast}
                    onClick={() => handleSelectDay(day)}
                    className={`h-8 w-8 mx-auto rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                      isStart || isEnd
                        ? "bg-primary text-white font-bold shadow-sm"
                        : inRange
                        ? "bg-primary/15 text-primary dark:text-sky-300 rounded-none font-bold"
                        : isPast
                        ? "text-gray-300 dark:text-neutral-700 cursor-not-allowed"
                        : "hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer Summary */}
            <div className="mt-3 pt-2 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                {nightsCount > 0 ? `${nightsCount} Night${nightsCount > 1 ? "s" : ""} selected` : "Select dates"}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 bg-primary text-white rounded-lg font-bold text-xs hover:opacity-90 transition-opacity"
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
