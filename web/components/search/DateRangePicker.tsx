"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

export interface DateRangePickerProps {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  onChange: (checkIn: string, checkOut: string) => void;
  accentColor?: string;
  error?: string;
  className?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatToYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseYMD(str: string): Date | null {
  if (!str) return null;
  const parts = str.split("-");
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = parseYMD(dateStr);
  if (!d) return dateStr;
  const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
  const dayNum = d.getDate();
  const monthName = d.toLocaleDateString("en-US", { month: "short" });
  return `${dayName}, ${dayNum} ${monthName}`;
}

export default function DateRangePicker({
  checkIn,
  checkOut,
  onChange,
  accentColor = "#2882c5",
  error,
  className = "",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftCheckIn, setDraftCheckIn] = useState<string>(checkIn);
  const [draftCheckOut, setDraftCheckOut] = useState<string>(checkOut);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Calendar month views: current month offset (0 = current month)
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Synchronize internal draft when opened or external props change
  useEffect(() => {
    if (isOpen) {
      setDraftCheckIn(checkIn);
      setDraftCheckOut(checkOut);
      if (checkIn) {
        const d = parseYMD(checkIn);
        if (d) {
          setViewYear(d.getFullYear());
          setViewMonth(d.getMonth());
        }
      }
    }
  }, [isOpen, checkIn, checkOut]);

  // Click outside and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
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

  const handlePrevMonth = () => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // Month generation
  const getMonthDays = useCallback((year: number, month: number) => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDayIndex, daysInMonth };
  }, []);

  const month1Data = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth, getMonthDays]);

  const nextMonthYear = viewMonth === 11 ? viewYear + 1 : viewYear;
  const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const month2Data = useMemo(() => getMonthDays(nextMonthYear, nextMonth), [nextMonthYear, nextMonth, getMonthDays]);

  // Date selection logic (Range mode)
  const handleDateClick = (dateStr: string) => {
    const clickedDate = parseYMD(dateStr);
    if (!clickedDate || clickedDate < today) return;

    if (!draftCheckIn || (draftCheckIn && draftCheckOut)) {
      // First tap = check-in
      setDraftCheckIn(dateStr);
      setDraftCheckOut("");
    } else if (draftCheckIn && !draftCheckOut) {
      // Second tap = check-out
      const startDate = parseYMD(draftCheckIn);
      if (startDate && clickedDate > startDate) {
        // Enforce max 30 nights
        const diffDays = Math.round((clickedDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          setDraftCheckOut(dateStr);
        } else {
          // If >30 nights, reset start to clicked
          setDraftCheckIn(dateStr);
          setDraftCheckOut("");
        }
      } else {
        // Clicked date is before or same as start date -> reset start date
        setDraftCheckIn(dateStr);
        setDraftCheckOut("");
      }
    }
  };

  // Quick Chips
  const handleChipTonight = () => {
    const inD = new Date(today);
    const outD = new Date(today);
    outD.setDate(outD.getDate() + 1);
    const inStr = formatToYMD(inD);
    const outStr = formatToYMD(outD);
    setDraftCheckIn(inStr);
    setDraftCheckOut(outStr);
  };

  const handleChipTomorrow = () => {
    const inD = new Date(today);
    inD.setDate(inD.getDate() + 1);
    const outD = new Date(today);
    outD.setDate(outD.getDate() + 2);
    const inStr = formatToYMD(inD);
    const outStr = formatToYMD(outD);
    setDraftCheckIn(inStr);
    setDraftCheckOut(outStr);
  };

  const handleChipThisWeekend = () => {
    const inD = new Date(today);
    const dayOfWeek = inD.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    inD.setDate(inD.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
    const outD = new Date(inD);
    outD.setDate(outD.getDate() + 2); // Friday to Sunday
    setDraftCheckIn(formatToYMD(inD));
    setDraftCheckOut(formatToYMD(outD));
  };

  const handleApply = () => {
    if (draftCheckIn && draftCheckOut) {
      onChange(draftCheckIn, draftCheckOut);
      setIsOpen(false);
    } else if (draftCheckIn && !draftCheckOut) {
      // Auto-set 1 night if user applies with 1 date
      const d = parseYMD(draftCheckIn);
      if (d) {
        d.setDate(d.getDate() + 1);
        const autoOut = formatToYMD(d);
        onChange(draftCheckIn, autoOut);
        setIsOpen(false);
      }
    }
  };

  const handleClear = () => {
    setDraftCheckIn("");
    setDraftCheckOut("");
    onChange("", "");
  };

  // Computed summary label
  const nightsCount = useMemo(() => {
    const inStr = isOpen ? draftCheckIn : checkIn;
    const outStr = isOpen ? draftCheckOut : checkOut;
    if (!inStr || !outStr) return 0;
    const s = parseYMD(inStr);
    const e = parseYMD(outStr);
    if (!s || !e) return 0;
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [isOpen, draftCheckIn, draftCheckOut, checkIn, checkOut]);

  const summaryText = useMemo(() => {
    if (!checkIn || !checkOut) return "Select dates";
    const inFormatted = formatDisplayDate(checkIn);
    const outFormatted = formatDisplayDate(checkOut);
    return `${inFormatted} → ${outFormatted} · ${nightsCount} ${nightsCount === 1 ? "night" : "nights"}`;
  }, [checkIn, checkOut, nightsCount]);

  // Render Day Cell
  const renderDayCell = (year: number, month: number, day: number) => {
    const dateObj = new Date(year, month, day);
    const dateStr = formatToYMD(dateObj);
    const isPast = dateObj < today;

    const isStart = dateStr === draftCheckIn;
    const isEnd = dateStr === draftCheckOut;
    const isHoveredEnd = !draftCheckOut && draftCheckIn && hoveredDate === dateStr && dateObj > (parseYMD(draftCheckIn) || today);

    let isInRange = false;
    if (draftCheckIn && draftCheckOut) {
      const s = parseYMD(draftCheckIn);
      const e = parseYMD(draftCheckOut);
      if (s && e && dateObj > s && dateObj < e) {
        isInRange = true;
      }
    } else if (draftCheckIn && hoveredDate && !draftCheckOut) {
      const s = parseYMD(draftCheckIn);
      const h = parseYMD(hoveredDate);
      if (s && h && dateObj > s && dateObj < h) {
        isInRange = true;
      }
    }

    const isToday = dateStr === formatToYMD(today);

    return (
      <button
        key={dateStr}
        type="button"
        disabled={isPast}
        onClick={() => handleDateClick(dateStr)}
        onMouseEnter={() => !draftCheckOut && draftCheckIn && setHoveredDate(dateStr)}
        className={`
          relative h-10 w-full flex items-center justify-center text-xs font-semibold transition-all duration-150 select-none
          ${isPast ? "text-neutral-300 dark:text-neutral-700 cursor-not-allowed opacity-40" : "cursor-pointer"}
          ${isInRange ? "bg-primary/10 text-primary font-bold dark:bg-primary/20" : ""}
          ${isStart ? "bg-primary text-white rounded-l-xl font-bold shadow-sm z-10" : ""}
          ${isEnd ? "bg-primary text-white rounded-r-xl font-bold shadow-sm z-10" : ""}
          ${isStart && isEnd ? "rounded-xl" : ""}
          ${!isStart && !isEnd && !isInRange && !isPast ? "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl" : ""}
          ${isToday && !isStart && !isEnd ? "border border-primary/50 rounded-xl text-primary font-bold" : ""}
          ${isHoveredEnd ? "bg-primary/20 rounded-r-xl" : ""}
        `}
        style={isStart || isEnd ? { backgroundColor: accentColor } : undefined}
      >
        <span>{day}</span>
      </button>
    );
  };

  return (
    <div ref={containerRef} className={`relative flex-1 min-w-0 ${className}`}>
      {/* ─── Field Trigger ─── */}
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="Check-in and check-out dates"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[64px] py-2.5 px-3.5 sm:px-4 rounded-2xl border text-left flex items-center gap-3 transition-all duration-200 active:scale-[0.99] cursor-pointer bg-white dark:bg-neutral-900 ${
          error
            ? "border-red-400 bg-red-50/20 dark:border-red-600 ring-2 ring-red-400/20"
            : isOpen
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
          </svg>
        </div>

        {/* Text Container */}
        <div className="flex-1 min-w-0">
          <span className="block text-[11px] font-bold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-0.5">
            Check-In & Check-Out
          </span>
          <div className="text-sm sm:text-[15px] font-bold text-neutral-900 dark:text-white truncate">
            {checkIn && checkOut ? (
              summaryText
            ) : (
              <span className="text-neutral-400 font-normal">Select dates</span>
            )}
          </div>
        </div>

        {/* Trailing Calendar Glyph */}
        <div className="shrink-0 text-neutral-400 dark:text-neutral-500">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path
              fillRule="evenodd"
              d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>

      {/* Inline Validation Error Message */}
      {error && (
        <span className="text-xs font-semibold text-red-500 dark:text-red-400 mt-1 block px-1 animate-in fade-in">
          {error}
        </span>
      )}

      {/* ─── Bottom Sheet (Mobile) & 2-Month Popover (Desktop) ─── */}
      {isOpen && (
        <>
          {/* Backdrop on Mobile */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={popoverRef}
            className={`
              fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl border-t border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250
              md:absolute md:inset-auto md:top-[calc(100%+8px)] md:left-0 md:w-[680px] md:rounded-2xl md:border md:shadow-2xl md:slide-in-from-top-2 md:z-50
            `}
          >
            {/* Mobile Sheet Handle */}
            <div className="flex md:hidden items-center justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            </div>

            {/* Quick Chips & Month Navigation Header */}
            <div className="p-3 sm:p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
              {/* Quick Preset Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleChipTonight}
                  className="px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  Tonight (1N)
                </button>
                <button
                  type="button"
                  onClick={handleChipTomorrow}
                  className="px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  Tomorrow (1N)
                </button>
                <button
                  type="button"
                  onClick={handleChipThisWeekend}
                  className="px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  This Weekend (Fri-Sun)
                </button>
              </div>

              {/* Prev / Next Month Arrow Buttons */}
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                  className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                  className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Months Calendar Grid Container (1 month on mobile, 2 months on desktop) */}
            <div className="p-3 sm:p-5 overflow-y-auto max-h-[60vh] md:max-h-none grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Month 1 */}
              <div>
                <div className="text-center font-bold text-sm text-neutral-900 dark:text-white mb-3">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase text-neutral-400 mb-1">
                  {WEEKDAY_NAMES.map((w) => (
                    <div key={w} className="h-6 flex items-center justify-center">
                      {w}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {Array.from({ length: month1Data.firstDayIndex }).map((_, i) => (
                    <div key={`empty-1-${i}`} className="h-10" />
                  ))}
                  {Array.from({ length: month1Data.daysInMonth }).map((_, i) =>
                    renderDayCell(viewYear, viewMonth, i + 1)
                  )}
                </div>
              </div>

              {/* Month 2 (Desktop view) */}
              <div className="hidden md:block">
                <div className="text-center font-bold text-sm text-neutral-900 dark:text-white mb-3">
                  {MONTH_NAMES[nextMonth]} {nextMonthYear}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase text-neutral-400 mb-1">
                  {WEEKDAY_NAMES.map((w) => (
                    <div key={w} className="h-6 flex items-center justify-center">
                      {w}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {Array.from({ length: month2Data.firstDayIndex }).map((_, i) => (
                    <div key={`empty-2-${i}`} className="h-10" />
                  ))}
                  {Array.from({ length: month2Data.daysInMonth }).map((_, i) =>
                    renderDayCell(nextMonthYear, nextMonth, i + 1)
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-3 sm:p-4 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
              <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                {draftCheckIn && draftCheckOut ? (
                  <span>
                    {formatDisplayDate(draftCheckIn)} → {formatDisplayDate(draftCheckOut)} (
                    <span className="text-primary font-black">
                      {nightsCount} {nightsCount === 1 ? "night" : "nights"}
                    </span>
                    )
                  </span>
                ) : draftCheckIn ? (
                  <span>Selected: {formatDisplayDate(draftCheckIn)} (Tap check-out date)</span>
                ) : (
                  <span className="text-neutral-400">Select check-in & check-out dates</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!draftCheckIn}
                  style={{ backgroundColor: accentColor }}
                  className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Apply Dates
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
