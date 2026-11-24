"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export interface SelectOption {
  label: string;
  value: string;
  subtitle?: string;
  icon?: string;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  options: (string | SelectOption)[];
  onChange: (val: string) => void;
  icon?: React.ReactNode;
  searchable?: boolean;
  placeholder?: string;
  className?: string;
}

export default function SelectField({
  label,
  value,
  options,
  onChange,
  icon,
  searchable = false,
  placeholder = "Select an option",
  className = "",
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 240,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const normalizedOptions: SelectOption[] = React.useMemo(() => {
    return options.map((opt) =>
      typeof opt === "string" ? { label: opt, value: opt } : opt
    );
  }, [options]);

  const selectedOption = normalizedOptions.find((o) => o.value === value);

  const updatePopoverCoords = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = Math.max(rect.width, 240);
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
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePopoverCoords();
    }
  }, [isOpen, updatePopoverCoords]);

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

  const filtered = normalizedOptions.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      o.subtitle?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`relative flex-1 min-w-[140px] ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 bg-[#f8f9fa] dark:bg-neutral-800/80 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-primary transition-colors min-h-[58px]"
      >
        <span className="text-gray-400 dark:text-gray-500 shrink-0">
          {icon || (
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          )}
        </span>

        <div className="flex-1 overflow-hidden">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
            {label}
          </span>
          <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </div>
        </div>

        <span className="text-xs text-gray-400 shrink-0">▾</span>
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
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 p-2 text-gray-900 dark:text-white max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
          >
            {searchable && (
              <div className="p-1 mb-1 border-b border-gray-100 dark:border-neutral-800">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type to filter..."
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-50 dark:bg-neutral-800 outline-none"
                  autoFocus
                />
              </div>
            )}

            <div className="space-y-0.5">
              {filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-primary text-white font-bold"
                        : "hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    <div className="truncate flex-1">
                      <div className="truncate">{opt.label}</div>
                      {opt.subtitle && (
                        <div
                          className={`text-[10px] truncate ${
                            isSelected ? "text-white/80" : "text-gray-400"
                          }`}
                        >
                          {opt.subtitle}
                        </div>
                      )}
                    </div>
                    {isSelected && <span className="ml-2 font-bold">✓</span>}
                  </button>
                );
              })}

              {filtered.length === 0 && (
                <div className="p-3 text-center text-xs text-gray-400">No matching options</div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
