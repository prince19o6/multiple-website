# TOURSAPP ENTERPRISE PLATFORM
## Comprehensive System Architecture, Business Logic & Functional Specification

> **Platform Architecture Overview**  
> ToursApp is a production-grade, multi-tenant travel and hospitality SaaS ecosystem comprising a **Next.js 15 App Router** web application, an **Expo SDK 57 React Native** mobile application, and an **ASP.NET Core 8 Web API** with isolated **MongoDB** databases per tenant. The platform powers three distinct travel brands with zero data cross-contamination.

---

## 1. Executive Summary & Ecosystem Overview

The ToursApp platform provides an integrated, end-to-end travel booking and itinerary management system. It serves B2C retail travelers, specialized cultural groups (with tailored Pure Veg and Jain meal accommodations), and B2B corporate travel buyers.

### 1.1 The Three Operating Brands

The platform operates across three fully isolated websites, sharing a single codebase while providing dedicated databases, domain-based routing, brand color tokens, and business configurations:

* **Gujju Tours (`gujjutours`):** Specializes in luxury travel, Dubai expeditions, domestic Indian pilgrimage, and international getaways. Uniquely caters to vegetarian travelers with certified Pure Veg and Jain kitchen verification across hotels, safaris, and dining.
* **TripGo Asia (`tripgoasia`):** Focuses on vibrant Southeast Asia excursions, adventure tours (Thailand, Vietnam, Singapore, Bali, Malaysia), budget-to-mid scale packages, and backpacker journeys.
* **TechnoHeaven (`technoheaven`):** B2B wholesale travel technology platform providing net and gross pricing, consolidated hotel allocations, MICE corporate transfers, and wholesale flight seats.

### 1.2 High-Level Technology Stack

| Layer | Technology | Key Libraries / Frameworks | Primary Responsibility |
| :--- | :--- | :--- | :--- |
| **Web Frontend** | Next.js 15 (App Router) | React 19, TypeScript, Tailwind CSS, Zod | SEO-optimized responsive web portal, dynamic module rendering, booking checkout, customer dashboard. |
| **Mobile Application** | Expo SDK 57 (React Native) | Expo Router, React Native Reanimated, SecureStore | Cross-platform mobile app for iOS and Android, offline voucher access, native QR boarding pass. |
| **Backend API** | ASP.NET Core 8 Web API | C#, MongoDB.Driver, MailKit, Dependency Injection | High-performance REST API, booking state machine, payment calculation, coupon validation, email dispatch. |
| **Database** | MongoDB (Multi-DB) | Isolated per-tenant databases, BSON document modeling | Data isolation: `tours_gujjutours`, `tours_tripgoasia`, `tours_technoheaven`. |
| **Security & Cache** | JWT + SHA-256 Tokens | BCrypt, In-Memory Caching, Idempotency keys | Role-based access control, transaction replay protection, single-use action tokens. |

---

## 2. Multi-Tenancy & Website Resolution Architecture

Multi-tenancy in ToursApp is implemented at every tier: edge routing, application context, API client headers, backend dependency injection, and database storage.

### 2.1 Edge Routing & Middleware (`web/middleware.ts`)
The Next.js middleware inspects incoming HTTP requests before any page or route handler is invoked:
1. **Hostname Normalization:** Strips port numbers and extracts the clean hostname (e.g. `www.gujjutours.com` $\rightarrow$ `gujjutours.com`). Matches against the registry in `lib/siteRegistry.ts`.
2. **Canonical Language Prefix:** Guarantees every user has a canonical language prefix (defaults to `/en`). Prevents 404s and ensures internationalization consistency.
3. **Legacy Route Preservation:** Routes like `/booking`, `/bookings`, `/my-bookings`, `/contact`, `/about` are preserved without language prefixes.
4. **Dynamic Route Segment Rewrite:** The internal request is rewritten to `/[site]/[lang]/...` while maintaining the public-facing URL in the traveler's browser bar.
5. **Tenant Header Propagation:** Inject `x-site-id`, `x-site-hostname`, and `x-backend-hostname` headers into the request context for downstream consumption.

