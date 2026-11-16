# Live Site Reference Audit: Hotels Module (`/en/hotels`)

## 1. Landing Page (`/en/hotels`)
- **URL**: `https://www.gujjutours.com/en/hotels`
- **Hero Title**: Config-driven / "Find Your Ideal Stay"
- **Search Widget**:
  - Fields: Destination/Hotel autocomplete, Nationality dropdown, Check-in / Check-out date range, Guests & Rooms selector (Adults, Children with age dropdowns, Rooms count).
  - Validation: Destination required, Check-in >= Today, Check-out > Check-in, Adults >= 1.
  - Search CTA: "Search Hotels" in brand primary color.
- **Landing Collections & Default Content (Pre-Search)**:
  - "Find Top Stays in Cities" (City cards with hotel count: Dubai, Goa, Jaipur, Mumbai, Abu Dhabi, Singapore).
  - "Explore India's Best Hill Station Hotels" (Shimla, Manali, Ooty, Munnar, Darjeeling).
  - "India's Most Loved Hotel Destinations" (Goa, Jaipur, Udaipur, Kerala, Varanasi).
  - "Explore India's Sacred Pilgrimage Destinations" (Dwarka, Somnath, Tirupati, Shirdi, Haridwar).
  - "India's Most Iconic Stays" (Heritage palaces, royal retreats, luxury boutique resorts).
  - "Top International Luxury Hotels" (Dubai Marina, Palm Jumeirah, Singapore Marina Bay, Bangkok Riverside).
  - "Watch Top Travel Experiences" (Reels / short video carousels).
  - Post-Booking Care comparison section ("How is post-booking care different from a basic hotel booking?").

## 2. Results Page (`/en/hotels?destination=...`)
- **Layout**: Sticky search bar at top, left sidebar filters (Desktop 1440px), filter bottom sheet (Mobile 375px), main list/grid of hotel cards, map toggle.
- **Filters**:
  - Price Range slider (Min - Max).
  - Star Rating: 5 Star, 4 Star, 3 Star, 2 Star, Budget.
  - Property Type / Category: Hotel, Aparthotel, Apartment, Hostel, Villa, Resort, Boutique.
  - Collections: Hill Station, Beach, Pilgrimage, Luxury, Budget, Family.
  - Amenities: Free WiFi, Swimming Pool, Pure Veg / Jain Food, Airport Shuttle, Spa, Ocean View.
- **Sorting**: Popularity, Price (Low to High), Price (High to Low), Guest Rating.
- **Hotel Card Item**:
  - Image carousel with thumbnail indicators.
  - Hotel Title & Star rating badge.
  - Location address & distance to city center / landmark.
  - Guest rating badge (e.g. `4.8/5 (1,420 reviews)`).
  - Key amenities tags (e.g. `Pure Veg Available`, `Free WiFi`, `Beachfront`).
  - Pricing: Strikethrough original price, discount badge (`20% OFF`), effective price per night, taxes & fees disclaimer.
  - CTA: "View Details" / "Check Availability".

## 3. Detail Page (`/en/hotels/<city-id>/<hotel-slug-id>?start=..&end=..`)
- **URL Structure**: `/en/hotels/<city-slug>-<cityId>/<hotel-slug>-<hotelId>?start=<checkIn>&end=<checkOut>&adults=<adults>&rooms=<rooms>`
- **Components**:
  - Header with Breadcrumb: `Home / Hotels / <City> / <Hotel Name>`.
  - Image Gallery: 5-photo grid on Desktop, full-width swipe carousel on Mobile, with "View All Photos" modal.
  - Key Highlights & Property Overview.
  - Room Selection Matrix:
    - Room Category (Deluxe King, Executive Suite, Family Villa).
    - Bed configuration, room area ($m^2$), occupancy limits.
    - Inclusions (Free Breakfast, Free Cancellation up to 48h, Non-refundable rate).
    - Pricing per room per night and total for stay duration.
    - "Select Room" / "Book Now" CTA.
  - Amenities & Facilities (Full categorized list with icons).
  - Location & Map View with nearby landmarks.
  - Hotel Policies: Check-in time (14:00), Check-out time (11:00), Child policy, Cancellation & Refund policy.
  - Verified Guest Reviews breakdown with category ratings (Cleanliness, Service, Location, Food).
  - Similar Hotels in this Destination.

## 4. Booking & Cart Flow
- Step 1: Room Selection & Rate Plan choice.
- Step 2: Guest Details (Lead guest name, email, phone with country code, special requests e.g. Jain meal, early check-in).
- Step 3: Review Order Summary (Base rate, nights count, taxes & service charge, promo code coupon discount, total).
- Step 4: Booking Workflow: Generates booking record with status `Pending Approval` (B2B/B2C workflow) or Instant Voucher with confirmation email.

