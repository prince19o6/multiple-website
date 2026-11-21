"use client";

/**
 * lib/CurrencyContext.tsx
 *
 * Universal reactive multi-currency context for the Next.js web application.
 * Synchronizes with header dropdown, mobile drawer, local storage, and page components.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  SUPPORTED_CURRENCIES,
  DEFAULT_EXCHANGE_RATES,
  convertCurrencyAmount,
  formatCurrencyPrice,
  type CurrencyDefinition,
} from "@/lib/currencyUtils";

export interface CurrencyContextType {
  currentCurrency: CurrencyDefinition;
  currencies: readonly CurrencyDefinition[];
  currencyCode: string;
  currencySymbol: string;
  setCurrency: (code: string) => void;
  convertPrice: (amount: number, itemCurrency?: string) => number;
  formatPrice: (amount: number, itemCurrency?: string) => string;
  tenantBaseCurrency: string;
}

const STORAGE_KEY = "tours_currency";
const EVENT_NAME = "tours_currency_changed";

const CurrencyContext = createContext<CurrencyContextType>({
  currentCurrency: SUPPORTED_CURRENCIES[0],
  currencies: SUPPORTED_CURRENCIES,
  currencyCode: "INR",
  currencySymbol: "₹",
  setCurrency: () => {},
  convertPrice: (p) => p,
  formatPrice: (p) => `₹${p}`,
  tenantBaseCurrency: "INR",
});

interface CurrencyProviderProps {
  children: React.ReactNode;
  siteId?: string;
  defaultCurrencyCode?: string;
}

export function CurrencyProvider({
  children,
  siteId = "gujjutours",
  defaultCurrencyCode,
}: CurrencyProviderProps) {
  // Tenant native base currency (INR for GujjuTours, USD for TripGoAsia & Technoheaven)
  const tenantBaseCurrency = useMemo(() => {
    if (defaultCurrencyCode) {
      return defaultCurrencyCode.toUpperCase();
    }
    const s = (siteId || "").toLowerCase();
    if (s.includes("gujju") || s === "website1") {
      return "INR";
    }
    if (s.includes("techno") || s === "website3") {
      return "AED";
    }
    return "USD";
  }, [siteId, defaultCurrencyCode]);

  const defaultCurrency = useMemo(() => {
    return (
      SUPPORTED_CURRENCIES.find((c) => c.code === tenantBaseCurrency) ||
      SUPPORTED_CURRENCIES[0]
    );
  }, [tenantBaseCurrency]);

  const [currentCurrency, setCurrentCurrency] = useState<CurrencyDefinition>(defaultCurrency);

  // Restore preferred currency from localStorage on mount and listen to cross-component changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const match = SUPPORTED_CURRENCIES.find(
        (c) => c.code.toUpperCase() === saved.trim().toUpperCase()
      );
      if (match) {
        setCurrentCurrency(match);
      }
    } else {
      setCurrentCurrency(defaultCurrency);
    }

    const handleExternalChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ currency?: string }>;
      const code = customEvent.detail?.currency;
      if (code) {
        const found = SUPPORTED_CURRENCIES.find(
          (c) => c.code.toUpperCase() === code.toUpperCase()
        );
        if (found) {
          setCurrentCurrency(found);
        }
      }
    };

    window.addEventListener(EVENT_NAME, handleExternalChange);
    return () => {
      window.removeEventListener(EVENT_NAME, handleExternalChange);
    };
  }, [defaultCurrency]);

  const setCurrency = useCallback((code: string) => {
    const match = SUPPORTED_CURRENCIES.find(
      (c) => c.code.toUpperCase() === code.trim().toUpperCase()
    );
    if (!match) return;

    setCurrentCurrency(match);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, match.code);
      document.cookie = `${STORAGE_KEY}=${match.code}; path=/; max-age=31536000; SameSite=Lax`;
      window.dispatchEvent(
        new CustomEvent(EVENT_NAME, { detail: { currency: match.code } })
      );
    }
  }, []);

  const rateMap = useMemo(() => {
    const map: Record<string, number> = { ...DEFAULT_EXCHANGE_RATES };
    SUPPORTED_CURRENCIES.forEach((c) => {
      map[c.code] = c.rate;
    });
    return map;
  }, []);

  const convertPrice = useCallback(
    (amount: number, itemCurrency?: string): number => {
      if (typeof amount !== "number" || isNaN(amount)) return 0;
      const effectiveSrcCurrency = itemCurrency || tenantBaseCurrency;
      return convertCurrencyAmount(
        amount,
        effectiveSrcCurrency,
        currentCurrency.code,
        rateMap
      );
    },
    [currentCurrency.code, tenantBaseCurrency, rateMap]
  );

  const formatPrice = useCallback(
    (amount: number, itemCurrency?: string): string => {
      if (typeof amount !== "number" || isNaN(amount)) {
        return `${currentCurrency.symbol}0`;
      }
      const effectiveSrcCurrency = itemCurrency || tenantBaseCurrency;
      return formatCurrencyPrice(
        amount,
        effectiveSrcCurrency,
        currentCurrency.code,
        rateMap
      );
    },
    [currentCurrency.code, tenantBaseCurrency, rateMap]
  );

  const value = useMemo(
    () => ({
      currentCurrency,
      currencies: SUPPORTED_CURRENCIES,
      currencyCode: currentCurrency.code,
      currencySymbol: currentCurrency.symbol,
      setCurrency,
      convertPrice,
      formatPrice,
      tenantBaseCurrency,
    }),
    [
      currentCurrency,
      setCurrency,
      convertPrice,
      formatPrice,
      tenantBaseCurrency,
    ]
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  return useContext(CurrencyContext);
}

export function PriceDisplay({
  amount,
  itemCurrency,
  className = "",
}: {
  amount: number;
  itemCurrency?: string;
  className?: string;
}) {
  const { formatPrice } = useCurrency();
  return <span className={className}>{formatPrice(amount, itemCurrency)}</span>;
}