### 2.2 Site Configuration Contract (`web/lib/config/siteConfigSchema.ts`)
Every website configuration is strictly validated against a comprehensive Zod schema containing over 80 validated fields:
* **Brand Identity & Theme Tokens:** Defines primary, secondary, accent, surface, and text colors with WCAG 2.1 AA contrast verification.
* **Localization & Currency:** Local currency code (`INR`, `USD`, `AED`), currency symbol, ISO country code, support phone numbers, WhatsApp concierge links, and legal entity details.
* **Module Feature Flags:** Toggles availability of specific verticals (`hotels`, `tours`, `packages`, `flights`, `transfers`, `visas`, `restaurants`, `buildpackage`) per site.
* **Dietary Flags:** Enables or disables Pure Veg, Jain, and Swaminarayan meal filters on a per-site basis.

### 2.3 Backend Tenant Isolation (`backend/toursApi/services/WebsiteContext.cs`)
In the ASP.NET Core backend, multi-tenancy is handled via the scoped `IWebsiteContext` and `MongoDbContext`:
* **Per-Request Scope:** Extracts `X-Website-Hostname` or `X-Website-Id` from request headers and resolves the active tenant identifier.
* **Dynamic DB Resolution:** `MongoDbContext` dynamically connects to the database corresponding to the active tenant: `tours_gujjutours`, `tours_tripgoasia`, or `tours_technoheaven`.
* **Zero Cross-Contamination Guarantee:** Because tenant resolution occurs at the database connection level, it is architecturally impossible for bookings, user accounts, or catalog items from Gujju Tours to bleed into TripGo Asia or TechnoHeaven.

---

## 3. Core Modules & Vertical Logic

ToursApp supports eight distinct travel verticals, each with dedicated database models, API controllers, frontend search forms, detail pages, and booking parameter mappings.

### 3.1 Hotels Module
* **Functional Scope:** Provides direct access to luxury resorts, business hotels, boutique stays, and desert glamping.
* **Search & Filters:** Destination city, check-in and check-out dates, guest count (adults and children), room count, star rating, price range, and amenities (pool, free Wi-Fi, pure veg kitchen).
* **Data Model (`Hotel.cs`):** Title, slug, city, country, starRating, basePrice, rooms array (room type, capacity, price, inclusions, cancellationPolicy), photos, coordinates.
* **Pricing Calculation:** $\text{Total} = (\text{Selected Room Nightly Rate} \times \text{Nights} \times \text{Rooms}) + 5\%\text{ Tax}$. Children under 6 stay free.

### 3.2 Tours & Activities Module
* **Functional Scope:** Curated excursions, dune bashing, desert safaris, dhow cruises, museum entries, and water sports.
* **Search & Filters:** City/destination, activity date, category (Desert Safari, Theme Parks, Water Sports, Sightseeing, Cultural), traveler count.
* **Data Model (`Tour.cs`):** Numeric TourId, name, slug, duration, rating, reviewsCount, pricing tiers (Standard, VIP, Private 4x4), inclusions, exclusions, meetingPoint, departureTimes.
* **Pricing Calculation:** $\text{Adult Total} = (\text{Adults} \times \text{Adult Rate})$; $\text{Child Total} = (\text{Children} \times \text{Child Rate})$ (typically $70\%$ of adult rate). Instant e-ticket issued on booking.

### 3.3 Holiday Packages Module
* **Functional Scope:** Complete packaged holidays combining hotel stays, guided sightseeing, domestic transfers, and meals.
* **Search & Filters:** Theme (Family, Honeymoon, Luxury, Pilgrimage, Adventure), duration (e.g. 5D/4N), departure month, budget per person.
* **Data Model (`Package.cs`):** Title, slug, durationDays, durationNights, citiesCovered, hotelStays, dayByDayItinerary, keyInclusions, exclusions, fixedDepartureDates.
* **Pricing Calculation:** Twin-sharing base rate per adult. Child with bed charged at $70\%$, child without bed at $50\%$. Single supplement option available.

