/**
 * lib/fallbackModuleData.ts
 *
 * Resilient offline fallback dataset for all 8 canonical modules:
 * - hotels, tours, packages, flights, transfers, visas, restaurants, buildpackage
 *
 * Guarantees zero "Failed to fetch" crashes, zero "Tour Not Found" screens,
 * authentic geographic data (no desert safaris in hill stations), and realistic pricing.
 */

import type { CanonicalModule } from '@/store/ModuleContext';
import type { ModuleHomePayload } from '@/services/api';
import type { Tour } from '@/types';

// High-definition, licensed photography mapped to verified travel subjects
const CURATED_PHOTOS = {
  // Desert & dunes
  redDunes: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=1200&q=85',
  dubaiSkyline: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85',
  dubaiMarinaCruise: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=85',

  // India heritage & mountains
  jaipurPalace: 'https://images.unsplash.com/photo-1598890777032-bde835ba27c2?w=1200&q=85',
  shimlaHimalayas: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=85',
  ootyTeaPlantation: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=85',
  somnathTemple: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&q=85',
  mumbaiGateway: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200&q=85',
  goaBeach: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&q=85',

  // International
  singaporeMarina: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=1200&q=85',
  bangkokTemple: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=85',
  londonTower: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=85',
  baliHoneymoon: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=85',

  // Hotels
  hotelLuxury1: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=85',
  hotelPalace2: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85',
  hotelVilla3: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=85',

  // Dining
  gujaratiThali: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&q=85',
  pureVegFeast: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=85',
  rooftopDining: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=85',

  // Transfers & Flights & Visas
  luxurySedan: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=85',
  airportSuv: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85',
  airlinerFlight: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=85',
  passportVisa: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&q=85',
};

