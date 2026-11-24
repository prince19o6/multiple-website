"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export interface DateFieldProps {
  label: string;
  value: string; // YYYY-MM-DD or readable
  onChange: (date: string) => void;
  minDate?: string; // YYYY-MM-DD
  placeholder?: string;
  className?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DateField({
  label,
  value,
  onChange,
  minDate,
  placeholder = "Select date",
  className = "",
}: DateFieldProps) {
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

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const effectiveMin = minDate || todayStr;

  const parsedVal = value ? new Date(value) : new Date();
  const safeDate = isNaN(parsedVal.getTime()) ? today : parsedVal;

  const [currentYear, setCurrentYear] = useState(safeDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(safeDate.getMonth());

  // Update coords on open
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = Math.min(340, window.innerWidth - 24);
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

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

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

  const formatDisplay = (val: string) => {
    if (!val) return placeholder;
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(currentYear, currentMonth, day);
    const y = selected.getFullYear();
    const m = String(selected.getMonth() + 1).padStart(2, "0");
    const d = String(selected.getDate()).padStart(2, "0");
    const iso = `${y}-${m}-${d}`;
    onChange(iso);
    setIsOpen(false);
  };

  return (
    <div className={`relative flex-1 min-w-[140px] ${className}`}>
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
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
          />
        </svg>

        <div className="flex-1 overflow-hidden">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {label}
          </span>
          <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {formatDisplay(value)}
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
            {/* Calendar Header */}
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
                const dIso = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isPast = dIso < effectiveMin;
                const isSelected = value === dIso;

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    disabled={isPast}
                    onClick={() => handleSelectDay(day)}
                    className={`h-8 w-8 mx-auto rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-primary text-white font-bold shadow-sm"
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
          </div>,
          document.body
        )}
    </div>
  );
}