### 3.4 Flights Module
* **Functional Scope:** Domestic and international flight ticketing across major carriers (Emirates, IndiGo, Air India, Singapore Airlines, etc.).
* **Search & Filters:** Origin airport, destination airport, departure date, return date (round-trip), passenger counts, cabin class (Economy, Business, First).
* **Data Model (`Flight.cs`):** AirlineCode, flightNumber, origin, destination, departureTime, arrivalTime, duration, baggageAllowance, mealIncluded, refundable.
* **Pricing Calculation:** Base Airfare + Fuel Surcharge + Airport Departure Tax + GST. Optional seat selection and meal pre-booking.

### 3.5 Transfers Module
* **Functional Scope:** Private and shared airport pickups, inter-hotel transfers, and inter-city chauffeur services.
* **Search & Filters:** Transfer type (Airport to Hotel, Hotel to Attraction, City to City), pickup location, drop-off location, date, passenger capacity.
* **Data Model (`Transfer.cs`):** Title, vehicleCategory (Sedan, Luxury SUV, High-Top Van, Limousine), maxPassengers, maxLuggage, pricePerVehicle, flightTrackingIncluded.
* **Pricing Calculation:** Flat rate per vehicle (not per person), accommodating luggage allowances and complimentary 60-minute airport wait time.

### 3.6 Visas Module
* **Functional Scope:** Assisted consular visa filing, express tourist visas, and multi-entry business permits.
* **Search & Filters:** Applicant nationality, destination country (UAE, Singapore, Thailand, Schengen, UK, USA), visa type (Tourist 30 Days, Express 24h, 60 Days Multi-Entry).
* **Data Model (`Visa.cs`):** Country, visaType, processingTimeDays, validityDays, stayDurationDays, requiredDocumentsList, consularFee, serviceFee.
* **Pricing Calculation:** Consular Fee + Mandatory Travel Insurance + Express Processing Surcharge. Per-applicant pricing.

### 3.7 Restaurants & Dining Module
* **Functional Scope:** Table reservations and culinary set-menu bookings at top-rated dining venues across 9 world cuisines.
* **Search & Filters:** Cuisine (Gujarati Thali, North Indian, Jain Special, Italian, Pan-Asian, Middle Eastern, Mediterranean), dining date, meal slot (Lunch, Dinner), party size.
* **Data Model (`Restaurant.cs`):** Name, slug, cuisineType, dietaryCertifications (Pure Veg, Jain Kitchen, Halal), openingHours, coverImage, sampleMenu, averageCostForTwo.
* **Pricing Calculation:** Deposit token per guest credited against the final dining bill on arrival, or pre-paid set menu vouchers.

### 3.8 Build Your Own Package (Custom Tour Builder)
* **Functional Scope:** Interactive custom itinerary builder allowing travelers to construct tailor-made holidays with real-time price updates.
* **User Journey:** Step-by-step wizard: 1) Choose Destination & Duration $\rightarrow$ 2) Select Hotel Category $\rightarrow$ 3) Add Handpicked Sightseeing $\rightarrow$ 4) Select Transfers $\rightarrow$ 5) Review & Book.
* **Data Model:** Dynamic assembly linking `Hotel.cs`, `Tour.cs`, and `Transfer.cs` records into a single composite custom package.
* **Pricing Calculation:** Dynamic sum of selected hotel nights + daily tours + airport transfer package, minus package bundling discount (typically $5\text{--}10\%$).

---

## 4. Global State & Dynamic Rendering Architecture

