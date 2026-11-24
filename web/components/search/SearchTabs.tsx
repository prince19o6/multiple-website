"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

export interface TabItem {
  id: string;
  label: string;
  code: string;
  icon: React.ReactNode;
}

export interface SearchTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  accentColor?: string;
  className?: string;
}

const TABS: TabItem[] = [
  {
    id: "hotels",
    label: "Hotels",
    code: "HOTEL",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
  },
  {
    id: "tours",
    label: "Tours",
    code: "TOUR",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.828 9.172-1.414 4.242a1 1 0 0 1-.586.586l-4.242 1.414 1.414-4.242a1 1 0 0 1 .586-.586l4.242-1.414Z" />
      </svg>
    ),
  },
  {
    id: "packages",
    label: "Packages",
    code: "PACKAGE",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v1.069m7.5 0c.976.096 1.944.225 2.894.387m-13.288 0A49.123 49.123 0 0 1 12 6.75c2.474 0 4.88.225 7.212.656" />
      </svg>
    ),
  },
  {
    id: "flights",
    label: "Flight",
    code: "FLIGHT",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
      </svg>
    ),
  },
  {
    id: "transfers",
    label: "Transfer",
    code: "TRANSFER",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6m-3-2v4" />
      </svg>
    ),
  },
  {
    id: "visas",
    label: "Visa",
    code: "VISA",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
      </svg>
    ),
  },
  {
    id: "restaurants",
    label: "Restaurant",
    code: "RESTAURANT",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3v6a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 9V3m3 0v18m7.5-18v6.75a3 3 0 0 0 6 0V3m-3 0v18" />
      </svg>
    ),
  },
  {
    id: "buildpackage",
    label: "Build Package",
    code: "BUILDPACKAGE",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.07a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091.455.087.92-.016 1.365" />
      </svg>
    ),
  },
];

export default function SearchTabs({
  activeTab,
  onTabChange,
  accentColor = "#2882c5",
  className = "",
}: SearchTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const checkScrollFade = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 8);
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScrollFade();
    el.addEventListener("scroll", checkScrollFade, { passive: true });
    window.addEventListener("resize", checkScrollFade);
    return () => {
      el.removeEventListener("scroll", checkScrollFade);
      window.removeEventListener("resize", checkScrollFade);
    };
  }, [checkScrollFade]);

  // Auto-scroll active tab into view smoothly
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
    checkScrollFade();
  }, [activeTab, checkScrollFade]);

  const normalized = (activeTab || "").toLowerCase();

  return (
    <div className={`relative w-full ${className}`}>
      {/* Container with rounded top and subtle bottom divider */}
      <div className="relative flex items-center bg-white dark:bg-neutral-900 rounded-t-3xl border-b border-neutral-100 dark:border-neutral-800/80 px-2 sm:px-4 py-2 sm:py-2.5">
        {/* Left Gradient Fade Edge (Mobile indicator) */}
        {showLeftFade && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-neutral-900 to-transparent z-10" />
        )}

        {/* Scrollable Tab Strip */}
        <div
          ref={scrollContainerRef}
          role="tablist"
          aria-label="Travel modules"
          className="flex-1 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide py-1 px-1 scroll-smooth"
          style={{ scrollbarWidth: "none" }}
        >
          {TABS.map((tab) => {
            const isSelected =
              normalized === tab.id.toLowerCase() ||
              normalized === tab.code.toLowerCase() ||
              (tab.id === "flights" && normalized === "flight") ||
              (tab.id === "transfers" && normalized === "transfer") ||
              (tab.id === "visas" && normalized === "visa") ||
              (tab.id === "restaurants" && normalized === "restaurant");

            return (
              <button
                key={tab.id}
                ref={isSelected ? (el) => { activeTabRef.current = el; } : undefined}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-full whitespace-nowrap text-xs sm:text-sm font-bold transition-all duration-200 shrink-0 min-h-[44px] cursor-pointer active:scale-95
                  ${
                    isSelected
                      ? "text-white shadow-md"
                      : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }
                `}
                style={
                  isSelected
                    ? {
                        backgroundColor: accentColor,
                        boxShadow: `0 4px 14px ${accentColor}40`,
                      }
                    : undefined
                }
              >
                <span className={isSelected ? "text-white" : "text-neutral-400 dark:text-neutral-500"}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Gradient Fade Edge (Mobile indicator) */}
        {showRightFade && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-neutral-900 to-transparent z-10" />
        )}
      </div>
    </div>
  );
}
