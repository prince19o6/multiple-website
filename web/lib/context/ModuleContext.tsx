"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSite } from "@/lib/SiteContext";

export type CanonicalModule =
  | "hotels"
  | "tours"
  | "packages"
  | "flights"
  | "transfers"
  | "visas"
  | "restaurants"
  | "buildpackage";

export interface ModuleItem {
  id: CanonicalModule;
  canonical: CanonicalModule;
  label: string;
  code: string; // "HOTEL", "TOUR", "PACKAGE", etc.
  route: string;
  iconName: string;
  isExternal?: boolean;
  externalUrl?: string;
}

export const MODULE_LIST: ModuleItem[] = [
  {
    id: "hotels",
    canonical: "hotels",
    label: "Hotels",
    code: "HOTEL",
    route: "/en/hotels",
    iconName: "business-outline",
  },
  {
    id: "tours",
    canonical: "tours",
    label: "Tours",
    code: "TOUR",
    route: "/en/tours",
    iconName: "compass-outline",
  },
  {
    id: "packages",
    canonical: "packages",
    label: "Packages",
    code: "PACKAGE",
    route: "/en/packages",
    iconName: "briefcase-outline",
  },
  {
    id: "flights",
    canonical: "flights",
    label: "Flights",
    code: "FLIGHT",
    route: "/en/flights",
    iconName: "airplane-outline",
  },
  {
    id: "transfers",
    canonical: "transfers",
    label: "Transfers",
    code: "TRANSFER",
    route: "/en/transfers",
    iconName: "car-outline",
  },
  {
    id: "visas",
    canonical: "visas",
    label: "Visas",
    code: "VISA",
    route: "/en/visas",
    iconName: "card-outline",
  },
  {
    id: "restaurants",
    canonical: "restaurants",
    label: "Restaurants",
    code: "RESTAURANT",
    route: "/en/restaurants",
    iconName: "restaurant-outline",
  },
  {
    id: "buildpackage",
    canonical: "buildpackage",
    label: "Build Package",
    code: "BUILDPACKAGE",
    route: "/en/buildpackage",
    iconName: "construct-outline",
  },
];

export interface ModuleHomeData {
  success: boolean;
  websiteId: string;
  module: CanonicalModule;
  meta: {
    title: string;
    subtitle: string;
    badge: string;
    searchModule: string;
    citySectionTitle: string;
    collectionTitle?: string;
    collectionSubtitle?: string;
    viewMoreUrl: string;
  };
  banners: any[];
  offers?: any[];
  featured: any[];
  destinations: any[];
  categories: any[];
  packages: any[];
  videos: any[];
  reviews: any[];
  faq: any[];
}

interface ModuleContextType {
  activeModule: CanonicalModule;
  activeModuleCode: string;
  activeModuleItem: ModuleItem;
  setActiveModule: (module: string | CanonicalModule, syncUrl?: boolean) => void;
  moduleData: ModuleHomeData | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  prefetchModule: (module: CanonicalModule) => Promise<void>;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const dataCache = new Map<string, { timestamp: number; data: ModuleHomeData }>();

export function normalizeModuleString(val?: string | null): CanonicalModule {
  if (!val) return "hotels";
  const clean = val.trim().toLowerCase();
  switch (clean) {
    case "hotel":
    case "hotels":
      return "hotels";
    case "tour":
    case "tours":
    case "activities":
    case "activity":
      return "tours";
    case "package":
    case "packages":
    case "holiday":
    case "holidays":
      return "packages";
    case "flight":
    case "flights":
      return "flights";
    case "transfer":
    case "transfers":
      return "transfers";
    case "visa":
    case "visas":
      return "visas";
    case "restaurant":
    case "restaurants":
    case "dining":
      return "restaurants";
    case "buildpackage":
    case "build-package":
    case "custompackage":
      return "buildpackage";
    default:
      return "hotels";
  }
}

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const site = useSite();
  const siteId = site?.siteId || "gujjutours";

  const userSelectedRef = useRef<CanonicalModule | null>(null);

  // 1. Initial State from URL or localStorage
  const detectInitialModule = useCallback((): CanonicalModule => {
    if (userSelectedRef.current) {
      return userSelectedRef.current;
    }
    // Check URL query ?tab= or ?module=
    const queryModule = searchParams?.get("tab") || searchParams?.get("module");
    if (queryModule) {
      return normalizeModuleString(queryModule);
    }

    // Check pathname /en/hotels, /en/tours, etc.
    if (pathname) {
      for (const item of MODULE_LIST) {
        if (!item.isExternal && pathname.includes(`/${item.id}`)) {
          return item.canonical;
        }
      }
      if (pathname.includes("/holidays")) return "packages";
      if (pathname.includes("/activities")) return "tours";
    }

    // Check localStorage in browser
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("toursapp_active_module");
        if (saved) return normalizeModuleString(saved);
      } catch {
        // localStorage unavailable
      }
    }