### 4.1 Global Module Context (`web/lib/context/ModuleContext.tsx`)
The `ModuleContext` provides the single source of truth for the active vertical:
* **Supported Active Modules:** `hotels`, `tours`, `packages`, `flights`, `transfers`, `visas`, `restaurants`, `buildpackage`.
* **State & URL Synchronization:** When a traveler clicks "Hotels", the URL updates to `?module=hotels` (or `/en/hotels`), and the `activeModule` state transitions immediately.
* **Synchronized View Updates:** The hero headline ("Find Luxury Stays in Dubai"), subtitle, and search widget tab all synchronize with zero layout shifts.

### 4.2 Dynamic Homepage Aggregator (`GET /api/core/v1/home`)
When a module changes, the homepage queries the unified core aggregator endpoint (implemented in `CoreHomeController.cs` and `route.ts`):

| JSON Key | Data Type | Role in Homepage UI |
| :--- | :--- | :--- |
| **`meta`** | Object | Provides the dynamic hero title, tagline, badge text, and default destination. |
| **`categories`** | Array | Renders the horizontal filter chip strip immediately below the hero widget. |
| **`offers`** | Array | Displays contextual promotional cards (e.g. "Book Now Pay Later", 20% off promos). |
| **`featured`** | Array | Populates the primary card grid (top hotels, top tours, or top flights). |
| **`destinations`**| Array | Renders the destination city tiles with live property/tour counts. |
| **`videos`** | Array | Supplies immersive travel experience reels and video walkthroughs. |
| **`packages`** | Array | Provides curated multi-day packages related to the selected vertical. |
| **`reviews`** | Array | Surfaces traveler testimonials with TrustScore and Google reviews. |
| **`faq`** | Array | Accordion answering top traveler concerns for that specific vertical. |

---

## 5. End-to-End Booking Engine & Checkout Lifecycle

### 5.1 Detail Page Booking Dispatch
Every detail page packages the user's selected date, party size, dietary requirements, and tier options into query parameters and invokes:
```ts
router.push('/booking?' + bookingParams.toString());
```

### 5.2 Booking Checkout View (`web/components/booking/BookingCheckoutView.tsx`)
The checkout interface provides a frictionless 4-step reservation process:
1. **Lead Guest Contact:** Full Name, Email, and Phone with international country code selector (`+91`, `+971`, `+1`, `+44`). Auto-fills for returning customers.
2. **Traveler Manifest:** Dynamic passenger list based on total guest count. Allows entering full legal names and genders for flight/hotel check-in.
3. **Dietary Preferences:** Special care options: 100% Pure Vegetarian, Jain Special (no onion, garlic, or root vegetables), Swaminarayan, and Halal, plus special requests.
4. **Payment Schedule:** Full payment (100%) vs. "Book Now, Pay Later" (20% advance token, 80% on arrival). Gateway selection: Card, UPI, Net Banking, Pay on Arrival.
5. **Promo Discounts:** Instant coupon validation for `GUJJU20` (20% off), `TRIPGO15` (15% off), `LUXURY50` ($50 off), `WELCOME` (10% off).
6. **Live Order Summary:** Sticky summary showing item breakdown, taxes (5%), discounts, free cancellation badge, and 24/7 helpline.

### 5.3 Booking Lifecycle State Machine (`backend/toursApi/controllers/BookingsController.cs`)
Bookings progress through well-defined lifecycle stages:

| Status | Trigger | Permissions & Actions | Customer Access |
| :--- | :--- | :--- | :--- |
| **Pending** | Booking created via checkout. | Awaiting admin confirmation or payment gateway webhook. | Voucher preview visible; QR code locked. |
| **Confirmed** | Admin confirms or payment succeeds. | Automated email with PDF voucher dispatched; QR code activated. | Boarding pass unlocked; ready for gate entry. |
| **Cancelled** | User or admin requests cancellation. | Refund calculation initiated based on 48h cancellation policy. | Voucher invalidated; status badge shows Cancelled. |
| **Rejected** | Admin rejects due to capacity/sold-out. | Instant notification sent; alternate date offered. | Status shows Rejected; refund issued. |

