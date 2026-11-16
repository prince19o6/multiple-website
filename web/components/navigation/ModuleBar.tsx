"use client";

import React, { useRef } from "react";
import {
  useActiveModule,
  MODULE_LIST,
} from "@/lib/context/ModuleContext";
import { useSiteConfig } from "@/lib/SiteConfigContext";

interface ModuleBarProps {
  variant?: "header" | "hero" | "strip";
  className?: string;
  accentColor?: string;
}

function renderModuleIcon(id: string, className = "w-4 h-4 sm:w-5 sm:h-5") {
  switch (id) {
    case "hotels":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      );
    case "tours":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.828 9.172-1.414 4.242a1 1 0 0 1-.586.586l-4.242 1.414 1.414-4.242a1 1 0 0 1 .586-.586l4.242-1.414Z" />
        </svg>
      );
    case "packages":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v1.069m7.5 0c.976.096 1.944.225 2.894.387m-13.288 0A49.123 49.123 0 0 1 12 6.75c2.474 0 4.88.225 7.212.656" />
        </svg>
      );
    case "flights":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
        </svg>
      );
    case "transfers":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6m-3-2v4" />
        </svg>
      );
    case "visas":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
        </svg>
      );
    case "restaurants":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3v6a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 9V3m3 0v18m7.5-18v6.75a3 3 0 0 0 6 0V3m-3 0v18" />
        </svg>
      );
    case "buildpackage":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

export function ModuleBar({
  variant = "header",
  className = "",
  accentColor,
}: ModuleBarProps) {
  const { activeModule, setActiveModule, prefetchModule } = useActiveModule();
  const config = useSiteConfig();
  const primaryColor =
    accentColor || config?.theme?.colors?.primary || config?.theme?.primary || "#2882c5";

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Header Variant (desktop nav row & mobile scroll strip in header)
  if (variant === "header") {
    return (
      <nav
        aria-label="Travel Services Navigation"
        className={`w-full overflow-hidden ${className}`}
      >
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide py-1 px-1 sm:justify-center"
          style={{ scrollbarWidth: "none" }}
        >
          {MODULE_LIST.map((item) => {
            const isSelected = !item.isExternal && item.canonical === activeModule;

            if (item.isExternal) {
              return (
                <a
                  key={item.id}
                  href={item.externalUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs sm:text-sm font-semibold text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0 min-h-[44px]"
                >
                  <span className="text-neutral-500">{renderModuleIcon(item.id)}</span>
                  <span>{item.label}</span>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-neutral-400">
                    <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h4a.75.75 0 0 1 0 1.5h-4Z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 0 0 1.06 1.06l7.5-7.5-2.25-2.25a.75.75 0 0 0-1.06 1.06l1.19 1.19H10.5a.75.75 0 0 0 0 1.5h2.19l-6.496 6.44Z" clipRule="evenodd" />
                  </svg>
                </a>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveModule(item.canonical, true)}
                onMouseEnter={() => prefetchModule(item.canonical)}
                onFocus={() => prefetchModule(item.canonical)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 min-h-[44px] ${
                  isSelected
                    ? "text-white shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: primaryColor,
                        boxShadow: `0 2px 8px ${primaryColor}40`,
                      }
                    : undefined
                }
              >
                <span className={isSelected ? "text-white" : "text-neutral-500"}>
                  {renderModuleIcon(item.id)}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // Hero Variant (clean modern white tab bar with brand highlights)
  return (
    <div className={`relative w-full max-w-[1200px] mx-auto ${className}`}>
      <div className="relative flex items-center bg-white dark:bg-neutral-900 rounded-t-2xl border border-neutral-200/90 dark:border-neutral-800 border-b-neutral-100 dark:border-b-neutral-800/60 px-2 sm:px-3 py-2 sm:py-2.5 shadow-lg">
        {/* Left Scroll Button */}
        <button
          type="button"
          onClick={() => handleScroll("left")}
          aria-label="Scroll left"
          className="flex shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:scale-105 active:scale-95 transition-all shadow-sm mr-1 sm:mr-1.5 z-10 min-h-[30px]"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Scrollable Module Chips */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide py-1 px-0.5 sm:px-1 scroll-smooth"
          style={{ scrollbarWidth: "none" }}
        >
          {MODULE_LIST.map((item) => {
            const isSelected = !item.isExternal && item.canonical === activeModule;

            if (item.isExternal) {
              return (
                <a
                  key={item.id}
                  href={item.externalUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full whitespace-nowrap text-xs sm:text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0 min-h-[38px] sm:min-h-[44px]"
                >
                  <span className="text-neutral-500 dark:text-neutral-400">{renderModuleIcon(item.id)}</span>
                  <span>{item.label}</span>
                </a>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveModule(item.canonical, true)}
                onMouseEnter={() => prefetchModule(item.canonical)}
                onFocus={() => prefetchModule(item.canonical)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full whitespace-nowrap text-xs sm:text-sm font-bold transition-all duration-200 shrink-0 min-h-[38px] sm:min-h-[44px] ${
                  isSelected
                    ? "text-white shadow-md"
                    : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: primaryColor,
                        boxShadow: `0 4px 14px ${primaryColor}40`,
                      }
                    : undefined
                }
              >
                <span className={isSelected ? "text-white" : "text-neutral-500 dark:text-neutral-400"}>
                  {renderModuleIcon(item.id)}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        <button
          type="button"
          onClick={() => handleScroll("right")}
          aria-label="Scroll right"
          className="flex shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:scale-105 active:scale-95 transition-all shadow-sm ml-1 sm:ml-1.5 z-10 min-h-[30px]"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
export default ModuleBar;
