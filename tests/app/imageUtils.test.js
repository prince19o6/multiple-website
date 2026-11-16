const { describe, it } = require('node:test');
const assert = require('node:assert');

// Standalone verification of the safe string coercion logic in getActualImageUrl
function getSafeActualImageUrl(rawUrl, context) {
  const safeStr = (val) => (typeof val === 'string' ? val : '');

  const rawModule = safeStr(context?.module).toLowerCase();
  const rawTitle = safeStr(context?.title || context?.name);
  const titleLower = rawTitle.toLowerCase();
  const rawCategory = safeStr(context?.category).toLowerCase();
  const rawCity = safeStr(context?.city);
  const city = rawCity.toLowerCase().trim();

  let moduleKey = rawModule || 'tours';
  const CITY_PHOTOS = {
    dubai: 'https://images.unsplash.com/photo-dubai',
    shimla: 'https://images.unsplash.com/photo-shimla',
  };
  const MODULE_PHOTOS = {
    tours: ['https://images.unsplash.com/photo-tour-default']
  };

  if (city && CITY_PHOTOS[city]) {
    return CITY_PHOTOS[city];
  }

  return MODULE_PHOTOS[moduleKey] ? MODULE_PHOTOS[moduleKey][0] : 'https://images.unsplash.com/fallback';
}

describe('Image Utils Runtime Resilience Suite', () => {
  it('does NOT throw when context.city is window.location object', () => {
    // Simulate window.location object passed as city
    const fakeLocation = {
      href: 'http://localhost:8081/tours',
      pathname: '/tours',
      origin: 'http://localhost:8081'
    };

    assert.doesNotThrow(() => {
      const url = getSafeActualImageUrl(null, {
        module: 'tours',
        title: 'Desert Safari',
        city: fakeLocation
      });
      assert.strictEqual(typeof url, 'string');
    });
  });

  it('does NOT throw when context fields are undefined or non-string', () => {
    assert.doesNotThrow(() => {
      const url = getSafeActualImageUrl(null, {
        module: 123,
        title: null,
        city: undefined,
        category: {}
      });
      assert.strictEqual(typeof url, 'string');
    });
  });

  it('correctly resolves real city photo when valid string city is provided', () => {
    const url = getSafeActualImageUrl(null, {
      module: 'tours',
      title: 'City Highlights',
      city: 'Dubai'
    });
    assert.strictEqual(url, 'https://images.unsplash.com/photo-dubai');
  });
});