### 5.4 Digital Voucher & Confirmation (`web/app/booking/confirmation/page.tsx`)
Upon completion, travelers receive an instant confirmation voucher:
* **Unique Reference Code:** Format `GT-2026-XXXXX` (Gujju Tours), `TGA-2026-XXXXX` (TripGo Asia), or `TH-2026-XXXXX` (TechnoHeaven).
* **Digital QR Code:** Vector SVG QR code encoding the reference and verification hash for paperless entry.
* **Print Voucher View:** Print-optimized CSS media query rendering a clean physical boarding pass.

### 5.5 Customer Booking Portal (`web/app/my-bookings/page.tsx`)
Travelers can access all their historical and active reservations anytime by authenticating or looking up by reference and email. Includes cancellation requests and ticket downloads.

---

## 6. Backend Architecture & Controller Specifications

The ASP.NET Core 8 Web API contains over 45 dedicated controllers and background services:

### 6.1 Core Controller Roster
* **`CoreHomeController.cs`:** Unified multi-module homepage aggregator endpoint serving meta, categories, offers, featured inventory, destination grids, video reels, and FAQs.
* **`BookingsController.cs`:** 1200+ lines managing the entire booking workflow, idempotency keys, single-use action tokens, coupon validation, and cancellation reviews.
* **`ToursController.cs` & `HotelsController.cs`:** Catalog exploration, full-text search, pagination, ratings filters, and slug lookups.
* **`FlightsController.cs`:** Manages airline route lookups, cabin availability, seat inventory, and passenger baggage rules.
* **`TransfersController.cs`:** Private fleet scheduling, airport meet-and-greet logistics, and vehicle class dispatch.
* **`VisasController.cs`:** Consular requirement guidelines, document upload checklists, and application status tracking.
* **`RestaurantsController.cs`:** Table booking slots, dining party sizes, set-menu pricing, and dietary certifications.
* **`BuildPackageController.cs`:** Custom dynamic package calculation engine for tailor-made itineraries.
* **`AuthController.cs` & `UsersController.cs`:** JWT issuance, refresh token rotation, BCrypt password hashing, and user profile management.
* **`WebsiteConfigAdminController.cs`:** Multi-tenant website configuration editor for updating brand themes, banners, and contact numbers.

### 6.2 Key Background Services
* **`EmailOutboxBackgroundService.cs`:** Reliable asynchronous background worker scanning the email outbox collection and dispatching emails via SMTP or SendGrid.
* **`BookingExpiryBackgroundService.cs`:** Sweeps expired pending bookings and releases reserved wholesaler allocations after the 24-hour payment window.
* **`ActionTokenService.cs`:** Generates cryptographically signed, single-use action tokens embedded in admin notification emails, allowing one-click approval with mail-scanner prefetch protection.
* **`ApiKeyRateLimiter.cs`:** Sliding-window rate limiter protecting sensitive booking and authentication endpoints from brute force and DoS.

---

## 7. Mobile Application Architecture (Expo SDK 57 / React Native)

The mobile app (`my-app`) provides a native, buttery-smooth experience across iOS and Android devices, mirroring all website capabilities.

### 7.1 Navigation Hierarchy & Expo Router
The mobile app leverages Expo Router file-based navigation:
* **Tabs Navigation (`app/(tabs)`):** Bottom tab bar: Home, Explore, My Bookings, and Traveler Profile.
* **Detail Stack Screens:** Seamless full-screen presentation of catalog items with photo carousels, itinerary tabs, and sticky booking buttons.
* **Native Booking Sheet:** Native multi-step modal checkout featuring haptic feedback and instant touch validation.
* **Offline Boarding Pass:** High-contrast QR code display that functions offline without active cellular data.

### 7.2 Resilient Multi-Tenant API Client (`my-app/services/api.ts`)
The mobile API client automatically manages tenant isolation:
* **Tenant Header Injection:** Attaches `X-Website-Hostname` and `X-Website-Id` to every HTTP request based on the user's active tenant selection.
* **Token Authentication:** Automatically injects JWT Bearer tokens when the traveler is signed in.
* **Offline Fallback & Cache:** Intercepts network timeouts and gracefully serves cached catalog fixtures when travelers are offline or in transit.