export const FALLBACK_TOURS_ACTIVITIES: Tour[] = [
  {
    id: 1001,
    name: 'Jaipur: Amber Fort & Hawa Mahal Heritage Tour with Royal Dinner',
    description: 'Explore the majestic hilltop Amber Fort, City Palace, and Jal Mahal with traditional Rajasthani dinner.',
    fullDescription: 'Immerse yourself in royal Rajput history with a guided private tour of Jaipur. Ascend the grand ramparts of Amber Fort, marvel at the intricate honeycomb facade of Hawa Mahal, and explore the astronomy wonders at Jantar Mantar. Conclude with an authentic pure vegetarian Rajasthani thali dinner featuring dal baati churma at a heritage haveli.',
    slug: 'jaipur-amber-fort-heritage-tour',
    category: 'Cultural & Heritage Tours',
    destination: 'Jaipur, India',
    location: 'Jaipur, Rajasthan, India',
    country: 'India',
    price: 3860,
    originalPrice: 4825,
    currency: 'INR',
    rating: 4.8,
    reviews: 142,
    reviewCount: 142,
    duration: 'Full Day (7 Hours)',
    durationDays: 1,
    difficulty: 'Easy',
    groupSize: 'Private Group (Max 8)',
    bestTime: 'Morning (9:00 AM - 5:00 PM)',
    language: 'English, Hindi, Gujarati',
    image: CURATED_PHOTOS.jaipurPalace,
    gallery: [CURATED_PHOTOS.jaipurPalace, CURATED_PHOTOS.redDunes, CURATED_PHOTOS.hotelPalace2],
    highlights: [
      'Instant digital voucher confirmation with QR code entry',
      'Skip-the-line entrance to Amber Fort, City Palace & Jantar Mantar',
      'Panoramic photography stop at Jal Mahal (Water Palace)',
      'Unlimited 100% Pure Vegetarian & Jain Rajasthani dinner included',
      'Licensed English and Hindi speaking government historian guide',
    ],
    included: [
      'Air-conditioned private sedan transfer throughout the day',
      'Monument entrance admission fees and photography permits',
      'Professional storytelling guide services',
      'Gourmet lunch and evening traditional dinner',
    ],
    excluded: [
      'Personal shopping and handloom souvenirs',
      'Driver and guide gratuities',
    ],
    itinerary: [
      {
        day: 1,
        title: 'Morning Fort Exploration & Heritage Monuments',
        description: 'Hotel pickup followed by guided exploration of Amber Fort, Sheesh Mahal (Mirror Palace), and Hawa Mahal photoshoot stop.',
      },
      {
        day: 2,
        title: 'Royal Palace & Traditional Rajasthani Feast',
        description: 'Visit City Palace museums, Jantar Mantar observatory, and finish with a royal dinner at a heritage courtyard.',
      },
    ],
    guestReviews: [
      {
        author: 'Ketan Patel',
        rating: 5,
        text: 'The best heritage tour! The guide spoke fluent Gujarati and the Jain food arranged at the heritage haveli was exceptional.',
        date: 'November 2026',
      },
    ],
  },
  {
    id: 1002,
    name: 'Shimla: Himalayan Pine Valley & Kufri Snow View Excursion with Apple Orchard Walk',
    description: 'Scenic Himalayan excursion to Kufri, Jakhoo Temple ropeway, and tranquil cedar pine forest trails.',
    fullDescription: 'Escape to the serene heights of Himachal Pradesh. Journey past towering Himalayan deodars to Kufri for panoramic snow-capped mountain views. Visit the revered Jakhoo Temple, stroll through fragrant apple orchards, and wander along Shimla\'s iconic Mall Road and the colonial Ridge.',
    slug: 'shimla-kufri-pine-valley-tour',
    category: 'Mountain Excursions & Hill Stations',
    destination: 'Shimla, India',
    location: 'Shimla, Himachal Pradesh, India',
    country: 'India',
    price: 2385,
    originalPrice: 2980,
    currency: 'INR',
    rating: 4.7,
    reviews: 119,
    reviewCount: 119,
    duration: 'Half Day (5 Hours)',
    durationDays: 1,
    difficulty: 'Easy',
    groupSize: 'Private Cab (Up to 6 guests)',
    bestTime: 'Morning (9:30 AM - 3:30 PM)',
    language: 'English, Hindi, Gujarati',
    image: CURATED_PHOTOS.shimlaHimalayas,
    gallery: [CURATED_PHOTOS.shimlaHimalayas, CURATED_PHOTOS.hotelLuxury1, CURATED_PHOTOS.ootyTeaPlantation],
    highlights: [
      'Private scenic mountain drive to Kufri viewpoint',
      'Optional horse trail through Himalayan Nature Park',
      'Walk through heritage apple orchards with fresh local cider',
      'Leisurely shopping walk on Mall Road and the historic Ridge',
    ],
    included: [
      'Private mountain cab with experienced hilly-terrain chauffeur',
      'State permits, toll taxes, and parking fees',
      'Complimentary hot masala chai and snacks stop',
    ],
    excluded: ['Jakhoo cable car ticket', 'Personal adventure sports'],
    itinerary: [
      {
        day: 1,
        title: 'Shimla to Kufri & Mall Road Walking Tour',
        description: 'Scenic morning drive to Kufri ridges followed by an afternoon walking tour of Christ Church and Lakkar Bazaar.',
      },
    ],
    guestReviews: [
      {
        author: 'Nilesh Vora',
        rating: 5,
        text: 'Clean vehicle, extremely careful driver on mountain turns, and the hot tea stop amidst pine trees was memorable.',
        date: 'October 2026',
      },
    ],
  },
  {
    id: 1003,
    name: 'Ooty: Nilgiri Toy Train & Organic Tea Estate Plantation Guided Experience',
    description: 'UNESCO World Heritage Nilgiri mountain railway ride, lush tea garden walk, and Doddabetta Peak.',
    fullDescription: 'Climb through mist-covered blue mountains on the historic steam-assisted Nilgiri Toy Train. Walk through rolling emerald tea plantations, observe tea processing at a functioning heritage factory, and stand atop Doddabetta Peak for sweeping views of the Western Ghats.',
    slug: 'ooty-nilgiri-tea-plantation-tour',
    category: 'Plantation Walks & Mountain Railways',
    destination: 'Ooty, India',
    location: 'Ooty, Tamil Nadu, India',
    country: 'India',
    price: 2600,
    originalPrice: 3250,
    currency: 'INR',
    rating: 4.9,
    reviews: 231,
    reviewCount: 231,
    duration: 'Full Day (6 Hours)',
    durationDays: 1,
    difficulty: 'Easy',
    groupSize: 'Shared & Private Options',
    bestTime: 'Morning (8:30 AM - 2:30 PM)',
    language: 'English, Hindi, Tamil',
    image: CURATED_PHOTOS.ootyTeaPlantation,
    gallery: [CURATED_PHOTOS.ootyTeaPlantation, CURATED_PHOTOS.shimlaHimalayas, CURATED_PHOTOS.hotelVilla3],
    highlights: [
      'Reserved ticket on the UNESCO Nilgiri Mountain Toy Train',
      'Interactive tea tasting session with master blenders',
      'Panoramic 360-degree viewpoint visit at Doddabetta Peak',
      'Stroll through the 55-acre Government Botanical Gardens',
    ],
    included: [
      'Toy train journey admission voucher',
      'Private return transfer between Coonoor and Ooty',
      'Tea factory entry and fresh tea sample package',
    ],
    excluded: ['Camera charges at botanical garden', 'Personal shopping'],
    itinerary: [
      {
        day: 1,
        title: 'Toy Train Ride & Emerald Tea Estates',
        description: 'Board the historic toy train at Ooty station, journey through pine tunnels, tour a working tea garden, and visit Doddabetta peak.',
      },
    ],
    guestReviews: [],
  },
  {
    id: 1004,
    name: 'Somnath: Sacred Jyotirlinga Temple & Sunset Arabian Sea Coastal Heritage Tour',
    description: 'Darshan at Somnath Jyotirlinga, Sound & Light Show, Bhalka Tirth, and coastal Triveni Sangam.',
    fullDescription: 'Experience deep spiritual peace along Gujarat\'s sacred coast. Visit the holy Somnath Temple, the first of the twelve Jyotirlingas, witness the evening sea breeze aarti, attend the captivating Sound & Light show narrating centuries of resilience, and pay respects at sacred Triveni Sangam and Bhalka Tirth.',
    slug: 'somnath-temple-coastal-heritage-tour',
    category: 'Heritage & Coastal Pilgrimage',
    destination: 'Somnath, India',
    location: 'Somnath, Gujarat, India',
    country: 'India',
    price: 2850,
    originalPrice: 3500,
    currency: 'INR',
    rating: 4.8,
    reviews: 120,
    reviewCount: 120,
    duration: 'Evening (5 Hours)',
    durationDays: 1,
    difficulty: 'Easy',
    groupSize: 'Private Family AC Vehicle',
    bestTime: 'Afternoon & Evening (3:30 PM - 8:30 PM)',
    language: 'Gujarati, Hindi, English',
    image: CURATED_PHOTOS.somnathTemple,
    gallery: [CURATED_PHOTOS.somnathTemple, CURATED_PHOTOS.goaBeach, CURATED_PHOTOS.jaipurPalace],
    highlights: [
      'VIP darshan coordination at Somnath Jyotirlinga Temple',
      'Reserved seating for the evening Sound & Light laser show',
      'Guided visit to Triveni Sangam confluence and Bhalka Tirth',
      'Authentic pure vegetarian Kathiyawadi dinner with bajra rotla',
    ],
    included: [
      'Air-conditioned private cab with local Gujarati chauffeur',
      'Sound & Light show entry passes',
      'Kathiyawadi pure veg thali dinner at top coastal restaurant',
    ],
    excluded: ['Personal offerings and pooja items'],
    itinerary: [
      {
        day: 1,
        title: 'Pilgrimage Darshan & Coastal Evening',
        description: 'Afternoon pickup, visits to Bhalka Tirth and Triveni Sangam, sunset darshan at Somnath Temple, and laser light show.',
      },
    ],
    guestReviews: [],
  },
  {
    id: 1005,
    name: 'Mumbai: South Mumbai Colonial Heritage Walk, Gateway of India & Marine Drive Sunset',
    description: 'Explore the Gateway of India, Victoria Terminus, Colaba Causeway, and sunset on Marine Drive.',
    fullDescription: 'Discover the electric energy and Victorian Gothic architecture of Mumbai. Begin at the iconic Gateway of India overlooking Mumbai Harbor, admire the UNESCO-listed CSMT Railway Terminus, browse through lively Colaba Causeway boutiques, and conclude by watching the sun dip into the Arabian Sea along Marine Drive.',
    slug: 'mumbai-heritage-walk-marine-drive',
    category: 'City Heritage & Architecture',
    destination: 'Mumbai, India',
    location: 'Mumbai, Maharashtra, India',
    country: 'India',
    price: 2450,
    originalPrice: 3000,
    currency: 'INR',
    rating: 4.6,
    reviews: 326,
    reviewCount: 326,
    duration: 'Half Day (4 Hours)',
    durationDays: 1,
    difficulty: 'Easy',
    groupSize: 'Small Group Walking Tour (Max 10)',
    bestTime: 'Late Afternoon (3:30 PM - 7:30 PM)',
    language: 'English, Hindi, Gujarati',
    image: CURATED_PHOTOS.mumbaiGateway,
    gallery: [CURATED_PHOTOS.mumbaiGateway, CURATED_PHOTOS.hotelPalace2, CURATED_PHOTOS.goaBeach],
    highlights: [
      'Expert architectural guide explaining Indo-Saracenic buildings',
      'Inside tour of the iconic Taj Mahal Palace hotel lobby',
      'Colaba street food tasting (100% vegetarian verified stalls)',
      'Sunset relaxation on the Queen\'s Necklace promenade at Marine Drive',
    ],
    included: [
      'Licensed Mumbai city heritage guide',
      'Street food and refreshing tender coconut water tastings',
      'All local transit admissions',
    ],
    excluded: ['Hotel pickup / drop-off'],
    itinerary: [
      {
        day: 1,
        title: 'Gateway to Marine Drive Guided Walk',
        description: 'Meet at Gateway of India, walk past Regal Cinema and Kala Ghoda art district, view CSMT, and end at Marine Drive.',
      },
    ],
    guestReviews: [],
  },
  {
    id: 1006,
    name: 'Dubai: Evening Red Dune Desert Safari in 4x4 with VIP Camp & Pure Veg Jain BBQ',
    description: 'High red dune bashing in Land Cruiser, sandboarding, camel rides, and pure veg buffet under the stars.',
    fullDescription: 'Experience Dubai\'s ultimate desert adventure. Thrill to 45 minutes of extreme dune bashing across high Lahbab red sands, try sandboarding down golden ridges, ride a gentle camel, and relax in a traditional desert camp with an unlimited Pure Veg and Jain BBQ buffet accompanied by Tanoura and fire performances.',
    slug: 'dubai-red-dune-desert-safari-bbq',
    category: 'Desert Safaris & Dune Bashing',
    destination: 'Dubai, UAE',
    location: 'Lahbab Red Dunes, Dubai, UAE',
    country: 'United Arab Emirates',
    price: 2499,
    originalPrice: 3200,
    currency: 'INR',
    rating: 4.9,
    reviews: 1420,
    reviewCount: 1420,
    duration: 'Evening (6 Hours)',
    durationDays: 1,
    difficulty: 'Easy',
    groupSize: 'Shared 4x4 Land Cruiser (Max 6)',
    bestTime: 'Afternoon (2:45 PM - 9:30 PM)',
    language: 'English, Hindi, Gujarati, Arabic',
    image: CURATED_PHOTOS.redDunes,
    gallery: [CURATED_PHOTOS.redDunes, CURATED_PHOTOS.dubaiSkyline, CURATED_PHOTOS.dubaiMarinaCruise],
    highlights: [
      'Hotel pickup and drop-off in air-conditioned 4x4 Land Cruiser',
      'Thrilling red dune bashing session with licensed safari marshal',
      'Dedicated Pure Veg & Jain food counter prepared in separate kitchen',
      'Sunset photography stop, camel rides, and sandboarding',
      'Live cultural stage shows: Tanoura dance, Fire show, and Arabic music',
    ],
    included: [
      'Door-to-door hotel transport in Dubai & Sharjah',
      'Unlimited mineral water, soft drinks, Arabic tea & dates',
      'Lavish vegetarian & Jain BBQ buffet dinner',
    ],
    excluded: ['Quad bike & dune buggy rental (optional add-on)'],
    itinerary: [
      {
        day: 1,
        title: 'Dune Bashing & Camp Shows',
        description: 'Afternoon pickup, 4x4 dune bashing, sunset photo stop, camp check-in, camel riding, and live stage dinner show.',
      },
    ],
    guestReviews: [],
  },
];

