"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import CounterRow from "./CounterRow";

export interface PassengersFieldProps {
  adults: number;
  children: number;
  infants: number;
  cabinClass?: string;
  onChange: (adults: number, children: number, infants: number) => void;
  className?: string;
}

export default function PassengersField({
  adults,
  children,
  infants,
  cabinClass = "Economy",
  onChange,
  className = "",
}: PassengersFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 280,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update coords on open
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = Math.min(280, window.innerWidth - 24);
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

  const total = adults + children + infants;

  return (
    <div className={`relative flex-1 min-w-[160px] ${className}`}>
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
            d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
          />
        </svg>

        <div className="flex-1 overflow-hidden">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            PASSENGERS
          </span>
          <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {total} Passenger{total > 1 ? "s" : ""}
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
              <CounterRow
                label="Adults"
                subtitle="12+ years"
                value={adults}
                min={1}
                max={9}
                onChange={(v) => onChange(v, children, infants)}
              />

              <CounterRow
                label="Children"
                subtitle="2-11 years"
                value={children}
                min={0}
                max={8}
                onChange={(v) => onChange(adults, v, infants)}
              />

              <CounterRow
                label="Infants"
                subtitle="Under 2 years"
                value={infants}
                min={0}
                max={adults} // Infants cannot exceed adults
                onChange={(v) => onChange(adults, children, v)}
              />

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