### 7.3 Storage Architecture (`my-app/lib/storage.ts`)
The mobile storage layer utilizes a hybrid strategy:
* **Expo SecureStore:** Stores sensitive authentication tokens and user credentials in hardware-backed secure storage (iOS Keychain / Android Keystore).
* **AsyncStorage Fallback:** Automatically falls back to AsyncStorage in environments where hardware encryption is unavailable.
* **Tenant-Prefixed Keys:** All storage keys are scoped with the tenant identifier (e.g. `@gujjutours.auth:token`) to prevent cross-account contamination.

---

## 8. Database Schema & Data Models (MongoDB)

The MongoDB databases (`tours_gujjutours`, `tours_tripgoasia`, `tours_technoheaven`) employ optimized BSON document models:

| Collection Name | Primary Key / Indexes | Description & Key Fields |
| :--- | :--- | :--- |
| **`tours`** | Id (Int), Slug (Unique) | Tour catalog documents: Title, Duration, Price, Rating, Inclusions, DepartureDates. |
| **`hotels`** | Id (Int), Slug (Unique) | Hotel properties: Name, Stars, City, Rooms (Type, Rate, Beds), Amenities. |
| **`packages`** | Id (Int), Slug (Unique) | Multi-day packages: DurationDays, Itinerary (Day, Title, Desc), Inclusions. |
| **`flights`** | FlightNumber, Route Index | Airline inventory: Carrier, FromCity, ToCity, DepartureTime, CabinClasses. |
| **`transfers`** | Id (Int), Slug (Unique) | Fleet allocations: VehicleType, MaxPax, MaxBags, HourlyRate, AirportRates. |
| **`visas`** | Slug (Unique), Country | Consular requirements: Country, VisaType, ProcessingDays, ConsularFee. |
| **`restaurants`** | Slug (Unique), Cuisine | Culinary listings: Cuisine, DietaryCertifications, SetMenus, OpeningHours. |
| **`bookings`** | Reference (Unique), Email | Master booking record: GuestName, Email, Phone, TravelDate, Amount, Status. |
| **`booking_history`** | BookingId, ChangedAt | Audit trail tracking every status change, timestamp, and actor. |
| **`email_outbox`** | Status, ScheduledAt | Transactional email queue: Recipient, Template, Subject, Payload, RetryCount. |

---

## 9. Security, Resilience & Verification Quality

ToursApp implements enterprise security standards across communication, data storage, and transaction execution:
* **Transaction Idempotency:** Protects against double billing during network interruptions. Every booking submission accepts an `Idempotency-Key`.
* **Single-Use Admin Action Tokens:** Cryptographically signed action tokens embedded in notification emails require an explicit POST action, preventing email scanners from triggering false confirmations.
* **Automated Test Suites:**
  * **Web Module Tests:** 100/100 Passed (`node --test ../tests/web/*.test.js`)
  * **Mobile Client Tests:** 21/21 Passed
  * **Mobile Storage Tests:** 11/11 Passed
  * **ASP.NET Core Backend Build:** 0 Errors, 0 Warnings (`dotnet build`)

---

## 10. Deployment, Runbook & Environment Setup

### 10.1 Environment Variables (`.env`)
* `SITE_ID`: Specifies the default tenant for local development (`gujjutours`, `tripgoasia`, or `technoheaven`).
* `NEXT_PUBLIC_API_URL`: URL of the ASP.NET Core API (default: `http://localhost:5000`).
* `ENABLE_HOST_ROUTING`: When set to `true`, allows browsing `gujjutours.localhost:3000` and `tripgoasia.localhost:3000` simultaneously.

### 10.2 Service Startup Commands
* **Backend API (Port 5000):** `cd backend/toursApi && dotnet run`
* **Web Frontend (Port 3000):** `cd web && npm run dev`
* **Mobile App (Expo):** `cd my-app && npx expo start`