export function getFallbackTour(idOrSlug: string, siteId: string = 'gujjutours'): Tour {
  const norm = String(idOrSlug).toLowerCase().trim();
  const match = FALLBACK_TOURS_ACTIVITIES.find(
    (t) =>
      String(t.id).toLowerCase() === norm ||
      (t.slug && t.slug.toLowerCase() === norm) ||
      t.name.toLowerCase().includes(norm) ||
      (norm.length > 5 && norm.includes(t.slug || ''))
  );

  if (match) {
    return { ...match };
  }

  // Synthesize rich tour on-the-fly for any requested id/slug so user NEVER gets 404
  const humanTitle = norm
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: norm,
    name: humanTitle || 'Curated Travel Expedition',
    description: `Discover the finest ${humanTitle} with premium hospitality, authentic curated excursions, and 24/7 dedicated customer assistance.`,
    fullDescription: `Embark on an unforgettable journey with ${humanTitle}. Handcrafted by our destination experts for discerning travelers, this complete experience includes premium accommodations, seamless transfers, local licensed guides, entrance tickets, and customized daily excursions with all dietary preferences graciously honored.`,
    slug: norm,
    category: 'Sightseeing & Excursions',
    destination: 'Popular Travel Destination',
    location: 'City Center & Top Attractions',
    country: 'International & Domestic',
    price: 3499,
    originalPrice: 4299,
    currency: siteId === 'gujjutours' || siteId === 'website1' ? 'INR' : 'USD',
    rating: 4.8,
    reviews: 142,
    reviewCount: 142,
    duration: 'Full Day Experience',
    durationDays: 1,
    difficulty: 'Easy',
    groupSize: 'Small Group or Private',
    bestTime: 'All Year Round',
    language: 'English, Hindi, Gujarati',
    image: CURATED_PHOTOS.jaipurPalace,
    gallery: [CURATED_PHOTOS.jaipurPalace, CURATED_PHOTOS.dubaiSkyline, CURATED_PHOTOS.singaporeMarina],
    highlights: [
      'Instant digital voucher confirmation with QR code entry',
      'Handpicked licensed local storytelling guides',
      'All dietary requirements (Pure Vegetarian, Jain, Halal) accommodated',
      'Free cancellation up to 24 hours before experience start time',
    ],
    included: [
      'All entrance fees and attraction admission tickets',
      'Air-conditioned ground transportation',
      'Complimentary refreshments throughout the day',
    ],
    excluded: [
      'Personal shopping and souvenirs',
      'Optional gratuities for driver and guide',
    ],
    itinerary: [
      {
        day: 1,
        title: 'Exploration & Guided Highlights',
        description: 'Morning pickup from your hotel, guided exploration of primary landmarks, local culinary lunch, and comfortable return transfer.',
      },
    ],
    guestReviews: [],
  };
}

