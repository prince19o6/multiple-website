/**
 * backend/seed/generate.js
 *
 * Deterministic multi-tenant seed generator for the Travel Platform.
 * Generates realistic dummy data with at least 10 items in EVERY category and collection
 * across GujjuTours, TripGoAsia, and Technoheaven.
 *
 * Covers:
 *   - Hotels & Categories (`hotels.json`, `categories.json`)
 *   - Activities / Tours (`activities.json`)
 *
 * Usage:
 *   node backend/seed/generate.js
 */

const fs = require('fs');
const path = require('path');

// Deterministic PRNG (Linear Congruential Generator)
function makePrng(seed = 123456789) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HOTEL TAXONOMIES & CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  'Hotel',
  'Aparthotel',
  'Apartment',
  'Hostel',
  'Villa',
  'Resort',
  'Boutique',
];

const HOTEL_COLLECTIONS = [
  'hill-stations',
  'beach-stays',
  'pilgrimage',
  'luxury-stays',
  'budget-stays',
  'family-stays',
  'iconic-stays',
];

const GUJJU_CITIES = [
  { name: 'Goa', country: 'India', primaryCollection: 'beach-stays' },
  { name: 'Jaipur', country: 'India', primaryCollection: 'iconic-stays' },
  { name: 'Udaipur', country: 'India', primaryCollection: 'luxury-stays' },
  { name: 'Shimla', country: 'India', primaryCollection: 'hill-stations' },
  { name: 'Manali', country: 'India', primaryCollection: 'hill-stations' },
  { name: 'Ooty', country: 'India', primaryCollection: 'hill-stations' },
  { name: 'Dwarka', country: 'India', primaryCollection: 'pilgrimage' },
  { name: 'Somnath', country: 'India', primaryCollection: 'pilgrimage' },
  { name: 'Tirupati', country: 'India', primaryCollection: 'pilgrimage' },
  { name: 'Mumbai', country: 'India', primaryCollection: 'family-stays' },
  { name: 'Dubai', country: 'United Arab Emirates', primaryCollection: 'luxury-stays' },
];

const TRIPGO_CITIES = [
  { name: 'Bali', country: 'Indonesia', primaryCollection: 'beach-stays' },
  { name: 'Phuket', country: 'Thailand', primaryCollection: 'beach-stays' },
  { name: 'Bangkok', country: 'Thailand', primaryCollection: 'iconic-stays' },
  { name: 'Singapore', country: 'Singapore', primaryCollection: 'luxury-stays' },
  { name: 'Kuala Lumpur', country: 'Malaysia', primaryCollection: 'family-stays' },
  { name: 'Langkawi', country: 'Malaysia', primaryCollection: 'beach-stays' },
  { name: 'Krabi', country: 'Thailand', primaryCollection: 'beach-stays' },
  { name: 'Cameron Highlands', country: 'Malaysia', primaryCollection: 'hill-stations' },
  { name: 'Sydney', country: 'Australia', primaryCollection: 'iconic-stays' },
  { name: 'Dubai', country: 'United Arab Emirates', primaryCollection: 'luxury-stays' },
];

const TECHNO_CITIES = [
  { name: 'Dubai', country: 'United Arab Emirates', primaryCollection: 'luxury-stays' },
  { name: 'Abu Dhabi', country: 'United Arab Emirates', primaryCollection: 'iconic-stays' },
  { name: 'Singapore', country: 'Singapore', primaryCollection: 'luxury-stays' },
  { name: 'Bangkok', country: 'Thailand', primaryCollection: 'family-stays' },
  { name: 'Doha', country: 'Qatar', primaryCollection: 'luxury-stays' },
  { name: 'London', country: 'United Kingdom', primaryCollection: 'iconic-stays' },
];

const HOTEL_NAME_PREFIXES = [
  'Sapphire', 'Golden Horizon', 'Emerald Bay', 'Grand Heritage', 'Royal Palm',
  'Whispering Pines', 'Misty Mountain', 'Serene Oasis', 'Coastal Breeze',
  'Tranquil Haven', 'Lotus Valley', 'Celestial Palms', 'Silver Cascades',
  'Amber Crest', 'Marigold Sanctuary', 'Azure Lagoon', 'Imperial Vista',
  'Shivalik Crest', 'Sundowner Bay', 'Velvet Sands', 'Crystal Springs',
  'Orchid Grove', 'Harbour View', 'Monarch Crest', 'Paradise Cove'
];

