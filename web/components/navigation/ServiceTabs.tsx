"use client";

import React, { useRef, useMemo } from "react";
import Image from "next/image";
import type { WebsiteModuleItem } from "@/lib/websiteModules";
import { useFeatures } from "@/lib/features/useFeature";

interface ServiceTabsProps {
  modules?: WebsiteModuleItem[];
  activeCode?: string;
  onSelectTab?: (code: string) => void;
  accentColor?: string;
  staticPath?: string;
}

/**
 * High-fidelity semantic SVG icons per travel vertical.
 * Used as reliable fallback when a remote CDN SVG or WebP is not cached or loading.
 */
function renderSemanticIcon(code: string, className = "w-4 h-4 sm:w-5 sm:h-5") {
  const normalized = code.toUpperCase();

  switch (normalized) {
    case "HOTEL":
    case "HOTELS":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      );
    case "TOUR":
    case "TOURS":
    case "ATTRACTION":
    case "ATTRACTIONS":
    case "ACTIVITY":
    case "ACTIVITIES":
    case "SIGHTSEEING":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.828 9.172-1.414 4.242a1 1 0 0 1-.586.586l-4.242 1.414 1.414-4.242a1 1 0 0 1 .586-.586l4.242-1.414Z" />
        </svg>
      );
    case "CAR":
    case "CARRENTAL":
    case "CAR-RENTAL":
    case "RENTAL":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75m0 3.75h4.125" />
        </svg>
      );
    case "TRANSFER":
    case "TRANSFERS":
    case "AIRPORT-TRANSFER":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6m-3-2v4" />
        </svg>
      );
    case "PACKAGE":
    case "PACKAGES":
    case "HOLIDAY":
    case "HOLIDAYS":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0v1.5m-9 0h10.5a2.25 2.25 0 0 1 2.25 2.25v8.25a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 18V9.75A2.25 2.25 0 0 1 6.75 7.5Z" />
        </svg>
      );
    case "FLIGHT":
    case "FLIGHTS":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
        </svg>
      );
    case "VISA":
    case "VISAS":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 9.5h5m-5 3h7m-7 3h3" />
        </svg>
      );
    case "RESTAURANT":
    case "RESTAURANTS":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M9.75 4.5A2.25 2.25 0 0 1 12 2.25a2.25 2.25 0 0 1 2.25 2.25v6a2.25 2.25 0 0 1-4.5 0v-6ZM5.25 4.5v6a2.25 2.25 0 0 0 2.25 2.25h0A2.25 2.25 0 0 0 9.75 10.5v-6M18.75 4.5v12" />
        </svg>
      );
    case "BUILDPACKAGE":
    case "BUILD-PACKAGE":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
      );
    case "INSURANCE":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
        </svg>
      );
  }
}

interface DisplayTabItem {
  id: string;
  code: string;
  name: string;
  iconUrl?: string;
  badge?: string;
}

function isVerticalActive(tabCode: string, tabId: string, currentActive: string): boolean {
  const normTab = (tabCode || "").toUpperCase().replace(/[-_\s]/g, "");
  const normId = (tabId || "").toUpperCase().replace(/[-_\s]/g, "");
  const normActive = (currentActive || "").toUpperCase().replace(/[-_\s]/g, "");

  if (normTab === normActive || normId === normActive) return true;

  if (
    (normTab === "HOTEL" || normTab === "HOTELS") &&
    (normActive === "HOTEL" || normActive === "HOTELS")
  ) {
    return true;
  }
  if (
    ["TOUR", "TOURS", "ACTIVITY", "ACTIVITIES", "ATTRACTION", "ATTRACTIONS", "SIGHTSEEING"].includes(normTab) &&
    ["TOUR", "TOURS", "ACTIVITY", "ACTIVITIES", "ATTRACTION", "ATTRACTIONS", "SIGHTSEEING"].includes(normActive)
  ) {
    return true;
  }
  if (
    ["PACKAGE", "PACKAGES", "HOLIDAY", "HOLIDAYS"].includes(normTab) &&
    ["PACKAGE", "PACKAGES", "HOLIDAY", "HOLIDAYS"].includes(normActive)
  ) {
    return true;
  }
  if (
    (normTab === "FLIGHT" || normTab === "FLIGHTS") &&
    (normActive === "FLIGHT" || normActive === "FLIGHTS")
  ) {
    return true;
  }
  if (
    ["TRANSFER", "TRANSFERS", "AIRPORTTRANSFER"].includes(normTab) &&
    ["TRANSFER", "TRANSFERS", "AIRPORTTRANSFER"].includes(normActive)
  ) {
    return true;
  }
  if (
    (normTab === "VISA" || normTab === "VISAS") &&
    (normActive === "VISA" || normActive === "VISAS")
  ) {
    return true;
  }
  if (
    (normTab === "RESTAURANT" || normTab === "RESTAURANTS") &&
    (normActive === "RESTAURANT" || normActive === "RESTAURANTS")
  ) {
    return true;
  }
  if (
    ["BUILDPACKAGE", "BUILD-PACKAGE", "BUILD_PACKAGE"].includes(normTab) &&
    ["BUILDPACKAGE", "BUILD-PACKAGE", "BUILD_PACKAGE"].includes(normActive)
  ) {
    return true;
  }

  return false;
}

