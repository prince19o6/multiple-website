/**
 * lib/toursData.ts
 *
 * Static fallback tour data per site.
 * Ported verbatim from web/lib/toursData.ts — pure data, zero web deps.
 *
 * Used when:
 *   1. The API is unreachable (offline / timeout)
 *   2. The backend returns an empty tours array
 *
 * TanStack Query's `placeholderData` / `initialData` options use this.
 */

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
  // ═══════════════════════════════════════════════════
  // website1 — Travel Explorer (GujjuTours)
  // ═══════════════════════════════════════════════════
  website1: [
    {
      id: 1,
      name: 'Paris City Tour',
      description: 'Walk through the City of Light — Eiffel Tower, Louvre, Notre-Dame.',
      price: 999,
      rating: 4.8,
      reviews: 128,
      duration: '5 days / 4 nights',
      difficulty: 'Easy',
      location: 'Paris, France',
      groupSize: '8-12 people',
      bestTime: 'April - May, September - October',
      language: 'English, French',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=500&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1550340499-b12fa6f6c5f9?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45e003008e0f?w=400&h=300&fit=crop',
      ],
      fullDescription:
        'Experience the magic of Paris with our comprehensive 5-day city tour. Visit the iconic Eiffel Tower, explore the world-renowned Louvre Museum, stroll through charming Montmartre, and enjoy authentic French cuisine.',
      highlights: [
        'Eiffel Tower visit with summit access',
        'Louvre Museum guided tour',
        'Montmartre neighborhood exploration',
        'Seine River evening cruise',
        'Versailles Palace day trip',
      ],
      included: [
        '4 nights luxury 4-star hotel',
        'Daily gourmet breakfast',
        'All guided city tours',
        'Museum entry fees',
        'Airport transfers',
      ],
      itinerary: [
        { day: 1, title: 'Arrival & Eiffel Tower', description: 'Arrive in Paris, check-in, visit the Eiffel Tower at sunset.' },
        { day: 2, title: 'Louvre & Seine River', description: 'Explore the Louvre, then enjoy a Seine river cruise at night.' },
        { day: 3, title: 'Versailles Palace', description: 'Day trip to the Palace of Versailles and its gardens.' },
        { day: 4, title: 'Montmartre & Notre-Dame', description: 'Explore the artistic neighborhood and Notre-Dame Cathedral.' },
        { day: 5, title: 'Departure', description: 'Final morning at leisure, then depart for home.' },
      ],
      guestReviews: [
        { author: 'Sarah M.', rating: 5, text: 'An absolutely magical experience! Paris is more beautiful than I imagined.' },
        { author: 'John D.', rating: 5, text: 'The guides were incredibly knowledgeable and friendly.' },
        { author: 'Priya K.', rating: 4, text: 'Wonderful trip, well organised. Would definitely recommend!' },
      ],
    },
    {
      id: 2,
      name: 'Rome & Vatican Tour',
      description: 'Explore the Eternal City, Vatican Museums, and the Colosseum.',
      price: 1199,
      rating: 4.9,
      reviews: 95,
      duration: '6 days / 5 nights',
      difficulty: 'Easy',
      location: 'Rome, Italy',
      groupSize: '10-15 people',
      bestTime: 'March - June, September - November',
      language: 'English, Italian',
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=500&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
      ],
      fullDescription:
        'Discover the wonders of Rome — ancient history, incredible art, and world-famous cuisine all in one unforgettable journey.',
      highlights: [
        'Colosseum guided tour with skip-the-line',
        'Vatican Museums & Sistine Chapel',
        "St. Peter's Basilica",
        'Roman Forum & Palatine Hill',
        'Trevi Fountain evening walk',
      ],
      included: [
        '5 nights centrally located hotel',
        'Daily breakfast',
        'Skip-the-line entries',
        'Expert local guides',
        'Airport transfers',
      ],
      itinerary: [
        { day: 1, title: 'Arrival & Colosseum', description: 'Arrive, check in, evening at the Colosseum.' },
        { day: 2, title: 'Vatican Day', description: 'Full day at Vatican Museums and Sistine Chapel.' },
        { day: 3, title: 'Roman Forum', description: 'Explore the ancient heart of Rome.' },
        { day: 4, title: 'Day Trip to Pompeii', description: 'Journey to the ancient city of Pompeii.' },
        { day: 5, title: 'Leisure & Shopping', description: 'Free time for shopping and gelato.' },
        { day: 6, title: 'Departure', description: 'Transfer to airport.' },
      ],
      guestReviews: [
        { author: 'Marco R.', rating: 5, text: 'The Vatican tour was incredible — totally worth it.' },
        { author: 'Emma S.', rating: 5, text: 'Best trip of my life. Rome is unforgettable.' },
      ],
    },
    {
      id: 3,
      name: 'Tokyo Discovery',
      description: 'Modern Tokyo meets ancient tradition in this unforgettable Japan adventure.',
      price: 1499,
      rating: 4.7,
      reviews: 67,
      duration: '7 days / 6 nights',
      difficulty: 'Easy',
      location: 'Tokyo, Japan',
      groupSize: '8-12 people',
      bestTime: 'March - May, October - November',
      language: 'English, Japanese',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=500&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=300&fit=crop',
      ],
      fullDescription:
        'Tokyo is a city of contrasts — neon-lit streets and ancient temples, cutting-edge tech and timeless tradition. Our 7-day itinerary captures it all.',
      highlights: [
        'Shibuya Crossing and Harajuku',
        'Mt Fuji day trip',
        'Asakusa Senso-ji Temple',
        'teamLab digital art museum',
        'Traditional tea ceremony',
      ],
      included: [
        '6 nights hotel in central Tokyo',
        'Daily breakfast',
        'Bullet train (Shinkansen) pass',
        'All guided tours',
        'Airport transfers',
      ],
      itinerary: [
        { day: 1, title: 'Arrival & Shinjuku', description: 'Arrive, check in, explore Shinjuku by night.' },
        { day: 2, title: 'Asakusa & Shibuya', description: 'Temple morning, iconic crossing afternoon.' },
        { day: 3, title: 'Mt Fuji', description: 'Full day trip to Mt Fuji and Hakone.' },
        { day: 4, title: 'Harajuku & Akihabara', description: 'Pop culture day.' },
        { day: 5, title: 'teamLab & Odaiba', description: 'Digital art and futuristic waterfront.' },
        { day: 6, title: 'Tea Ceremony & Free Time', description: 'Cultural experience and shopping.' },
        { day: 7, title: 'Departure', description: 'Transfer to Narita or Haneda airport.' },
      ],
      guestReviews: [
        { author: 'Kenji T.', rating: 5, text: 'As a Japanese speaker I still learned so much. Fantastic guides.' },
        { author: 'Lisa P.', rating: 4, text: 'Tokyo blew my mind. The Mt Fuji trip was the highlight.' },
      ],
    },
  ],

  // ═══════════════════════════════════════════════════
  // website2 — Adventure World (TripGoAsia)
  // ═══════════════════════════════════════════════════
  website2: [
    {
      id: 1,
      name: 'Himalayan Trek',
      description: 'A challenging multi-day trek through stunning Himalayan valleys and high passes.',
      price: 799,
      rating: 4.9,
      reviews: 203,
      duration: '10 days',
      difficulty: 'Hard',
      location: 'Nepal Himalayas',
      groupSize: '4-8 people',
      bestTime: 'March - May, October - November',
      language: 'English, Nepali',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=500&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=400&h=300&fit=crop',
      ],
      fullDescription:
        'Conquer the Himalayas on this epic 10-day trek through stunning mountain landscapes, ancient monasteries, and remote Sherpa villages.',
      highlights: [
        'Base Camp at 5 364m altitude',
        'Views of Everest, Lhotse, and Ama Dablam',
        'Sherpa village homestay',
        'Tengboche Monastery visit',
        'Namche Bazaar acclimatisation day',
      ],
      included: [
        'All camping equipment',
        'Experienced trekking guide & porters',
        'All meals on the trail',
        'Permits and fees',
        'Emergency evacuation insurance',
      ],
      itinerary: [
        { day: 1, title: 'Fly to Lukla', description: 'Scenic flight to Lukla, trek to Phakding.' },
        { day: 2, title: 'Trek to Namche Bazaar', description: 'Gain altitude through lush forests.' },
        { day: 3, title: 'Acclimatisation', description: 'Rest day, short hike to viewpoint.' },
        { day: 4, title: 'Tengboche', description: 'Visit the famous monastery.' },
        { day: 5, title: 'Dingboche', description: 'Higher altitude, stunning views.' },
        { day: 6, title: 'Lobuche', description: 'Trek along the Khumbu Glacier.' },
        { day: 7, title: 'EBC Day', description: 'Reach Everest Base Camp!' },
        { day: 8, title: 'Kala Patthar', description: 'Summit at dawn for panoramic views.' },
        { day: 9, title: 'Descent to Lukla', description: 'Long trek back to Lukla.' },
        { day: 10, title: 'Fly to Kathmandu', description: 'Return flight and farewell dinner.' },
      ],
      guestReviews: [
        { author: 'Alex T.', rating: 5, text: 'The hardest thing I have ever done — and the best.' },
        { author: 'Sofia R.', rating: 5, text: 'Life-changing. Our guide Tenzing was phenomenal.' },
      ],
    },
    {
      id: 2,
      name: 'River Rafting Rishikesh',
      description: 'Thrilling white-water rafting on the sacred Ganges river.',
      price: 149,
      rating: 4.7,
      reviews: 312,
      duration: '2 days / 1 night',
      difficulty: 'Moderate',
      location: 'Rishikesh, India',
      groupSize: '6-12 people',
      bestTime: 'October - June',
      language: 'English, Hindi',
      image: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=800&h=500&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop',
      ],
      fullDescription:
        'Experience the adrenaline rush of Grade III-IV rapids on the Ganges in Rishikesh — the adventure capital of India.',
      highlights: [
        'Grade III-IV rapids including "The Wall" and "Golf Course"',
        'Cliff jumping at natural pools',
        'Beachside bonfire camping',
        'Morning yoga session',
        'All safety equipment provided',
      ],
      included: [
        'All rafting equipment & safety gear',
        'Professional river guide',
        'Campsite accommodation',
        'All meals',
        'Transportation from Rishikesh',
      ],
      itinerary: [
        { day: 1, title: 'Arrive & Raft', description: 'Briefing, gear up, hit the rapids!' },
        { day: 2, title: 'Morning Yoga & Return', description: 'Sunrise yoga, breakfast, return to Rishikesh.' },
      ],
      guestReviews: [
        { author: 'Rahul M.', rating: 5, text: 'Pure adrenaline! Best weekend ever.' },
        { author: 'Nadia K.', rating: 4, text: 'The camping under stars was magical.' },
      ],
    },
    {
      id: 3,
      name: 'Borneo Jungle Safari',
      description: 'Spot orangutans, pygmy elephants and exotic wildlife in Borneo\'s rainforest.',
      price: 1299,
      rating: 4.8,
      reviews: 88,
      duration: '8 days / 7 nights',
      difficulty: 'Moderate',
      location: 'Sabah, Malaysia',
      groupSize: '4-10 people',
      bestTime: 'March - October',
      language: 'English, Malay',
      image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&h=500&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=400&h=300&fit=crop',
      ],
      fullDescription:
        'Explore one of the world\'s oldest rainforests, encounter wild orangutans, and discover the incredible biodiversity of Borneo.',
      highlights: [
        'Sepilok Orangutan Rehabilitation Centre',
        'Kinabatangan River wildlife cruise',
        'Pygmy elephant spotting',
        'Firefly watching by river',
        'Canopy walkway adventure',
      ],
      included: [
        'All accommodation (jungle lodges)',
        'Full board meals',
        'Expert wildlife guides',
        'All transfers and boat trips',
        'Park entry fees',
      ],
      itinerary: [
        { day: 1, title: 'Arrive Kota Kinabalu', description: 'Arrive and transfer to lodge.' },
        { day: 2, title: 'Sepilok Orangutans', description: 'Morning feeding session visit.' },
        { day: 3, title: 'Kinabatangan River', description: 'River cruise, spot wildlife.' },
        { day: 4, title: 'Jungle Trek', description: 'Guided rainforest walk.' },
        { day: 5, title: 'Elephant Search', description: 'Pygmy elephant habitat exploration.' },
        { day: 6, title: 'Canopy Walkway', description: 'Treetop adventure and birdwatching.' },
        { day: 7, title: 'Fireflies & Culture', description: 'Evening firefly boat tour.' },
        { day: 8, title: 'Departure', description: 'Return to Kota Kinabalu, fly home.' },
      ],
      guestReviews: [
        { author: 'James H.', rating: 5, text: 'Saw so much wildlife. Orangutans were incredible.' },
        { author: 'Mei L.', rating: 5, text: 'Perfect balance of adventure and comfort.' },
      ],
    },
  ],

  // ═══════════════════════════════════════════════════
  // website3 — Holiday Paradise (Technoheaven)
  // ═══════════════════════════════════════════════════
  website3: [
    {
      id: 1,
      name: 'Maldives Luxury Escape',
      description: 'An indulgent island retreat in one of the world\'s most beautiful destinations.',
      price: 2499,
      rating: 5.0,
      reviews: 156,
      duration: '7 days / 6 nights',
      difficulty: 'Easy',
      location: 'Maldives',
      groupSize: '2-4 people',
      bestTime: 'November - April',
      language: 'English',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=300&fit=crop',
      ],
      fullDescription:
        'Escape to crystal-clear lagoons and pristine white sand beaches. Our Maldives package places you in an overwater villa with direct ocean access and world-class service.',
      highlights: [
        'Overwater villa with glass floor',
        'Private beach and infinity pool',
        'Sunset dolphin cruise',
        'Snorkelling with manta rays',
        'Couples spa treatment',
      ],
      included: [
        '6 nights overwater villa',
        'All-inclusive dining (3 restaurants)',
        'Seaplane transfers',
        'Daily snorkelling equipment',
        'One couples spa session',
      ],
      itinerary: [
        { day: 1, title: 'Seaplane Arrival', description: 'Scenic seaplane transfer to your private island.' },
        { day: 2, title: 'Beach & Snorkel', description: 'Explore the house reef at your own pace.' },
        { day: 3, title: 'Manta Ray Excursion', description: 'Snorkelling with manta rays at Hanifaru Bay.' },
        { day: 4, title: 'Spa Day', description: 'Couples treatment, private beach dinner.' },
        { day: 5, title: 'Sunset Dolphin Cruise', description: 'Evening boat trip watching spinner dolphins.' },
        { day: 6, title: 'Leisure Day', description: 'Final day at your villa, any last adventures.' },
        { day: 7, title: 'Departure', description: 'Seaplane back to Malé, fly home.' },
      ],
      guestReviews: [
        { author: 'Priya & Arjun', rating: 5, text: 'Perfect honeymoon. Every detail was magical.' },
        { author: 'Claire B.', rating: 5, text: 'The overwater villa was everything we dreamed of.' },
        { author: 'David W.', rating: 5, text: 'The best holiday of our lives. We will be back.' },
      ],
    },
    {
      id: 2,
      name: 'Santorini Romance',
      description: 'Iconic white-domed villages, volcanic sunsets, and Aegean blue in Greece.',
      price: 1899,
      rating: 4.9,
      reviews: 112,
      duration: '6 days / 5 nights',
      difficulty: 'Easy',
      location: 'Santorini, Greece',
      groupSize: '2-6 people',
      bestTime: 'April - October',
      language: 'English, Greek',
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=500&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=300&fit=crop',
      ],
      fullDescription:
        'The iconic caldera views, whitewashed buildings, and spectacular sunsets make Santorini one of the world\'s most romantic destinations.',
      highlights: [
        'Oia village and famous sunset viewpoint',
        'Private catamaran sailing tour',
        'Wine tasting at volcanic wineries',
        'Akrotiri archaeological site',
        'Black sand beach at Perissa',
      ],
      included: [
        '5 nights cave-style boutique hotel',
        'Daily breakfast with caldera views',
        'Private catamaran day sail',
        'Winery tour with tasting',
        'Airport transfers',
      ],
      itinerary: [
        { day: 1, title: 'Arrive & Settle', description: 'Transfer to hotel, first sunset from your terrace.' },
        { day: 2, title: 'Oia Exploration', description: 'Walk the caldera path to Oia, iconic viewpoint at dusk.' },
        { day: 3, title: 'Catamaran Sailing', description: 'Full day private sail around the caldera.' },
        { day: 4, title: 'Akrotiri & Beaches', description: 'Ancient ruins and black sand beaches.' },
        { day: 5, title: 'Wineries', description: 'Volcanic wine tasting tour.' },
        { day: 6, title: 'Departure', description: 'Morning at leisure, transfer to airport.' },
      ],
      guestReviews: [
        { author: 'Isabella M.', rating: 5, text: 'The most beautiful place on earth. The sunsets are unreal.' },
        { author: 'Thomas & Julie', rating: 5, text: 'The catamaran day was the highlight of our honeymoon.' },
      ],
    },
    {
      id: 3,
      name: 'Bali Wellness Retreat',
      description: 'Rejuvenate your mind, body, and soul in the spiritual heart of Bali.',
      price: 1299,
      rating: 4.8,
      reviews: 178,
      duration: '8 days / 7 nights',
      difficulty: 'Easy',
      location: 'Ubud, Bali',
      groupSize: '2-8 people',
      bestTime: 'April - October',
      language: 'English, Balinese',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=500&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=400&h=300&fit=crop',
      ],
      fullDescription:
        'Immerse yourself in Balinese culture, daily yoga, traditional healing treatments, and the lush green rice terraces of Ubud.',
      highlights: [
        'Daily sunrise yoga with master teacher',
        'Traditional Balinese healing massage',
        'Tegallalang Rice Terrace walk',
        'Cooking class with local family',
        'Sacred Monkey Forest Sanctuary',
      ],
      included: [
        '7 nights private villa with pool',
        'Daily breakfast and dinner',
        'All yoga sessions',
        'Two spa treatments',
        'Airport transfers',
        'All cultural activities',
      ],
      itinerary: [
        { day: 1, title: 'Arrive Ubud', description: 'Transfer to villa, welcome ceremony.' },
        { day: 2, title: 'Yoga & Rice Terraces', description: 'Morning yoga, afternoon rice terrace walk.' },
        { day: 3, title: 'Healing Day', description: 'Traditional Balinese massage and healing ceremony.' },
        { day: 4, title: 'Cooking Class', description: 'Market visit and Balinese cooking class.' },
        { day: 5, title: 'Sacred Sites', description: 'Tirta Empul holy water temple.' },
        { day: 6, title: 'Monkey Forest & Art', description: 'Monkey sanctuary and local art galleries.' },
        { day: 7, title: 'Free Day', description: 'Swimming pool, spa, or optional excursion.' },
        { day: 8, title: 'Departure', description: 'Final breakfast, transfer to Ngurah Rai airport.' },
      ],
      guestReviews: [
        { author: 'Ananya S.', rating: 5, text: 'Exactly what I needed. I came back completely transformed.' },
        { author: 'Hannah K.', rating: 5, text: 'The villa, the yoga, the food — all perfect.' },
      ],
    },
  ],
};

/** Get tours for a given site id. Returns the website1 set as fallback. */
export function getToursForSite(siteId: string): Tour[] {
  return toursBySite[siteId] ?? toursBySite['website1'] ?? [];
}

/** Find a single tour by id within a site. */
export function findTour(siteId: string, tourId: number | string): Tour | undefined {
  return getToursForSite(siteId).find((t) => t.id === Number(tourId));
}
