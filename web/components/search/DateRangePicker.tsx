"use client";

import React, { useState, useRef, useEffect } from "react";

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  label?: string;
  isSingleDate?: boolean;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
  label = "CHECK-IN — CHECK-OUT",
  isSingleDate = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default to today + 7 days
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  const defaultEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10);

  const parsedStart = startDate ? new Date(startDate) : defaultStart;
  const parsedEnd = endDate ? new Date(endDate) : defaultEnd;

  const [currentMonth, setCurrentMonth] = useState(parsedStart.getMonth());
  const [currentYear, setCurrentYear] = useState(parsedStart.getFullYear());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDateDisplay = (d: Date) => {
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const toISODate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(currentYear, currentMonth, day);
    if (isSingleDate) {
      onChange(toISODate(selected), "");
      setIsOpen(false);
      return;
    }

    if (!startDate || (startDate && endDate)) {
      onChange(toISODate(selected), "");
    } else {
      if (selected < parsedStart) {
        onChange(toISODate(selected), "");
      } else {
        onChange(toISODate(parsedStart), toISODate(selected));
        setIsOpen(false);
      }
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

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
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5"
          />
        </svg>

        <div className="flex-1 overflow-hidden">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {label}
          </label>
          <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {isSingleDate ? (
              startDate ? formatDateDisplay(parsedStart) : "Select travel date"
            ) : startDate ? (
              `${formatDateDisplay(parsedStart)} — ${endDate ? formatDateDisplay(parsedEnd) : "Select return date"}`
            ) : (
              "Select dates"
            )}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:left-auto right-auto sm:right-0 lg:left-0 top-full mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-700 p-3 sm:p-4 z-50 text-gray-800 dark:text-gray-100">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear(currentYear - 1);
                } else {
                  setCurrentMonth(currentMonth - 1);
                }
              }}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              ◀
            </button>
            <span className="font-bold text-sm text-gray-800 dark:text-white">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear(currentYear + 1);
                } else {
                  setCurrentMonth(currentMonth + 1);
                }
              }}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              ▶
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(currentYear, currentMonth, day);
              const isStart = startDate && toISODate(dateObj) === startDate;
              const isEnd = endDate && toISODate(dateObj) === endDate;
              const inRange =
                startDate &&
                endDate &&
                dateObj > new Date(startDate) &&
                dateObj < new Date(endDate);

              let cellStyle = "hover:bg-orange-50 dark:hover:bg-neutral-700 text-gray-800 dark:text-gray-200";
              if (isStart || isEnd) {
                cellStyle = "bg-[#ff7a00] text-white font-bold rounded-lg shadow-sm";
              } else if (inRange) {
                cellStyle = "bg-orange-100 dark:bg-neutral-700/80 text-orange-800 dark:text-orange-300";
              }

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-lg transition-colors text-xs font-semibold ${cellStyle}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Shortcuts */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-700 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dayAfter = new Date();
                dayAfter.setDate(dayAfter.getDate() + 3);
                onChange(toISODate(tomorrow), isSingleDate ? "" : toISODate(dayAfter));
                setIsOpen(false);
              }}
              className="text-[#ff7a00] font-semibold hover:underline"
            >
              This Weekend
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-md font-semibold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
