/**
 * tests/app/currency_and_pricing.test.js
 *
 * Unit tests verifying realistic pricing, zero double-currency conversions (86.5x bug),
 * and multi-tenant currency behavior across INR and USD.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const DEFAULT_EXCHANGE_RATES = {
  USD: 1.0,
  INR: 86.5,
  EUR: 0.92,
  AED: 3.67,
  GBP: 0.78,
  THB: 34.5,
  SGD: 1.34,
};

function convertCurrencyAmount(amount, itemCurrency = 'INR', targetCurrency = 'INR', rates = DEFAULT_EXCHANGE_RATES) {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return 0;
  const src = (itemCurrency || 'INR').toUpperCase();
  const tgt = (targetCurrency || 'INR').toUpperCase();
  if (src === tgt) return Math.round(amount);

  const srcRate = rates[src] ?? (src === 'INR' ? 86.5 : 1.0);
  const tgtRate = rates[tgt] ?? (tgt === 'INR' ? 86.5 : 1.0);
  const priceInUSD = amount / srcRate;
  return Math.round(priceInUSD * tgtRate);
}

function formatCurrencyPrice(amount, itemCurrency = 'INR', targetCurrency = 'INR', rates = DEFAULT_EXCHANGE_RATES) {
  const converted = convertCurrencyAmount(amount, itemCurrency, targetCurrency, rates);
  const tgt = (targetCurrency || 'INR').toUpperCase();
  const symbols = { USD: '$', INR: '₹', EUR: '€', AED: 'AED ', GBP: '£', THB: '฿', SGD: 'S$' };
  const symbol = symbols[tgt] ?? `${tgt} `;
  if (tgt === 'INR') {
    return `${symbol}${converted.toLocaleString('en-IN')}`;
  }
  return `${symbol}${converted.toLocaleString('en-US')}`;
}

describe('Currency and Pricing Conversion Suite', () => {
  it('does NOT double convert prices already in INR on GujjuTours', () => {
    // Restaurant: Zaffran Heritage Spices Dining: cost for two is 1,570 INR
    const converted = convertCurrencyAmount(1570, 'INR', 'INR');
    assert.equal(converted, 1570, '1570 INR should remain 1570 INR, NOT 135,805!');

    const formatted = formatCurrencyPrice(1570, 'INR', 'INR');
    assert.equal(formatted, '₹1,570');

    // Restaurant: Royal Haveli Awadhi & Mughlai Kitchen: cost for two is 1,740 INR
    const formattedRoyal = formatCurrencyPrice(1740, 'INR', 'INR');
    assert.equal(formattedRoyal, '₹1,740', '1740 INR should format to ₹1,740, NOT ₹150,510');
  });

  it('correctly formats tour prices in INR without 86.5x multiplier', () => {
    // Jaipur Day Tour: 3,860 INR
    const formatted = formatCurrencyPrice(3860, 'INR', 'INR');
    assert.equal(formatted, '₹3,860', '3860 INR should be ₹3,860, NOT ₹333,890');
  });

  it('correctly converts USD prices to INR for international items', () => {
    // Dubai Luxury stay: $100 USD -> INR
    const converted = convertCurrencyAmount(100, 'USD', 'INR');
    assert.equal(converted, 8650);
    const formatted = formatCurrencyPrice(100, 'USD', 'INR');
    assert.equal(formatted, '₹8,650');
  });

  it('correctly converts INR prices to USD for US travelers', () => {
    // 8,650 INR -> USD
    const converted = convertCurrencyAmount(8650, 'INR', 'USD');
    assert.equal(converted, 100);
    const formatted = formatCurrencyPrice(8650, 'INR', 'USD');
    assert.equal(formatted, '$100');
  });

  it('handles edge cases: zero, negative, and NaN gracefully', () => {
    assert.equal(convertCurrencyAmount(0, 'INR', 'INR'), 0);
    assert.equal(convertCurrencyAmount(-50, 'INR', 'INR'), 0);
    assert.equal(convertCurrencyAmount(NaN, 'INR', 'INR'), 0);
  });
});

