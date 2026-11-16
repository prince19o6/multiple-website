const { describe, it } = require('node:test');
const assert = require('node:assert');

// 1. DeepMerge implementation under test (from web/lib/mergeWebsiteConfig.ts)
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge(target, source) {
  if (!isPlainObject(target) || !isPlainObject(source)) {
    return source !== undefined ? source : target;
  }
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    result[key] = isPlainObject(sv) && isPlainObject(tv) ? deepMerge(tv, sv) : sv;
  }
  return result;
}

// 2. Contrast & Accessible Text calculation (from web/lib/contrast.ts)
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r, g, b };
}

function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// 3. Module services mapper (from web/lib/websiteModules.ts)
function mapEnabledServices(modules) {
  const services = {
    hotels: false,
    tours: false,
    transfers: false,
    flights: false,
    visas: false,
    holidays: false
  };

  if (!Array.isArray(modules)) return services;

  modules.forEach((mod) => {
    const name = String(mod.moduleName || mod.name || mod.id || '').toLowerCase();
    const isEnabled = mod.isEnable ?? mod.enabled ?? true;
    if (name.includes('hotel')) services.hotels = isEnabled;
    if (name.includes('tour') || name.includes('activity')) services.tours = isEnabled;
    if (name.includes('transfer')) services.transfers = isEnabled;
    if (name.includes('flight')) services.flights = isEnabled;
    if (name.includes('visa')) services.visas = isEnabled;
    if (name.includes('holiday') || name.includes('package')) services.holidays = isEnabled;
  });

  return services;
}

describe('Web Configuration & Helper Logic Suite', () => {
  it('deepMerges local fallback config with remote API overrides without losing nested defaults', () => {
    const localDefaults = {
      theme: {
        primary: '#2882c5',
        secondary: '#1e40af',
        surface: '#ffffff'
      },
      typography: {
        heading: 'Poppins',
        body: 'Inter'
      },
      features: {
        liveChat: true,
        instantBooking: false
      }
    };

    const remoteOverrides = {
      theme: {
        primary: '#FF932C' // Override only primary
      },
      features: {
        instantBooking: true // Enable instant booking
      }
    };

    const merged = deepMerge(localDefaults, remoteOverrides);

    // Assert overrides are applied
    assert.strictEqual(merged.theme.primary, '#FF932C');
    assert.strictEqual(merged.features.instantBooking, true);

    // Assert defaults are preserved
    assert.strictEqual(merged.theme.secondary, '#1e40af');
    assert.strictEqual(merged.theme.surface, '#ffffff');
    assert.strictEqual(merged.typography.heading, 'Poppins');
    assert.strictEqual(merged.features.liveChat, true);
  });

  it('calculates WCAG compliant contrast ratios for brand buttons', () => {
    // Gujju Tours primary vs white text
    const gujjuRatio = getContrastRatio('#2882c5', '#ffffff');
    assert.ok(gujjuRatio >= 3.0, 'Large buttons must exceed 3:1 contrast');

    // Black text on white background must be 21:1
    const bwRatio = getContrastRatio('#000000', '#ffffff');
    assert.ok(bwRatio >= 20.0);
  });

  it('maps module lists to service flags accurately', () => {
    const modules = [
      { id: 'hotels_mod', moduleName: 'Hotels', isEnable: true },
      { id: 'tours_mod', moduleName: 'Tours & Activities', isEnable: true },
      { id: 'flights_mod', moduleName: 'Flights', isEnable: false }
    ];

    const services = mapEnabledServices(modules);
    assert.strictEqual(services.hotels, true);
    assert.strictEqual(services.tours, true);
    assert.strictEqual(services.flights, false);
    assert.strictEqual(services.visas, false);
  });
});