const CORE_SERVICE_MODULES: Array<{ id: string; code: string; name: string; order: number }> = [
  { id: "hotels", code: "HOTELS", name: "Hotels", order: 1 },
  { id: "tours", code: "TOURS", name: "Tours", order: 2 },
  { id: "packages", code: "PACKAGES", name: "Packages", order: 3 },
  { id: "flights", code: "FLIGHTS", name: "Flights", order: 4 },
  { id: "transfers", code: "TRANSFERS", name: "Transfers", order: 5 },
  { id: "visas", code: "VISAS", name: "Visas", order: 6 },
  { id: "restaurants", code: "RESTAURANTS", name: "Restaurants", order: 7 },
  { id: "buildpackage", code: "BUILDPACKAGE", name: "Build Package", order: 8 },
];

export default function ServiceTabs({
  modules,
  activeCode = "HOTEL",
  onSelectTab,
  accentColor = "#2882c5",
  staticPath,
}: ServiceTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { allFeatures } = useFeatures();

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -240 : 240;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  // Build the list of active service tabs dynamically from registry or API modules
  const displayTabs: DisplayTabItem[] = useMemo(() => {
    const ALLOWED_CODES = new Set([
      "HOTELS",
      "TOURS",
      "PACKAGES",
      "FLIGHTS",
      "TRANSFERS",
      "VISAS",
      "RESTAURANTS",
      "BUILDPACKAGE",
    ]);

    // 1. If feature registry is present and populated, use enabled web service features
    const enabledRegistryServices = allFeatures.filter(
      (f) =>
        f.enabled &&
        f.type === "service" &&
        f.platforms.includes("web") &&
        !f.id.toLowerCase().includes("cruise")
    );

    if (enabledRegistryServices.length > 0) {
      const mapped = enabledRegistryServices.map((f) => {
        let code = f.id.toUpperCase();
        let name = f.label?.en || f.id;

        if (code === "TOUR" || code === "TOURS" || code === "ACTIVITY") {
          code = "TOURS";
          name = "Tours";
        } else if (code === "HOTEL" || code === "HOTELS") {
          code = "HOTELS";
          name = "Hotels";
        } else if (code === "PACKAGE" || code === "PACKAGES" || code === "HOLIDAYS") {
          code = "PACKAGES";
          name = "Packages";
        } else if (code === "FLIGHT" || code === "FLIGHTS") {
          code = "FLIGHTS";
          name = "Flights";
        } else if (code === "TRANSFER" || code === "TRANSFERS") {
          code = "TRANSFERS";
          name = "Transfers";
        } else if (code === "VISA" || code === "VISAS") {
          code = "VISAS";
          name = "Visas";
        } else if (code === "RESTAURANT" || code === "RESTAURANTS") {
          code = "RESTAURANTS";
          name = "Restaurants";
        } else if (code === "BUILDPACKAGE" || code === "BUILD-PACKAGE" || code === "BUILD_PACKAGE") {
          code = "BUILDPACKAGE";
          name = "Build Package";
        }

        return {
          id: f.id,
          code,
          name,
          iconUrl: f.icon?.url || undefined,
          badge: f.badge,
          order: f.order ?? 99,
        };
      });

      return mapped
        .filter((item) => ALLOWED_CODES.has(item.code))
        .sort((a, b) => a.order - b.order);
    }

    // 2. Fallback to API modules if passed
    if (modules && modules.length > 0) {
      return modules
        .filter((m) => {
          const rawCode = (m.serviceCode || m.serviceName || "").toLowerCase();
          return !rawCode.includes("cruise");
        })
        .map((m) => {
          let code = (m.serviceCode || m.serviceName || "").toUpperCase();
          let name = m.serviceName;

          if (code === "TOUR" || code === "TOURS" || code === "ACTIVITY") {
            code = "TOURS";
            name = "Tours";
          } else if (code === "HOTEL" || code === "HOTELS") {
            code = "HOTELS";
            name = "Hotels";
          } else if (code === "PACKAGE" || code === "PACKAGES" || code === "HOLIDAY" || code === "HOLIDAYS") {
            code = "PACKAGES";
            name = "Packages";
          } else if (code === "FLIGHT" || code === "FLIGHTS") {
            code = "FLIGHTS";
            name = "Flights";
          } else if (code === "TRANSFER" || code === "TRANSFERS") {
            code = "TRANSFERS";
            name = "Transfers";
          } else if (code === "VISA" || code === "VISAS") {
            code = "VISAS";
            name = "Visas";
          } else if (code === "RESTAURANT" || code === "RESTAURANTS") {
            code = "RESTAURANTS";
            name = "Restaurants";
          } else if (code === "BUILDPACKAGE" || code === "BUILD-PACKAGE") {
            code = "BUILDPACKAGE";
            name = "Build Package";
          }

          let fullIconUrl: string | undefined = undefined;
          const iconCandidate = (m as any).iconUrl || m.url;
          if (iconCandidate) {
            fullIconUrl = iconCandidate;
          } else if (m.serviceIcon && staticPath) {
            fullIconUrl = `${staticPath.replace(/\/$/, "")}/${m.serviceIcon.replace(/^\//, "")}`;
          }

          return {
            id: (m.serviceCode || m.serviceName).toLowerCase(),
            code,
            name,
            iconUrl: fullIconUrl,
          };
        })
        .filter((item) => ALLOWED_CODES.has(item.code));
    }

    // 3. Fallback: all 8 canonical modules
    return CORE_SERVICE_MODULES.map((m) => ({
      id: m.id,
      code: m.code,
      name: m.name,
    }));
  }, [allFeatures, modules, staticPath]);


  return (
    <div className="relative w-full max-w-[1200px] mx-auto">
      {/* Curved Dark Tab Bar Container matching live design */}
      <div className="relative flex items-center bg-neutral-900/90 dark:bg-neutral-900/95 backdrop-blur-md rounded-t-2xl border border-white/10 border-b-0 px-2 py-2">
        {/* Left Scroll Arrow */}
        <button
          type="button"
          onClick={() => handleScroll("left")}
          aria-label="Scroll left"
          className="flex shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/20 bg-black/40 text-white items-center justify-center hover:bg-black/70 hover:scale-105 active:scale-95 transition-all shadow-md mr-1.5 z-10"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Horizontal Scrollable Tabs */}
        <div
          ref={scrollRef}
          className="flex-1 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide py-1 px-1"
          style={{ scrollbarWidth: "none" }}
        >
          {displayTabs.map((item, idx) => {
            const isSelected = isVerticalActive(item.code, item.id, activeCode);

            return (
              <button
                key={`${item.id}-${idx}`}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (onSelectTab) onSelectTab(item.code);
                }}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full whitespace-nowrap text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 ${
                  isSelected
                    ? "bg-white/20 text-white font-bold backdrop-blur-md border shadow-sm"
                    : "text-white/75 hover:text-white hover:bg-white/10"
                }`}
                style={
                  isSelected && accentColor
                    ? {
                        borderColor: accentColor,
                        boxShadow: `0 0 12px ${accentColor}40`,
                      }
                    : { borderColor: "rgba(255,255,255,0.15)" }
                }
              >
                {/* Real API Icon (Image) or Semantic Fallback */}
                {item.iconUrl ? (
                  <div className="relative w-4 h-4 sm:w-5 sm:h-5 shrink-0">
                    <Image
                      src={item.iconUrl}
                      alt={item.name}
                      width={20}
                      height={20}
                      unoptimized
                      className="object-contain w-full h-full"
                    />
                  </div>
                ) : (
                  <span className={isSelected ? "text-white" : "text-white/80"}>
                    {renderSemanticIcon(item.code)}
                  </span>
                )}

                <span>{item.name}</span>

                {item.badge && (
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-full bg-amber-400 text-black shadow-xs">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Scroll Arrow */}
        <button
          type="button"
          onClick={() => handleScroll("right")}
          aria-label="Scroll right"
          className="flex shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/20 bg-black/40 text-white items-center justify-center hover:bg-black/70 hover:scale-105 active:scale-95 transition-all shadow-md ml-1.5 z-10"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