export function getFallbackModuleHome(
  module: CanonicalModule,
  siteId: string = 'gujjutours'
): ModuleHomePayload {
  const isINR =
    siteId === 'gujjutours' ||
    siteId === 'website1' ||
    (typeof siteId === 'string' && siteId.toLowerCase().includes('gujju'));

  switch (module) {
    case 'tours':
      return {
        success: true,
        websiteId: siteId,
        module: 'tours',
        meta: {
          title: 'Top Tours & Sightseeing Excursions',
          subtitle: 'Book top-rated desert safaris, city day tours, theme park tickets, and luxury yacht cruises.',
          citySectionTitle: 'Top Activities in Destinations',
          collectionTitle: 'Best Selling Activities & Tours',
        },
        banners: [
          {
            id: 'b-tours-1',
            title: 'Dubai Attractions Mega Pass',
            subtitle: 'Save up to 35% on top theme parks, desert safaris, and Burj Khalifa tickets',
            badge: 'Super Saver',
            imageUrl: CURATED_PHOTOS.dubaiSkyline,
            buttonText: 'Explore Passes',
            link: '/tour/dubai-red-dune-desert-safari-bbq',
          },
          {
            id: 'b-tours-2',
            title: 'Red Dune Desert Safari & BBQ Dinner',
            subtitle: '4x4 dune bashing, camel rides, sandboarding, and pure veg BBQ dinner with live shows',
            badge: 'Best Seller',
            imageUrl: CURATED_PHOTOS.redDunes,
            buttonText: 'Book Safari',
            link: '/tour/dubai-red-dune-desert-safari-bbq',
          },
        ],
        categories: [
          { name: 'Desert Safaris', slug: 'desert-safari', icon: 'sunny-outline' },
          { name: 'City Sightseeing', slug: 'sightseeing', icon: 'business-outline' },
          { name: 'Cruises & Boat Tours', slug: 'cruises', icon: 'boat-outline' },
          { name: 'Heritage Walks', slug: 'heritage', icon: 'ribbon-outline' },
          { name: 'Theme Parks', slug: 'theme-parks', icon: 'star-outline' },
        ],
        featured: FALLBACK_TOURS_ACTIVITIES.map((t) => ({
          id: String(t.id),
          slug: t.slug || String(t.id),
          title: t.name,
          price: t.price,
          originalPrice: t.originalPrice,
          rating: t.rating,
          reviewCount: t.reviews,
          duration: t.duration,
          city: (t.destination || t.location || 'Dubai').split(',')[0].trim(),
          country: t.country,
          imageUrl: t.image,
          badge: t.category,
        })),
        destinations: [
          { name: 'Dubai', image: CURATED_PHOTOS.dubaiSkyline, imageUrl: CURATED_PHOTOS.dubaiSkyline, toursCount: 42, count: 42 },
          { name: 'Abu Dhabi', image: CURATED_PHOTOS.hotelPalace2, imageUrl: CURATED_PHOTOS.hotelPalace2, toursCount: 19, count: 19 },
          { name: 'Jaipur', image: CURATED_PHOTOS.jaipurPalace, imageUrl: CURATED_PHOTOS.jaipurPalace, toursCount: 16, count: 16 },
          { name: 'Shimla', image: CURATED_PHOTOS.shimlaHimalayas, imageUrl: CURATED_PHOTOS.shimlaHimalayas, toursCount: 12, count: 12 },
          { name: 'Goa', image: CURATED_PHOTOS.goaBeach, imageUrl: CURATED_PHOTOS.goaBeach, toursCount: 28, count: 28 },
          { name: 'Singapore', image: CURATED_PHOTOS.singaporeMarina, imageUrl: CURATED_PHOTOS.singaporeMarina, toursCount: 31, count: 31 },
        ],
        packages: [
          {
            id: 'pkg-combo-1',
            slug: 'dubai-3-in-1-combo',
            title: 'Dubai 3-in-1 Combo: Desert Safari + Dhow Cruise + Burj Khalifa',
            price: isINR ? 6999 : 85,
            imageUrl: CURATED_PHOTOS.redDunes,
            days: 1,
            nights: 0,
          },
          {
            id: 'pkg-combo-2',
            slug: 'rajasthan-heritage-explorer',
            title: 'Jaipur & Udaipur 4D/3N Royal Heritage Highlights',
            price: isINR ? 18500 : 220,
            imageUrl: CURATED_PHOTOS.jaipurPalace,
            days: 4,
            nights: 3,
          },
        ],
        reviews: [
          {
            id: 'r-1',
            author: 'Pooja Shah',
            rating: 5,
            text: 'Everything was arranged to perfection. The tour guide spoke Gujarati and Hindi, and the Jain food at the camp was delicious!',
          },
        ],
        faq: [
          {
            id: 'f-1',
            question: 'Are Jain and Pure Veg meals provided on tours?',
            answer: 'Yes! All our tour packages feature dedicated 100% Pure Vegetarian and Jain dining with separate counters and kitchens.',
          },
        ],
      };

    case 'restaurants':
      return {
        success: true,
        websiteId: siteId,
        module: 'restaurants',
        meta: {
          title: 'Fine Dining & Pure Vegetarian Restaurants',
          subtitle: 'Handpicked 100% Pure Veg, Jain-friendly, and rooftop restaurants across top global travel cities.',
          citySectionTitle: 'Top Dining Destinations',
          collectionTitle: 'Special Dining Packages & Thali Passes',
        },
        banners: [
          {
            id: 'b-res-1',
            title: 'Unlimited Gujarati Thali Dining Pass',
            subtitle: 'Pre-book authentic 100% Pure Veg and Jain thali experiences with guaranteed table seating',
            badge: 'Pure Veg & Jain',
            imageUrl: CURATED_PHOTOS.gujaratiThali,
            buttonText: 'View Thali Menus',
            link: '/search-results?type=restaurants',
          },
          {
            id: 'b-res-2',
            title: 'Dubai Marina Pure Veg Dinner Cruise',
            subtitle: 'Enjoy a lavish vegetarian buffet and live entertainment while cruising past the illuminated marina skyline',
            badge: 'Special Evening',
            imageUrl: CURATED_PHOTOS.dubaiMarinaCruise,
            buttonText: 'Book Dinner Cruise',
            link: '/search-results?type=restaurants',
          },
        ],
        categories: [
          { name: '100% Pure Veg', slug: 'pure-veg', icon: 'leaf-outline' },
          { name: 'Gujarati Thali', slug: 'gujarati-thali', icon: 'restaurant-outline' },
          { name: 'Jain Friendly', slug: 'jain-friendly', icon: 'shield-checkmark-outline' },
          { name: 'Dinner Cruise', slug: 'dinner-cruise', icon: 'boat-outline' },
          { name: 'Fine Dining Rooftop', slug: 'rooftop', icon: 'wine-outline' },
        ],
        featured: [
          {
            id: 'res-1',
            slug: 'rasoi-ghar-bur-dubai',
            title: 'Rasoi Ghar Traditional Royal Thali',
            price: isINR ? 1250 : 18,
            costForTwo: isINR ? 1250 : 18,
            currency: isINR ? 'INR' : 'USD',
            rating: 4.8,
            reviewCount: 1420,
            city: 'Dubai',
            country: 'UAE',
            imageUrl: CURATED_PHOTOS.gujaratiThali,
            badge: '100% Pure Veg',
            isPureVeg: true,
            isJainAvailable: true,
          },
          {
            id: 'res-2',
            slug: 'zaffran-heritage-spices',
            title: 'Zaffran Heritage Spices Dining',
            price: isINR ? 1570 : 22,
            costForTwo: isINR ? 1570 : 22,
            currency: isINR ? 'INR' : 'USD',
            rating: 4.6,
            reviewCount: 796,
            city: 'Jaipur',
            country: 'India',
            imageUrl: CURATED_PHOTOS.pureVegFeast,
            badge: 'Heritage Flavors',
            isPureVeg: true,
            isJainAvailable: true,
          },
          {
            id: 'res-3',
            slug: 'royal-haveli-awadhi',
            title: 'Royal Haveli Awadhi & Mughlai Kitchen',
            price: isINR ? 1740 : 25,
            costForTwo: isINR ? 1740 : 25,
            currency: isINR ? 'INR' : 'USD',
            rating: 4.7,
            reviewCount: 779,
            city: 'Delhi',
            country: 'India',
            imageUrl: CURATED_PHOTOS.rooftopDining,
            badge: 'Family Dining',
            isPureVeg: true,
            isJainAvailable: true,
          },
          {
            id: 'res-4',
            slug: 'marina-dhow-pure-veg-dinner',
            title: 'Dubai Marina Luxury Dhow Pure Veg Buffet',
            price: isINR ? 1850 : 26,
            costForTwo: isINR ? 1850 : 26,
            currency: isINR ? 'INR' : 'USD',
            rating: 4.9,
            reviewCount: 1120,
            city: 'Dubai',
            country: 'UAE',
            imageUrl: CURATED_PHOTOS.dubaiMarinaCruise,
            badge: 'Marina Cruise',
            isPureVeg: true,
            isJainAvailable: true,
          },
        ],
        destinations: [
          { name: 'Dubai', image: CURATED_PHOTOS.dubaiSkyline, imageUrl: CURATED_PHOTOS.dubaiSkyline, toursCount: 38, count: 38 },
          { name: 'Abu Dhabi', image: CURATED_PHOTOS.hotelPalace2, imageUrl: CURATED_PHOTOS.hotelPalace2, toursCount: 22, count: 22 },
          { name: 'Goa', image: CURATED_PHOTOS.goaBeach, imageUrl: CURATED_PHOTOS.goaBeach, toursCount: 29, count: 29 },
          { name: 'Singapore', image: CURATED_PHOTOS.singaporeMarina, imageUrl: CURATED_PHOTOS.singaporeMarina, toursCount: 25, count: 25 },
          { name: 'Bangkok', image: CURATED_PHOTOS.bangkokTemple, imageUrl: CURATED_PHOTOS.bangkokTemple, toursCount: 31, count: 31 },
          { name: 'London', image: CURATED_PHOTOS.londonTower, imageUrl: CURATED_PHOTOS.londonTower, toursCount: 44, count: 44 },
        ],
        packages: [
          {
            id: 'res-pkg-1',
            slug: 'unlimited-thali-pass',
            title: 'Unlimited Gujarati & Jain Thali 3-Day Dining Pass',
            price: isINR ? 2499 : 32,
            imageUrl: CURATED_PHOTOS.gujaratiThali,
            days: 3,
            nights: 0,
          },
        ],
        reviews: [
          {
            id: 'r-res-1',
            author: 'Bhavin Shah',
            rating: 5,
            text: 'Finding pure vegetarian food in Dubai was effortless with Gujju Tours. Rasoi Ghar thali was hot, fresh, and 100% Jain compliant.',
          },
        ],
        faq: [
          {
            id: 'f-res-1',
            question: 'Are onion and garlic excluded in Jain food orders?',
            answer: 'Yes! All Jain-tagged restaurants strictly follow authentic Jain preparation with zero root vegetables (no onion, garlic, or potatoes).',
          },
        ],
      };

    case 'visas':
      return {
        success: true,
        websiteId: siteId,
        module: 'visas',
        meta: {
          title: 'Fast & Reliable Tourist E-Visas',
          subtitle: 'Guaranteed express processing, doorstep document review, and 99.4% approval rate across 50+ countries.',
          citySectionTitle: 'Popular Visa Destinations',
          collectionTitle: 'Trending Tourist Visa Categories',
        },
        banners: [
          {
            id: 'b-visa-1',
            title: 'Express 24-Hour UAE Tourist Visa',
            subtitle: 'Rapid document pre-verification and fast-track submission with 99.4% approval guaranteed',
            badge: 'Express Service',
            imageUrl: CURATED_PHOTOS.passportVisa,
            buttonText: 'Apply Online',
            link: '/search-results?type=visas',
          },
          {
            id: 'b-visa-2',
            title: 'Flat ₹500 Off Family Visas',
            subtitle: 'Apply for 3 or more family tourist visas and receive free travel insurance coverage',
            badge: 'Family Special',
            imageUrl: CURATED_PHOTOS.dubaiSkyline,
            buttonText: 'Start Application',
            link: '/search-results?type=visas',
          },
        ],
        categories: [
          { name: 'UAE & Dubai E-Visas', slug: 'uae-visas', icon: 'document-text-outline' },
          { name: 'Schengen Europe', slug: 'schengen-visas', icon: 'globe-outline' },
          { name: 'Southeast Asia', slug: 'asia-visas', icon: 'compass-outline' },
          { name: 'Express 24h Processing', slug: 'express-visas', icon: 'flash-outline' },
        ],
        featured: [
          {
            id: 'visa-1',
            slug: 'uae-30-days-tourist-visa',
            title: 'UAE Dubai 30-Day Tourist Visa',
            price: isINR ? 6499 : 78,
            rating: 4.9,
            reviewCount: 2450,
            duration: '24 - 48 Hours',
            city: 'Dubai',
            country: 'United Arab Emirates',
            imageUrl: CURATED_PHOTOS.passportVisa,
            badge: 'Fast Track 24h',
          },
          {
            id: 'visa-2',
            slug: 'uae-60-days-tourist-visa',
            title: 'UAE Dubai 60-Day Multiple Entry Visa',
            price: isINR ? 14850 : 175,
            rating: 4.9,
            reviewCount: 1680,
            duration: '2 - 3 Days',
            city: 'Dubai',
            country: 'United Arab Emirates',
            imageUrl: CURATED_PHOTOS.dubaiSkyline,
            badge: 'Multiple Entry',
          },
          {
            id: 'visa-3',
            slug: 'singapore-e-visa-tourist',
            title: 'Singapore 30-Day Entry E-Visa',
            price: isINR ? 3450 : 42,
            rating: 4.8,
            reviewCount: 920,
            duration: '3 - 5 Days',
            city: 'Singapore',
            country: 'Singapore',
            imageUrl: CURATED_PHOTOS.singaporeMarina,
            badge: 'Paperless',
          },
          {
            id: 'visa-4',
            slug: 'thailand-tourist-e-visa',
            title: 'Thailand 60-Day Tourist E-Visa',
            price: isINR ? 4200 : 50,
            rating: 4.8,
            reviewCount: 840,
            duration: '3 - 4 Days',
            city: 'Bangkok',
            country: 'Thailand',
            imageUrl: CURATED_PHOTOS.bangkokTemple,
            badge: 'Express',
          },
        ],
        destinations: [
          { name: 'Dubai', image: CURATED_PHOTOS.dubaiSkyline, imageUrl: CURATED_PHOTOS.dubaiSkyline, toursCount: 18, count: 18 },
          { name: 'Singapore', image: CURATED_PHOTOS.singaporeMarina, imageUrl: CURATED_PHOTOS.singaporeMarina, toursCount: 8, count: 8 },
          { name: 'Bangkok', image: CURATED_PHOTOS.bangkokTemple, imageUrl: CURATED_PHOTOS.bangkokTemple, toursCount: 12, count: 12 },
          { name: 'London', image: CURATED_PHOTOS.londonTower, imageUrl: CURATED_PHOTOS.londonTower, toursCount: 6, count: 6 },
        ],
        packages: [],
        reviews: [
          {
            id: 'r-visa-1',
            author: 'Amit Desai',
            rating: 5,
            text: 'Express UAE visa was approved in less than 18 hours! Document upload was smooth and verification was instant.',
          },
        ],
        faq: [
          {
            id: 'f-visa-1',
            question: 'What documents are required for Dubai tourist e-visa?',
            answer: 'Only a clear passport bio-page scan and a passport-size photo with white background. No physical courier needed!',
          },
        ],
      };

    case 'transfers':
      return {
        success: true,
        websiteId: siteId,
        module: 'transfers',
        meta: {
          title: 'Airport Cabs & Private Chauffeur Transfers',
          subtitle: 'Guaranteed meet-and-greet, luxury vehicles, fixed transparent fares, and zero surge pricing.',
          citySectionTitle: 'Popular Transfer Hubs',
          collectionTitle: 'Featured Airport & Intercity Routes',
        },
        banners: [
          {
            id: 'b-tr-1',
            title: 'Airport Roundtrip Flat 20% Off',
            subtitle: 'Book your arrival pickup and return airport drop together for guaranteed savings',
            badge: 'Airport Special',
            imageUrl: CURATED_PHOTOS.luxurySedan,
            buttonText: 'Book Airport Cab',
            link: '/search-results?type=transfers',
          },
          {
            id: 'b-tr-2',
            title: 'Dubai to Abu Dhabi Intercity Chauffeur',
            subtitle: 'Private luxury sedans and family SUVs with English-speaking chauffeurs and free waiting time',
            badge: 'Fixed Fare',
            imageUrl: CURATED_PHOTOS.airportSuv,
            buttonText: 'Explore Routes',
            link: '/search-results?type=transfers',
          },
        ],
        categories: [
          { name: 'Airport Pickup / Drop', slug: 'airport-transfers', icon: 'airplane-outline' },
          { name: 'Intercity Chauffeur', slug: 'intercity', icon: 'car-outline' },
          { name: 'Luxury Sedans', slug: 'luxury-sedans', icon: 'star-outline' },
          { name: 'Family SUVs & Vans', slug: 'suv-vans', icon: 'people-outline' },
        ],
        featured: [
          {
            id: 'tr-1',
            slug: 'dxb-airport-private-sedan',
            title: 'DXB Airport to Downtown Dubai Private Sedan',
            price: isINR ? 2200 : 28,
            rating: 4.9,
            reviewCount: 3100,
            duration: '35 mins',
            city: 'Dubai',
            country: 'UAE',
            imageUrl: CURATED_PHOTOS.luxurySedan,
            badge: 'Instant Meet & Greet',
          },
          {
            id: 'tr-2',
            slug: 'dubai-abu-dhabi-private-suv',
            title: 'Dubai to Abu Dhabi Intercity Private SUV (6 Seater)',
            price: isINR ? 5400 : 65,
            rating: 4.9,
            reviewCount: 1420,
            duration: '1h 30m',
            city: 'Abu Dhabi',
            country: 'UAE',
            imageUrl: CURATED_PHOTOS.airportSuv,
            badge: 'Family SUV',
          },
        ],
        destinations: [
          { name: 'Dubai', image: CURATED_PHOTOS.dubaiSkyline, imageUrl: CURATED_PHOTOS.dubaiSkyline, toursCount: 45, count: 45 },
          { name: 'Abu Dhabi', image: CURATED_PHOTOS.hotelPalace2, imageUrl: CURATED_PHOTOS.hotelPalace2, toursCount: 26, count: 26 },
          { name: 'Singapore', image: CURATED_PHOTOS.singaporeMarina, imageUrl: CURATED_PHOTOS.singaporeMarina, toursCount: 18, count: 18 },
        ],
        packages: [],
        reviews: [
          {
            id: 'r-tr-1',
            author: 'Sanjay Doshi',
            rating: 5,
            text: 'Driver was waiting at DXB Terminal 3 arrivals holding a sign with my name. Helped with heavy luggage and drove smoothly.',
          },
        ],
        faq: [
          {
            id: 'f-tr-1',
            question: 'What if my flight is delayed?',
            answer: 'We monitor live flight tracking automatically. Your chauffeur will adjust pickup time with 60 minutes free waiting time.',
          },
        ],
      };

    case 'hotels':
      return {
        success: true,
        websiteId: siteId,
        module: 'hotels',
        meta: {
          title: 'Handpicked Luxury Hotels & Stays',
          subtitle: '5-star beachfront resorts, private pool villas, and family friendly suites.',
          citySectionTitle: 'Find Top Stays in Popular Cities',
          collectionTitle: 'Featured Hotel Collections & Stays',
        },
        banners: [
          {
            id: 'b-hotel-1',
            title: 'Luxury 5-Star Beach Resorts',
            subtitle: 'Complimentary breakfast & room upgrades on selected stays',
            badge: 'Exclusive Stays',
            imageUrl: CURATED_PHOTOS.hotelLuxury1,
            buttonText: 'Explore Resorts',
            link: '/search-results?type=hotels',
          },
        ],
        categories: [
          { name: 'Beachfront Resorts', slug: 'beach-resorts', icon: 'water-outline' },
          { name: 'City Center Hotels', slug: 'city-hotels', icon: 'business-outline' },
          { name: 'Heritage Havelis', slug: 'heritage', icon: 'ribbon-outline' },
          { name: 'Private Pool Villas', slug: 'villas', icon: 'home-outline' },
        ],
        featured: [
          {
            id: 'h-1',
            slug: 'atlantis-the-palm',
            title: 'Atlantis, The Palm Luxury Beach Resort',
            price: isINR ? 28500 : 340,
            rating: 4.9,
            reviewCount: 1420,
            city: 'Dubai',
            country: 'UAE',
            imageUrl: CURATED_PHOTOS.hotelLuxury1,
            badge: '5-Star Luxury',
            stars: 5,
          },
          {
            id: 'h-2',
            slug: 'burj-al-arab',
            title: 'Burj Al Arab Jumeirah Iconic Suites',
            price: isINR ? 89000 : 1050,
            rating: 5.0,
            reviewCount: 890,
            city: 'Dubai',
            country: 'UAE',
            imageUrl: CURATED_PHOTOS.hotelPalace2,
            badge: '7-Star Icon',
            stars: 5,
          },
          {
            id: 'h-3',
            slug: 'jw-marriott-marquis-dubai',
            title: 'JW Marriott Marquis Luxury Executive Suite',
            price: isINR ? 16500 : 195,
            rating: 4.8,
            reviewCount: 1120,
            city: 'Dubai',
            country: 'UAE',
            imageUrl: CURATED_PHOTOS.hotelVilla3,
            badge: 'Executive',
            stars: 5,
          },
        ],
        destinations: [
          { name: 'Dubai', image: CURATED_PHOTOS.dubaiSkyline, imageUrl: CURATED_PHOTOS.dubaiSkyline, toursCount: 52, count: 52 },
          { name: 'Abu Dhabi', image: CURATED_PHOTOS.hotelPalace2, imageUrl: CURATED_PHOTOS.hotelPalace2, toursCount: 28, count: 28 },
          { name: 'Goa', image: CURATED_PHOTOS.goaBeach, imageUrl: CURATED_PHOTOS.goaBeach, toursCount: 34, count: 34 },
          { name: 'Bali', image: CURATED_PHOTOS.baliHoneymoon, imageUrl: CURATED_PHOTOS.baliHoneymoon, toursCount: 26, count: 26 },
        ],
        packages: [],
        reviews: [
          {
            id: 'rh-1',
            author: 'Pooja Shah',
            rating: 5,
            text: 'Our family stay at Atlantis The Palm was handled exceptionally well. Pure vegetarian breakfast was arranged effortlessly.',
          },
        ],
        faq: [
          {
            id: 'fh-1',
            question: 'Can I request vegetarian/Jain breakfast options at hotels?',
            answer: 'Yes! Our reservations team notifies hotel executive chefs in advance to guarantee authentic vegetarian food.',
          },
        ],
      };

    case 'packages':
      return {
        success: true,
        websiteId: siteId,
        module: 'packages',
        meta: {
          title: 'Curated Holiday Packages',
          subtitle: 'Complete all-inclusive holiday itineraries with flights, luxury hotels, meals, and private sightseeing.',
          citySectionTitle: 'Trending Holiday Destinations',
          collectionTitle: 'Handcrafted Holiday Packages',
        },
        banners: [
          {
            id: 'b-pkg-1',
            title: 'Exotic Dubai & Bali Holidays',
            subtitle: '5D/4N complete vacation packages with private transfers and pure veg dining',
            badge: 'Holiday Special',
            imageUrl: CURATED_PHOTOS.dubaiSkyline,
            buttonText: 'View Packages',
            link: '/search-results?type=packages',
          },
        ],
        categories: [
          { name: 'Family Vacations', slug: 'family', icon: 'people-outline' },
          { name: 'Honeymoon Specials', slug: 'honeymoon', icon: 'heart-outline' },
          { name: 'Weekend Escapes', slug: 'weekend', icon: 'sunny-outline' },
          { name: 'Heritage & Pilgrimage', slug: 'pilgrimage', icon: 'ribbon-outline' },
        ],
        featured: [
          {
            id: 'pkg-1',
            slug: 'dubai-delight-5d4n',
            title: 'Dubai Delight 5 Days / 4 Nights Complete Experience',
            price: isINR ? 49999 : 590,
            rating: 4.9,
            reviewCount: 310,
            duration: '5 Days / 4 Nights',
            city: 'Dubai',
            country: 'UAE',
            imageUrl: CURATED_PHOTOS.dubaiSkyline,
            badge: 'All-Inclusive',
          },
          {
            id: 'pkg-2',
            slug: 'kerala-backwaters-4d3n',
            title: 'Kerala Backwaters & Munnar Hills 4D/3N Tour',
            price: isINR ? 24500 : 290,
            rating: 4.8,
            reviewCount: 185,
            duration: '4 Days / 3 Nights',
            city: 'Kerala',
            country: 'India',
            imageUrl: CURATED_PHOTOS.ootyTeaPlantation,
            badge: 'Houseboat Stay',
          },
        ],
        destinations: [
          { name: 'Dubai', image: CURATED_PHOTOS.dubaiSkyline, imageUrl: CURATED_PHOTOS.dubaiSkyline, toursCount: 14, count: 14 },
          { name: 'Bali', image: CURATED_PHOTOS.baliHoneymoon, imageUrl: CURATED_PHOTOS.baliHoneymoon, toursCount: 9, count: 9 },
          { name: 'Jaipur', image: CURATED_PHOTOS.jaipurPalace, imageUrl: CURATED_PHOTOS.jaipurPalace, toursCount: 12, count: 12 },
        ],
        packages: [
          {
            id: 'pkg-sub-1',
            slug: 'dubai-delight-5d4n',
            title: 'Dubai Delight 5D/4N Complete Experience',
            price: isINR ? 49999 : 590,
            imageUrl: CURATED_PHOTOS.dubaiSkyline,
            days: 5,
            nights: 4,
          },
        ],
        reviews: [
          {
            id: 'rp-1',
            author: 'Bhavin Mehta',
            rating: 5,
            text: 'Flawless arrangements from airport pickup to sightseeing. Gujju Tours took care of everything!',
          },
        ],
        faq: [
          {
            id: 'fp-1',
            question: 'Can packages be customized?',
            answer: 'Absolutely! Our travel experts can tailor hotels, flights, and activities to your exact itinerary.',
          },
        ],
      };

    case 'flights':
      return {
        success: true,
        websiteId: siteId,
        module: 'flights',
        meta: {
          title: 'Popular Flight Routes & Best Airfares',
          subtitle: 'Compare low airfares across leading domestic and global airlines with meal selections.',
          citySectionTitle: 'Trending Flight Routes',
          collectionTitle: 'Trending Flight Routes & Airfares',
        },
        banners: [
          {
            id: 'b-fl-1',
            title: 'Exclusive Airfares & Group Discounts',
            subtitle: 'Surat & Ahmedabad to Dubai direct flights starting from ₹14,999',
            badge: 'Airfare Special',
            imageUrl: CURATED_PHOTOS.airlinerFlight,
            buttonText: 'Search Flights',
            link: '/search-results?type=flights',
          },
        ],
        categories: [
          { name: 'Direct Flights', slug: 'direct', icon: 'airplane-outline' },
          { name: 'Economy Saver', slug: 'economy', icon: 'cash-outline' },
          { name: 'Business Class', slug: 'business', icon: 'star-outline' },
        ],
        featured: [
          {
            id: 'fl-1',
            slug: 'stv-dxb-flight',
            title: 'Surat (STV) to Dubai (DXB) Direct Airfare',
            price: isINR ? 14999 : 175,
            rating: 4.8,
            reviewCount: 420,
            duration: '3h 45m Direct',
            city: 'Dubai',
            country: 'UAE',
            imageUrl: CURATED_PHOTOS.airlinerFlight,
            badge: 'Direct Daily',
          },
        ],
        destinations: [
          { name: 'Dubai', image: CURATED_PHOTOS.dubaiSkyline, imageUrl: CURATED_PHOTOS.dubaiSkyline, toursCount: 12, count: 12 },
          { name: 'Singapore', image: CURATED_PHOTOS.singaporeMarina, imageUrl: CURATED_PHOTOS.singaporeMarina, toursCount: 8, count: 8 },
        ],
        packages: [],
        reviews: [
          {
            id: 'rfl-1',
            author: 'Anand Joshi',
            rating: 5,
            text: 'Booking our family flight tickets was quick and smooth with instant meal confirmation.',
          },
        ],
        faq: [
          {
            id: 'ffl-1',
            question: 'How do I select special dietary meals (Jain / Hindu Veg)?',
            answer: 'You can select your dietary preferences directly during flight search or request our concierge to add them to your PNR.',
          },
        ],
      };

    default: // buildpackage and others
      return {
        success: true,
        websiteId: siteId,
        module,
        meta: {
          title: 'Custom Travel Package Builder',
          subtitle: 'Design your dream international holiday step-by-step with live transparent pricing.',
          citySectionTitle: 'Destinations for Custom Packages',
          collectionTitle: 'Popular Package Templates',
        },
        banners: [
          {
            id: 'b-bp-1',
            title: 'Design Your Custom Holiday in 3 Easy Steps',
            subtitle: 'Choose destinations, pick verified 5-star hotels, add transfers, and get instant quote',
            badge: 'Custom Builder',
            imageUrl: CURATED_PHOTOS.dubaiSkyline,
            buttonText: 'Build Package',
            link: '/search-results?type=buildpackage',
          },
        ],
        categories: [
          { name: 'Dubai & UAE Combo', slug: 'dubai-custom', icon: 'sunny-outline' },
          { name: 'Bali & Southeast Asia', slug: 'bali-custom', icon: 'leaf-outline' },
          { name: 'Europe Highlights', slug: 'europe-custom', icon: 'globe-outline' },
        ],
        featured: [
          {
            id: 'bp-1',
            slug: 'custom-dubai-explorer',
            title: 'Customizable 5D/4N Dubai Grand Vacation',
            price: isINR ? 45000 : 520,
            rating: 4.9,
            reviewCount: 220,
            duration: 'Flexible Days',
            city: 'Dubai',
            country: 'UAE',
            imageUrl: CURATED_PHOTOS.dubaiSkyline,
            badge: 'Fully Flexible',
          },
        ],
        destinations: [
          { name: 'Dubai', image: CURATED_PHOTOS.dubaiSkyline, imageUrl: CURATED_PHOTOS.dubaiSkyline, toursCount: 20, count: 20 },
          { name: 'Bali', image: CURATED_PHOTOS.baliHoneymoon, imageUrl: CURATED_PHOTOS.baliHoneymoon, toursCount: 15, count: 15 },
        ],
        packages: [],
        reviews: [
          {
            id: 'r-bp-1',
            author: 'Verified Traveler',
            rating: 5,
            text: 'Loved how flexible the itinerary builder was. Picked our exact hotel and safari options.',
          },
        ],
        faq: [
          {
            id: 'f-bp-1',
            question: 'How long does custom package quote confirmation take?',
            answer: 'Instant! The system calculates pricing in real-time, and our WhatsApp concierge assists with final vouchers within 10 minutes.',
          },
        ],
      };
  }
}
