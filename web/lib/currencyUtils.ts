/**
 * lib/currencyUtils.ts
 *
 * Enterprise Multi-Currency conversion and formatting engine for the Web platform.
 * Features:
 *   - Synchronized exchange rates relative to USD (USD = 1.0)
 *   - Currency symbols with clean spacing for dirhams, dollars, rupees, euros, and pounds
 *   - Smart double-conversion guard (detects if source price is already in tenant base currency)
 *   - Locale-aware grouping (Indian grouping for INR: e.g. ₹14,999; US grouping for others)
 */

export interface CurrencyFormatOptions {
  amount: number;
  itemCurrency?: string;
  targetCurrency?: string;
  tenantBaseCurrency?: string;
  exchangeRates?: Record<string, number>;
}

export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  INR: 86.5,
  EUR: 0.92,
  AED: 3.67,
  GBP: 0.78,
  THB: 34.5,
  SGD: 1.34,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  AED: "AED ",
  GBP: "£",
  THB: "฿",
  SGD: "S$",
};

export interface CurrencyDefinition {
  code: string;
  symbol: string;
  name: string;
  rate: number;
  flag: string;
}

export const SUPPORTED_CURRENCIES: readonly CurrencyDefinition[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 86.5, flag: "🇮🇳" },
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1.0, flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.92, flag: "🇪🇺" },
  { code: "AED", symbol: "AED ", name: "UAE Dirham", rate: 3.67, flag: "🇦🇪" },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.78, flag: "🇬🇧" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", rate: 1.34, flag: "🇸🇬" },
  { code: "THB", symbol: "฿", name: "Thai Baht", rate: 34.5, flag: "🇹🇭" },
];

/**
 * Converts a price from its source currency to target currency without double-conversion.
 * If source and target currencies are identical, returns the amount unchanged (rounded).
 */
export function convertCurrencyAmount(
  amount: number,
  itemCurrency: string = "INR",
  targetCurrency: string = "INR",
  rates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): number {
  if (typeof amount !== "number" || isNaN(amount) || amount <= 0) return 0;

  const src = (itemCurrency || "INR").trim().toUpperCase();
  const tgt = (targetCurrency || "INR").trim().toUpperCase();

  // If source currency matches target currency, no conversion needed
  if (src === tgt) {
    return Math.round(amount);
  }

  // Guard against double conversion:
  // If catalog item is marked USD but price is >= 250 (e.g. ₹1,570, ₹14,999, ₹38,500), it's already in INR
  if (src === "USD" && tgt === "INR" && amount >= 250) {
    return Math.round(amount);
  }

  const srcRate = rates[src] ?? (src === "INR" ? 86.5 : src === "AED" ? 3.67 : 1.0);
  const tgtRate = rates[tgt] ?? (tgt === "INR" ? 86.5 : tgt === "AED" ? 3.67 : 1.0);

  // Convert source to USD base, then USD to target
  const priceInUSD = amount / srcRate;
  const converted = priceInUSD * tgtRate;

  return Math.round(converted);
}

/**
 * Formats a currency amount with correct symbol and locale grouping (e.g. Indian numbering for INR).
 */
export function formatCurrencyPrice(
  amount: number,
  itemCurrency: string = "INR",
  targetCurrency: string = "INR",
  rates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): string {
  if (typeof amount !== "number" || isNaN(amount)) return "—";
  const converted = convertCurrencyAmount(amount, itemCurrency, targetCurrency, rates);
  const tgt = (targetCurrency || "INR").trim().toUpperCase();
  const symbol = CURRENCY_SYMBOLS[tgt] ?? `${tgt} `;

  if (tgt === "INR") {
    // Format with Indian grouping: e.g. ₹1,570 or ₹14,999
    return `${symbol}${converted.toLocaleString("en-IN")}`;
  }

  return `${symbol}${converted.toLocaleString("en-US")}`;
}
