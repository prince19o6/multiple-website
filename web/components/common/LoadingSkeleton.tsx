"use client";

import React from "react";

export interface LoadingSkeletonProps {
  count?: number;
  type?: "grid" | "detail" | "table" | "list" | "card";
  variant?: "grid" | "detail" | "table" | "list" | "card";
  className?: string;
}

export function LoadingSkeleton({
  count = 6,
  type,
  variant,
  className = "",
}: LoadingSkeletonProps) {
  const activeType = variant || type || "grid";

  if (activeType === "detail") {
    return (
      <div className={`w-full max-w-7xl mx-auto px-4 py-8 space-y-6 ${className}`}>
        <div className="h-8 w-1/3 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
        <div className="h-4 w-1/4 bg-neutral-100 dark:bg-neutral-850 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-80 w-full bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-neutral-100 dark:bg-neutral-850 rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-64 w-full bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse" />
            <div className="h-12 w-full bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (activeType === "list") {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="h-40 w-full bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-4 shadow-sm"
        >
          <div className="h-48 w-full bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-neutral-100 dark:bg-neutral-850 rounded animate-pulse" />
          </div>
          <div className="pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800">
            <div className="h-5 w-20 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-8 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default LoadingSkeleton;