const HOTEL_AMENITY_POOL = [
  'Free High-Speed WiFi', 'Swimming Pool', 'Airport Shuttle', 'Pure Veg / Jain Available',
  'Fitness Center', 'Spa & Wellness', '24/7 Front Desk', 'Kids Play Zone',
  'In-house Dining', 'Free Valet Parking', 'Balcony with Scenic View', 'Air Conditioning'
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. PACKAGES & HOLIDAYS TAXONOMIES & CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PACKAGE_CATEGORIES = [
  { slug: 'scenic-escapes', label: 'Scenic Escapes Across India & Beyond', icon: 'trail-sign-outline', svg: '/seed-images/packages/package-scenic.svg' },
  { slug: 'spiritual-escapes', label: 'Spiritual Escapes at Best Prices', icon: 'flame-outline', svg: '/seed-images/packages/package-spiritual.svg' },
  { slug: 'visa-free-escapes', label: 'Discover Visa-Free Escapes', icon: 'airplane-outline', svg: '/seed-images/packages/package-international.svg' },
  { slug: 'honeymoon-getaways', label: 'Dream Honeymoon Getaways', icon: 'heart-outline', svg: '/seed-images/packages/package-honeymoon.svg' },
  { slug: 'dubai-packages', label: 'Dubai Holiday Packages', icon: 'business-outline', svg: '/seed-images/packages/package-dubai.svg' },
  { slug: 'jain-packages', label: 'Jain Friendly Tour Packages', icon: 'restaurant-outline', svg: '/seed-images/packages/package-jain.svg' },
  { slug: 'international-packages', label: 'International Escapes', icon: 'globe-outline', svg: '/seed-images/packages/package-international.svg' },
  { slug: 'domestic-holidays', label: 'Incredible India Domestic', icon: 'map-outline', svg: '/seed-images/packages/package-domestic.svg' },
];

const PACKAGE_TITLES = {
  'scenic-escapes': [
    'Kashmir Valley Paradise: Srinagar, Gulmarg & Pahalgam with Shikara Ride',
    'Himachal Serenity Circuit: Shimla, Manali & Solang Valley Snow Peaks',
    'Kerala Backwaters & Tea Plantations: Munnar, Thekkady & Alleppey Houseboat',
    'North East Splendor: Gangtok, Darjeeling & Tsomgo Lake Heritage Tour',
    'Ooty & Kodaikanal Queen of Hills Scenic Highland Escape',
    'Uttarakhand Lake District: Nainital, Ranikhet & Jim Corbett Wilderness',
    'Meghalaya Living Root Bridges & Dawki Crystal River Adventure',
  ],
  'spiritual-escapes': [
    'Gujarat Holy Pilgrimage: Dwarka, Somnath, Nageshwar & Girnar Temple Yatra',
    'Char Dham Himalayan Sacred Yatra: Badrinath, Kedarnath, Gangotri & Yamunotri',
    'South India Temple Circuit: Tirupati Balaji, Madurai Meenakshi & Rameswaram',
    'Kashi Vishwanath & Sacred Ganges River Aarti Pilgrimage with Ayodhya Darshan',
    'Shirdi Sai Baba & Shani Shingnapur Divine Blessings Weekend Yatra',
    'Palitana & Shatrunjaya Hill Sacred Jain Tirth Yatra with Guided Darshan',
    'Vaishno Devi Katra Holy Shrine Darshan with Helicopter Upgrade Pass',
  ],
  'visa-free-escapes': [
    'Thailand Tropical Island Hopping: Bangkok, Pattaya Coral Island & Safari World',
    'Malaysia City & Rainforest Explorer: Kuala Lumpur, Genting & Langkawi Beach',
    'Maldives Overwater Luxury Villa Retreat with All-Inclusive Sunset Cruise',
    'Bali Tropical Bliss & Nusa Penida Island Snorkeling Adventure',
    'Sri Lanka Cultural Triangle: Colombo, Kandy, Nuwara Eliya & Bentota Beach',
    'Vietnam Golden Bridge & Halong Bay Overnight Luxury Cruise',
    'Mauritius Tropical Paradise: North & South Island Private Scenic Tour',
  ],
  'honeymoon-getaways': [
    'Bali Romantic Luxury Pool Villa Retreat with Candlelight Beach Dinner',
    'Swiss Alpine Dream & Paris Romance: Lucerne, Interlaken & Eiffel Tower',
    'Maldives Private Island Water Villa Escape with Floating Breakfast',
    'Kashmir Romantic Snow Wonderland: Private Houseboat & Gulmarg Gondola',
    'Goa Beachside Luxury Resort & Sunset Yacht Cruise for Couples',
    'Udaipur Royal Palace Retreat with Lake Pichola Candlelight Dining',
    'Phuket & Krabi Private Island Catamaran Honeymoon Escape',
  ],
  'dubai-packages': [
    'Dubai Extravaganza 5 Nights: Burj Khalifa 124th Floor, Desert Safari & Marina Cruise',
    'Dubai & Abu Dhabi Grand Tour: Ferrari World, Sheikh Zayed Grand Mosque & Museum of Future',
    'Dubai Luxury Shopping & Theme Park Fiesta with Atlantis Aquaventure Access',
    'Dubai Budget Family Explorer 4 Nights with City Highlights & Miracle Garden',
    'Dubai Desert Dunes & Dhow Cruise Spectacular with Miracle Garden & Global Village',
    'Dubai Ultra-Luxury Royal Stay: Burj Al Arab Tour, Yacht Charter & Desert Glamping',
    'Dubai Stopover Special 3 Nights with Airport Return Transfers & Dubai Mall',
  ],
  'jain-packages': [
    'Pure Jain Friendly Dubai Tour: 100% Pure Jain Gourmet Meals & Maharaj Kitchen',
    'Jain Pilgrimage Special: Palitana, Shankheshwar & Girnar Mahatirth Circuit',
    'Himachal Jain Special: Manali & Shimla with Dedicated Gujarati Jain Maharaj Catering',
    'Kashmir Jain Family Tour: Srinagar, Gulmarg & Pahalgam with Guaranteed Jain Food',
    'South East Asia Jain Friendly Escapade: Singapore, Malaysia & Genting with Pure Jain Food',
    'Europe Highlights with Jain Kitchen: Switzerland, Paris, Italy with Pure Jain Catering',
    'Rajasthan Royal Jain Heritage: Mount Abu, Dilwara Temples, Ranakpur & Udaipur',
  ],
  'international-packages': [
    'Singapore & Sentosa Mega Explorer with Universal Studios & Gardens by the Bay',
    'Best of Europe 7 Nights: Swiss Alpine Wonders, Paris City & Rhine River Cruise',
    'Australia Highlights: Sydney Opera House, Blue Mountains & Gold Coast',
    'Japan Golden Route: Tokyo Skyline, Mount Fuji, Kyoto Temples & Bullet Train',
    'London & Scotland Royal Discovery: Big Ben, Edinburgh Castle & Loch Ness',
    'South Africa Wildlife & Coastal Vista: Cape Town, Table Mountain & Kruger Safari',
    'Turkey Jewels: Istanbul Historic Bazaars, Cappadocia Hot Air Balloon & Pamukkale',
  ],
  'domestic-holidays': [
    'Golden Triangle Classic: Delhi Red Fort, Agra Taj Mahal & Jaipur Amer Fort',
    'Goa Coastal Odyssey: North Goa Beaches, Dudhsagar Waterfalls & South Goa Heritage',
    'Kashmir Valley Paradise: Srinagar Shikara, Pahalgam Valley & Gulmarg Snow Meadows',
    'Royal Rajasthan Heritage: Jaipur, Jodhpur Blue City & Jaisalmer Thar Desert Camp',
    'Gods Own Country Kerala: Munnar Tea Hills, Alleppey Houseboat & Kovalam Beach',
    'Kutch Rann Utsav Full Moon Experience: Dhordo Tent City & White Salt Desert',
    'Andaman Tropical Islands: Port Blair Cellular Jail, Havelock Radhanagar & Scuba',
  ],
};

const ACTIVITY_CATEGORIES = [
  { slug: 'desert-safari', label: 'Desert Safaris & Dune Bashing', icon: 'flame-outline', svg: '/seed-images/activities/desert-safari.svg' },
  { slug: 'water-sports', label: 'Water Sports & Scuba Diving', icon: 'water-outline', svg: '/seed-images/activities/water-sports.svg' },
  { slug: 'city-tours', label: 'City Tours & Sightseeing', icon: 'bus-outline', svg: '/seed-images/activities/city-tour.svg' },
  { slug: 'theme-parks', label: 'Theme Parks & Attractions', icon: 'ticket-outline', svg: '/seed-images/activities/theme-park.svg' },
  { slug: 'boat-tours', label: 'Boat & Yacht Tours', icon: 'boat-outline', svg: '/seed-images/activities/boat-tour.svg' },
  { slug: 'walking-tours', label: 'Walking & Heritage Trails', icon: 'footsteps-outline', svg: '/seed-images/activities/walking-tour.svg' },
  { slug: 'wildlife-safari', label: 'Wildlife & Nature Safaris', icon: 'paw-outline', svg: '/seed-images/activities/wildlife-safari.svg' },
  { slug: 'cultural-experience', label: 'Cultural Shows & Folklore', icon: 'sparkles-outline', svg: '/seed-images/activities/cultural-experience.svg' },
];

const ACTIVITY_TITLES = {
  'desert-safari': [
    'Red Dunes Evening Desert Safari with Sunset BBQ Dinner & Falconry',
    'VIP Desert Safari in 4x4 with Dune Bashing, Quad Biking & Tanoura Show',
    'Morning Desert Dune Safari with Sandboarding & Camel Ride',
    'Overnight Stargazing Desert Camp with Traditional Campfire & Breakfast',
    'Luxury Desert Conservation Reserve Safari with Private Wildlife Drive',
    'Sunset Camel Caravan Trek Across Golden Dunes with Arabic Hospitality',
    'High-Power Desert Buggy Adventure with Guided Dune Trail',
  ],
  'water-sports': [
    'Coral Reef Scuba Diving & Snorkeling Day Trip with Certified Guide',
    'Parasailing & Banana Boat Adventure with Full Safety Gear',
    'Jet Ski Coastal Tour Around Scenic Harbor & Marina Skyline',
    'Catamaran Sailing & Dolphin Watching Coastal Cruise',
    'Stand-Up Paddleboarding & Sea Kayaking in Calm Lagoon Waters',
    'Deep Sea Game Fishing Charter with Trolling & Bottom Fishing Equipment',
    'Underwater Helmet Walking Experience Among Tropical Fish & Coral',
  ],
  'city-tours': [
    'Hop-On Hop-Off City Sightseeing Bus Pass with Multilingual Audio',
    'Full-Day Guided City Highlights Tour with Landmark Photo Stops',
    'Evening Illuminations City Tour & Skyline Observation Deck Access',
    'Architectural Masterpieces & Historic Quarter Guided Walking Circuit',
    'Panoramic Helicopter Skyline Tour Over City Center & Waterfront',
    'Old Town Heritage Rickshaw Trail & Local Spice Bazaar Excursion',
    'Royal Palaces & Fortress Discovery Tour with Priority Entry Pass',
  ],
  'theme-parks': [
    'Mega Theme Park All-Day Unlimited Rides Entry Pass',
    'Aquatic Water Adventure Park with Wave Pools & Extreme Slides',
    'Virtual Reality Experience Zone & Interactive Arcade Pass',
    'Tropical Marine Life Aquarium & Glass Tunnel Walkthrough',
    'Snow & Winter Wonder Indoor Ice Park Admission Ticket',
    'Wildlife Conservation Safari Park with Tram Ride & Animal Shows',
    'Botanical Fantasy Gardens & Night Laser Light Spectacle',
  ],
  'boat-tours': [
    'Luxury Sunset Yacht Cruise with Gourmet Finger Food & Mocktails',
    'Traditional Dhow Harbor Cruise with International Buffet Dinner',
    'Speedboat Island Hopping Tour with Hidden Beach Exploration',
    'Mangrove Ecological Kayak Expedition with Bird Watching',
    'Private Glass-Bottom Boat Tour Over Protected Marine Sanctuaries',
    'Riverside Heritage Boat Ride at Sunset with Folk Melodies',
    'Offshore Archipelago Cruise with Snorkel Equipment & Fresh Fruit Platter',
  ],
  'walking-tours': [
    'Historic Old City Heritage Walking Trail with Local Historian',
    'Evening Street Food Tasting Trail Exploring Authentic Secret Recipes',
    'Ghost & Legends Night Lantern Walking Tour',
    'Artisans, Handloom Weavers & Craft Guilds Guided Walk',
    'Historic Fortresses & Ancient Ramparts Scenic Sunset Hike',
    'Botanical & Herbal Forest Nature Trail with Resident Naturalist',
    'Photography Walking Masterclass Through Atmospheric Historic Alleys',
  ],
  'wildlife-safari': [
    'National Park Open Jeep Safari for Big Cat & Wildlife Tracking',
    'Morning Bird Sanctuary Walk with High-Power Binoculars & Guide',
    'Elephant Care Sanctuary Experience with Ethical Bathing & Feeding',
    'Nocturnal Wildlife Forest Night Drive with Thermal Spotting Scopes',
    'Coastal Dolphin & Sea Turtle Conservation Eco-Safari',
    'Tiger Reserve Jungle Patrol Drive with Forest Naturalist',
    'Mountain Valley Leopard & Wildlife Tracking Expedition',
  ],
  'cultural-experience': [
    'Traditional Folklore Evening with Live Music, Dance & Royal Banquet',
    'Interactive Ceramic Pottery & Traditional Craft Workshop',
    'Temple Rituals & Sacred River Evening Aarti Ceremony Experience',
    'Spice Plantation Guided Tour with Traditional Banana Leaf Lunch',
    'Cooking Masterclass with Celebrated Local Chef & Market Visit',
    'Ancient Martial Arts & Folklore Theatrical Performance',
    'Village Life Cultural Immersion with Bullock Cart Ride & Chai Making',
  ],
};

function generateCategoriesForHotels() {
  const cats = [];
  let order = 1;

  PROPERTY_TYPES.forEach((pt) => {
    cats.push({
      module: 'hotels',
      slug: pt.toLowerCase().replace(/\s+/g, '-'),
      name: {
        en: pt,
        gu: pt === 'Hotel' ? 'હોટેલ' : pt === 'Resort' ? 'રિસોર્ટ' : pt,
        ms: pt === 'Hotel' ? 'Hotel' : pt === 'Resort' ? 'Tempat Peranginan' : pt,
      },
      icon: pt === 'Resort' ? 'leaf-outline' : pt === 'Villa' ? 'home-outline' : 'business-outline',
      order: order++,
      enabled: true,
      parentSlug: null,
      metadata: { type: 'propertyType', isDemo: true },
    });
  });

  HOTEL_COLLECTIONS.forEach((col) => {
    const formattedName = col
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    cats.push({
      module: 'hotels',
      slug: col,
      name: {
        en: formattedName,
        gu: formattedName,
        ms: formattedName,
      },
      icon: col.includes('beach') ? 'water-outline' : col.includes('hill') ? 'triangle-outline' : 'star-outline',
      order: order++,
      enabled: true,
      parentSlug: null,
      metadata: { type: 'collection', isDemo: true },
    });
  });

  // Activities Categories
  ACTIVITY_CATEGORIES.forEach((act) => {
    cats.push({
      module: 'activities',
      slug: act.slug,
      name: {
        en: act.label,
        gu: act.label,
        ms: act.label,
      },
      icon: act.icon,
      order: order++,
      enabled: true,
      parentSlug: null,
      metadata: { type: 'activityCategory', isDemo: true },
    });
  });

  // Package & Holiday Categories
  PACKAGE_CATEGORIES.forEach((pkg) => {
    cats.push({
      module: 'packages',
      slug: pkg.slug,
      name: {
        en: pkg.label,
        gu: pkg.label,
        ms: pkg.label,
      },
      icon: pkg.icon,
      order: order++,
      enabled: true,
      parentSlug: null,
      metadata: { type: 'packageCategory', isDemo: true },
    });
  });

  // Visa Categories
  const VISA_CATEGORIES = [
    { slug: 'tourist-visa', label: 'Tourist eVisa', icon: 'document-text-outline' },
    { slug: 'express-visa', label: 'Urgent Express (24-48h)', icon: 'flash-outline' },
    { slug: 'business-visa', label: 'Business & Commercial Visa', icon: 'briefcase-outline' },
    { slug: 'transit-visa', label: 'Transit & Stopover Visa', icon: 'airplane-outline' },
    { slug: 'multiple-entry', label: 'Multiple Entry Visa', icon: 'repeat-outline' },
  ];

  VISA_CATEGORIES.forEach((visa) => {
    cats.push({
      module: 'visas',
      slug: visa.slug,
      name: {
        en: visa.label,
        gu: visa.label,
        ms: visa.label,
      },
      icon: visa.icon,
      order: order++,
      enabled: true,
      parentSlug: null,
      metadata: { type: 'visaCategory', isDemo: true },
    });
  });

  // Restaurant Cuisines
  const RESTAURANT_CUISINES = [
    { slug: 'indian', label: 'Indian Cuisine', icon: 'restaurant-outline' },
    { slug: 'gujarati-thali', label: 'Gujarati Thali', icon: 'nutrition-outline' },
    { slug: 'jain', label: 'Jain Friendly', icon: 'leaf-outline' },
    { slug: 'vegetarian', label: '100% Pure Veg', icon: 'flower-outline' },
    { slug: 'asian', label: 'Pan-Asian & Oriental', icon: 'globe-outline' },
    { slug: 'seafood', label: 'Fresh Seafood', icon: 'water-outline' },
    { slug: 'fine-dining', label: 'Fine Dining & Bistro', icon: 'wine-outline' },
    { slug: 'cafe', label: 'Artisan Cafe & Bakery', icon: 'cafe-outline' },
    { slug: 'street-food', label: 'Street Food & Chaat', icon: 'fast-food-outline' },
  ];

  RESTAURANT_CUISINES.forEach((rc) => {
    cats.push({
      module: 'restaurants',
      slug: rc.slug,
      name: {
        en: rc.label,
        gu: rc.label,
        ms: rc.label,
      },
      icon: rc.icon,
      order: order++,
      enabled: true,
      parentSlug: null,
      metadata: { type: 'restaurantCuisine', isDemo: true },
    });
  });

  // Build Package Category
  cats.push({
    module: 'buildpackage',
    slug: 'custom-package-builder',
    name: {
      en: 'Custom Package Builder',
      gu: 'કસ્ટમ પેકેજ બિલ્ડર',
      ms: 'Pembina Pakej Tersuai',
    },
    icon: 'construct-outline',
    order: order++,
    enabled: true,
    parentSlug: null,
    metadata: { type: 'buildPackage', isDemo: true },
  });

  return cats;
}

function generateHotelsForSite(siteId, cities, currency, basePriceMultiplier, rand) {
  const hotels = [];

  for (let i = 0; i < 75; i++) {
    const propertyType = PROPERTY_TYPES[i % PROPERTY_TYPES.length];
    const primaryColl = HOTEL_COLLECTIONS[i % HOTEL_COLLECTIONS.length];
    const secondaryColl = HOTEL_COLLECTIONS[(i + 3) % HOTEL_COLLECTIONS.length];
    const collections = [primaryColl];
    if (secondaryColl !== primaryColl) collections.push(secondaryColl);

    const cityObj = cities[i % cities.length];
    const prefix = HOTEL_NAME_PREFIXES[i % HOTEL_NAME_PREFIXES.length];
    const title = `${prefix} ${cityObj.name} ${propertyType}`;
    const slug = `${prefix.toLowerCase().replace(/\s+/g, '-')}-${cityObj.name.toLowerCase().replace(/\s+/g, '-')}-${propertyType.toLowerCase()}-${100 + i}`;

    const starRating = 3 + Math.floor(rand() * 3);
    const rating = Math.round((3.9 + rand() * 1.1) * 10) / 10;
    const reviewCount = 80 + Math.floor(rand() * 950);

    const rawPrice = Math.round((45 + rand() * 180) * basePriceMultiplier);
    const pricePerNight = Math.round(rawPrice / 10) * 10;
    const compareAtPrice = rand() > 0.3 ? Math.round(pricePerNight * (1.15 + rand() * 0.25)) : null;
    const netPricePerNight = siteId === 'technoheaven' ? Math.round(pricePerNight * 0.82) : null;

    const amenities = HOTEL_AMENITY_POOL.slice(0, 4 + Math.floor(rand() * 5));
    if (primaryColl === 'beach-stays' && !amenities.includes('Balcony with Scenic View')) {
      amenities.push('Balcony with Scenic View');
    }

    const isPilgrimage = primaryColl === 'pilgrimage';
    const pureVeg = isPilgrimage || rand() > 0.45;
    const jainAvailable = isPilgrimage || pureVeg || rand() > 0.6;

    const styleImageMap = {
      Resort: '/seed-images/hotels/hotel-resort.svg',
      Villa: '/seed-images/hotels/hotel-villa.svg',
      Apartment: '/seed-images/hotels/hotel-apartment.svg',
      Aparthotel: '/seed-images/hotels/hotel-apartment.svg',
      Hostel: '/seed-images/hotels/hotel-hostel.svg',
      Boutique: '/seed-images/hotels/hotel-boutique.svg',
      Hotel: starRating === 5 ? '/seed-images/hotels/hotel-luxury.svg' : '/seed-images/hotels/hotel-resort.svg'
    };

    const mainImage = styleImageMap[propertyType] || '/seed-images/hotels/hotel-luxury.svg';

    const rooms = [
      {
        id: `room_${i}_1`,
        name: 'Deluxe King Room',
        bedConfiguration: '1 Extra-Large Double Bed',
        maxAdults: 2,
        maxChildren: 1,
        areaSqm: 32,
        pricePerNight,
        netPricePerNight,
        freeBreakfast: true,
        cancellationPolicy: 'Free cancellation up to 48 hours prior to check-in',
        features: ['City or Garden View', 'Soundproofing', 'Free WiFi', 'Ensuite Bathroom'],
        images: [mainImage],
      },
      {
        id: `room_${i}_2`,
        name: 'Executive Suite with Balcony',
        bedConfiguration: '1 King Bed + 1 Sofa Bed',
        maxAdults: 3,
        maxChildren: 1,
        areaSqm: 48,
        pricePerNight: Math.round(pricePerNight * 1.35),
        netPricePerNight: netPricePerNight ? Math.round(netPricePerNight * 1.35) : null,
        freeBreakfast: true,
        cancellationPolicy: 'Free cancellation up to 24 hours prior to check-in',
        features: ['Private Balcony', 'Executive Lounge Access', 'Nespresso Coffee Machine', 'Bathtub'],
        images: [mainImage],
      },
    ];

    hotels.push({
      id: `htl_${siteId}_${1000 + i}`,
      websiteId: siteId,
      slug,
      title,
      propertyType,
      collections,
      destination: {
        cityId: `${cityObj.name.toLowerCase()}-${1000 + i}`,
        cityName: cityObj.name,
        country: cityObj.country,
        address: `${10 + i}, Central Avenue, ${cityObj.name}`,
        latitude: 25.2048 + (rand() - 0.5) * 5,
        longitude: 55.2708 + (rand() - 0.5) * 5,
      },
      starRating,
      rating,
      reviewCount,
      pricePerNight,
      compareAtPrice,
      netPricePerNight,
      currency,
      images: [mainImage],
      amenities,
      dietaryFeatures: {
        pureVeg,
        jainAvailable,
        halalCertified: siteId !== 'gujjutours' || cityObj.name === 'Dubai',
      },
      rooms,
      policies: {
        checkInTime: '14:00',
        checkOutTime: '11:00',
        cancellation: 'Free cancellation up to 48 hours prior to check-in date.',
      },
      featured: i % 7 === 0,
      popular: i % 5 === 0,
      isNew: i % 11 === 0,
      isDemo: true,
      status: 'active',
      createdAt: new Date('2026-10-01T00:00:00Z').toISOString(),
    });
  }

  return hotels;
}

function generateActivitiesForSite(siteId, cities, currency, basePriceMultiplier, rand) {
  const activities = [];
  let itemCounter = 1;

  ACTIVITY_CATEGORIES.forEach((cat) => {
    const titleTemplates = ACTIVITY_TITLES[cat.slug] || ACTIVITY_TITLES['city-tours'];

    titleTemplates.forEach((template, idx) => {
      const cityObj = cities[(itemCounter + idx) % cities.length];
      const title = `${cityObj.name}: ${template}`;
      const slug = `${cityObj.name.toLowerCase().replace(/\s+/g, '-')}-${cat.slug}-${itemCounter}`;

      const rating = Math.round((4.2 + rand() * 0.8) * 10) / 10;
      const reviewCount = 65 + Math.floor(rand() * 850);

      // Duration variations
      const durations = ['2 Hours', '3-4 Hours', 'Half Day (5 Hours)', 'Full Day (8 Hours)', 'Evening (4 Hours)'];
      const duration = durations[itemCounter % durations.length];

      // Base pricing
      const rawPrice = Math.round((25 + rand() * 95) * basePriceMultiplier);
      const price = Math.round(rawPrice / 5) * 5;
      const originalPrice = rand() > 0.4 ? Math.round(price * 1.25) : null;
      const netPrice = siteId === 'technoheaven' ? Math.round(price * 0.8) : null;

      // Dietary specifics
      const pureVeg = siteId === 'gujjutours' ? (cat.slug === 'desert-safari' || rand() > 0.4) : (rand() > 0.7);
      const jainAvailable = pureVeg || (siteId === 'gujjutours' && rand() > 0.5);

      // Package options
      const packageOptions = [
        {
          id: `opt_${itemCounter}_std`,
          title: 'Standard Admission Ticket',
          description: 'Includes regular admission, entry pass & self-guided tour access.',
          price,
          netPrice,
          hotelPickup: false,
          mealsIncluded: false,
        },
        {
          id: `opt_${itemCounter}_transfer`,
          title: 'Admission with Hotel Return Transfers',
          description: 'Includes entry pass plus air-conditioned door-to-door hotel transfers.',
          price: Math.round(price * 1.45),
          netPrice: netPrice ? Math.round(netPrice * 1.45) : null,
          hotelPickup: true,
          mealsIncluded: false,
        },
        {
          id: `opt_${itemCounter}_vip`,
          title: 'VIP Fast-Track Pass with Gourmet Meals',
          description: 'Priority fast-track entry, dedicated concierge, and gourmet meal voucher.',
          price: Math.round(price * 1.95),
          netPrice: netPrice ? Math.round(netPrice * 1.95) : null,
          hotelPickup: true,
          mealsIncluded: true,
        },
      ];

      activities.push({
        id: 1000 + itemCounter,
        activityId: `act_${siteId}_${1000 + itemCounter}`,
        tourNumericId: 1000 + itemCounter,
        websiteId: siteId,
        website: siteId === 'gujjutours' ? 'website1' : siteId === 'tripgoasia' ? 'website2' : 'technoheaven',
        title,
        name: title,
        slug,
        category: cat.label,
        categorySlug: cat.slug,
        destination: cityObj.name,
        location: `${cityObj.name}, ${cityObj.country}`,
        country: cityObj.country,
        city: cityObj.name,
        price,
        originalPrice,
        netPrice,
        currency,
        rating,
        reviews: reviewCount,
        reviewCount,
        duration,
        durationDays: 1,
        durationNights: 0,
        groupSize: 'Shared Tour (Max 15 Travelers)',
        image: cat.svg,
        images: [cat.svg],
        gallery: [cat.svg],
        highlights: [
          'Instant digital confirmation voucher with QR code access',
          'Free cancellation up to 24 hours prior to activity start time',
          'Licensed English-speaking professional tour guide',
          pureVeg ? 'Dedicated Pure Veg & Jain dining options included' : 'Flexible dining and hydration stops included',
        ],
        included: [
          'All entry tickets and access passes',
          'Expert local storytelling guide',
          'Taxes, toll fees and fuel surcharges',
        ],
        excluded: [
          'Personal shopping and souvenirs',
          'Optional gratuities and tips',
        ],
        packageOptions,
        dietaryFeatures: {
          pureVeg,
          jainAvailable,
          halalCertified: siteId !== 'gujjutours' || cityObj.name === 'Dubai',
        },
        featured: itemCounter % 6 === 0,
        popular: itemCounter % 4 === 0,
        isNew: itemCounter % 9 === 0,
        isDemo: true,
        status: 'Active',
        createdAt: new Date('2026-10-01T00:00:00Z').toISOString(),
      });

      itemCounter++;
    });
  });

  return activities;
}

function generatePackagesForSite(siteId, cities, currency, basePriceMultiplier, rand) {
  const packages = [];
  let itemCounter = 1;

  PACKAGE_CATEGORIES.forEach((cat) => {
    const titles = PACKAGE_TITLES[cat.slug] || PACKAGE_TITLES['scenic-escapes'];

    titles.forEach((template, idx) => {
      const cityObj = cities[(itemCounter + idx) % cities.length];
      const durationNights = 3 + ((itemCounter + idx) % 4); // 3, 4, 5, 6 nights
      const durationDays = durationNights + 1;
      const duration = `${durationDays} Days / ${durationNights} Nights`;

      const slug = `${template.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)}-${durationNights}n-${1000 + itemCounter}`;

      const rating = Math.round((4.6 + rand() * 0.4) * 10) / 10;
      const reviewCount = 85 + Math.floor(rand() * 750);

      // Package pricing based on currency and nights
      const rawPrice = Math.round((180 + durationNights * 70 + rand() * 140) * basePriceMultiplier);
      const startingPrice = Math.round(rawPrice / 100) * 100;
      const originalPrice = Math.round(startingPrice * (1.18 + rand() * 0.2));
      const netPrice = siteId === 'technoheaven' ? Math.round(startingPrice * 0.82) : null;

      // Dietary specifics
      const isJainPackage = cat.slug === 'jain-packages';
      const pureVeg = isJainPackage || siteId === 'gujjutours' ? (cat.slug === 'spiritual-escapes' || rand() > 0.35) : (rand() > 0.7);
      const jainAvailable = isJainPackage || (siteId === 'gujjutours' && (pureVeg || rand() > 0.5));

      // Key Inclusions badges
      const keyInclusions = [
        `${4 + (itemCounter % 2)}★ Hotel Stays`,
        pureVeg ? 'Daily Pure Veg Meals' : 'Daily Breakfast & Dinners',
        'AC Private Cab Transfers',
        'All Landmark Entry Passes',
        '24/7 Concierge Support',
      ];

      // Hotel Stays breakdown
      const hotelStays = [
        {
          hotelName: `Grand ${cityObj.name} Resort & Spa`,
          starRating: 4 + (itemCounter % 2),
          nights: durationNights - 1,
          city: cityObj.name,
          roomType: 'Deluxe Heritage Room',
        },
        {
          hotelName: `${cityObj.name} Palace View Hotel`,
          starRating: 5,
          nights: 1,
          city: cityObj.name,
          roomType: 'Executive Suite',
        },
      ];

      // Day-by-Day Itinerary
      const itinerary = [];
      for (let day = 1; day <= durationDays; day++) {
        if (day === 1) {
          itinerary.push({
            day: 1,
            title: `Arrival in ${cityObj.name} & Scenic Hotel Transfer`,
            description: `Arrive at ${cityObj.name} international airport or terminal. Receive a traditional welcome from our representative and transfer in a private air-conditioned vehicle to your verified hotel. Spend the evening relaxing or exploring nearby atmospheric local bazaars.`,
            meals: ['Dinner'],
            highlights: ['Airport Pickup', 'Hotel Check-in', 'Evening Leisure'],
          });
        } else if (day === durationDays) {
          itinerary.push({
            day,
            title: `Farewell ${cityObj.name} & Return Journey`,
            description: `Enjoy a lavish morning breakfast at your hotel. Complete check-out procedures, pick up authentic local souvenirs, and transfer in comfort to the airport for your return flight with unforgettable holiday memories.`,
            meals: ['Breakfast'],
            highlights: ['Breakfast Buffet', 'Airport Transfer', 'Departure'],
          });
        } else {
          itinerary.push({
            day,
            title: `Day ${day}: ${cityObj.name} Guided Landmark Circuit & Excursions`,
            description: `After a fresh breakfast, set out on a private guided excursion covering prominent natural viewpoints, ancient heritage landmarks, and cultural highlights. Includes leisurely lunch and hydration stops.`,
            meals: pureVeg ? ['Breakfast', 'Pure Veg Lunch', 'Jain Dinner'] : ['Breakfast', 'Dinner'],
            highlights: ['Guided Sightseeing', 'Photo Stops', 'Cultural Discovery'],
          });
        }
      }

      // Upcoming Departure Dates across the next 3 months
      const departureDates = [
        '2026-11-15',
        '2026-11-25',
        '2026-12-05',
        '2026-12-18',
        '2026-12-28',
        '2027-01-10',
        '2027-01-24',
      ];

      packages.push({
        id: 1000 + itemCounter,
        packageId: `pkg_${siteId}_${1000 + itemCounter}`,
        packageNumericId: 1000 + itemCounter,
        websiteId: siteId,
        website: siteId === 'gujjutours' ? 'website1' : siteId === 'tripgoasia' ? 'website2' : 'technoheaven',
        title: template,
        name: template,
        slug,
        category: cat.label,
        categorySlug: cat.slug,
        destination: cityObj.name,
        country: cityObj.country,
        city: cityObj.name,
        citiesCovered: `${cityObj.name} (${durationNights}N)`,
        duration,
        durationDays,
        durationNights,
        startingPrice,
        price: startingPrice,
        originalPrice,
        netPrice,
        currency,
        rating,
        reviews: reviewCount,
        reviewCount,
        image: cat.svg,
        images: [
          cat.svg,
          '/seed-images/packages/package-family.svg',
          '/seed-images/packages/package-scenic.svg',
        ],
        dietaryFeatures: {
          pureVeg,
          jainAvailable,
          halalCertified: siteId !== 'gujjutours' || cityObj.name === 'Dubai',
        },
        keyInclusions,
        hotelStays,
        itinerary,
        inclusions: [
          `Accommodation for ${durationNights} nights in 4★/5★ verified hotels`,
          pureVeg ? 'Daily 100% Pure Vegetarian breakfast & dinners (dedicated Jain catering)' : 'Daily buffet breakfast and multi-course dinners',
          'Private air-conditioned vehicle for all transfers and sightseeing',
          'All entry tickets, landmark permits, and toll surcharges',
          'Dedicated 24/7 concierge support via WhatsApp and phone',
        ],
        exclusions: [
          'Airfare and rail tickets (can be added with flight booking)',
          'Personal shopping, laundry, and mini-bar room services',
          'Optional adventure activities and camera permits',
          'Mandatory tips and driver gratuities',
        ],
        departureDates,
        featured: itemCounter % 5 === 0,
        popular: itemCounter % 3 === 0,
        isNew: itemCounter % 7 === 0,
        isDemo: true,
        status: 'Active',
        createdAt: new Date('2026-10-01T00:00:00Z').toISOString(),
      });

      itemCounter++;
    });
  });

  return packages;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Flights Generation (>= 50 scheduled flights per website + Popular Routes)
// ─────────────────────────────────────────────────────────────────────────────

const AIRLINES = [
  { name: 'SkyWings Airlines', code: 'SW', logo: '/seed-images/flights/airline-skywings.svg' },
  { name: 'AeroBharat Express', code: 'AB', logo: '/seed-images/flights/airline-aerobharat.svg' },
  { name: 'Orient Jet Airways', code: 'OJ', logo: '/seed-images/flights/airline-orientjet.svg' },
  { name: 'Gulf Airway Regional', code: 'GA', logo: '/seed-images/flights/airline-gulfairways.svg' },
  { name: 'Pacific Air Horizon', code: 'PA', logo: '/seed-images/flights/airline-pacificair.svg' },
];

const AIRPORT_REGISTRY = {
  DEL: { code: 'DEL', city: 'Delhi', name: 'Indira Gandhi International Airport', country: 'India', terminal: 'T3' },
  BOM: { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International', country: 'India', terminal: 'T2' },
  AMD: { code: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel International', country: 'India', terminal: 'T1' },
  STV: { code: 'STV', city: 'Surat', name: 'Surat International Airport', country: 'India', terminal: 'T1' },
  BLR: { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda International Airport', country: 'India', terminal: 'T1' },
  GOI: { code: 'GOI', city: 'Goa', name: 'Goa Dabolim Airport', country: 'India', terminal: 'T1' },
  JAI: { code: 'JAI', city: 'Jaipur', name: 'Jaipur International Airport', country: 'India', terminal: 'T2' },
  CCU: { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhash Chandra Bose International', country: 'India', terminal: 'T2' },
  DXB: { code: 'DXB', city: 'Dubai', name: 'Dubai International Airport', country: 'United Arab Emirates', terminal: 'T3' },
  BKK: { code: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi Airport', country: 'Thailand', terminal: 'T1' },
  SIN: { code: 'SIN', city: 'Singapore', name: 'Singapore Changi Airport', country: 'Singapore', terminal: 'T3' },
  LHR: { code: 'LHR', city: 'London', name: 'London Heathrow Airport', country: 'United Kingdom', terminal: 'T4' },
  KUL: { code: 'KUL', city: 'Kuala Lumpur', name: 'Kuala Lumpur International Airport', country: 'Malaysia', terminal: 'KLIA2' },
  DPS: { code: 'DPS', city: 'Bali', name: 'Ngurah Rai International Airport', country: 'Indonesia', terminal: 'T1' },
  HKT: { code: 'HKT', city: 'Phuket', name: 'Phuket International Airport', country: 'Thailand', terminal: 'T2' },
  CNX: { code: 'CNX', city: 'Chiang Mai', name: 'Chiang Mai International Airport', country: 'Thailand', terminal: 'T1' },
  NRT: { code: 'NRT', city: 'Tokyo', name: 'Narita International Airport', country: 'Japan', terminal: 'T1' },
  SYD: { code: 'SYD', city: 'Sydney', name: 'Sydney Kingsford Smith Airport', country: 'Australia', terminal: 'T1' },
  AUH: { code: 'AUH', city: 'Abu Dhabi', name: 'Zayed International Airport', country: 'United Arab Emirates', terminal: 'T1' },
  SHJ: { code: 'SHJ', city: 'Sharjah', name: 'Sharjah International Airport', country: 'United Arab Emirates', terminal: 'T1' },
  DOH: { code: 'DOH', city: 'Doha', name: 'Hamad International Airport', country: 'Qatar', terminal: 'T1' },
  RUH: { code: 'RUH', city: 'Riyadh', name: 'King Khalid International Airport', country: 'Saudi Arabia', terminal: 'T2' },
  JED: { code: 'JED', city: 'Jeddah', name: 'King Abdulaziz International Airport', country: 'Saudi Arabia', terminal: 'T1' },
  IST: { code: 'IST', city: 'Istanbul', name: 'Istanbul Airport', country: 'Turkey', terminal: 'T1' },
  KWI: { code: 'KWI', city: 'Kuwait City', name: 'Kuwait International Airport', country: 'Kuwait', terminal: 'T1' },
  MCT: { code: 'MCT', city: 'Muscat', name: 'Muscat International Airport', country: 'Oman', terminal: 'T1' },
  BAH: { code: 'BAH', city: 'Manama', name: 'Bahrain International Airport', country: 'Bahrain', terminal: 'T1' },
};

const SITE_FLIGHT_ROUTES = {
  gujjutours: {
    domestic: [
      { from: 'DEL', to: 'BOM', baseDuration: '2h 15m', minutes: 135, baseUsd: 55 },
      { from: 'BOM', to: 'DEL', baseDuration: '2h 10m', minutes: 130, baseUsd: 55 },
      { from: 'BOM', to: 'GOI', baseDuration: '1h 15m', minutes: 75, baseUsd: 42 },
      { from: 'GOI', to: 'BOM', baseDuration: '1h 20m', minutes: 80, baseUsd: 42 },
      { from: 'AMD', to: 'DEL', baseDuration: '1h 35m', minutes: 95, baseUsd: 46 },
      { from: 'DEL', to: 'AMD', baseDuration: '1h 30m', minutes: 90, baseUsd: 46 },
      { from: 'STV', to: 'DEL', baseDuration: '1h 45m', minutes: 105, baseUsd: 50 },
      { from: 'DEL', to: 'STV', baseDuration: '1h 40m', minutes: 100, baseUsd: 50 },
      { from: 'AMD', to: 'BOM', baseDuration: '1h 15m', minutes: 75, baseUsd: 38 },
      { from: 'BLR', to: 'BOM', baseDuration: '1h 40m', minutes: 100, baseUsd: 48 },
      { from: 'DEL', to: 'JAI', baseDuration: '1h 00m', minutes: 60, baseUsd: 32 },
      { from: 'CCU', to: 'DEL', baseDuration: '2h 25m', minutes: 145, baseUsd: 62 },
    ],
    international: [
      { from: 'AMD', to: 'DXB', baseDuration: '3h 30m', minutes: 210, baseUsd: 145 },
      { from: 'DXB', to: 'AMD', baseDuration: '3h 15m', minutes: 195, baseUsd: 145 },
      { from: 'BOM', to: 'DXB', baseDuration: '3h 25m', minutes: 205, baseUsd: 155 },
      { from: 'DEL', to: 'BKK', baseDuration: '4h 15m', minutes: 255, baseUsd: 185 },
      { from: 'BOM', to: 'SIN', baseDuration: '5h 10m', minutes: 310, baseUsd: 220 },
      { from: 'DEL', to: 'LHR', baseDuration: '8h 55m', minutes: 535, baseUsd: 480 },
    ],
  },
  tripgoasia: {
    domestic: [
      { from: 'BKK', to: 'HKT', baseDuration: '1h 25m', minutes: 85, baseUsd: 45 },
      { from: 'HKT', to: 'BKK', baseDuration: '1h 20m', minutes: 80, baseUsd: 45 },
      { from: 'BKK', to: 'CNX', baseDuration: '1h 15m', minutes: 75, baseUsd: 40 },
      { from: 'CNX', to: 'BKK', baseDuration: '1h 15m', minutes: 75, baseUsd: 40 },
      { from: 'SIN', to: 'KUL', baseDuration: '1h 00m', minutes: 60, baseUsd: 38 },
      { from: 'KUL', to: 'SIN', baseDuration: '1h 00m', minutes: 60, baseUsd: 38 },
      { from: 'BKK', to: 'SIN', baseDuration: '2h 25m', minutes: 145, baseUsd: 75 },
      { from: 'SIN', to: 'BKK', baseDuration: '2h 20m', minutes: 140, baseUsd: 75 },
      { from: 'KUL', to: 'DPS', baseDuration: '3h 05m', minutes: 185, baseUsd: 95 },
      { from: 'DPS', to: 'KUL', baseDuration: '3h 00m', minutes: 180, baseUsd: 95 },
      { from: 'SIN', to: 'DPS', baseDuration: '2h 45m', minutes: 165, baseUsd: 110 },
      { from: 'DPS', to: 'SIN', baseDuration: '2h 40m', minutes: 160, baseUsd: 110 },
    ],
    international: [
      { from: 'BKK', to: 'NRT', baseDuration: '6h 15m', minutes: 375, baseUsd: 290 },
      { from: 'SIN', to: 'SYD', baseDuration: '7h 45m', minutes: 465, baseUsd: 380 },
      { from: 'BKK', to: 'DXB', baseDuration: '6h 40m', minutes: 400, baseUsd: 260 },
      { from: 'SIN', to: 'LHR', baseDuration: '13h 20m', minutes: 800, baseUsd: 590 },
    ],
  },
  technoheaven: {
    domestic: [
      { from: 'DXB', to: 'AUH', baseDuration: '0h 45m', minutes: 45, baseUsd: 45 },
      { from: 'AUH', to: 'DXB', baseDuration: '0h 45m', minutes: 45, baseUsd: 45 },
      { from: 'DXB', to: 'DOH', baseDuration: '1h 10m', minutes: 70, baseUsd: 85 },
      { from: 'DOH', to: 'DXB', baseDuration: '1h 10m', minutes: 70, baseUsd: 85 },
      { from: 'DXB', to: 'RUH', baseDuration: '1h 55m', minutes: 115, baseUsd: 120 },
      { from: 'RUH', to: 'DXB', baseDuration: '1h 50m', minutes: 110, baseUsd: 120 },
      { from: 'DXB', to: 'JED', baseDuration: '2h 45m', minutes: 165, baseUsd: 150 },
      { from: 'JED', to: 'DXB', baseDuration: '2h 40m', minutes: 160, baseUsd: 150 },
      { from: 'DXB', to: 'KWI', baseDuration: '1h 45m', minutes: 105, baseUsd: 95 },
      { from: 'DXB', to: 'MCT', baseDuration: '1h 05m', minutes: 65, baseUsd: 70 },
      { from: 'DXB', to: 'BAH', baseDuration: '1h 15m', minutes: 75, baseUsd: 80 },
      { from: 'SHJ', to: 'DOH', baseDuration: '1h 15m', minutes: 75, baseUsd: 80 },
    ],
    international: [
      { from: 'DXB', to: 'BOM', baseDuration: '3h 25m', minutes: 205, baseUsd: 160 },
      { from: 'BOM', to: 'DXB', baseDuration: '3h 30m', minutes: 210, baseUsd: 160 },
      { from: 'DXB', to: 'LHR', baseDuration: '7h 45m', minutes: 465, baseUsd: 460 },
      { from: 'DXB', to: 'IST', baseDuration: '4h 50m', minutes: 290, baseUsd: 240 },
    ],
  },
};

const SCHEDULE_SLOTS = [
  { dep: '06:15', suffix: 'A' },
  { dep: '09:40', suffix: 'B' },
  { dep: '13:20', suffix: 'C' },
  { dep: '17:45', suffix: 'D' },
  { dep: '21:30', suffix: 'E' },
];

function generateFlightsForSite(siteId, currency, basePriceMultiplier, rand) {
  const routesData = SITE_FLIGHT_ROUTES[siteId] || SITE_FLIGHT_ROUTES.gujjutours;
  const flights = [];
  let itemCounter = 1;

  const allRoutes = [
    ...routesData.domestic.map((r) => ({ ...r, isDomestic: true })),
    ...routesData.international.map((r) => ({ ...r, isDomestic: false })),
  ];

  allRoutes.forEach((route) => {
    const fromApt = AIRPORT_REGISTRY[route.from] || { code: route.from, city: route.from, name: `${route.from} Airport`, country: 'Unknown', terminal: 'T1' };
    const toApt = AIRPORT_REGISTRY[route.to] || { code: route.to, city: route.to, name: `${route.to} Airport`, country: 'Unknown', terminal: 'T1' };

    const slotsCount = route.isDomestic ? 4 : 2;

    for (let s = 0; s < slotsCount; s++) {
      const slot = SCHEDULE_SLOTS[s % SCHEDULE_SLOTS.length];
      const airline = AIRLINES[(itemCounter + s) % AIRLINES.length];

      // Calculate arrival time based on duration minutes
      const [depH, depM] = slot.dep.split(':').map(Number);
      const totalDepMin = depH * 60 + depM;
      const totalArrMin = (totalDepMin + route.minutes) % 1440;
      const arrH = String(Math.floor(totalArrMin / 60)).padStart(2, '0');
      const arrM = String(totalArrMin % 60).padStart(2, '0');
      const arrTime = `${arrH}:${arrM}`;

      const flightNumber = `${airline.code}-${100 + (itemCounter % 899)}`;
      const routeSlug = `${fromApt.city.toLowerCase()}-to-${toApt.city.toLowerCase()}-flights-${fromApt.code.toLowerCase()}-${toApt.code.toLowerCase()}`;
      const slug = `${routeSlug}-${flightNumber.toLowerCase()}`;

      // Pricing
      const rawPrice = Math.round((route.baseUsd * (0.9 + rand() * 0.35)) * basePriceMultiplier);
      const price = Math.round(rawPrice / 10) * 10;
      const originalPrice = Math.round(price * (1.18 + rand() * 0.15));
      const netPrice = siteId === 'technoheaven' ? Math.round(price * 0.85) : null;

      const pureVegMeal = siteId === 'gujjutours' || rand() > 0.4;
      const jainMealAvailable = pureVegMeal || rand() > 0.5;

      const isNonStop = s !== 3; // 4th slot can be 1 stop for realistic variety
      const stops = isNonStop ? 'Non-stop' : `1 Stop via ${siteId === 'gujjutours' ? 'AMD' : 'BKK'}`;

      flights.push({
        id: 1000 + itemCounter,
        flightId: `fl_${siteId}_${1000 + itemCounter}`,
        flightNumericId: 1000 + itemCounter,
        websiteId: siteId,
        website: siteId === 'gujjutours' ? 'website1' : siteId === 'tripgoasia' ? 'website2' : 'technoheaven',
        airline: airline.name,
        airlineCode: airline.code,
        flightNumber,
        airlineLogo: airline.logo,
        fromAirport: fromApt,
        toAirport: toApt,
        departureTime: slot.dep,
        arrivalTime: arrTime,
        duration: route.baseDuration,
        durationMinutes: route.minutes,
        stops,
        stopsCount: isNonStop ? 0 : 1,
        cabinClass: s === 1 ? 'Business' : 'Economy',
        price,
        originalPrice,
        netPrice,
        currency,
        refundable: s % 2 === 0,
        cancellationPolicy: s % 2 === 0 ? 'Free cancellation up to 24 hours prior to departure' : 'Non-refundable fare with date change permitted',
        baggage: {
          cabin: '7 kg (1 cabin bag + laptop bag)',
          checkIn: route.isDomestic ? '15 kg (1 piece)' : '25 kg (2 pieces)',
        },
        meals: {
          included: true,
          pureVegGuaranteed: pureVegMeal,
          jainMealAvailable,
          description: pureVegMeal
            ? 'Complimentary hot gourmet Pure Veg meal with choice of hot/cold beverages'
            : 'Complimentary in-flight meal service with vegetarian options',
        },
        aircraft: route.isDomestic ? 'Airbus A320neo' : 'Boeing 787-9 Dreamliner',
        routeSlug,
        slug,
        isDomestic: route.isDomestic,
        featured: itemCounter % 4 === 0,
        rating: Math.round((4.4 + rand() * 0.5) * 10) / 10,
        reviews: 140 + Math.floor(rand() * 450),
        availableSeats: 6 + Math.floor(rand() * 24),
        status: 'Active',
        createdAt: new Date('2026-10-01T00:00:00Z').toISOString(),
      });

      itemCounter++;
    }
  });

  return flights;
}

function generatePopularRoutes(siteId, flights) {
  const routeMap = new Map();

  flights.forEach((f) => {
    if (!routeMap.has(f.routeSlug)) {
      routeMap.set(f.routeSlug, {
        routeSlug: f.routeSlug,
        fromCity: f.fromAirport.city,
        fromCode: f.fromAirport.code,
        toCity: f.toAirport.city,
        toCode: f.toAirport.code,
        duration: f.duration,
        startingPrice: f.price,
        currency: f.currency,
        isDomestic: f.isDomestic,
        dailyFlightsCount: 1,
        image: f.isDomestic ? '/seed-images/flights/flight-domestic.svg' : '/seed-images/flights/flight-international.svg',
      });
    } else {
      const existing = routeMap.get(f.routeSlug);
      existing.dailyFlightsCount++;
      if (f.price < existing.startingPrice) {
        existing.startingPrice = f.price;
      }
    }
  });

  return Array.from(routeMap.values());
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Transfers Generation (>= 50 vehicle transfer services per website)
// ─────────────────────────────────────────────────────────────────────────────

const VEHICLE_TYPES = [
  {
    type: 'Sedan',
    label: 'Comfort Executive Sedan',
    model: 'Toyota Etios / Suzuki Dzire or equivalent',
    maxPax: 3,
    maxBags: 2,
    multiplier: 1.0,
    image: '/seed-images/transfers/transfer-sedan.svg',
  },
  {
    type: 'SUV',
    label: 'Spacious Family SUV',
    model: 'Toyota Innova Crysta / Ertiga or equivalent',
    maxPax: 6,
    maxBags: 4,
    multiplier: 1.45,
    image: '/seed-images/transfers/transfer-suv.svg',
  },
  {
    type: 'Van',
    label: 'Executive Passenger Van',
    model: 'Toyota HiAce / Tempo Luxury Coach',
    maxPax: 12,
    maxBags: 10,
    multiplier: 2.15,
    image: '/seed-images/transfers/transfer-van.svg',
  },
  {
    type: 'Luxury',
    label: 'VIP Executive Luxury Sedan',
    model: 'Mercedes-Benz E-Class / BMW 5 Series',
    maxPax: 3,
    maxBags: 3,
    multiplier: 2.7,
    image: '/seed-images/transfers/transfer-luxury.svg',
  },
];

function generateTransfersForSite(siteId, cities, currency, basePriceMultiplier, rand) {
  const transfers = [];
  let itemCounter = 1;

  cities.forEach((cityObj) => {
    const cityName = cityObj.name;
    const country = cityObj.country;

    // Define 4 typical transfer routes per city
    const cityRoutes = [
      {
        type: 'airport',
        typeLabel: 'Airport Transfer',
        titleTemplate: `${cityName} Airport to City Hotels One-Way Transfer`,
        pickup: `${cityName} International Airport (Arrivals Gate)`,
        dropoff: `${cityName} City Center & Verified Hotels`,
        baseUsd: 28,
        minutes: 45,
        duration: '45 Mins',
      },
      {
        type: 'airport',
        typeLabel: 'Airport Transfer',
        titleTemplate: `${cityName} Hotels to Airport Departure Return Transfer`,
        pickup: `${cityName} Hotel Lobby / Verified Residence`,
        dropoff: `${cityName} International Airport (Departures Gate)`,
        baseUsd: 28,
        minutes: 45,
        duration: '45 Mins',
      },
      {
        type: 'attraction',
        typeLabel: 'Attraction Transfer',
        titleTemplate: `${cityName} Sightseeing Highlights & Landmark Circuit Transfer`,
        pickup: `${cityName} Hotel Lobby`,
        dropoff: `${cityName} Key Sightseeing Attractions & Heritage Sites`,
        baseUsd: 42,
        minutes: 120,
        duration: '2 Hours (Custom Stops)',
      },
      {
        type: 'hotel',
        typeLabel: 'Hotel Transfer',
        titleTemplate: `${cityName} Downtown to Coastal Resort Inter-Hotel Transfer`,
        pickup: `${cityName} City Hotel`,
        dropoff: `${cityName} Resort / Outer Area Hotel`,
        baseUsd: 24,
        minutes: 35,
        duration: '35 Mins',
      },
    ];

    cityRoutes.forEach((route) => {
      VEHICLE_TYPES.forEach((veh) => {
        const rawPrice = Math.round((route.baseUsd * veh.multiplier * (0.92 + rand() * 0.22)) * basePriceMultiplier);
        const price = Math.round(rawPrice / 10) * 10;
        const originalPrice = Math.round(price * (1.18 + rand() * 0.15));
        const netPrice = siteId === 'technoheaven' ? Math.round(price * 0.85) : null;

        const title = `${cityName}: ${veh.label} - ${route.titleTemplate}`;
        const slug = `${cityName.toLowerCase()}-${route.type}-${veh.type.toLowerCase()}-transfer-${itemCounter}`;

        transfers.push({
          id: 1000 + itemCounter,
          transferId: `tr_${siteId}_${1000 + itemCounter}`,
          transferNumericId: 1000 + itemCounter,
          websiteId: siteId,
          website: siteId === 'gujjutours' ? 'website1' : siteId === 'tripgoasia' ? 'website2' : 'technoheaven',
          title,
          name: title,
          slug,
          transferType: route.type,
          transferTypeLabel: route.typeLabel,
          vehicleType: veh.type,
          vehicleLabel: veh.label,
          vehicleModel: veh.model,
          maxPassengers: veh.maxPax,
          maxLuggage: veh.maxBags,
          airConditioned: true,
          pickupLocation: route.pickup,
          dropoffLocation: route.dropoff,
          city: cityName,
          country,
          durationMinutes: route.minutes,
          estimatedDuration: route.duration,
          price,
          originalPrice,
          netPrice,
          currency,
          image: veh.image,
          freeCancellation: true,
          meetAndGreet: true,
          flightMonitoring: route.type === 'airport',
          tollIncluded: true,
          rating: Math.round((4.6 + rand() * 0.4) * 10) / 10,
          reviews: 80 + Math.floor(rand() * 260),
          featured: itemCounter % 5 === 0,
          status: 'Active',
          createdAt: new Date('2026-10-01T00:00:00Z').toISOString(),
        });

        itemCounter++;
      });
    });
  });

  return transfers;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. VISAS TAXONOMIES & GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

const GUJJU_VISA_COUNTRIES = [
  { name: 'United Arab Emirates', code: 'AE', slug: 'united-arab-emirates', flag: '🇦🇪', continent: 'Middle East', popular: true, baseUsd: 85 },
  { name: 'Thailand', code: 'TH', slug: 'thailand', flag: '🇹🇭', continent: 'Asia', popular: true, baseUsd: 45 },
  { name: 'Singapore', code: 'SG', slug: 'singapore', flag: '🇸🇬', continent: 'Asia', popular: true, baseUsd: 40 },
  { name: 'Malaysia', code: 'MY', slug: 'malaysia', flag: '🇲🇾', continent: 'Asia', popular: true, baseUsd: 35 },
  { name: 'Indonesia', code: 'ID', slug: 'indonesia', flag: '🇮🇩', continent: 'Asia', popular: true, baseUsd: 42 },
  { name: 'Vietnam', code: 'VN', slug: 'vietnam', flag: '🇻🇳', continent: 'Asia', popular: true, baseUsd: 38 },
  { name: 'United Kingdom', code: 'GB', slug: 'united-kingdom', flag: '🇬🇧', continent: 'Europe', popular: true, baseUsd: 195 },
  { name: 'Schengen / France', code: 'FR', slug: 'schengen-france', flag: '🇫🇷', continent: 'Europe', popular: true, baseUsd: 160 },
  { name: 'Schengen / Switzerland', code: 'CH', slug: 'schengen-switzerland', flag: '🇨🇭', continent: 'Europe', popular: true, baseUsd: 165 },
  { name: 'United States', code: 'US', slug: 'united-states', flag: '🇺🇸', continent: 'North America', popular: true, baseUsd: 240 },
  { name: 'Sri Lanka', code: 'LK', slug: 'sri-lanka', flag: '🇱🇰', continent: 'Asia', popular: false, baseUsd: 30 },
  { name: 'Egypt', code: 'EG', slug: 'egypt', flag: '🇪🇬', continent: 'Africa', popular: false, baseUsd: 50 },
  { name: 'Turkey', code: 'TR', slug: 'turkey', flag: '🇹🇷', continent: 'Europe', popular: true, baseUsd: 65 },
  { name: 'Oman', code: 'OM', slug: 'oman', flag: '🇴🇲', continent: 'Middle East', popular: false, baseUsd: 55 },
];

const TRIPGO_VISA_COUNTRIES = [
  { name: 'Thailand', code: 'TH', slug: 'thailand', flag: '🇹🇭', continent: 'Asia', popular: true, baseUsd: 45 },
  { name: 'Singapore', code: 'SG', slug: 'singapore', flag: '🇸🇬', continent: 'Asia', popular: true, baseUsd: 40 },
  { name: 'Malaysia', code: 'MY', slug: 'malaysia', flag: '🇲🇾', continent: 'Asia', popular: true, baseUsd: 35 },
  { name: 'Indonesia', code: 'ID', slug: 'indonesia', flag: '🇮🇩', continent: 'Asia', popular: true, baseUsd: 42 },
  { name: 'Japan', code: 'JP', slug: 'japan', flag: '🇯🇵', continent: 'Asia', popular: true, baseUsd: 75 },
  { name: 'Australia', code: 'AU', slug: 'australia', flag: '🇦🇺', continent: 'Oceania', popular: true, baseUsd: 140 },
  { name: 'United Arab Emirates', code: 'AE', slug: 'united-arab-emirates', flag: '🇦🇪', continent: 'Middle East', popular: true, baseUsd: 85 },
  { name: 'Vietnam', code: 'VN', slug: 'vietnam', flag: '🇻🇳', continent: 'Asia', popular: true, baseUsd: 38 },
  { name: 'South Korea', code: 'KR', slug: 'south-korea', flag: '🇰🇷', continent: 'Asia', popular: true, baseUsd: 55 },
  { name: 'China', code: 'CN', slug: 'china', flag: '🇨🇳', continent: 'Asia', popular: false, baseUsd: 110 },
  { name: 'New Zealand', code: 'NZ', slug: 'new-zealand', flag: '🇳🇿', continent: 'Oceania', popular: false, baseUsd: 130 },
  { name: 'United Kingdom', code: 'GB', slug: 'united-kingdom', flag: '🇬🇧', continent: 'Europe', popular: true, baseUsd: 195 },
  { name: 'Philippines', code: 'PH', slug: 'philippines', flag: '🇵🇭', continent: 'Asia', popular: false, baseUsd: 40 },
  { name: 'Cambodia', code: 'KH', slug: 'cambodia', flag: '🇰🇭', continent: 'Asia', popular: false, baseUsd: 36 },
];

const TECHNO_VISA_COUNTRIES = [
  { name: 'United Arab Emirates', code: 'AE', slug: 'united-arab-emirates', flag: '🇦🇪', continent: 'Middle East', popular: true, baseUsd: 85 },
  { name: 'Saudi Arabia', code: 'SA', slug: 'saudi-arabia', flag: '🇸🇦', continent: 'Middle East', popular: true, baseUsd: 120 },
  { name: 'Qatar', code: 'QA', slug: 'qatar', flag: '🇶🇦', continent: 'Middle East', popular: true, baseUsd: 55 },
  { name: 'Oman', code: 'OM', slug: 'oman', flag: '🇴🇲', continent: 'Middle East', popular: true, baseUsd: 50 },
  { name: 'Bahrain', code: 'BH', slug: 'bahrain', flag: '🇧🇭', continent: 'Middle East', popular: false, baseUsd: 65 },
  { name: 'Kuwait', code: 'KW', slug: 'kuwait', flag: '🇰🇼', continent: 'Middle East', popular: false, baseUsd: 70 },
  { name: 'United Kingdom', code: 'GB', slug: 'united-kingdom', flag: '🇬🇧', continent: 'Europe', popular: true, baseUsd: 195 },
  { name: 'Schengen / EU', code: 'EU', slug: 'schengen-eu', flag: '🇪🇺', continent: 'Europe', popular: true, baseUsd: 160 },
  { name: 'India', code: 'IN', slug: 'india', flag: '🇮🇳', continent: 'Asia', popular: true, baseUsd: 60 },
  { name: 'Turkey', code: 'TR', slug: 'turkey', flag: '🇹🇷', continent: 'Europe', popular: true, baseUsd: 65 },
  { name: 'Egypt', code: 'EG', slug: 'egypt', flag: '🇪🇬', continent: 'Africa', popular: false, baseUsd: 50 },
  { name: 'Jordan', code: 'JO', slug: 'jordan', flag: '🇯🇴', continent: 'Middle East', popular: false, baseUsd: 75 },
  { name: 'Singapore', code: 'SG', slug: 'singapore', flag: '🇸🇬', continent: 'Asia', popular: true, baseUsd: 40 },
  { name: 'Malaysia', code: 'MY', slug: 'malaysia', flag: '🇲🇾', continent: 'Asia', popular: true, baseUsd: 35 },
];

const VISA_TIERS = [
  {
    tierKey: 'tourist-30',
    titleSuffix: '30-Day Single Entry Tourist eVisa',
    visaType: 'tourist',
    visaTypeLabel: 'Tourist eVisa',
    validity: '60 Days from Date of Issue',
    stayDuration: '30 Days',
    processingTime: '3-4 Working Days',
    entryType: 'Single Entry',
    fastTrackAvailable: false,
    image: '/seed-images/visas/visa-tourist.svg',
    priceMultiplier: 1.0,
  },
  {
    tierKey: 'tourist-60',
    titleSuffix: '60-Day Multiple Entry Tourist eVisa',
    visaType: 'multiple-entry',
    visaTypeLabel: 'Multiple Entry eVisa',
    validity: '90 Days from Date of Issue',
    stayDuration: '60 Days',
    processingTime: '4-5 Working Days',
    entryType: 'Multiple Entry',
    fastTrackAvailable: true,
    image: '/seed-images/visas/visa-tourist.svg',
    priceMultiplier: 1.85,
  },
  {
    tierKey: 'express-48h',
    titleSuffix: '48-Hour Urgent Express Tourist eVisa',
    visaType: 'express',
    visaTypeLabel: 'Express Fast-Track eVisa',
    validity: '30 Days from Date of Issue',
    stayDuration: '30 Days',
    processingTime: '24-48 Hours',
    entryType: 'Single Entry',
    fastTrackAvailable: true,
    image: '/seed-images/visas/visa-express.svg',
    priceMultiplier: 1.5,
  },
  {
    tierKey: 'business-90',
    titleSuffix: '90-Day Business & Commercial eVisa',
    visaType: 'business',
    visaTypeLabel: 'Business & Commercial Visa',
    validity: '180 Days from Date of Issue',
    stayDuration: '90 Days',
    processingTime: '4-6 Working Days',
    entryType: 'Multiple Entry',
    fastTrackAvailable: false,
    image: '/seed-images/visas/visa-business.svg',
    priceMultiplier: 2.2,
  },
];

function generateVisasForSite(siteId, currency, basePriceMultiplier, rand) {
  const countries = siteId === 'gujjutours' ? GUJJU_VISA_COUNTRIES : siteId === 'tripgoasia' ? TRIPGO_VISA_COUNTRIES : TECHNO_VISA_COUNTRIES;
  const visas = [];
  let itemCounter = 1;

  countries.forEach((country) => {
    VISA_TIERS.forEach((tier) => {
      const rawPrice = Math.round((country.baseUsd * tier.priceMultiplier * (0.95 + rand() * 0.15)) * basePriceMultiplier);
      const price = Math.round(rawPrice / 10) * 10;
      const originalPrice = Math.round(price * (1.15 + rand() * 0.15));
      const netPrice = siteId === 'technoheaven' ? Math.round(price * 0.82) : null;

      const title = `${country.name}: ${tier.titleSuffix}`;
      const slug = `${country.slug}-${tier.tierKey}-${1000 + itemCounter}`;

      const standardDocs = [
        'Valid Passport Copy with minimum 6 months validity from date of travel',
        'Recent Passport-Sized Photograph (white background, taken within 3 months)',
        'Confirmed Round-Trip Flight Itinerary / Return Air Ticket',
        'Confirmed Hotel Voucher or Proof of Accommodation',
      ];
      if (tier.visaType === 'business') {
        standardDocs.push('Official Invitation Letter or Business Conference Registration');
      }

      visas.push({
        id: 1000 + itemCounter,
        visaId: `vi_${siteId}_${1000 + itemCounter}`,
        visaNumericId: 1000 + itemCounter,
        websiteId: siteId,
        website: siteId === 'gujjutours' ? 'website1' : siteId === 'tripgoasia' ? 'website2' : 'technoheaven',
        country: country.name,
        countryCode: country.code,
        countrySlug: country.slug,
        flag: country.flag,
        continent: country.continent,
        title,
        name: title,
        slug,
        visaType: tier.visaType,
        visaTypeLabel: tier.visaTypeLabel,
        validity: tier.validity,
        stayDuration: tier.stayDuration,
        processingTime: tier.processingTime,
        entryType: tier.entryType,
        fastTrackAvailable: tier.fastTrackAvailable,
        price,
        originalPrice,
        netPrice,
        currency,
        image: tier.image,
        documentsRequired: standardDocs,
        approvalRate: Math.round((99.2 + rand() * 0.6) * 10) / 10,
        rating: Math.round((4.8 + rand() * 0.2) * 10) / 10,
        reviews: 120 + Math.floor(rand() * 320),
        featured: country.popular && tier.tierKey === 'tourist-30',
        isDemo: true,
        status: 'Active',
        createdAt: new Date('2026-10-01T00:00:00Z').toISOString(),
        overview: `Comprehensive visa facilitation service for travel to ${country.name}. Our dedicated visa desk conducts a full pre-screening of your passport, travel itinerary, and documentation to guarantee swift approval with zero embassy delays.`,
        faqs: [
          {
            question: `How long does it take to process the ${country.name} eVisa?`,
            answer: `Standard processing takes ${tier.processingTime}. Once approved by official immigration authorities, your eVisa is instantly dispatched via email and WhatsApp.`
          },
          {
            question: `Can I extend my stay beyond ${tier.stayDuration}?`,
            answer: `Extensions depend on local immigration regulations. You can consult our visa desk prior to departure for country-specific extension policies.`
          },
          {
            question: 'What happens if there is an error in my uploaded documents?',
            answer: 'Our pre-screening verification desk immediately checks your documents within 2 hours of upload and flags any issues before official embassy submission.'
          }
        ],
        submissionSteps: [
          'Submit Application Online: Fill traveler details and securely upload passport copy and photograph.',
          'Expert Pre-Screening: Our visa documentation specialist verifies every detail within 2 hours.',
          'Government / Immigration Submission: Application processed with official authorities.',
          'Receive Approved eVisa: Approved visa PDF delivered directly to email and WhatsApp.'
        ]
      });

      itemCounter++;
    });
  });

  return visas;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. RESTAURANTS TAXONOMIES & GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

const RESTAURANT_CUISINE_CONFIG = [
  {
    slug: 'indian',
    label: 'Indian Cuisine',
    image: '/seed-images/restaurants/dining-indian.svg',
    priceSymbol: '$$',
    baseUsd: 22,
    titles: [
      'Saffron Clay Tandoor & Biryani House',
      'Zaffran Heritage Spices Dining',
      'Royal Haveli Awadhi & Mughlai Kitchen',
      'Kashmir Valley Rogan Josh & Grill',
      'Peshawari Chulha Charcoal BBQ',
      'Dakshin Curry Coastal Banana Leaf',
      'Punjab Rasoi Handi & Naan Bistro',
      'Darbar Royal Mughlai Banquets',
      'Masala Craft Modern Indian Table',
      'Vedic Spice Claypot Kitchen',
      'Grand Nizam Biryani Pavilion',
    ],
    specialties: ['Dum Pukht Biryani', 'Dal Makhani', 'Paneer Tikka Angaar', 'Butter Garlic Naan'],
  },
  {
    slug: 'gujarati-thali',
    label: 'Gujarati Thali',
    image: '/seed-images/restaurants/dining-gujarati-thali.svg',
    priceSymbol: '$$',
    baseUsd: 14,
    titles: [
      'Kathiawad Rasoi Grand Heritage Thali',
      'Surati Swad Unlimited Royal Thali',
      'Girnar Bhojanalaya Authentic Thali',
      'Shree Annapurna Gujarati Dining Hall',
      'Aangan Desi Ghee Kathiawadi Thali',
      'Gorbandh Gujarati & Marwari Thali',
      'Sankalp Grand Patidar Thali',
      'Kansar Heritage Unlimited Thali',
      'Panchamrit Traditional Gujarati Bhojan',
      'Gordhan Thal Kathiawadi Rasoi',
      'Toran Heritage Royal Dining Hall',
    ],
    specialties: ['Undhiyu & Puri', 'Khaman Dhokla', 'Gujarati Dal & Kadhi', 'Kaju Kari', 'Shrikhand & Jalebi'],
  },
  {
    slug: 'jain',
    label: 'Jain Friendly',
    image: '/seed-images/restaurants/dining-jain.svg',
    priceSymbol: '$$',
    baseUsd: 16,
    titles: [
      'Ahinsa Sattvic Jain Fine Dining',
      'Tirthankar Pure Jain Bhojanalaya',
      'Navkar Sanctified Jain Kitchen',
      'Samveg Pure Vegetarian & Jain Dining',
      'Arihant Heritage Jain Rasoi',
      'Siddhachal Sanctified Jain Thal',
      'Prashant Sattvic Jain Gourmet',
      'Anand Mangal Pure Jain Dining Hall',
      'Shanti Niketan Jain Bhojan Shala',
      'Padmavati Sattvic Pure Kitchen',
      'Ratnatraya Jain Feast Lounge',
    ],
    specialties: ['Jain Paneer Lababdar', 'Banana Kofta Curry', 'Jain Dal Tadka', 'Moong Dal Halwa'],
  },
  {
    slug: 'vegetarian',
    label: '100% Pure Veg',
    image: '/seed-images/restaurants/dining-pureveg.svg',
    priceSymbol: '$$',
    baseUsd: 18,
    titles: [
      'Green Oasis 100% Pure Veg Bistro',
      'The Lotus Leaf Pure Veg Gourmet',
      'Tulsi Pure Veg Family Restaurant',
      'Shri Krishna Pure Vegetarian Pavilion',
      'Vrindavan Garden Pure Veg Dining',
      'Saffron Grove Pure Vegetarian Lounge',
      'Shiv Sagar Pure Veg Dosa & Grill',
      'Pavitra Bhojan 100% Veg Hall',
      'Nectar Grove Pure Vegetarian Terrace',
      'Brahma Kamal Pure Veg Culinary',
      'Aaradhna Pure Vegetarian Kitchen',
    ],
    specialties: ['Paneer Makhani', 'Crispy Corn & Waterchestnut', 'Cheese Stuffed Kulcha', 'Gulab Jamun'],
  },
  {
    slug: 'asian',
    label: 'Pan-Asian & Oriental',
    image: '/seed-images/restaurants/dining-asian.svg',
    priceSymbol: '$$$',
    baseUsd: 32,
    titles: [
      'Silk Route Pan-Asian Noodle Bar',
      'Dragon Blossom Dim Sum & Wok',
      'Tokyo Lantern Teppanyaki & Ramen',
      'Zen Garden Oriental Bistro',
      'Golden Pagoda Thai & Asian Bowls',
      'Red Lotus Sichuan & Wok House',
      'Bamboo Grove Sushi & Dim Sum House',
      'Mekong Delta Vietnamese & Thai Kitchen',
      'Chopsticks & Steam Pan-Asian Lounge',
      'Samurai Crest Robata & Ramen',
      'Orient Pearl Dim Sum Tea House',
    ],
    specialties: ['Truffle Edamame Dumplings', 'Pad Thai Noodles', 'Spicy Sichuan Mapo Tofu', 'Matcha Cheesecake'],
  },
  {
    slug: 'seafood',
    label: 'Fresh Seafood',
    image: '/seed-images/restaurants/dining-seafood.svg',
    priceSymbol: '$$$',
    baseUsd: 38,
    titles: [
      'Blue Coral Ocean Grill & Seafood',
      'Coastal Tides Fresh Fish House',
      'Harbour View Lobster & Prawn Shack',
      'Pelican Bay Catch of the Day',
      'Mariner\'s Cove Grilled Seafood Kitchen',
      'Triton Bay Oyster & Seafood Bar',
      'Neptune Crest Coastal Bar & Grill',
      'Bayfront Crab Shack & BBQ',
      'Wavecrest Coastal Fisherman\'s Kitchen',
      'Aqua Marine Fresh Catch Dining',
      'Lighthouse Cove Seafood Terrace',
    ],
    specialties: ['Grilled Jumbo Prawns', 'Coastal Fish Curry', 'Charcoal Whole Sea Bass', 'Garlic Butter Calamari'],
  },
  {
    slug: 'fine-dining',
    label: 'Fine Dining & Bistro',
    image: '/seed-images/restaurants/dining-finedine.svg',
    priceSymbol: '$$$$',
    baseUsd: 65,
    titles: [
      'The Grand Velvet Courtyard Bistro',
      'L\'Etoile Royale French Contemporary',
      'The Crown & Sovereign Haute Cuisine',
      'Ambrosia Sky Terrace Fine Dining',
      'Lumière Culinary Symphony & Cellar',
      'The Royal Monogram Executive Dining',
      'Aura Panorama Fine Dining Rooftop',
      'Belvedere Crest Haute Gastronomy',
      'Cellar 1890 Vintage Dining Club',
      'Opus Prime Chef\'s Tasting Table',
      'Verona Elegance Mediterranean Bistro',
    ],
    specialties: ['Sous-Vide Wild Mushrooms', 'Artisan Cheese Fondue', 'Truffle Risotto', 'Saffron Molten Cake'],
  },
  {
    slug: 'cafe',
    label: 'Artisan Cafe & Bakery',
    image: '/seed-images/restaurants/dining-cafe.svg',
    priceSymbol: '$',
    baseUsd: 12,
    titles: [
      'Roast & Bean Artisan Espresso Bar',
      'The Copper Kettle Sourdough & Cafe',
      'Vanilla Bean Boulangerie & Roastery',
      'Velvet Crema Specialty Coffee Lounge',
      'Misty Morning Artisan Bakery & Brews',
      'The Daily Grind Espresso & Brunch',
      'Little Hazelnut Patisserie & Cafe',
      'Blueberry & Co. Artisan Waffles',
      'Cinnamon Grove Bakery & Espresso',
      'Urban Roast Pour-Over & Brunch',
      'The Baker\'s Mill Cafe & Kitchen',
    ],
    specialties: ['Specialty Single-Origin Espresso', 'Avocado Toast & Sourdough', 'Belgian Waffles', 'Almond Croissant'],
  },
  {
    slug: 'street-food',
    label: 'Street Food & Chaat',
    image: '/seed-images/restaurants/dining-streetfood.svg',
    priceSymbol: '$',
    baseUsd: 8,
    titles: [
      'Khau Galli Heritage Chaat Bazaar',
      'Manek Chowk Night Bites & Pav Bhaji',
      'Bombay Tawa Rolls & Frankies',
      'Chowpatty Crispy Dosas & Chaat',
      'Delhi 6 Paratha Gali & Kebabs',
      'Spice Street Golgappa & Bhel Corner',
      'The Frankie Station & Street Bites',
      'Tawa Grill Pav Bhaji & Pulao',
      'Midnight Chowk Street Delicacies',
      'Golden Crisp Chole Bhature Hub',
      'Kathi Junction Charcoal Rolls',
    ],
    specialties: ['Butter Pav Bhaji', 'Sev Puri & Pani Puri', 'Crispy Paneer Kathi Roll', 'Cheese Masala Dosa'],
  },
];

function generateRestaurantsForSite(siteId, cities, currency, basePriceMultiplier, rand) {
  const restaurants = [];
  let itemCounter = 1;

  RESTAURANT_CUISINE_CONFIG.forEach((cuisineCfg) => {
    cuisineCfg.titles.forEach((restaurantName, titleIdx) => {
      const cityObj = cities[(itemCounter + titleIdx) % cities.length];
      const rawCost = Math.round((cuisineCfg.baseUsd * (0.92 + rand() * 0.22)) * basePriceMultiplier);
      const costForTwo = Math.round(rawCost / 10) * 10;
      const netCost = siteId === 'technoheaven' ? Math.round(costForTwo * 0.82) : null;

      const title = `${restaurantName}`;
      const slug = `${restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${cityObj.name.toLowerCase()}-${1000 + itemCounter}`;

      const isGujaratiThali = cuisineCfg.slug === 'gujarati-thali';
      const isJainCuisine = cuisineCfg.slug === 'jain';
      const isPureVegCuisine = cuisineCfg.slug === 'vegetarian' || isGujaratiThali || isJainCuisine || cuisineCfg.slug === 'street-food';
      const isPureVeg = isPureVegCuisine || (siteId === 'gujjutours' && rand() > 0.3);
      const isJainAvailable = isJainCuisine || isGujaratiThali || isPureVeg || rand() > 0.4;
      const isHalalCertified = siteId === 'technoheaven' || cuisineCfg.slug === 'asian' || rand() > 0.5;
      const isVeganFriendly = isJainCuisine || cuisineCfg.slug === 'cafe' || rand() > 0.5;

      const tags = [];
      if (isPureVeg) tags.push('100% Pure Vegetarian');
      if (isJainAvailable) tags.push('Jain Options Available');
      if (isHalalCertified) tags.push('Halal Certified');
      if (isVeganFriendly) tags.push('Vegan Friendly');
      tags.push(titleIdx % 2 === 0 ? 'Valet Parking' : 'Outdoor Seating');
      tags.push(titleIdx % 3 === 0 ? 'Live Music' : 'Air Conditioned');

      restaurants.push({
        id: 1000 + itemCounter,
        restaurantId: `res_${siteId}_${1000 + itemCounter}`,
        restaurantNumericId: 1000 + itemCounter,
        websiteId: siteId,
        website: siteId === 'gujjutours' ? 'website1' : siteId === 'tripgoasia' ? 'website2' : 'technoheaven',
        title,
        name: title,
        slug,
        cuisine: cuisineCfg.slug,
        cuisineLabel: cuisineCfg.label,
        city: cityObj.name,
        country: cityObj.country,
        address: `${12 + (itemCounter % 80)}, Heritage Food Boulevard, ${cityObj.name}`,
        priceRange: cuisineCfg.priceSymbol,
        costForTwo,
        netCost,
        currency,
        rating: Math.round((4.1 + rand() * 0.8) * 10) / 10,
        reviews: 90 + Math.floor(rand() * 750),
        isNew: itemCounter % 4 === 0,
        featured: titleIdx < 3,
        popular: titleIdx < 4,
        isPureVeg,
        isJainAvailable,
        isHalalCertified,
        isVeganFriendly,
        dietaryTags: tags,
        timings: titleIdx % 2 === 0 ? '11:30 AM - 03:30 PM, 07:00 PM - 11:30 PM' : '12:00 PM - 11:00 PM (All Day Dining)',
        image: cuisineCfg.image,
        images: [cuisineCfg.image],
        specialties: cuisineCfg.specialties,
        overview: `${title} is one of ${cityObj.name}'s premier dining destinations, celebrated for its authentic ${cuisineCfg.label} culinary mastery, impeccable hospitality, and warm ambiance suitable for families and gourmet travelers.`,
        isDemo: true,
        status: 'Active',
        createdAt: new Date('2026-10-01T00:00:00Z').toISOString(),
      });

      itemCounter++;
    });
  });

  return restaurants;
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. BUILD PACKAGE (CUSTOM PACKAGE BUILDER) OPTIONS & DESTINATIONS
// ─────────────────────────────────────────────────────────────────────────────

const BUILD_PACKAGE_CATALOG = {
  gujjutours: [
    {
      name: 'Dubai & Abu Dhabi',
      slug: 'dubai-emirates-builder',
      country: 'United Arab Emirates',
      flag: '🇦🇪',
      tagline: 'Futuristic Skylines, Golden Dunes & Ultra-Modern Luxury',
      badge: 'Bestseller Builder',
      basePrice: 42000,
      baseFlight: 32000,
      baseHotel: 18000,
      activities: [
        { name: 'Burj Khalifa Observation Deck (Levels 124 & 125)', price: 3800, duration: '2 Hours', recommended: true },
        { name: 'VIP Desert Safari with Dune Bashing & Sunset BBQ Dinner', price: 2900, duration: '6 Hours', recommended: true },
        { name: 'Dubai Marina Luxury Glass Dhow Cruise with Dinner', price: 2200, duration: '2.5 Hours', recommended: true },
        { name: 'Aquaventure Waterpark & Lost Chambers Atlantis', price: 6800, duration: 'Full Day', recommended: false },
        { name: 'Museum of the Future Priority Entry Ticket', price: 3600, duration: '3 Hours', recommended: true },
        { name: 'Miracle Garden & Global Village Evening Cultural Tour', price: 1950, duration: '5 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Private AC Sedan (Airport + City Sightseeing)', price: 5500, vehicleClass: 'Sedan (3 Pax)' },
        { name: 'Private Luxury 7-Seater SUV (Toyota Highlander)', price: 8900, vehicleClass: 'SUV (6 Pax)' },
        { name: 'Executive Mercedes E-Class VIP Chauffeur', price: 17500, vehicleClass: 'Executive Luxury' },
      ],
      visa: { name: 'UAE 30-Day Tourist eVisa (Express 48h Approval)', price: 6800, standardPrice: 5200 },
    },
    {
      name: 'Bali Island Paradise',
      slug: 'bali-island-builder',
      country: 'Indonesia',
      flag: '🇮🇩',
      tagline: 'Emerald Rice Terraces, Sacred Water Temples & Pool Villas',
      badge: 'Honeymoon Favorite',
      basePrice: 38000,
      baseFlight: 34000,
      baseHotel: 16000,
      activities: [
        { name: 'Ubud Sacred Monkey Forest & Tegalalang Jungle Swing', price: 2600, duration: 'Full Day', recommended: true },
        { name: 'Nusa Penida West Coast Island Day Speedboat Tour', price: 4400, duration: 'Full Day', recommended: true },
        { name: 'Mount Batur Sunrise Volcano Trek with Hot Springs', price: 3100, duration: '7 Hours', recommended: false },
        { name: 'Tanah Lot & Uluwatu Sunset Clifftop Temple Tour', price: 2200, duration: 'Half Day', recommended: true },
        { name: 'Ayung River White Water Rafting with Buffet Lunch', price: 2800, duration: '5 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Private AC Sedan Airport & Sightseeing Car', price: 4500, vehicleClass: 'Sedan (3 Pax)' },
        { name: 'Private 7-Seater Van with Chauffeur Guide', price: 7200, vehicleClass: 'Family Van (6 Pax)' },
      ],
      visa: { name: 'Indonesia 30-Day Electronic Visa on Arrival (e-VOA)', price: 3200, standardPrice: 2800 },
    },
    {
      name: 'Singapore Garden City',
      slug: 'singapore-city-builder',
      country: 'Singapore',
      flag: '🇸🇬',
      tagline: 'Gardens by the Bay, Marina Bay Sands & Sentosa Island',
      badge: 'Family Top Choice',
      basePrice: 48000,
      baseFlight: 31000,
      baseHotel: 22000,
      activities: [
        { name: 'Universal Studios Singapore Full Day Theme Park Pass', price: 5400, duration: 'Full Day', recommended: true },
        { name: 'Gardens by the Bay Flower Dome & Cloud Forest Entry', price: 2400, duration: '3 Hours', recommended: true },
        { name: 'Marina Bay Sands Skypark Observation Deck & Light Show', price: 2100, duration: '2 Hours', recommended: true },
        { name: 'Singapore Night Safari Tram & Walking Trail Tour', price: 3600, duration: '4 Hours', recommended: false },
        { name: 'Sentosa Cable Car Sky Pass & S.E.A. Aquarium Entry', price: 4100, duration: '5 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Private Airport & Hotel AC Transfer Sedan', price: 5200, vehicleClass: 'Sedan (3 Pax)' },
        { name: 'Private Executive Combi Van (Toyota HiAce)', price: 8500, vehicleClass: 'Van (7 Pax)' },
      ],
      visa: { name: 'Singapore 30-Day eVisa with Document Screening', price: 2800, standardPrice: 2200 },
    },
    {
      name: 'Thailand (Bangkok & Phuket)',
      slug: 'thailand-bangkok-phuket-builder',
      country: 'Thailand',
      flag: '🇹🇭',
      tagline: 'Vibrant Night Markets, Phi Phi Islands & Grand Palaces',
      badge: 'Budget Friendly',
      basePrice: 32000,
      baseFlight: 24000,
      baseHotel: 14000,
      activities: [
        { name: 'Phi Phi & Maya Bay Speedboat Tour with Snorkel & Lunch', price: 4200, duration: 'Full Day', recommended: true },
        { name: 'Bangkok Grand Palace & Wat Arun Royal Canal Tour', price: 2600, duration: 'Half Day', recommended: true },
        { name: 'Phang Nga Bay & James Bond Island Sea Canoe Tour', price: 3900, duration: 'Full Day', recommended: false },
        { name: 'Chao Phraya Princess Luxury Dinner Cruise', price: 2100, duration: '2.5 Hours', recommended: true },
        { name: 'Safari World & Marine Park Full Day with Lunch', price: 3400, duration: '6 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Private Airport & Intercity AC Sedan Transfer', price: 4200, vehicleClass: 'Sedan (3 Pax)' },
        { name: 'Private VIP Minibus Transfer with Chauffeur', price: 6800, vehicleClass: 'Minibus (8 Pax)' },
      ],
      visa: { name: 'Thailand Tourist Visa / Fast Track Assistance', price: 2200, standardPrice: 1800 },
    },
    {
      name: 'Kashmir Paradise (Srinagar & Gulmarg)',
      slug: 'kashmir-srinagar-gulmarg-builder',
      country: 'India',
      flag: '🇮🇳',
      tagline: 'Dal Lake Shikaras, Pine Meadows & Snow Peaks of Gulmarg',
      badge: 'Scenic Romance',
      basePrice: 28000,
      baseFlight: 16000,
      baseHotel: 15000,
      activities: [
        { name: 'Gulmarg Gondola Cable Car Ride (Phase 1 & Phase 2)', price: 2400, duration: '4 Hours', recommended: true },
        { name: 'Traditional Dal Lake Shikara Ride at Golden Sunset', price: 1200, duration: '2 Hours', recommended: true },
        { name: 'Pahalgam Betaab Valley & Aru Valley Sightseeing Tour', price: 2800, duration: 'Full Day', recommended: true },
        { name: 'Sonamarg Thajiwas Glacier Snow Sledge Excursion', price: 2200, duration: '5 Hours', recommended: false },
        { name: 'Mughal Gardens (Shalimar & Nishat) Guided Heritage Walk', price: 1100, duration: '3 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Dedicated AC Toyota Innova for Full Trip', price: 14000, vehicleClass: 'Innova (6 Pax)' },
        { name: 'Private Sedan Airport & Local Excursions', price: 9500, vehicleClass: 'Sedan (4 Pax)' },
      ],
      visa: { name: 'Domestic Travel (Valid Government Photo ID Required)', price: 0, standardPrice: 0 },
    },
    {
      name: 'Kerala Backwaters (Munnar & Alleppey)',
      slug: 'kerala-backwaters-builder',
      country: 'India',
      flag: '🇮🇳',
      tagline: 'Mist-Covered Tea Hills & Traditional Houseboat Cruises',
      badge: 'Nature & Ayurveda',
      basePrice: 26000,
      baseFlight: 15000,
      baseHotel: 13000,
      activities: [
        { name: 'Private Alleppey Houseboat Day Cruise with Kerala Feast', price: 4500, duration: '6 Hours', recommended: true },
        { name: 'Munnar Tea Plantation, Factory & Echo Point Jeep Tour', price: 2100, duration: 'Full Day', recommended: true },
        { name: 'Periyar Wildlife Sanctuary Boating & Spice Garden Walk', price: 1900, duration: '4 Hours', recommended: true },
        { name: 'Kathakali Dance & Kalaripayattu Martial Arts Live Show', price: 1200, duration: '2 Hours', recommended: false },
        { name: 'Kochi Fort & Chinese Fishing Nets Guided Heritage Trail', price: 1400, duration: '3 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Dedicated AC Private Car with Driver (Entire Circuit)', price: 13500, vehicleClass: 'Innova / Sedan' },
        { name: 'Airport Pick-up & Drop Transfers', price: 3800, vehicleClass: 'Sedan' },
      ],
      visa: { name: 'Domestic Travel (Valid Government Photo ID Required)', price: 0, standardPrice: 0 },
    },
    {
      name: 'Goa Coastal Getaway (North & South)',
      slug: 'goa-coastal-builder',
      country: 'India',
      flag: '🇮🇳',
      tagline: 'Golden Shorelines, Portuguese Villas & Sunset Catamarans',
      badge: 'Weekend Favorite',
      basePrice: 22000,
      baseFlight: 12000,
      baseHotel: 11000,
      activities: [
        { name: 'Dudhsagar Waterfalls Jeep Safari & Spice Farm Lunch', price: 2600, duration: 'Full Day', recommended: true },
        { name: 'Mandovi River Sunset Luxury Cruise with DJ & Drinks', price: 1500, duration: '2 Hours', recommended: true },
        { name: 'Scuba Diving & Watersports Combo at Grand Island', price: 3200, duration: '6 Hours', recommended: true },
        { name: 'Old Goa Heritage Churches & Fontainhas Latin Quarter', price: 1200, duration: '4 Hours', recommended: false },
        { name: 'South Goa Serene Beaches & Cabo de Rama Fort Tour', price: 1800, duration: '5 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Airport Return Transfers + Self Drive Car (4 Days)', price: 6800, vehicleClass: 'Car Rental / Transfer' },
        { name: 'Private AC Chauffeur Car for All Days', price: 9200, vehicleClass: 'Sedan with Driver' },
      ],
      visa: { name: 'Domestic Travel (Valid Government Photo ID Required)', price: 0, standardPrice: 0 },
    },
    {
      name: 'Rajasthan Royal Circuit (Jaipur & Udaipur)',
      slug: 'rajasthan-royal-builder',
      country: 'India',
      flag: '🇮🇳',
      tagline: 'Imperial Fortresses, Lake Palaces & Rajasthani Folk Evenings',
      badge: 'Heritage & Culture',
      basePrice: 27000,
      baseFlight: 14000,
      baseHotel: 15000,
      activities: [
        { name: 'Amber Fort Elephant / Jeep Ride & City Palace Priority Tour', price: 2200, duration: 'Half Day', recommended: true },
        { name: 'Lake Pichola Sunset Boat Cruise past Taj Lake Palace', price: 1600, duration: '2 Hours', recommended: true },
        { name: 'Chokhi Dhani Ethnic Village Cultural Night & Royal Feast', price: 1800, duration: '4 Hours', recommended: true },
        { name: 'Mehrangarh & Umaid Bhawan Palace Guided Heritage Excursion', price: 2100, duration: '5 Hours', recommended: false },
        { name: 'Jaisalmer Sam Sand Dunes Camel Safari & Kalbelia Dance', price: 2500, duration: '6 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Dedicated AC Sedan with Experienced Royal Driver', price: 12000, vehicleClass: 'Sedan (3 Pax)' },
        { name: 'Dedicated Toyota Innova Crysta for Circuit', price: 16500, vehicleClass: 'Innova (6 Pax)' },
      ],
      visa: { name: 'Domestic Travel (Valid Government Photo ID Required)', price: 0, standardPrice: 0 },
    },
    {
      name: 'Vietnam Wonders (Hanoi & Da Nang)',
      slug: 'vietnam-wonders-builder',
      country: 'Vietnam',
      flag: '🇻🇳',
      tagline: 'Halong Bay Cruise, Golden Hand Bridge & Hoi An Lanterns',
      badge: 'Trending International',
      basePrice: 39000,
      baseFlight: 28000,
      baseHotel: 16000,
      activities: [
        { name: 'Halong Bay Luxury Day Cruise with Kayaking & Cave Visit', price: 4600, duration: 'Full Day', recommended: true },
        { name: 'Ba Na Hills & Golden Hand Bridge Cable Car Excursion', price: 3800, duration: 'Full Day', recommended: true },
        { name: 'Hoi An Ancient Lantern Town & Coconut Boat Tour', price: 2100, duration: '5 Hours', recommended: true },
        { name: 'Hanoi Street Food Walking Trail with Egg Coffee', price: 1400, duration: '3 Hours', recommended: false },
        { name: 'Ninh Binh Trang An Grottoes & Mua Cave Hike', price: 3200, duration: 'Full Day', recommended: false },
      ],
      transfers: [
        { name: 'Private Airport & City Transfer Car', price: 4800, vehicleClass: 'Sedan (3 Pax)' },
        { name: 'Private Minivan with English Speaking Driver', price: 7800, vehicleClass: 'Van (6 Pax)' },
      ],
      visa: { name: 'Vietnam 30-Day Single Entry Tourist eVisa', price: 3400, standardPrice: 2800 },
    },
    {
      name: 'Switzerland & Paris Panorama',
      slug: 'switzerland-paris-builder',
      country: 'Switzerland & France',
      flag: '🇨🇭',
      tagline: 'Jungfraujoch Glacier, Lake Lucerne & Eiffel Tower Romance',
      badge: 'Dream European',
      basePrice: 115000,
      baseFlight: 68000,
      baseHotel: 52000,
      activities: [
        { name: 'Jungfraujoch Top of Europe Cogwheel Train Day Trip', price: 14500, duration: 'Full Day', recommended: true },
        { name: 'Eiffel Tower 2nd Floor & Seine River Sightseeing Cruise', price: 5800, duration: '4 Hours', recommended: true },
        { name: 'Mount Titlis Rotair Cable Car & Glacier Cliff Walk', price: 9200, duration: 'Full Day', recommended: true },
        { name: 'Louvre Museum Priority Audio Guided Tour', price: 4500, duration: '3 Hours', recommended: false },
        { name: 'Swiss Travel Pass Unlimited Transit Day Pass', price: 11000, duration: 'Full Day', recommended: true },
      ],
      transfers: [
        { name: 'Private Airport & Intercity Transfer Limousine', price: 18500, vehicleClass: 'Luxury Sedan' },
        { name: 'Station & Hotel Private Chauffeur Transfers', price: 9500, vehicleClass: 'Sedan (3 Pax)' },
      ],
      visa: { name: 'Schengen Visa Assistance & Appointment Concierge', price: 8500, standardPrice: 6500 },
    },
  ],

  tripgoasia: [
    {
      name: 'Bali Tropical Island Escape',
      slug: 'bali-tropical-package',
      country: 'Indonesia',
      flag: '🇮🇩',
      tagline: 'Pristine Beaches, Cliff Temples & Ubud Rainforest Sanctuary',
      badge: 'Top Seller Asia',
      basePrice: 480,
      baseFlight: 420,
      baseHotel: 220,
      activities: [
        { name: 'Ubud Rice Terrace, Waterfall & Jungle Swing Tour', price: 35, duration: 'Full Day', recommended: true },
        { name: 'Nusa Penida Island Speedboat Day Cruise & Snorkeling', price: 65, duration: 'Full Day', recommended: true },
        { name: 'Mount Batur Sunrise Hike & Volcanic Hot Springs', price: 45, duration: '7 Hours', recommended: false },
        { name: 'Uluwatu Sunset Temple & Fire Dance Experience', price: 30, duration: '4 Hours', recommended: true },
        { name: 'Seminyak Coastal Catamaran Sunset Party Cruise', price: 55, duration: '3 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Private AC Airport & Island Sedan Transfer', price: 50, vehicleClass: 'Sedan (3 Pax)' },
        { name: 'Private Family Minivan with Driver', price: 85, vehicleClass: 'Van (6 Pax)' },
      ],
      visa: { name: 'Indonesia 30-Day Electronic Visa on Arrival (e-VOA)', price: 45, standardPrice: 38 },
    },
    {
      name: 'Phuket & Krabi Coastal Getaway',
      slug: 'phuket-krabi-package',
      country: 'Thailand',
      flag: '🇹🇭',
      tagline: 'Emerald Waters, Limestone Cliffs & Vibrant Island Nightlife',
      badge: 'Beach Paradise',
      basePrice: 420,
      baseFlight: 380,
      baseHotel: 190,
      activities: [
        { name: 'Phi Phi Islands & Maya Bay VIP Speedboat Tour', price: 60, duration: 'Full Day', recommended: true },
        { name: 'James Bond Island Sea Kayaking in Phang Nga Bay', price: 55, duration: 'Full Day', recommended: true },
        { name: 'Krabi 4-Islands Sunset Tour with Bio-Luminescent Swim', price: 40, duration: '5 Hours', recommended: true },
        { name: 'Phuket Big Buddha & Old Town Cultural Trail', price: 28, duration: '4 Hours', recommended: false },
        { name: 'Carnival Magic & Cultural Evening Show Ticket', price: 65, duration: '4 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Private Airport Return & City Sedan Transfer', price: 45, vehicleClass: 'Sedan (3 Pax)' },
        { name: 'Private VIP Minibus Transfer', price: 75, vehicleClass: 'Minibus (8 Pax)' },
      ],
      visa: { name: 'Thailand Tourist eVisa Fast Track Processing', price: 35, standardPrice: 28 },
    },
    {
      name: 'Singapore Urban Wonder',
      slug: 'singapore-urban-package',
      country: 'Singapore',
      flag: '🇸🇬',
      tagline: 'Futuristic Architecture, Theme Parks & World-Class Dining',
      badge: 'Family Favorite',
      basePrice: 580,
      baseFlight: 410,
      baseHotel: 290,
      activities: [
        { name: 'Universal Studios Singapore All-Access Theme Park Pass', price: 75, duration: 'Full Day', recommended: true },
        { name: 'Gardens by the Bay Supertree & Cloud Forest Dome', price: 32, duration: '3 Hours', recommended: true },
        { name: 'Marina Bay Sands SkyPark Observation Deck & Drinks', price: 28, duration: '2 Hours', recommended: true },
        { name: 'Mandai Wildlife Reserve Night Safari with Tram', price: 48, duration: '4 Hours', recommended: false },
        { name: 'Sentosa Island Hopper Cable Car & Aquarium Pass', price: 56, duration: 'Full Day', recommended: false },
      ],
      transfers: [
        { name: 'Changi Airport Private Sedan Return Transfer', price: 65, vehicleClass: 'Sedan (3 Pax)' },
        { name: 'Changi Luxury VIP Van Transfer', price: 110, vehicleClass: 'Van (7 Pax)' },
      ],
      visa: { name: 'Singapore Electronic Travel Authorisation & eVisa', price: 40, standardPrice: 32 },
    },
    {
      name: 'Tokyo & Kyoto Heritage',
      slug: 'tokyo-kyoto-package',
      country: 'Japan',
      flag: '🇯🇵',
      tagline: 'High-Tech Metropolises, Shinkansen Bullet Trains & Ancient Shrines',
      badge: 'Cultural Masterpiece',
      basePrice: 890,
      baseFlight: 680,
      baseHotel: 420,
      activities: [
        { name: 'Tokyo Shibuya Sky & TeamLab Planets Immersive Pass', price: 52, duration: 'Half Day', recommended: true },
        { name: 'Mount Fuji, Lake Kawaguchi & Oshino Hakkai Day Trip', price: 95, duration: 'Full Day', recommended: true },
        { name: 'Kyoto Fushimi Inari Shrine & Arashiyama Bamboo Grove', price: 70, duration: 'Full Day', recommended: true },
        { name: 'Traditional Kimono Tea Ceremony & Gion Walking Tour', price: 45, duration: '3 Hours', recommended: false },
        { name: '7-Day Japan Rail Pass Unlimited Shinkansen Access', price: 310, duration: 'Multi-Day', recommended: true },
      ],
      transfers: [
        { name: 'Narita / Haneda Private Chauffeur Airport Transfer', price: 140, vehicleClass: 'Sedan (3 Pax)' },
        { name: 'Tokyo & Kyoto Station Luggage Forwarding & Transfer', price: 80, vehicleClass: 'Service' },
      ],
      visa: { name: 'Japan Single/Double Entry Tourist eVisa Screening', price: 55, standardPrice: 42 },
    },
    {
      name: 'Sydney & Melbourne Highlights',
      slug: 'sydney-melbourne-package',
      country: 'Australia',
      flag: '🇦🇺',
      tagline: 'Opera House Harbor Cruises, Great Ocean Road & Wildlife',
      badge: 'Southern Explorer',
      basePrice: 980,
      baseFlight: 740,
      baseHotel: 460,
      activities: [
        { name: 'Sydney Opera House Guided Tour & Harbor Bridge Climb', price: 115, duration: 'Half Day', recommended: true },
        { name: 'Blue Mountains Scenic World & Wildlife Sanctuary Pass', price: 85, duration: 'Full Day', recommended: true },
        { name: 'Melbourne Great Ocean Road & 12 Apostles Day Tour', price: 90, duration: 'Full Day', recommended: true },
        { name: 'Phillip Island Penguin Parade Sunset Viewing Deck', price: 65, duration: '5 Hours', recommended: false },
        { name: 'Yarra Valley Wine & Gourmet Farmhouse Tasting', price: 80, duration: 'Full Day', recommended: false },
      ],
      transfers: [
        { name: 'Sydney Kingsford Smith Airport Private Sedan', price: 75, vehicleClass: 'Sedan (3 Pax)' },
        { name: 'Melbourne Tullamarine Airport Private Transfer', price: 70, vehicleClass: 'Sedan (3 Pax)' },
      ],
      visa: { name: 'Australia Subclass 601 / 651 Tourist eVisitor', price: 65, standardPrice: 50 },
    },
    {
      name: 'Dubai & Abu Dhabi Oasis',
      slug: 'dubai-abudhabi-package',
      country: 'United Arab Emirates',
      flag: '🇦🇪',
      tagline: 'Gilded Architecture, Desert Safaris & Sheikh Zayed Grand Mosque',
      badge: 'Luxury Desert',
      basePrice: 540,
      baseFlight: 460,
      baseHotel: 260,
      activities: [
        { name: 'Burj Khalifa 124th Floor + Dubai Aquarium Combo Pass', price: 68, duration: 'Half Day', recommended: true },
        { name: 'Premium Red Dunes Desert Safari with BBQ Dinner', price: 42, duration: '6 Hours', recommended: true },
        { name: 'Abu Dhabi Grand Mosque & Louvre Museum Day Tour', price: 58, duration: 'Full Day', recommended: true },
        { name: 'Dubai Marina Luxury Sunset Yacht Cruise with Snacks', price: 38, duration: '2 Hours', recommended: false },
        { name: 'Ferrari World & Warner Bros World Abu Dhabi Dual Pass', price: 95, duration: 'Full Day', recommended: false },
      ],
      transfers: [
        { name: 'Dubai DXB Airport Private Sedan Return Transfer', price: 55, vehicleClass: 'Sedan (3 Pax)' },
        { name: 'Intercity Dubai to Abu Dhabi Private Transfer Car', price: 90, vehicleClass: 'Sedan' },
      ],
      visa: { name: 'UAE 30-Day Express Tourist eVisa', price: 85, standardPrice: 70 },
    },
    {
      name: 'Kuala Lumpur & Langkawi',
      slug: 'kualalumpur-langkawi-package',
      country: 'Malaysia',
      flag: '🇲🇾',
      tagline: 'Petronas Twin Towers, Batu Caves & Tropical Geoforest Island',
      badge: 'Best Value',
      basePrice: 390,
      baseFlight: 340,
      baseHotel: 180,
      activities: [
        { name: 'Petronas Twin Towers Observation Deck & Batu Caves Tour', price: 35, duration: 'Half Day', recommended: true },
        { name: 'Langkawi SkyCab Cable Car & SkyBridge Admission Ticket', price: 28, duration: '3 Hours', recommended: true },
        { name: 'Kilim Geoforest Park Mangrove Kayak & Eagle Feeding', price: 42, duration: '5 Hours', recommended: true },
        { name: 'Sunway Lagoon Theme Park Unlimited Multi-Park Pass', price: 48, duration: 'Full Day', recommended: false },
        { name: 'Genting Highlands Cable Car & Indoor Theme Park Trip', price: 38, duration: 'Full Day', recommended: false },
      ],
      transfers: [
        { name: 'KLIA Airport Private Sedan Transfer to Hotel', price: 40, vehicleClass: 'Sedan (3 Pax)' },
        { name: 'Langkawi Airport & Ferry Terminal Return Transfers', price: 30, vehicleClass: 'Van (6 Pax)' },
      ],
      visa: { name: 'Malaysia Digital Arrival Card (MDAC) & eVisa Support', price: 25, standardPrice: 18 },
    },
    {
      name: 'Vietnam Golden Bridge & Heritage',
      slug: 'vietnam-heritage-package',
      country: 'Vietnam',
      flag: '🇻🇳',
      tagline: 'Sun World Ba Na Hills, Halong Bay & Hoi An Lantern Town',
      badge: 'Top Trending',
      basePrice: 460,
      baseFlight: 390,
      baseHotel: 210,
      activities: [
        { name: 'Halong Bay UNESCO World Heritage Day Cruise & Kayaking', price: 65, duration: 'Full Day', recommended: true },
        { name: 'Ba Na Hills & Golden Bridge Giant Hands Cable Car Pass', price: 52, duration: 'Full Day', recommended: true },
        { name: 'Hoi An Ancient Town Twilight Walk & Lantern Boat Ride', price: 30, duration: '4 Hours', recommended: true },
        { name: 'Cu Chi Tunnels & Mekong Delta River Boat Discovery', price: 44, duration: 'Full Day', recommended: false },
        { name: 'Hanoi Cyclo Historic Quarter & Gourmet Street Food Tour', price: 25, duration: '3 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Private AC Airport Return Transfers (Hanoi / Da Nang)', price: 45, vehicleClass: 'Sedan (3 Pax)' },
        { name: 'Private Minivan for Central Vietnam Excursions', price: 78, vehicleClass: 'Van (6 Pax)' },
      ],
      visa: { name: 'Vietnam 30-Day Single Entry Tourist eVisa', price: 45, standardPrice: 35 },
    },
    {
      name: 'Seoul & Jeju Island Magic',
      slug: 'seoul-jeju-package',
      country: 'South Korea',
      flag: '🇰🇷',
      tagline: 'K-Culture, Gyeongbokgung Palace, Mount Hallasan & Lava Tubes',
      badge: 'K-Trend Choice',
      basePrice: 780,
      baseFlight: 590,
      baseHotel: 360,
      activities: [
        { name: 'Gyeongbokgung Palace Royal Guard & Hanbok Rental Tour', price: 38, duration: '4 Hours', recommended: true },
        { name: 'Nami Island & Petite France Scenic Day Excursion', price: 65, duration: 'Full Day', recommended: true },
        { name: 'Jeju Island Seongsan Ilchulbong & Manjanggul Lava Cave', price: 72, duration: 'Full Day', recommended: true },
        { name: 'Lotte World Adventure Indoor/Outdoor Theme Park Ticket', price: 46, duration: 'Full Day', recommended: false },
        { name: 'DMZ Korean Demilitarized Zone Educational Morning Tour', price: 58, duration: '5 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Incheon Airport AREX Express Train & Private Sedan Car', price: 55, vehicleClass: 'Sedan (3 Pax)' },
        { name: 'Jeju Airport Dedicated Island Chauffeur Car', price: 80, vehicleClass: 'SUV (4 Pax)' },
      ],
      visa: { name: 'South Korea K-ETA Electronic Travel Authorization', price: 35, standardPrice: 28 },
    },
    {
      name: 'Auckland & Queenstown Adventure',
      slug: 'newzealand-adventure-package',
      country: 'New Zealand',
      flag: '🇳🇿',
      tagline: 'Milford Sound Fjords, Hobbiton Movie Set & Alpine Thrills',
      badge: 'Ultimate Adventure',
      basePrice: 1150,
      baseFlight: 890,
      baseHotel: 540,
      activities: [
        { name: 'Milford Sound Scenic Nature Cruise & Glass-Roof Coach', price: 135, duration: 'Full Day', recommended: true },
        { name: 'Hobbiton Movie Set & Waitomo Glowworm Caves Combo', price: 160, duration: 'Full Day', recommended: true },
        { name: 'Queenstown Shotover Jet & Skyline Gondola Experience', price: 88, duration: '4 Hours', recommended: true },
        { name: 'Rotorua Te Puia Geothermal Valley & Maori Cultural Feast', price: 78, duration: '5 Hours', recommended: false },
        { name: 'Mount Cook National Park Glacier Valley Guided Hike', price: 95, duration: 'Full Day', recommended: false },
      ],
      transfers: [
        { name: 'Queenstown Airport Private AC Chauffeur Car', price: 80, vehicleClass: 'Sedan (3 Pax)' },
        { name: 'Auckland Airport Return Executive Van Transfer', price: 95, vehicleClass: 'Van (6 Pax)' },
      ],
      visa: { name: 'New Zealand NZeTA Electronic Travel Authority', price: 55, standardPrice: 45 },
    },
  ],

  technoheaven: [
    {
      name: 'Dubai VIP Executive & Marina Luxury',
      slug: 'dubai-vip-b2b-package',
      country: 'United Arab Emirates',
      flag: '🇦🇪',
      tagline: 'VIP Airport Meet & Assist, 5-Star Marina Suites & Luxury Safaris',
      badge: 'B2B Corporate VIP',
      basePrice: 2200,
      baseFlight: 1600,
      baseHotel: 1100,
      activities: [
        { name: 'Burj Khalifa At The Top SKY (148th Floor Lounge Access)', price: 450, duration: '2.5 Hours', recommended: true },
        { name: 'Royal Platinum Desert Safari in Vintage Land Rover with Dinner', price: 380, duration: '6 Hours', recommended: true },
        { name: 'Private Luxury 52ft Yacht Charter in Dubai Marina (2h)', price: 750, duration: '2 Hours', recommended: true },
        { name: 'Museum of the Future VIP Line-Skip Entry', price: 280, duration: '3 Hours', recommended: false },
        { name: 'Helicopter 17-Min Scenic Flight over The Palm & Atlantis', price: 620, duration: '17 Mins', recommended: false },
      ],
      transfers: [
        { name: 'Mercedes S-Class VIP Chauffeur Airport & City Service', price: 850, vehicleClass: 'Mercedes S-Class' },
        { name: 'Executive Cadillac Escalade SUV Chauffeur', price: 1100, vehicleClass: 'Luxury SUV' },
      ],
      visa: { name: 'UAE 30-Day Express Corporate eVisa (24-Hour Issuance)', price: 340, standardPrice: 280 },
    },
    {
      name: 'Abu Dhabi Grand Yas & Saadiyat Island',
      slug: 'abudhabi-grand-package',
      country: 'United Arab Emirates',
      flag: '🇦🇪',
      tagline: 'Louvre Abu Dhabi, Formula 1 Yas Marina & Emirates Palace Grandeur',
      badge: 'Executive Leisure',
      basePrice: 1950,
      baseFlight: 1500,
      baseHotel: 980,
      activities: [
        { name: 'Louvre Abu Dhabi VIP Guided Art & Dome Tour', price: 220, duration: '3 Hours', recommended: true },
        { name: 'Yas Marina Circuit Formula Driving / Guided Pit Walk', price: 420, duration: '3 Hours', recommended: true },
        { name: 'Sheikh Zayed Mosque Private Diplomatic Tour & Palace High Tea', price: 290, duration: '4 Hours', recommended: true },
        { name: 'Warner Bros World Abu Dhabi VIP FastPass Entry', price: 350, duration: 'Full Day', recommended: false },
        { name: 'Saadiyat Beach Club Full-Day Private Cabana Pass', price: 260, duration: 'Full Day', recommended: false },
      ],
      transfers: [
        { name: 'Private Chauffeur Mercedes E-Class Service', price: 650, vehicleClass: 'Mercedes E-Class' },
        { name: 'Luxury Sprinter VIP 12-Seater Executive Coach', price: 1250, vehicleClass: 'VIP Sprinter' },
      ],
      visa: { name: 'UAE 30-Day Express Corporate eVisa', price: 340, standardPrice: 280 },
    },
    {
      name: 'Riyadh & AlUla Heritage Circuit',
      slug: 'riyadh-alula-package',
      country: 'Saudi Arabia',
      flag: '🇸🇦',
      tagline: 'Hegra UNESCO Nabataean Tombs, Maraya Concert Hall & Boulevard Riyadh',
      badge: 'Kingdom Vision',
      basePrice: 2800,
      baseFlight: 1900,
      baseHotel: 1400,
      activities: [
        { name: 'AlUla Hegra UNESCO Heritage Private 4x4 Tour', price: 450, duration: '4 Hours', recommended: true },
        { name: 'Elephant Rock Sunset Lounge & Stargazing Experience', price: 260, duration: '3 Hours', recommended: true },
        { name: 'Diriyah At-Turaif UNESCO Mud-Brick Palace Guided Walk', price: 180, duration: '3 Hours', recommended: true },
        { name: 'Kingdom Centre Sky Bridge Observation Deck Pass', price: 140, duration: '1.5 Hours', recommended: false },
        { name: 'Edge of the World (Jebel Fihrayn) Desert Expedition', price: 380, duration: '6 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Dedicated Private 4x4 Toyota Land Cruiser with Driver', price: 950, vehicleClass: 'Land Cruiser (4 Pax)' },
        { name: 'Airport Return Chauffeur Sedan Transfers', price: 450, vehicleClass: 'Sedan (3 Pax)' },
      ],
      visa: { name: 'Saudi Arabia 1-Year Multiple Entry Tourist/Business eVisa', price: 480, standardPrice: 390 },
    },
    {
      name: 'Doha Corniche & Katara Prestige',
      slug: 'doha-prestige-package',
      country: 'Qatar',
      flag: '🇶🇦',
      tagline: 'Museum of Islamic Art, Souq Waqif Heritage & The Pearl Island Marina',
      badge: 'Gulf Hospitality',
      basePrice: 2100,
      baseFlight: 1450,
      baseHotel: 1050,
      activities: [
        { name: 'Museum of Islamic Art & National Museum of Qatar Dual Pass', price: 160, duration: 'Half Day', recommended: true },
        { name: 'Khor Al Adaid Inland Sea Monster Dunes Safari & Camp Lunch', price: 380, duration: '6 Hours', recommended: true },
        { name: 'Traditional Dhow Boat Cruise Along Doha Bay Skyline', price: 190, duration: '2 Hours', recommended: true },
        { name: 'Souq Waqif Evening Culinary & Spice Walking Trail', price: 140, duration: '3 Hours', recommended: false },
        { name: 'Katara Cultural Village & Luxury Opera House Guided Tour', price: 120, duration: '2.5 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Hamad International Airport Private Executive Sedan', price: 380, vehicleClass: 'Sedan (3 Pax)' },
        { name: 'Mercedes V-Class Luxury 7-Seater Van', price: 780, vehicleClass: 'V-Class Van' },
      ],
      visa: { name: 'Qatar Hayya / Tourist eVisa Fast Track', price: 220, standardPrice: 170 },
    },
    {
      name: 'London Mayfair & Westminster Diplomatic',
      slug: 'london-mayfair-package',
      country: 'United Kingdom',
      flag: '🇬🇧',
      tagline: 'Buckingham Palace, Thames Private River Boat & West End Theatres',
      badge: 'European Flagship',
      basePrice: 4800,
      baseFlight: 2800,
      baseHotel: 2200,
      activities: [
        { name: 'Tower of London & Crown Jewels VIP Early Access Tour', price: 280, duration: '3 Hours', recommended: true },
        { name: 'London Eye Private Capsule Champagne Experience', price: 340, duration: '1 Hour', recommended: true },
        { name: 'Windsor Castle, Stonehenge & Oxford Guided Day Trip', price: 460, duration: 'Full Day', recommended: true },
        { name: 'Westminster Abbey & Houses of Parliament Private Walk', price: 220, duration: '3 Hours', recommended: false },
        { name: 'Traditional Afternoon Tea at The Ritz London', price: 310, duration: '2 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Heathrow Airport Private Executive Chauffeur (Mercedes S-Class)', price: 720, vehicleClass: 'Executive Sedan' },
        { name: 'Dedicated London Daily Chauffeur Service', price: 1400, vehicleClass: 'Luxury Sedan' },
      ],
      visa: { name: 'UK Standard Visitor Visa Filing & Concierge Support', price: 550, standardPrice: 420 },
    },
    {
      name: 'Zurich & Lucerne Alpine Grandeur',
      slug: 'zurich-lucerne-package',
      country: 'Switzerland',
      flag: '🇨🇭',
      tagline: 'Mount Pilatus Dragon Ride, Lake Lucerne Steamers & Bahnhofstrasse',
      badge: 'Swiss Splendor',
      basePrice: 5400,
      baseFlight: 3100,
      baseHotel: 2400,
      activities: [
        { name: 'Mount Pilatus Golden Round Trip (Boat, Cogwheel & Cable Car)', price: 420, duration: 'Full Day', recommended: true },
        { name: 'Jungfraujoch Top of Europe High-Alpine Train Expedition', price: 680, duration: 'Full Day', recommended: true },
        { name: 'Lake Lucerne Scenic Yacht Cruise with Gourmet Canapes', price: 240, duration: '2 Hours', recommended: true },
        { name: 'Rhine Falls & Stein am Rhein Historic Half-Day Tour', price: 290, duration: '5 Hours', recommended: false },
        { name: 'First Cliff Walk Grindelwald Adventure Pass', price: 360, duration: 'Full Day', recommended: false },
      ],
      transfers: [
        { name: 'Zurich Airport to Lucerne Private Luxury Chauffeur', price: 850, vehicleClass: 'Luxury Sedan' },
        { name: 'First Class Swiss Travel Pass 4-Day Consecutive Pass', price: 1650, vehicleClass: 'Swiss Rail RailPass' },
      ],
      visa: { name: 'Schengen Business/Tourist Visa Documentation Assistance', price: 480, standardPrice: 380 },
    },
    {
      name: 'Singapore Sentosa & Marina Bay B2B',
      slug: 'singapore-b2b-package',
      country: 'Singapore',
      flag: '🇸🇬',
      tagline: 'Suntec Convention Proximity, Sentosa Resorts & Michelin Fine Dining',
      badge: 'MICE & Corporate',
      basePrice: 2600,
      baseFlight: 1750,
      baseHotel: 1250,
      activities: [
        { name: 'Marina Bay Sands Infinity Pool Deck & SkyPark Access', price: 190, duration: '2 Hours', recommended: true },
        { name: 'Gardens by the Bay Conservatories VIP Walking Tour', price: 160, duration: '3 Hours', recommended: true },
        { name: 'Universal Studios Singapore Corporate VIP Guided Tour', price: 420, duration: 'Full Day', recommended: true },
        { name: 'Night Safari Tram with Priority Express Line Access', price: 240, duration: '4 Hours', recommended: false },
        { name: 'Singapore River Electric Catamaran Private Dinner', price: 380, duration: '2 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Changi Airport VIP Arrival Meet & Greet with Mercedes Transfer', price: 480, vehicleClass: 'Executive Sedan' },
        { name: 'Daily Corporate Dedicated Minibus with Driver', price: 920, vehicleClass: 'Combi Minibus' },
      ],
      visa: { name: 'Singapore Business eVisa Fast Processing', price: 260, standardPrice: 200 },
    },
    {
      name: 'Istanbul & Cappadocia Historic Marvels',
      slug: 'istanbul-cappadocia-package',
      country: 'Turkey',
      flag: '🇹🇷',
      tagline: 'Hot Air Balloons over Fairy Chimneys, Bosphorus Yacht & Hagia Sophia',
      badge: 'East Meets West',
      basePrice: 2400,
      baseFlight: 1650,
      baseHotel: 1100,
      activities: [
        { name: 'Cappadocia Sunrise Hot Air Balloon Flight with Champagne', price: 580, duration: '3 Hours', recommended: true },
        { name: 'Hagia Sophia, Blue Mosque & Topkapi Palace Priority Tour', price: 240, duration: 'Full Day', recommended: true },
        { name: 'Bosphorus Sunset Private Yacht Cruise with Turkish Meze', price: 320, duration: '2 Hours', recommended: true },
        { name: 'Derinkuyu Underground City & Ihlara Valley Canyon Hike', price: 260, duration: 'Full Day', recommended: false },
        { name: 'Grand Bazaar & Spice Market Guided Shopping Trail', price: 140, duration: '3 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Istanbul New Airport Private Luxury Mercedes Vito Transfer', price: 340, vehicleClass: 'Vito VIP Van' },
        { name: 'Kayseri/Nevsehir Airport Cave Hotel Chauffeur Car', price: 280, vehicleClass: 'Sedan (3 Pax)' },
      ],
      visa: { name: 'Turkey Single/Multiple Entry eVisa Processing', price: 210, standardPrice: 160 },
    },
    {
      name: 'Cairo & Nile Royal Expedition',
      slug: 'cairo-nile-package',
      country: 'Egypt',
      flag: '🇪🇬',
      tagline: 'Great Pyramids of Giza, Grand Egyptian Museum & Nile Steamer',
      badge: 'Ancient Marvels',
      basePrice: 2300,
      baseFlight: 1550,
      baseHotel: 1020,
      activities: [
        { name: 'Giza Pyramids & Sphinx Private Egyptologist Guided Tour', price: 220, duration: 'Half Day', recommended: true },
        { name: 'Grand Egyptian Museum (GEM) Priority Admission Ticket', price: 180, duration: '4 Hours', recommended: true },
        { name: 'Nile Maxim 5-Star Luxury Dinner Cruise with Folk Show', price: 210, duration: '3 Hours', recommended: true },
        { name: 'Saqqara Step Pyramid & Memphis Ancient Capital Excursion', price: 190, duration: '5 Hours', recommended: false },
        { name: 'Khan el-Khalili Bazaar Guided Walk with Traditional Mint Tea', price: 120, duration: '3 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Cairo International Airport Private AC Sedan Transfer', price: 260, vehicleClass: 'Sedan (3 Pax)' },
        { name: 'Dedicated Cairo City Chauffeur Car for Full Itinerary', price: 620, vehicleClass: 'Sedan with Driver' },
      ],
      visa: { name: 'Egypt 30-Day Single Entry Tourist eVisa', price: 190, standardPrice: 140 },
    },
    {
      name: 'Delhi, Agra & Jaipur B2B Royal Circuit',
      slug: 'india-royal-triangle-package',
      country: 'India',
      flag: '🇮🇳',
      tagline: 'Taj Mahal Sunrise at Agra, Amber Fort Jaipur & Lutyens Delhi',
      badge: 'Heritage Triangle',
      basePrice: 1750,
      baseFlight: 1350,
      baseHotel: 850,
      activities: [
        { name: 'Taj Mahal Sunrise VIP Guided Entry & Agra Fort Excursion', price: 210, duration: 'Half Day', recommended: true },
        { name: 'Amber Palace Elephant/Jeep Safari & City Palace Jaipur Tour', price: 180, duration: 'Full Day', recommended: true },
        { name: 'Qutub Minar, Humayun Tomb & India Gate Delhi Heritage Drive', price: 160, duration: '5 Hours', recommended: true },
        { name: 'Fatehpur Sikri Deserted Mughal Capital Guided Walking Tour', price: 130, duration: '3 Hours', recommended: false },
        { name: 'Authentic Royal Indian Dinner with Cultural Folk Dances', price: 170, duration: '3 Hours', recommended: false },
      ],
      transfers: [
        { name: 'Dedicated Toyota Innova Crysta with Chauffeur for Full Golden Circuit', price: 780, vehicleClass: 'Innova Crysta' },
        { name: 'Delhi Airport Meet & Assist Chauffeur Transfer', price: 240, vehicleClass: 'Sedan (3 Pax)' },
      ],
      visa: { name: 'India 30-Day Double Entry Tourist eVisa Processing', price: 210, standardPrice: 160 },
    },
  ],
};

function generateBuildPackageOptionsForSite(siteId, currency, multiplier, rand) {
  const destList = BUILD_PACKAGE_CATALOG[siteId] || BUILD_PACKAGE_CATALOG['gujjutours'];
  const currencySymbol = siteId === 'gujjutours' ? '₹' : siteId === 'tripgoasia' ? '$' : 'AED ';

  return destList.map((dest, idx) => {
    const id = 1000 + idx;
    const isTechno = siteId === 'technoheaven';

    // Durations with price multipliers
    const durations = [
      { id: '3n-4d', nights: 3, days: 4, label: '3 Nights / 4 Days', priceMultiplier: 1.0 },
      { id: '4n-5d', nights: 4, days: 5, label: '4 Nights / 5 Days', priceMultiplier: 1.25 },
      { id: '5n-6d', nights: 5, days: 6, label: '5 Nights / 6 Days', priceMultiplier: 1.5 },
      { id: '6n-7d', nights: 6, days: 7, label: '6 Nights / 7 Days', priceMultiplier: 1.75 },
    ];

    // Flight options
    const flightOptions = [
      {
        id: 'flight-economy',
        name: 'Roundtrip Economy Flights (Scheduled Airlines)',
        type: 'Economy',
        airline: 'Premium Partner Carrier',
        baggage: '20-25kg Check-in + 7kg Cabin',
        meals: 'Complimentary Meals (Veg/Jain available)',
        pricePerPerson: dest.baseFlight,
        netPricePerPerson: isTechno ? Math.round(dest.baseFlight * 0.82) : null,
        image: '/seed-images/buildpackage/build-flight.svg',
      },
      {
        id: 'flight-business',
        name: 'Business Class Airfare with Lounge & Priority',
        type: 'Business',
        airline: 'Top Tier International Carrier',
        baggage: '40kg Check-in + Priority Check-in & Lounge',
        meals: 'Gourmet Multi-Course Dining',
        pricePerPerson: Math.round(dest.baseFlight * 2.3),
        netPricePerPerson: isTechno ? Math.round(dest.baseFlight * 2.3 * 0.82) : null,
        image: '/seed-images/buildpackage/build-flight.svg',
      },
      {
        id: 'flight-none',
        name: 'Land Package Only (No Flights / Self Arranged)',
        type: 'None',
        airline: 'Self Arranged',
        baggage: 'N/A',
        meals: 'N/A',
        pricePerPerson: 0,
        netPricePerPerson: isTechno ? 0 : null,
        image: '/seed-images/buildpackage/build-flight.svg',
      },
    ];

    // Hotel accommodation tiers
    const hotelTiers = [
      {
        id: 'hotel-3star',
        tierName: '3-Star Comfort Deluxe',
        starRating: 3,
        hotelName: `${dest.name} Comfort Deluxe Hotel`,
        highlights: 'Central location, cozy rooms, complimentary breakfast',
        inclusions: [
          'Buffet Breakfast with Pure Veg & Jain options',
          'Standard Air Conditioned Deluxe Room',
          'Free High Speed WiFi & Daily Housekeeping',
        ],
        pricePerPerson: Math.round(dest.baseHotel * 0.72),
        netPricePerPerson: isTechno ? Math.round(dest.baseHotel * 0.72 * 0.8) : null,
        image: '/seed-images/buildpackage/build-hotel.svg',
      },
      {
        id: 'hotel-4star',
        tierName: '4-Star Premium Resort & Suites',
        starRating: 4,
        hotelName: `${dest.name} Grand Panorama Resort`,
        highlights: 'Scenic view rooms, swimming pool, luxury spa access',
        inclusions: [
          'Lavish Daily Buffet Breakfast',
          'Premium Room with Balcony / Skyline View',
          'Free Swimming Pool & Fitness Center Access',
          'Complimentary Welcome Drink on Arrival',
        ],
        pricePerPerson: dest.baseHotel,
        netPricePerPerson: isTechno ? Math.round(dest.baseHotel * 0.82) : null,
        image: '/seed-images/buildpackage/build-hotel.svg',
      },
      {
        id: 'hotel-5star',
        tierName: '5-Star Ultra Luxury Palace & Villas',
        starRating: 5,
        hotelName: `${dest.name} Royal Sovereign Palace`,
        highlights: 'VIP butler service, private pool/executive club lounge, gourmet dining',
        inclusions: [
          'Gourmet Champagne & International Breakfast',
          'Executive Club Suite / Private Pool Villa',
          '24/7 Dedicated Concierge & Butler Service',
          'Early Check-in & Late Check-out Privileges',
        ],
        pricePerPerson: Math.round(dest.baseHotel * 1.85),
        netPricePerPerson: isTechno ? Math.round(dest.baseHotel * 1.85 * 0.82) : null,
        image: '/seed-images/buildpackage/build-hotel.svg',
      },
    ];

    // Activity choices
    const activityOptions = dest.activities.map((act, aIdx) => ({
      id: `act-${idx + 1}-${aIdx + 1}`,
      name: act.name,
      duration: act.duration,
      description: `Experience the best of ${dest.name} with fully escorted tours, licensed guides, and confirmed admission tickets.`,
      pricePerPerson: act.price,
      netPricePerPerson: isTechno ? Math.round(act.price * 0.82) : null,
      image: '/seed-images/buildpackage/build-activity.svg',
      isRecommended: act.recommended,
    }));

    // Transfer choices
    const transferOptions = dest.transfers.map((tr, tIdx) => ({
      id: `tr-${idx + 1}-${tIdx + 1}`,
      name: tr.name,
      vehicleClass: tr.vehicleClass,
      capacity: tr.vehicleClass.includes('SUV') ? 'Up to 6 Passengers' : tr.vehicleClass.includes('Van') ? 'Up to 7 Passengers' : 'Up to 3 Passengers',
      luggage: '3 Large Bags + 3 Hand Bags',
      priceTotal: tr.price,
      netPriceTotal: isTechno ? Math.round(tr.price * 0.82) : null,
      image: '/seed-images/buildpackage/build-transfer.svg',
    }));
    // Add "No Transfer" option
    transferOptions.push({
      id: `tr-${idx + 1}-none`,
      name: 'No Transfer (Self Arranged / Rental Car)',
      vehicleClass: 'Self Managed',
      capacity: 'N/A',
      luggage: 'N/A',
      priceTotal: 0,
      netPriceTotal: isTechno ? 0 : null,
      image: '/seed-images/buildpackage/build-transfer.svg',
    });

    // Visa options
    const visaOptions = [
      {
        id: `visa-${idx + 1}-express`,
        name: dest.visa.name,
        processingTime: '24 - 48 Hours',
        validity: '30 Days Single Entry',
        pricePerPerson: dest.visa.price,
        netPricePerPerson: isTechno ? Math.round(dest.visa.price * 0.85) : null,
        image: '/seed-images/buildpackage/build-visa.svg',
        isRequired: dest.visa.price > 0,
      },
      {
        id: `visa-${idx + 1}-standard`,
        name: `${dest.name} Standard Tourist Visa`,
        processingTime: '3 - 5 Working Days',
        validity: '30 Days Single Entry',
        pricePerPerson: dest.visa.standardPrice,
        netPricePerPerson: isTechno ? Math.round(dest.visa.standardPrice * 0.85) : null,
        image: '/seed-images/buildpackage/build-visa.svg',
        isRequired: dest.visa.standardPrice > 0,
      },
      {
        id: `visa-${idx + 1}-none`,
        name: 'Already Have Valid Visa / Visa Free Entry',
        processingTime: 'Immediate',
        validity: 'Existing Visa',
        pricePerPerson: 0,
        netPricePerPerson: isTechno ? 0 : null,
        image: '/seed-images/buildpackage/build-visa.svg',
        isRequired: false,
      },
    ];

    // Meal plans
    const mealPlans = [
      {
        id: 'breakfast-only',
        name: 'Breakfast Only (Complimentary Pure Veg & Jain Included)',
        description: 'Daily morning buffet at hotel restaurant',
        pricePerPerson: 0,
        netPricePerPerson: isTechno ? 0 : null,
      },
      {
        id: 'half-board',
        name: 'Half Board (Breakfast + Daily Dinner)',
        description: 'Includes breakfast buffet plus curated multi-course dinner daily',
        pricePerPerson: Math.round(dest.basePrice * 0.08),
        netPricePerPerson: isTechno ? Math.round(dest.basePrice * 0.08 * 0.82) : null,
      },
      {
        id: 'full-board',
        name: 'Full Board (Breakfast + Lunch + Dinner)',
        description: 'All 3 gourmet meals included with dietary customization',
        pricePerPerson: Math.round(dest.basePrice * 0.15),
        netPricePerPerson: isTechno ? Math.round(dest.basePrice * 0.15 * 0.82) : null,
      },
    ];

    return {
      id,
      destinationNumericId: id,
      destinationId: `bpo_${siteId}_${id}`,
      websiteId: siteId,
      website: siteId === 'gujjutours' ? 'website1' : siteId === 'tripgoasia' ? 'website2' : 'technoheaven',
      destinationSlug: dest.slug,
      destinationName: dest.name,
      country: dest.country,
      flag: dest.flag,
      tagline: dest.tagline,
      badge: dest.badge,
      overview: `Tailor every detail of your vacation to ${dest.name}. Select from curated durations, roundtrip flights, 3 to 5-star handpicked accommodations, priority sightseeing activities, private transfers, and hassle-free visa processing.`,
      heroImage: '/seed-images/buildpackage/build-destination.svg',
      image: '/seed-images/buildpackage/build-destination.svg',
      images: [
        '/seed-images/buildpackage/build-destination.svg',
        '/seed-images/buildpackage/build-hotel.svg',
        '/seed-images/buildpackage/build-activity.svg',
      ],
      popular: idx < 4,
      featured: idx < 3,
      rating: Math.round((4.6 + rand() * 0.35) * 10) / 10,
      reviews: 140 + Math.floor(rand() * 480),
      startingPrice: dest.basePrice,
      netStartingPrice: isTechno ? Math.round(dest.basePrice * 0.82) : null,
      currency,
      currencySymbol,
      durations,
      flightOptions,
      hotelTiers,
      activityOptions,
      transferOptions,
      visaOptions,
      mealPlans,
      customInclusions: [
        '24/7 Dedicated Trip Concierge via WhatsApp & Call',
        'Pre-departure Briefing & Digital Smartphone Vouchers',
        'All Confirmed Sightseeing Tickets with Skip-the-Line Access',
        'Private AC Transfers with Fuel, Parking & Tolls Included',
        'All Applicable Local Government Taxes and Service Surcharges',
      ],
      customExclusions: [
        'Personal Expenses (Mini Bar, Laundry, Telephone Calls)',
        'Optional Travel Insurance Policy (Available during checkout)',
        'Early Hotel Check-In / Late Check-Out (Subject to hotel policy)',
      ],
      isDemo: true,
      status: 'Active',
      createdAt: new Date('2026-10-01T00:00:00Z').toISOString(),
    };
  });
}

function main() {
  const rootDir = path.resolve(__dirname, '..', '..');
  const seedDir = path.join(rootDir, 'seed');

  console.log('Generating deterministic multi-tenant seed files (Hotels + Activities + Packages)...');

  const sites = [
    { id: 'gujjutours', cities: GUJJU_CITIES, currency: 'INR', multiplier: 75 },
    { id: 'tripgoasia', cities: TRIPGO_CITIES, currency: 'USD', multiplier: 1.1 },
    { id: 'technoheaven', cities: TECHNO_CITIES, currency: 'AED', multiplier: 4.2 },
  ];

  sites.forEach((site) => {
    const siteDir = path.join(seedDir, site.id);
    fs.mkdirSync(siteDir, { recursive: true });

    const rand = makePrng(site.id === 'gujjutours' ? 101 : site.id === 'tripgoasia' ? 202 : 303);

    // 1. Categories (Hotels + Activities + Packages)
    const categories = generateCategoriesForHotels();
    fs.writeFileSync(
      path.join(siteDir, 'categories.json'),
      JSON.stringify(categories, null, 2),
      'utf8'
    );
    console.log(`  ✓ ${site.id}: Generated ${categories.length} categories`);

    // 2. Hotels
    const hotels = generateHotelsForSite(site.id, site.cities, site.currency, site.multiplier, rand);
    fs.writeFileSync(
      path.join(siteDir, 'hotels.json'),
      JSON.stringify(hotels, null, 2),
      'utf8'
    );
    console.log(`  ✓ ${site.id}: Generated ${hotels.length} hotels`);

    // 3. Activities / Tours (>= 50 activities per website)
    const activities = generateActivitiesForSite(site.id, site.cities, site.currency, site.multiplier, rand);
    fs.writeFileSync(
      path.join(siteDir, 'activities.json'),
      JSON.stringify(activities, null, 2),
      'utf8'
    );
    console.log(`  ✓ ${site.id}: Generated ${activities.length} activities (across ${ACTIVITY_CATEGORIES.length} categories)`);

    // 4. Packages / Holidays (>= 50 packages per website)
    const packages = generatePackagesForSite(site.id, site.cities, site.currency, site.multiplier, rand);
    fs.writeFileSync(
      path.join(siteDir, 'packages.json'),
      JSON.stringify(packages, null, 2),
      'utf8'
    );
    console.log(`  ✓ ${site.id}: Generated ${packages.length} holiday packages (across ${PACKAGE_CATEGORIES.length} themes)`);

    // 5. Flights & Flight Routes (>= 50 scheduled flights per website)
    const flights = generateFlightsForSite(site.id, site.currency, site.multiplier, rand);
    fs.writeFileSync(
      path.join(siteDir, 'flights.json'),
      JSON.stringify(flights, null, 2),
      'utf8'
    );
    const flightRoutes = generatePopularRoutes(site.id, flights);
    fs.writeFileSync(
      path.join(siteDir, 'flight-routes.json'),
      JSON.stringify(flightRoutes, null, 2),
      'utf8'
    );
    console.log(`  ✓ ${site.id}: Generated ${flights.length} scheduled flights and ${flightRoutes.length} popular routes`);

    // 6. Transfers (>= 50 vehicle transfer services per website)
    const transfers = generateTransfersForSite(site.id, site.cities, site.currency, site.multiplier, rand);
    fs.writeFileSync(
      path.join(siteDir, 'transfers.json'),
      JSON.stringify(transfers, null, 2),
      'utf8'
    );
    console.log(`  ✓ ${site.id}: Generated ${transfers.length} vehicle transfers (across ${VEHICLE_TYPES.length} vehicle classes)`);

    // 7. Visas (>= 50 visa products across 14 destination countries)
    const visas = generateVisasForSite(site.id, site.currency, site.multiplier, rand);
    fs.writeFileSync(
      path.join(siteDir, 'visas.json'),
      JSON.stringify(visas, null, 2),
      'utf8'
    );
    console.log(`  ✓ ${site.id}: Generated ${visas.length} visa packages (across ${VISA_TIERS.length} visa tiers)`);

    // 8. Restaurants (>= 90 dining venues, at least 10 in every cuisine)
    const restaurants = generateRestaurantsForSite(site.id, site.cities, site.currency, site.multiplier, rand);
    fs.writeFileSync(
      path.join(siteDir, 'restaurants.json'),
      JSON.stringify(restaurants, null, 2),
      'utf8'
    );
    console.log(`  ✓ ${site.id}: Generated ${restaurants.length} restaurant venues (across ${RESTAURANT_CUISINE_CONFIG.length} cuisines)`);

    // 9. Build Package Options (>= 10 curated destination packages with customizable components)
    const buildPackageOptions = generateBuildPackageOptionsForSite(site.id, site.currency, site.multiplier, rand);
    fs.writeFileSync(
      path.join(siteDir, 'build-package-options.json'),
      JSON.stringify(buildPackageOptions, null, 2),
      'utf8'
    );
    console.log(`  ✓ ${site.id}: Generated ${buildPackageOptions.length} build package destination templates`);

    // Mirror to web/seed and backend/toursApi/seed
    const webSeedDir = path.join(rootDir, 'web', 'seed', site.id);
    const backendSeedDir = path.join(rootDir, 'backend', 'toursApi', 'seed', site.id);
    [webSeedDir, backendSeedDir].forEach((dest) => {
      fs.mkdirSync(dest, { recursive: true });
      fs.copyFileSync(path.join(siteDir, 'categories.json'), path.join(dest, 'categories.json'));
      fs.copyFileSync(path.join(siteDir, 'hotels.json'), path.join(dest, 'hotels.json'));
      fs.copyFileSync(path.join(siteDir, 'activities.json'), path.join(dest, 'activities.json'));
      fs.copyFileSync(path.join(siteDir, 'packages.json'), path.join(dest, 'packages.json'));
      fs.copyFileSync(path.join(siteDir, 'flights.json'), path.join(dest, 'flights.json'));
      fs.copyFileSync(path.join(siteDir, 'flight-routes.json'), path.join(dest, 'flight-routes.json'));
      fs.copyFileSync(path.join(siteDir, 'transfers.json'), path.join(dest, 'transfers.json'));
      fs.copyFileSync(path.join(siteDir, 'visas.json'), path.join(dest, 'visas.json'));
      fs.copyFileSync(path.join(siteDir, 'restaurants.json'), path.join(dest, 'restaurants.json'));
      fs.copyFileSync(path.join(siteDir, 'build-package-options.json'), path.join(dest, 'build-package-options.json'));
    });
  });

  console.log('✅ Deterministic seed files generated and synchronized across seed/, web/seed/, and backend/toursApi/seed/');
}

main();
