"use client";

import React from "react";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title = "No results found",
  description,
  message,
  actionLabel = "Reset Filters",
  onAction,
  className = "",
}: EmptyStateProps) {
  const text = message || description || "We couldn't find any items matching your current filters. Try adjusting your search criteria.";

  return (
    <div
      className={`rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 p-10 text-center max-w-lg mx-auto space-y-4 my-8 ${className}`}
    >
      <div className="w-14 h-14 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
          {title}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {text}
        </p>
      </div>

      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-bold text-xs bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 active:scale-95 transition-all shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
