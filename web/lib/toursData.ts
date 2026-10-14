// Per-site tour catalogs. Each site's tours are completely separate —
// different ids, names, images, and detail content — until Phase 9 adds
// a real per-site `websiteId` field to the MongoDB Tour model and this
// can be replaced with a filtered /api/tours call.
//
// Used by: app/[site]/page.tsx (featured tours), app/[site]/explore/page.tsx
// (full catalog), and app/[site]/tour/[id]/page.tsx (detail lookup) — so all
// three pages always agree on what a given site's tour #N actually is.

export type Tour = {
  id: number;
  name: string;
  description: string;
  price: number;
  rating: number;
  reviews: number;
  duration: string;
  difficulty: string;
  location?: string;
  groupSize: string;
  bestTime: string;
  language: string;
  image: string;
  gallery: string[];
  fullDescription: string;
  highlights: string[];
  included: string[];
  itinerary: { day: number; title: string; description: string }[];
  guestReviews: { author: string; rating: number; text: string }[];
};

export const toursBySite: Record<string, Tour[]> = {
  // ===========================================================
  // website1 — TravelCo: classic city tours
  // ===========================================================
  website1: [
    {
      id: 1,
      name: "Paris City Tour",
      description: "Walk through the City of Light - Eiffel Tower, Louvre, Notre-Dame.",
      price: 999,
      rating: 4.8,
      reviews: 128,
      duration: "5 days / 4 nights",
      difficulty: "Easy",
      groupSize: "8-12 people",
      bestTime: "April - May, September - October",
      language: "English, French",
      image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&h=600&fit=crop",
      gallery: [
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1550340499-b12fa6f6c5f9?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1570129477492-45e003008e0f?w=400&h=300&fit=crop",
      ],
      fullDescription:
        "Experience the magic of Paris with our comprehensive 5-day city tour. Visit the iconic Eiffel Tower, explore the world-renowned Louvre Museum, stroll through charming neighborhoods like Montmartre, and enjoy authentic French cuisine.",
      highlights: [
        "Eiffel Tower visit with summit access",
        "Louvre Museum guided tour (Mona Lisa & masterpieces)",
        "Montmartre neighborhood exploration",
        "Seine River evening cruise",
        "Versailles Palace day trip",
      ],
      included: [
        "4 nights luxury 4-star hotel accommodation",
        "Daily gourmet breakfast",
        "All guided city tours",
        "Museum entry fees",
        "Airport transfers",
      ],
      itinerary: [
        { day: 1, title: "Arrival & Eiffel Tower", description: "Arrive in Paris, check-in, visit the Eiffel Tower at sunset." },
        { day: 2, title: "Louvre & Seine River", description: "Explore the Louvre, then enjoy a Seine river cruise at night." },
        { day: 3, title: "Versailles Palace", description: "Day trip to the Palace of Versailles and its gardens." },
        { day: 4, title: "Montmartre & Notre-Dame", description: "Explore the artistic neighborhood and Notre-Dame Cathedral." },
        { day: 5, title: "Departure", description: "Final morning at leisure, then depart for home." },
      ],
      guestReviews: [
        { author: "Sarah M.", rating: 5, text: "An absolutely magical experience! Paris is more beautiful than I imagined." },
        { author: "John D.", rating: 5, text: "The guides were incredibly knowledgeable and friendly." },
      ],
    },
    {
      id: 2,
      name: "Tokyo Adventures",
      description: "Experience temples, modern cities, and traditional Japanese culture.",
      price: 1299,
      rating: 4.9,
      reviews: 156,
      duration: "7 days / 6 nights",
      difficulty: "Moderate",
      groupSize: "10-14 people",
      bestTime: "March - May, September - November",
      language: "English, Japanese",
      image: "https://images.unsplash.com/photo-1540959375944-7049f642e9a5?w=1200&h=600&fit=crop",
      gallery: [
        "https://images.unsplash.com/photo-1540959375944-7049f642e9a5?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1552277866-7aecc2c6b71c?w=400&h=300&fit=crop",
      ],
      fullDescription:
        "Discover the perfect blend of ancient tradition and cutting-edge modernity in Tokyo. Visit serene temples, explore bustling markets, and enjoy world-class dining.",
      highlights: [
        "Senso-ji Temple & traditional crafts",
        "Shibuya Crossing - world's busiest intersection",
        "teamLab Borderless digital art museum",
        "Traditional tea ceremony experience",
      ],
      included: [
        "6 nights 4-star hotel in central Tokyo",
        "Daily breakfast with Japanese specialties",
        "JR Pass for trains",
        "Tea ceremony class",
      ],
      itinerary: [
        { day: 1, title: "Arrival & City Orientation", description: "Arrive in Tokyo, settle in, explore Shibuya." },
        { day: 2, title: "Traditional Tokyo", description: "Visit temples and shrines with a local guide." },
        { day: 3, title: "Modern Tokyo", description: "Shibuya Crossing, teamLab museum, and technology districts." },
      ],
      guestReviews: [
        { author: "Lisa K.", rating: 5, text: "Tokyo is incredible! This tour showed us the real Japan." },
      ],
    },
    {
      id: 3,
      name: "New York Experience",
      description: "Broadway shows, iconic landmarks, and the energy of the Big Apple.",
      price: 899,
      rating: 4.7,
      reviews: 203,
      duration: "4 days / 3 nights",
      difficulty: "Easy",
      groupSize: "6-10 people",
      bestTime: "September - November, March - May",
      language: "English",
      image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&h=600&fit=crop",
      gallery: [
        "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1489749798305-4fea3ba63d60?w=400&h=300&fit=crop",
      ],
      fullDescription:
        "Experience the energy and excitement of New York City. From Broadway shows to iconic landmarks, discover why the city never sleeps.",
      highlights: [
        "Statue of Liberty & Ellis Island tour",
        "Empire State Building observation deck",
        "Broadway show tickets",
        "Central Park guided walk",
      ],
      included: [
        "3 nights 4-star Manhattan hotel",
        "Daily breakfast",
        "Broadway show ticket",
        "Airport transfers",
      ],
      itinerary: [
        { day: 1, title: "Arrival & Times Square", description: "Arrive, check-in, explore Times Square." },
        { day: 2, title: "Broadway & Central Park", description: "Broadway show evening and Central Park walk." },
        { day: 3, title: "Monuments & Museums", description: "Statue of Liberty and Empire State Building." },
        { day: 4, title: "Departure", description: "Final shopping, then depart to airport." },
      ],
      guestReviews: [
        { author: "Tom B.", rating: 5, text: "New York is amazing! This tour made it easy to see everything." },
      ],
    },
  ],

  // ===========================================================
  // website2 — Adventure World: outdoor/adventure trips
  // ===========================================================
  website2: [
    {
      id: 101,
      name: "Mountain Peak Trek",
      description: "Push your limits on a high-altitude trek through dramatic mountain terrain.",
      price: 799,
      rating: 4.9,
      reviews: 87,
      duration: "6 days / 5 nights",
      difficulty: "Hard",
      groupSize: "6-10 people",
      bestTime: "May - September",
      language: "English",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop",
      gallery: [
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=400&h=300&fit=crop",
      ],
      fullDescription:
        "Take on a challenging high-altitude trek with expert mountain guides. Sleep under the stars, cross glacial streams, and summit a dramatic peak.",
      highlights: [
        "Summit day with sunrise views",
        "Expert mountain guides & safety gear",
        "Camping under the stars",
        "Glacier crossing",
      ],
      included: [
        "All camping equipment",
        "Certified trekking guide",
        "Meals during the trek",
        "Permits and park fees",
      ],
      itinerary: [
        { day: 1, title: "Base Camp Arrival", description: "Arrive at base camp, gear check, acclimatization hike." },
        { day: 2, title: "Ascent Begins", description: "Trek through forest trails to the first high camp." },
        { day: 3, title: "Summit Push", description: "Early start for the summit, sunrise at the peak." },
      ],
      guestReviews: [
        { author: "Raj P.", rating: 5, text: "Toughest and most rewarding trek I've done. Guides were fantastic." },
      ],
    },
    {
      id: 102,
      name: "White-Water Rafting",
      description: "Ride the rapids on a heart-pounding white-water rafting adventure.",
      price: 599,
      rating: 4.8,
      reviews: 64,
      duration: "2 days / 1 night",
      difficulty: "Moderate",
      groupSize: "8-14 people",
      bestTime: "June - August",
      language: "English",
      image: "https://images.unsplash.com/photo-1530866495561-507c9faab00e?w=1200&h=600&fit=crop",
      gallery: [
        "https://images.unsplash.com/photo-1530866495561-507c9faab00e?w=400&h=300&fit=crop",
      ],
      fullDescription:
        "Get your adrenaline pumping on grade III-IV rapids, followed by a riverside campout under the stars.",
      highlights: [
        "Grade III-IV rapids",
        "Riverside overnight camp",
        "Professional safety kayakers",
        "BBQ dinner by the river",
      ],
      included: [
        "Rafting equipment & safety gear",
        "Certified river guides",
        "Camping overnight",
        "All meals",
      ],
      itinerary: [
        { day: 1, title: "Rapids & Camp", description: "Morning briefing, full day rafting, evening riverside BBQ." },
        { day: 2, title: "Final Run & Departure", description: "Short morning rafting section, then transfer back." },
      ],
      guestReviews: [
        { author: "Mia T.", rating: 5, text: "So much fun! The guides kept us safe but it still felt wild." },
      ],
    },
    {
      id: 103,
      name: "Rainforest Jungle Trek",
      description: "Explore dense rainforest, waterfalls, and wildlife on foot.",
      price: 699,
      rating: 4.7,
      reviews: 52,
      duration: "3 days / 2 nights",
      difficulty: "Moderate",
      groupSize: "6-12 people",
      bestTime: "November - March",
      language: "English",
      image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&h=600&fit=crop",
      gallery: [
        "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=300&fit=crop",
      ],
      fullDescription:
        "Trek through dense jungle canopy, swim beneath waterfalls, and spot wildlife with an expert naturalist guide.",
      highlights: [
        "Waterfall swimming stops",
        "Night wildlife spotting walk",
        "Local indigenous guide",
        "Jungle canopy views",
      ],
      included: [
        "Jungle lodge accommodation",
        "Naturalist guide",
        "All meals",
        "Waterproof gear rental",
      ],
      itinerary: [
        { day: 1, title: "Into the Jungle", description: "Trek to the jungle lodge, evening wildlife walk." },
        { day: 2, title: "Waterfalls", description: "Full day trekking to waterfalls, swim and relax." },
        { day: 3, title: "Departure", description: "Morning trek out, transfer back to town." },
      ],
      guestReviews: [
        { author: "Dev K.", rating: 4, text: "Beautiful jungle, saw so much wildlife. Bring bug spray!" },
      ],
    },
    {
      id: 104,
      name: "Desert Safari Extreme",
      description: "Dune bashing, sandboarding, and a night camping under desert stars.",
      price: 549,
      rating: 4.6,
      reviews: 41,
      duration: "2 days / 1 night",
      difficulty: "Extreme",
      groupSize: "4-8 people",
      bestTime: "October - March",
      language: "English, Arabic",
      image: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&h=600&fit=crop",
      gallery: [
        "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=300&fit=crop",
      ],
      fullDescription:
        "High-speed dune bashing, sandboarding down massive dunes, and a night under the stars in a desert camp.",
      highlights: [
        "4x4 dune bashing",
        "Sandboarding",
        "Bedouin-style desert camp",
        "Stargazing session",
      ],
      included: [
        "4x4 vehicle & driver",
        "Sandboard rental",
        "Desert camp overnight",
        "BBQ dinner",
      ],
      itinerary: [
        { day: 1, title: "Dune Bashing & Camp", description: "Afternoon dune bashing, sandboarding, evening camp with BBQ." },
        { day: 2, title: "Sunrise & Departure", description: "Sunrise over the dunes, breakfast, transfer back." },
      ],
      guestReviews: [
        { author: "Omar S.", rating: 5, text: "Absolutely wild ride! Not for the faint of heart." },
      ],
    },
  ],

  // ===========================================================
  // website3 — Holiday Paradise: luxury holiday packages
  // ===========================================================
  website3: [
    {
      id: 201,
      name: "Maldives Overwater Escape",
      description: "Private overwater villas above crystal-clear turquoise lagoons.",
      price: 2499,
      rating: 5.0,
      reviews: 74,
      duration: "6 days / 5 nights",
      difficulty: "Easy",
      location: "Maldives",
      groupSize: "2 people",
      bestTime: "November - April",
      language: "English",
      image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&h=600&fit=crop",
      gallery: [
        "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=400&h=300&fit=crop",
      ],
      fullDescription:
        "Stay in a private overwater villa with direct lagoon access, enjoy world-class spa treatments, and dine under the stars on your own private deck.",
      highlights: [
        "Private overwater villa with glass floor panel",
        "Sunset dolphin cruise",
        "Couples spa treatment",
        "Private beach dinner",
      ],
      included: [
        "5 nights overwater villa",
        "All-inclusive gourmet dining",
        "Seaplane transfers",
        "Daily spa credit",
      ],
      itinerary: [
        { day: 1, title: "Arrival", description: "Seaplane transfer to the resort, welcome drink and villa check-in." },
        { day: 2, title: "Ocean Day", description: "Snorkeling excursion and sunset dolphin cruise." },
        { day: 3, title: "Relax & Spa", description: "Full day at leisure with a couples spa treatment." },
      ],
      guestReviews: [
        { author: "Happy Traveler", rating: 5, text: "Everything was beautifully organized. The hotel, destination, and experience were perfect." },
      ],
    },
    {
      id: 202,
      name: "Dubai Luxury City Escape",
      description: "Five-star skyline views, desert glamping, and premium shopping.",
      price: 1999,
      rating: 4.9,
      reviews: 58,
      duration: "5 days / 4 nights",
      difficulty: "Easy",
      location: "Dubai, UAE",
      groupSize: "2-4 people",
      bestTime: "November - March",
      language: "English, Arabic",
      image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&h=600&fit=crop",
      gallery: [
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop",
      ],
      fullDescription:
        "Experience Dubai's skyline from a five-star suite, enjoy a private desert glamping night, and shop at the world's most luxurious malls.",
      highlights: [
        "Burj Khalifa VIP observation deck",
        "Private desert glamping night",
        "Dhow dinner cruise",
        "Personal shopping guide",
      ],
      included: [
        "4 nights 5-star hotel suite",
        "Daily breakfast",
        "Airport limousine transfers",
        "Desert glamping experience",
      ],
      itinerary: [
        { day: 1, title: "Arrival", description: "Limousine transfer, check-in, evening at leisure." },
        { day: 2, title: "City & Skyline", description: "Burj Khalifa visit and dhow dinner cruise." },
        { day: 3, title: "Desert Glamping", description: "Transfer to a private desert camp for an overnight stay." },
      ],
      guestReviews: [
        { author: "Holiday Guest", rating: 5, text: "A wonderful experience from booking to the end of our holiday." },
      ],
    },
    {
      id: 203,
      name: "Paris Romantic Getaway",
      description: "A boutique Parisian holiday designed for couples and honeymoons.",
      price: 2299,
      rating: 4.9,
      reviews: 63,
      duration: "5 days / 4 nights",
      difficulty: "Easy",
      location: "Paris, France",
      groupSize: "2 people",
      bestTime: "April - June, September - October",
      language: "English, French",
      image: "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?w=1200&h=600&fit=crop",
      gallery: [
        "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?w=400&h=300&fit=crop",
      ],
      fullDescription:
        "A boutique holiday built for romance — a private Seine cruise, champagne at the Eiffel Tower, and a stay in a historic boutique hotel.",
      highlights: [
        "Private Seine river cruise with champagne",
        "Boutique hotel in Saint-Germain",
        "Eiffel Tower sunset champagne toast",
        "Michelin-recommended dining",
      ],
      included: [
        "4 nights boutique hotel",
        "Daily breakfast in bed",
        "Private Seine cruise",
        "Airport transfers",
      ],
      itinerary: [
        { day: 1, title: "Arrival", description: "Private transfer, check-in, evening at leisure." },
        { day: 2, title: "Romance in Paris", description: "Private Seine cruise and Eiffel Tower champagne toast." },
        { day: 3, title: "Boutique Paris", description: "Saint-Germain neighborhood exploration and fine dining." },
      ],
      guestReviews: [
        { author: "Satisfied Guest", rating: 5, text: "The attention to detail made our trip truly special." },
      ],
    },
  ],
};

export function getToursForSite(site: string | undefined): Tour[] {
  return toursBySite[site || ""] || [];
}

export function getTourForSite(site: string | undefined, id: number): Tour | undefined {
  return getToursForSite(site).find((tour) => tour.id === id);
}