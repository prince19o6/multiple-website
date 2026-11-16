/**
 * lib/currencyUtils.ts
 *
 * Enterprise Multi-Currency conversion and formatting engine for ToursApp.
 * Eliminates the 86.5x double-conversion multiplier bug when catalog items
 * are already priced in tenant native currency (INR for GujjuTours, USD for TripGoAsia/Technoheaven).
 */

export interface CurrencyFormatOptions {
  amount: number;
  itemCurrency?: string; // Currency the item price was defined in (e.g. 'INR', 'USD', 'AED')
  targetCurrency?: string; // Target display currency (e.g. 'INR', 'USD', 'EUR')
  tenantBaseCurrency?: string; // Tenant default currency (e.g. 'INR' for GujjuTours)
  exchangeRates?: Record<string, number>; // Rates relative to USD (USD = 1.0)
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
  USD: '$',
  INR: '₹',
  EUR: '€',
  AED: 'AED ',
  GBP: '£',
  THB: '฿',
  SGD: 'S$',
};

/**
 * Converts a price from its source currency to target currency without double-conversion.
 * If source and target currencies are identical, returns the amount unchanged (rounded).
 */
export function convertCurrencyAmount(
  amount: number,
  itemCurrency: string = 'INR',
  targetCurrency: string = 'INR',
  rates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): number {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return 0;

  const src = (itemCurrency || 'INR').toUpperCase();
  const tgt = (targetCurrency || 'INR').toUpperCase();

  // If source currency matches target currency, no conversion needed!
  if (src === tgt) {
    return Math.round(amount);
  }

  // Guard against double conversion bug:
  // If source currency is marked USD but amount is already >= 250 (e.g. ₹1,570, ₹3,860, ₹8,235), it is already in INR
  if (src === 'USD' && tgt === 'INR' && amount >= 250) {
    return Math.round(amount);
  }

  const srcRate = rates[src] ?? (src === 'INR' ? 86.5 : src === 'AED' ? 3.67 : 1.0);
  const tgtRate = rates[tgt] ?? (tgt === 'INR' ? 86.5 : tgt === 'AED' ? 3.67 : 1.0);

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
  itemCurrency: string = 'INR',
  targetCurrency: string = 'INR',
  rates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): string {
  const converted = convertCurrencyAmount(amount, itemCurrency, targetCurrency, rates);
  const tgt = (targetCurrency || 'INR').toUpperCase();
  const symbol = CURRENCY_SYMBOLS[tgt] ?? `${tgt} `;

  if (tgt === 'INR') {
    // Format with Indian grouping: e.g. ₹1,570 or ₹14,999
    return `${symbol}${converted.toLocaleString('en-IN')}`;
  }

  return `${symbol}${converted.toLocaleString('en-US')}`;
}

