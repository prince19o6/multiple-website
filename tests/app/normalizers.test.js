const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');

// Logic extracted from my-app/lib/normalize.ts
function parseNumericPrice(value, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'number') return isNaN(value) ? fallback : Math.round(value * 100) / 100;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? fallback : Math.round(num * 100) / 100;
  }
  return fallback;
}

function normalizeTour(raw) {
  if (!raw || typeof raw !== 'object') {
    return { id: 0, name: 'Curated Expedition', price: 0, rating: 4.8, reviews: 0 };
  }

  let resolvedId = 0;
  if (raw.id !== undefined && !isNaN(Number(raw.id))) {
    resolvedId = Number(raw.id);
  } else if (raw.tourNumericId !== undefined && !isNaN(Number(raw.tourNumericId))) {
    resolvedId = Number(raw.tourNumericId);
  } else if (raw._id !== undefined) {
    resolvedId = String(raw._id);
  } else {
    resolvedId = 1;
  }

  const name = String(raw.name ?? raw.Name ?? raw.title ?? raw.Title ?? 'Curated Expedition').trim();
  const price = parseNumericPrice(raw.price ?? raw.Price ?? 0);
  const rating = Number(raw.rating ?? raw.Rating ?? 4.8);
  const reviews = Number(raw.reviews ?? raw.Reviews ?? 0);

  return { id: resolvedId, name, price, rating, reviews };
}

describe('App Normalizers Suite', () => {
  it('normalizes PascalCase tour from backend correctly', () => {
    const raw = {
      _id: '6710ef0001',
      tourNumericId: 101,
      Title: 'Desert Safari Dubai',
      Price: '$149.50',
      Rating: 4.9,
      Reviews: 320
    };

    const tour = normalizeTour(raw);
    assert.strictEqual(tour.id, 101);
    assert.strictEqual(tour.name, 'Desert Safari Dubai');
    assert.strictEqual(tour.price, 149.50);
    assert.strictEqual(tour.rating, 4.9);
    assert.strictEqual(tour.reviews, 320);
  });

  it('normalizes camelCase tour from staging API correctly', () => {
    const raw = {
      id: 202,
      name: 'Bangkok River Cruise',
      price: 89.0,
      rating: 4.7,
      reviews: 95
    };

    const tour = normalizeTour(raw);
    assert.strictEqual(tour.id, 202);
    assert.strictEqual(tour.name, 'Bangkok River Cruise');
    assert.strictEqual(tour.price, 89.0);
    assert.strictEqual(tour.rating, 4.7);
    assert.strictEqual(tour.reviews, 95);
  });

  it('falls back to MongoDB _id when numeric id is absent', () => {
    const raw = {
      _id: 'mongo-custom-999',
      title: 'Custom Trek'
    };

    const tour = normalizeTour(raw);
    assert.strictEqual(tour.id, 'mongo-custom-999');
    assert.strictEqual(tour.name, 'Custom Trek');
  });

  it('parses currency strings with symbols cleanly into floats', () => {
    assert.strictEqual(parseNumericPrice('$1,250.00'), 1250.0);
    assert.strictEqual(parseNumericPrice('₹ 8,999'), 8999.0);
    assert.strictEqual(parseNumericPrice('AED 450.75'), 450.75);
    assert.strictEqual(parseNumericPrice(null, 100), 100);
    assert.strictEqual(parseNumericPrice('invalid', 50), 50);
  });
});