    return "hotels";
  }, [pathname, searchParams]);

  const [activeModule, setActiveModuleState] = useState<CanonicalModule>("hotels");
  const [moduleData, setModuleData] = useState<ModuleHomeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with URL when pathname/searchParams change
  useEffect(() => {
    if (userSelectedRef.current) return;
    const detected = detectInitialModule();
    setActiveModuleState(detected);
  }, [detectInitialModule]);

  // Fetch or retrieve cached data
  const fetchModuleData = useCallback(
    async (mod: CanonicalModule, forceRefresh = false): Promise<ModuleHomeData | null> => {
      const cacheKey = `${siteId}:${mod}`;
      const now = Date.now();

      if (!forceRefresh) {
        const cached = dataCache.get(cacheKey);
        if (cached && now - cached.timestamp < CACHE_TTL_MS) {
          return cached.data;
        }
      }

      const res = await fetch(
        `/api/core/v1/home?module=${encodeURIComponent(mod)}&site=${encodeURIComponent(siteId)}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error(`Failed to load data for module ${mod} (${res.status})`);
      }

      const json = await res.json();
      dataCache.set(cacheKey, { timestamp: now, data: json });
      return json;
    },
    [siteId]
  );

  // Load data whenever activeModule changes
  const loadActiveData = useCallback(
    async (mod: CanonicalModule) => {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        const data = await fetchModuleData(mod);
        if (data) {
          setModuleData(data);
        }
      } catch (err: any) {
        setIsError(true);
        setError(err.message || "Failed to load module data");
      } finally {
        setIsLoading(false);
      }
    },
    [fetchModuleData]
  );

  useEffect(() => {
    loadActiveData(activeModule);
  }, [activeModule, loadActiveData]);

  // Public setter with URL sync and localStorage persistence
  const setActiveModule = useCallback(
    (modInput: string | CanonicalModule, syncUrl = true) => {
      const mod = normalizeModuleString(modInput);
      userSelectedRef.current = mod;
      setActiveModuleState(mod);

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("toursapp_active_module", mod);
        } catch {
          // ignore
        }
      }

      if (syncUrl && typeof window !== "undefined") {
        const cleanPath = pathname || "/";
        const isHomePage =
          cleanPath === "/" ||
          cleanPath === "/en" ||
          cleanPath.endsWith("/en") ||
          cleanPath === `/${siteId}` ||
          cleanPath === `/${siteId}/en` ||
          !MODULE_LIST.some((m) => !m.isExternal && cleanPath.includes(`/${m.id}`));

        if (isHomePage) {
          // On home page: stay on home page and update ?tab= and ?module= query parameters
          try {
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set("tab", mod);
            currentUrl.searchParams.set("module", mod);
            window.history.replaceState({}, "", currentUrl.toString());
          } catch {
            // ignore
          }
        } else {
          // On other pages (e.g. details or other routes): navigate to that module's page
          const targetItem = MODULE_LIST.find((m) => m.canonical === mod);
          if (targetItem && !cleanPath.includes(targetItem.route)) {
            router.push(targetItem.route);
          }
        }
      }
    },
    [pathname, router, siteId]
  );

  // Prefetch for hover / focus
  const prefetchModule = useCallback(
    async (mod: CanonicalModule) => {
      try {
        await fetchModuleData(mod);
      } catch {
        // prefetch silent fail
      }
    },
    [fetchModuleData]
  );

  const activeModuleItem = useMemo(() => {
    return (
      MODULE_LIST.find((m) => m.canonical === activeModule) ||
      MODULE_LIST[0]
    );
  }, [activeModule]);

  const activeModuleCode = activeModuleItem.code;

  const value = useMemo(
    () => ({
      activeModule,
      activeModuleCode,
      activeModuleItem,
      setActiveModule,
      moduleData,
      isLoading,
      isError,
      error,
      refetch: () => loadActiveData(activeModule),
      prefetchModule,
    }),
    [
      activeModule,
      activeModuleCode,
      activeModuleItem,
      setActiveModule,
      moduleData,
      isLoading,
      isError,
      error,
      loadActiveData,
      prefetchModule,
    ]
  );

  return (
    <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>
  );
}

export function useActiveModule() {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error("useActiveModule must be used within a ModuleProvider");
  }
  return context;
}
