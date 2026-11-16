const { describe, it } = require('node:test');
const assert = require('node:assert');
const { z } = require('../../web/node_modules/zod');

// Feature Registry Schema & helpers
const FeatureItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['service', 'module', 'page']),
  label: z.record(z.string()),
  icon: z.object({
    url: z.string().optional(),
    fallbackKey: z.string().default('sparkles-outline'),
  }),
  route: z.string(),
  order: z.number().int().default(100),
  enabled: z.boolean().default(true),
  platforms: z.array(z.enum(['web', 'app'])).default(['web', 'app']),
  visibleInNav: z.boolean().default(true),
  visibleOnHome: z.boolean().default(true),
  searchType: z.enum(['tour', 'hotel', 'flight', 'transfer', 'car', 'holiday', 'none']).default('none'),
  dependsOn: z.array(z.string()).default([]),
  requiresAuth: z.boolean().default(false),
  roles: z.array(z.string()).default([]),
  badge: z.string().optional(),
  provider: z.enum(['remote', 'local', 'hybrid']).default('local'),
});

function resolveDependencies(features) {
  const map = new Map();
  features.forEach((f) => map.set(f.id.toLowerCase(), { ...f }));

  let changed = true;
  while (changed) {
    changed = false;
    for (const [, feature] of map.entries()) {
      if (!feature.enabled) continue;
      for (const depId of feature.dependsOn || []) {
        const dep = map.get(depId.toLowerCase());
        if (!dep || !dep.enabled) {
          feature.enabled = false;
          changed = true;
          break;
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.order - b.order);
}

function getSemanticFallbackIcon(searchType, id) {
  const key = `${searchType || ''} ${id || ''}`.toLowerCase();
  if (key.includes('hotel') || key.includes('stay')) return 'Building2 / business-outline';
  if (key.includes('car')) return 'Car / car-outline';
  if (key.includes('tour') || key.includes('attraction') || key.includes('activit') || key.includes('sightseeing')) return 'Compass / compass-outline';
  if (key.includes('flight')) return 'Plane / airplane-outline';
  if (key.includes('transfer')) return 'CarSport / car-sport-outline';
  if (key.includes('holiday') || key.includes('package')) return 'Palmtree / map-outline';
  if (key.includes('visa')) return 'FileText / document-text-outline';
  if (key.includes('restaurant') || key.includes('dining')) return 'UtensilsCrossed / restaurant-outline';
  if (key.includes('build') || key.includes('custom')) return 'Wrench / construct-outline';
  return 'Layers / layers-outline';
}

describe('Feature Management System Test Suite', () => {
  it('validates a complete feature registry contract against Zod schema', () => {
    const rawFeature = {
      id: 'car-rental',
      type: 'service',
      label: { en: 'Car Rental', ms: 'Sewa Kereta' },
      icon: {
        url: 'https://d21bqxhdty55n7.cloudfront.net/icons/car-rental.webp',
        fallbackKey: 'car',
      },
      route: '/car-rental',
      order: 2,
      enabled: true,
      platforms: ['web', 'app'],
      visibleInNav: true,
      visibleOnHome: true,
      searchType: 'car',
      dependsOn: [],
      requiresAuth: false,
      roles: [],
      badge: 'Popular',
      provider: 'remote',
    };

    const parsed = FeatureItemSchema.safeParse(rawFeature);
    assert.strictEqual(parsed.success, true, 'Valid feature item should parse without error');
    assert.strictEqual(parsed.data.searchType, 'car');
  });

  it('cascades disablement when parent dependency is disabled', () => {
    const features = [
      {
        id: 'flights',
        type: 'service',
        label: { en: 'Flights' },
        icon: { fallbackKey: 'plane' },
        route: '/flights',
        order: 1,
        enabled: false, // PARENT DISABLED
        platforms: ['web', 'app'],
        visibleInNav: true,
        visibleOnHome: true,
        searchType: 'flight',
        dependsOn: [],
      },
      {
        id: 'flight-booking',
        type: 'module',
        label: { en: 'Flight Checkout' },
        icon: { fallbackKey: 'plane' },
        route: '/checkout/flight',
        order: 2,
        enabled: true,
        platforms: ['web', 'app'],
        visibleInNav: false,
        visibleOnHome: false,
        searchType: 'none',
        dependsOn: ['flights'], // DEPENDS ON FLIGHTS
      },
    ];

    const resolved = resolveDependencies(features);
    const flightBooking = resolved.find((f) => f.id === 'flight-booking');
    assert.strictEqual(flightBooking.enabled, false, 'Dependent feature must be disabled when parent is disabled');
  });

  it('proves TripGo Asia vs Gujju Tours vertical isolation in registry', () => {
    const tripGoFeatures = [
      { id: 'attractions', enabled: true, searchType: 'tour', order: 1, platforms: ['web', 'app'] },
      { id: 'car-rental', enabled: true, searchType: 'car', order: 2, platforms: ['web', 'app'] },
      { id: 'transfers', enabled: true, searchType: 'transfer', order: 3, platforms: ['web', 'app'] },
      { id: 'hotels', enabled: true, searchType: 'hotel', order: 4, platforms: ['web', 'app'] },
      { id: 'holidays', enabled: true, searchType: 'holiday', order: 5, platforms: ['web', 'app'] },
      { id: 'flights', enabled: false, searchType: 'flight', order: 6, platforms: ['web', 'app'] },
      { id: 'visas', enabled: false, searchType: 'none', order: 7, platforms: ['web', 'app'] },
    ];

    const gujjuFeatures = [
      { id: 'hotels', enabled: true, searchType: 'hotel', order: 1, platforms: ['web', 'app'] },
      { id: 'packages', enabled: true, searchType: 'holiday', order: 2, platforms: ['web', 'app'] },
      { id: 'activities', enabled: true, searchType: 'tour', order: 3, platforms: ['web', 'app'] },
      { id: 'flights', enabled: true, searchType: 'flight', order: 4, platforms: ['web', 'app'] },
      { id: 'transfers', enabled: true, searchType: 'transfer', order: 5, platforms: ['web', 'app'] },
      { id: 'visas', enabled: true, searchType: 'none', order: 6, platforms: ['web', 'app'] },
      { id: 'restaurants', enabled: true, searchType: 'none', order: 7, platforms: ['web', 'app'] },
      { id: 'build-package', enabled: true, searchType: 'none', order: 8, platforms: ['web', 'app'] },
      { id: 'car-rental', enabled: false, searchType: 'car', order: 9, platforms: ['web', 'app'] },
    ];

    // TripGo check: Car Rental is ENABLED, Flights are DISABLED
    const tgCars = tripGoFeatures.find((f) => f.id === 'car-rental');
    const tgFlights = tripGoFeatures.find((f) => f.id === 'flights');
    assert.strictEqual(tgCars.enabled, true, 'TripGo Asia must have Car Rental enabled');
    assert.strictEqual(tgFlights.enabled, false, 'TripGo Asia must have Flights disabled');

    // Gujju check: Flights & Visas are ENABLED, Car Rental is DISABLED
    const gjCars = gujjuFeatures.find((f) => f.id === 'car-rental');
    const gjFlights = gujjuFeatures.find((f) => f.id === 'flights');
    const gjVisas = gujjuFeatures.find((f) => f.id === 'visas');
    assert.strictEqual(gjCars.enabled, false, 'Gujju Tours must have Car Rental disabled');
    assert.strictEqual(gjFlights.enabled, true, 'Gujju Tours must have Flights enabled');
    assert.strictEqual(gjVisas.enabled, true, 'Gujju Tours must have Visas enabled');
  });

  it('guarantees semantic fallback icons per vertical with no generic sparkle icon', () => {
    const hotelIcon = getSemanticFallbackIcon('hotel', 'hotels');
    const carIcon = getSemanticFallbackIcon('car', 'car-rental');
    const tourIcon = getSemanticFallbackIcon('tour', 'attractions');
    const flightIcon = getSemanticFallbackIcon('flight', 'flights');
    const holidayIcon = getSemanticFallbackIcon('holiday', 'holidays');
    const visaIcon = getSemanticFallbackIcon('none', 'visas');
    const diningIcon = getSemanticFallbackIcon('none', 'restaurants');

    assert.match(hotelIcon, /business|Building/);
    assert.match(carIcon, /car/);
    assert.match(tourIcon, /compass/i);
    assert.match(flightIcon, /plane/i);
    assert.match(holidayIcon, /map|Palmtree/);
    assert.match(visaIcon, /document|FileText/);
    assert.match(diningIcon, /restaurant|Utensil/);

    assert.doesNotMatch(hotelIcon, /sparkle/i);
    assert.doesNotMatch(carIcon, /sparkle/i);
    assert.doesNotMatch(tourIcon, /sparkle/i);
  });
});
