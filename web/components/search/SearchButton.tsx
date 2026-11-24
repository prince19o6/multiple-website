"use client";

import React from "react";

export interface SearchButtonProps {
  title: string;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "submit" | "button";
  accentColor?: string;
  className?: string;
}

export default function SearchButton({
  title,
  icon,
  loading = false,
  disabled = false,
  onClick,
  type = "submit",
  accentColor = "#2882c5",
  className = "",
}: SearchButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{ backgroundColor: accentColor }}
      className={`w-full lg:w-auto py-3 px-4 sm:px-6 rounded-xl text-white font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 active:scale-98 min-h-[52px] sm:min-h-[58px] transition-all hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed max-w-full ${className}`}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon || (
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
          </svg>
        )
      )}
      <span>{loading ? "Searching..." : title}</span>
    </button>
  );
}
