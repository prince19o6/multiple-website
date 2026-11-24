"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export interface MultiSelectChipsProps {
  label: string;
  selected: string[];
  onChange: (items: string[]) => void;
  commonOptions?: string[];
  placeholder?: string;
  className?: string;
  error?: string;
}

const DEFAULT_PACKAGE_DESTINATIONS = [
  "Dubai & Abu Dhabi",
  "Bali, Indonesia",
  "Singapore & Malaysia",
  "Thailand (Bangkok & Phuket)",
  "Kashmir & Ladakh",
  "Kerala God's Own Country",
  "Himachal & Manali",
  "Rajasthan Royal Heritage",
  "Goa Beach Holiday",
  "Europe Highlights",
  "Vietnam & Cambodia",
  "Maldives Luxury Island",
];

export default function MultiSelectChips({
  label,
  selected,
  onChange,
  commonOptions = DEFAULT_PACKAGE_DESTINATIONS,
  placeholder = "Add destination (e.g. Dubai, Bali)",
  className = "",
  error,
}: MultiSelectChipsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 320,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePopoverCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverWidth = Math.max(rect.width, 320);
      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 12) {
        left = window.innerWidth - popoverWidth - 12;
      }
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: Math.max(12, left),
        width: Math.min(popoverWidth, window.innerWidth - 24),
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const addDestination = (dest: string) => {
    const trimmed = dest.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setInputValue("");
  };

  const removeDestination = (dest: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== dest));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        addDestination(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && selected.length > 0) {
      onChange(selected.slice(0, selected.length - 1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const filteredOptions = commonOptions.filter(
    (opt) =>
      !selected.includes(opt) &&
      opt.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div ref={containerRef} className={`relative flex-1 ${className}`}>
      <div
        onClick={() => {
          inputRef.current?.focus();
          setIsOpen(true);
          updatePopoverCoords();
        }}
        className={`flex flex-col justify-center px-3.5 py-2 bg-[#f8f9fa] dark:bg-neutral-800/80 rounded-xl border transition-colors min-h-[58px] cursor-text ${
          error
            ? "border-red-500 bg-red-50/20"
            : isOpen
            ? "border-primary ring-1 ring-primary/20"
            : "border-gray-200 dark:border-neutral-700 hover:border-primary"
        }`}
      >
        <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label}
        </span>

        {/* Selected Chips & Input Row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary dark:text-sky-300 text-xs font-bold shrink-0 border border-primary/20 animate-in fade-in"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={(e) => removeDestination(item, e)}
                className="hover:opacity-75 text-primary dark:text-sky-300 font-bold ml-0.5 text-xs"
                aria-label={`Remove ${item}`}
              >
                ×
              </button>
            </span>
          ))}

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
              updatePopoverCoords();
            }}
            onFocus={() => {
              setIsOpen(true);
              updatePopoverCoords();
            }}
            onKeyDown={handleKeyDown}
            placeholder={selected.length === 0 ? placeholder : "Add more..."}
            className="flex-1 min-w-[120px] bg-transparent font-bold text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
          />
        </div>
      </div>

      {error && <span className="text-[11px] text-red-500 font-semibold mt-1 block px-1">{error}</span>}

      {/* Popover Dropdown for Common Destinations */}
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
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 p-3 text-gray-900 dark:text-white max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-1">
              Popular Package Destinations
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {filteredOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => addDestination(opt)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-primary hover:text-white transition-colors"
                >
                  + {opt}
                </button>
              ))}
            </div>

            {inputValue.trim() && !selected.includes(inputValue.trim()) && (
              <button
                type="button"
                onClick={() => addDestination(inputValue)}
                className="w-full text-left mt-2 p-2 rounded-xl text-xs font-bold text-primary dark:text-sky-400 hover:bg-primary/10 flex items-center justify-between"
              >
                <span>Add &quot;{inputValue.trim()}&quot;</span>
                <span className="text-[10px] bg-primary/20 px-1.5 py-0.5 rounded">Enter ↵</span>
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
