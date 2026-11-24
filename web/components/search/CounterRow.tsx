"use client";

import React from "react";

export interface CounterRowProps {
  label: string;
  subtitle?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export default function CounterRow({
  label,
  subtitle,
  value,
  min = 0,
  max = 10,
  onChange,
  disabled = false,
}: CounterRowProps) {
  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (value > min && !disabled) {
      onChange(value - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (value < max && !disabled) {
      onChange(value + 1);
    }
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-neutral-800 last:border-b-0">
      <div>
        <div className="text-xs font-bold text-gray-800 dark:text-gray-100">{label}</div>
        {subtitle && <div className="text-[10px] text-gray-400 dark:text-gray-400">{subtitle}</div>}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          aria-label={`Decrease ${label}`}
          className="w-7 h-7 rounded-full border border-gray-300 dark:border-neutral-600 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          -
        </button>
        <span className="text-xs font-bold w-6 text-center text-gray-900 dark:text-white tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          aria-label={`Increase ${label}`}
          className="w-7 h-7 rounded-full border border-gray-300 dark:border-neutral-600 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          +
        </button>
      </div>
    </div>
  );
}
