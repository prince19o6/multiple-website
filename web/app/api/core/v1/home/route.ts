import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getActualImageUrl } from "@/lib/imageUtils";
import { getSiteApiCredentials } from "@/lib/serverSiteSecrets";

export const dynamic = "force-dynamic";

function loadSeedData(site: string, filename: string): any[] {
  try {
    const seedPath = path.join(process.cwd(), "..", "seed", site, filename);
    if (fs.existsSync(seedPath)) {
      const content = fs.readFileSync(seedPath, "utf-8");
      const list = JSON.parse(content);
      return Array.isArray(list) ? list : [];
    }

    const localSeedPath = path.join(process.cwd(), "seed", site, filename);
    if (fs.existsSync(localSeedPath)) {
      const content = fs.readFileSync(localSeedPath, "utf-8");
      const list = JSON.parse(content);
      return Array.isArray(list) ? list : [];
    }

    const backendSeedPath = path.join(process.cwd(), "..", "backend", "toursApi", "seed", site, filename);
    if (fs.existsSync(backendSeedPath)) {
      const content = fs.readFileSync(backendSeedPath, "utf-8");
      const list = JSON.parse(content);
      return Array.isArray(list) ? list : [];
    }
  } catch (err: any) {
    console.warn(`[CoreHomeAPI] Failed reading seed ${filename}:`, err.message);
  }
  return [];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const site = (searchParams.get("site") || process.env.NEXT_PUBLIC_SITE || "gujjutours").toLowerCase();
  const rawModule = (searchParams.get("module") || "hotels").toLowerCase();

  const normalizeModule = (m: string) => {
    switch (m) {
      case "hotel":
      case "hotels":
        return "hotels";
      case "tour":
      case "tours":
      case "activities":
      case "activity":
        return "tours";
      case "package":
      case "packages":
      case "holiday":
      case "holidays":
        return "packages";
      case "flight":
      case "flights":
        return "flights";
      case "transfer":
      case "transfers":
        return "transfers";
      case "visa":
      case "visas":
        return "visas";
      case "restaurant":
      case "restaurants":
      case "dining":
        return "restaurants";
      case "buildpackage":
      case "build-package":
      case "custompackage":
        return "buildpackage";
      default:
        return "hotels";
    }
  };

  const moduleName = normalizeModule(rawModule);
  const hostname =
    site === "tripgoasia"
      ? "www.tripgoasia.com"
      : site === "technoheaven"
      ? "stagingb2b.technoheaven.com"
      : "www.gujjutours.com";

  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // 1. Try ASP.NET Core backend first
  try {
    const creds = getSiteApiCredentials(site as any);
    const backendUrl = new URL(`${apiUrl}/api/core/v1/home`);
    backendUrl.searchParams.set("module", moduleName);
    backendUrl.searchParams.set("site", site);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(backendUrl.toString(), {
      headers: {
        "X-Website-Hostname": hostname,
        "X-Api-Key": creds.apiKey,
        "X-Website-Id": site,
      },
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err: any) {
    // Backend offline or timeout — fall back to local seed data
  }

  // 2. Local Generator with authentic data
  const isGujju = site === "gujjutours";
  const isTripGo = site === "tripgoasia";

  const metaMap: Record<string, any> = {
    hotels: {
      title: isGujju ? "Perfect Stays in Dubai & Worldwide" : isTripGo ? "Tropical Resorts & Stays" : "Wholesale Hotel Inventory",
      subtitle: isGujju ? "Handpicked luxury resorts, beachside villas, and city center hotels with Pure Veg & Jain dining options." : "Verified star hotels, beachfront villas, and executive suites across top destinations.",
      badge: "VERIFIED STAYS & RESORTS",
      searchModule: "HOTEL",
      citySectionTitle: isGujju ? "Find Top Stays in Popular Cities" : "Top Destination Stays",
      collectionTitle: "Featured Hotel Collections & Stays",
      collectionSubtitle: "Handpicked 5-star properties, beachfront villas, and luxury city center stays.",
      viewMoreUrl: "/en/hotels",
    },
    tours: {
      title: isGujju ? "Top Activities & Desert Safaris in Dubai" : isTripGo ? "Exciting Island Excursions & Tours" : "B2B Excursions & Sightseeing",
      subtitle: isGujju ? "Discover dune bashing, Burj Khalifa observation decks, luxury yacht cruises, and theme parks." : "Top-rated cultural tours, island hopping, adventure parks, and guided expeditions.",
      badge: "EXPERIENCES & EXCURSIONS",
      searchModule: "TOUR",
      citySectionTitle: "Top Activities in Destinations",
      collectionTitle: "Top Tour Combos & Multi-Day Experiences",
      collectionSubtitle: "Best-value bundled excursions, desert safaris, and attraction fast-track passes.",
      viewMoreUrl: "/en/tours",
    },
    packages: {
      title: isGujju ? "Curated Holiday Packages with Jain Meals" : isTripGo ? "All-Inclusive Southeast Asia Packages" : "Dynamic Wholesale Holiday Packages",
      subtitle: isGujju ? "All-inclusive family getaways, honeymoon packages, and domestic holiday tours." : "Carefully crafted vacations with flights, luxury hotels, transfers, and daily sightseeing included.",
      badge: "HANDCRAFTED HOLIDAYS",
      searchModule: "PACKAGE",
      citySectionTitle: "Popular Package Destinations",
      collectionTitle: "Curated Holiday Packages",
      collectionSubtitle: "Dubai, Jain-friendly domestic, and international holiday escapes.",
      viewMoreUrl: "/en/holidays",
    },
    flights: {
      title: isGujju ? "Popular Flight Routes & Best Airfares" : "Top Domestic & International Flights",
      subtitle: "Compare low airfares across leading domestic and global airlines with meal selections and instant booking.",
      badge: "EXCLUSIVE AIRFARES",
      searchModule: "FLIGHT",
      citySectionTitle: "Trending Flight Routes",
      collectionTitle: "Trending Flight Routes & Airfares",
      collectionSubtitle: "Direct flight tickets with complimentary vegetarian and Jain meal confirmation.",
      viewMoreUrl: "/en/flights",
    },
    transfers: {
      title: "Seamless Airport & City Transfers",
      subtitle: "Private executive sedans, spacious SUVs, and luxury coaches with verified, punctual English-speaking chauffeurs.",
      badge: "SAFE & ON-TIME TRANSFERS",
      searchModule: "TRANSFER",
      citySectionTitle: "Top Transfer Locations & Airport Hubs",
      collectionTitle: "Popular Airport & Intercity Transfer Routes",
      collectionSubtitle: "Fixed-rate private executive sedans, spacious SUVs, and airport meet & greet.",
      viewMoreUrl: "/en/transfers",
    },
    visas: {
      title: isGujju ? "Fast & Reliable Visa Services" : "International Tourist & Express Visas",
      subtitle: "Tourist, express, and business visas with end-to-end documentation support and high approval rates.",
      badge: "EXPRESS VISA PROCESSING",
      searchModule: "VISA",
      citySectionTitle: "Popular Visa Countries",
      collectionTitle: "Fast-Track Visa Types & Express Services",
      collectionSubtitle: "Official tourist and express visas with rapid document pre-verification and 99.4% approval.",
      viewMoreUrl: "/en/visas",
    },
    restaurants: {
      title: isGujju ? "Top Dining & Pure Veg Restaurants" : "Finest Dining & Culinary Experiences",
      subtitle: isGujju ? "Verified 100% Pure Veg and Jain friendly restaurants serving Gujarati, North Indian, and international delicacies." : "Top-rated restaurants, rooftop lounges, and authentic culinary dining.",
      badge: "CULINARY EXPERIENCES",
      searchModule: "RESTAURANT",
      citySectionTitle: "Top Dining Destinations",
      collectionTitle: "Special Dining Packages & Thali Passes",
      collectionSubtitle: "Pre-booked pure veg thali experiences, dinner cruises, and family buffets.",
      viewMoreUrl: "/en/restaurants",
    },
    buildpackage: {
      title: "Custom Tailor-Made Holidays",
      subtitle: "Mix and match hotels, private transfers, daily activities, and flights into a personalized dream itinerary.",
      badge: "TAILOR-MADE ITINERARIES",
      searchModule: "BUILDPACKAGE",
      citySectionTitle: "Custom Package Hubs",
      collectionTitle: "Popular Custom Itinerary Templates",
      collectionSubtitle: "Pre-designed customizable itineraries ready to modify and book instantly.",
      viewMoreUrl: "/en/buildpackage",
    },
  };

  const meta = metaMap[moduleName] || metaMap.hotels;

  // Load Seed Collections
  const hotelsSeed = loadSeedData(site, "hotels.json");
  const activitiesSeed = loadSeedData(site, "activities.json");
  const packagesSeed = loadSeedData(site, "packages.json");
  const flightsSeed = loadSeedData(site, "flights.json");
  const transfersSeed = loadSeedData(site, "transfers.json");
  const visasSeed = loadSeedData(site, "visas.json");
  const restaurantsSeed = loadSeedData(site, "restaurants.json");
  const buildOptionsSeed = loadSeedData(site, "build-package-options.json");
  const categoriesSeed = loadSeedData(site, "categories.json");

  // Fallback Category Definitions per Vertical
  const defaultCategoryMap: Record<string, any[]> = {
    hotels: [
      { slug: "luxury", name: "5-Star Luxury", icon: "diamond-outline" },
      { slug: "beachfront", name: "Beachfront Resorts", icon: "water-outline" },
      { slug: "city-center", name: "City Center", icon: "business-outline" },
      { slug: "family", name: "Family Suites", icon: "people-outline" },
      { slug: "budget", name: "Budget Friendly", icon: "wallet-outline" },
      { slug: "villas", name: "Villas & Apartments", icon: "home-outline" },
    ],
    tours: [
      { slug: "desert-safari", name: "Desert Safari", icon: "sunny-outline" },
      { slug: "theme-parks", name: "Theme Parks", icon: "ticket-outline" },
      { slug: "water-sports", name: "Water Activities", icon: "water-outline" },
      { slug: "city-sightseeing", name: "City Sightseeing", icon: "map-outline" },
      { slug: "day-trips", name: "Day Trips & Excursions", icon: "trail-sign-outline" },
      { slug: "culture", name: "Culture & Heritage", icon: "book-outline" },
    ],
    packages: [
      { slug: "family-holidays", name: "Family Holidays", icon: "people-outline" },
      { slug: "honeymoon", name: "Honeymoon Specials", icon: "heart-outline" },
      { slug: "jain-tours", name: "Jain Tour Packages", icon: "nutrition-outline" },
      { slug: "international", name: "International Escapes", icon: "airplane-outline" },
      { slug: "weekend", name: "Weekend Getaways", icon: "calendar-outline" },
      { slug: "luxury-escorted", name: "Escorted Group Tours", icon: "ribbon-outline" },
    ],
    flights: [
      { slug: "direct", name: "Direct Flights", icon: "airplane-outline" },
      { slug: "international", name: "International Airlines", icon: "globe-outline" },
      { slug: "domestic", name: "Domestic Routes", icon: "map-outline" },
      { slug: "family", name: "Family Fares", icon: "people-outline" },
      { slug: "business-class", name: "Business Class", icon: "briefcase-outline" },
      { slug: "low-fare", name: "Low Airfare Deals", icon: "pricetag-outline" },
    ],
    transfers: [
      { slug: "airport-pickup", name: "Airport Pickup", icon: "airplane-outline" },
      { slug: "private-sedan", name: "Private Sedan", icon: "car-outline" },
      { slug: "family-suv", name: "Family SUV / Van", icon: "car-sport-outline" },
      { slug: "intercity", name: "Intercity Chauffeur", icon: "navigate-outline" },
      { slug: "luxury-limo", name: "Luxury Limousine", icon: "sparkles-outline" },
      { slug: "hourly", name: "Hourly Rental", icon: "time-outline" },
    ],
    visas: [
      { slug: "tourist-30", name: "Tourist Visa (30 Days)", icon: "card-outline" },
      { slug: "tourist-60", name: "Tourist Visa (60 Days)", icon: "document-text-outline" },
      { slug: "express-24h", name: "Express 24h Visa", icon: "flash-outline" },
      { slug: "multiple-entry", name: "Multiple Entry Visa", icon: "repeat-outline" },
      { slug: "transit", name: "Transit Visa", icon: "swap-horizontal-outline" },
      { slug: "business-visa", name: "Business Visa", icon: "briefcase-outline" },
    ],
    restaurants: [
      { slug: "pure-veg", name: "100% Pure Veg", icon: "leaf-outline" },
      { slug: "gujarati-thali", name: "Gujarati Thali", icon: "restaurant-outline" },
      { slug: "jain-friendly", name: "Jain Friendly Dining", icon: "nutrition-outline" },
      { slug: "buffet", name: "Dinner Buffets", icon: "fast-food-outline" },
      { slug: "rooftop", name: "Rooftop Lounges", icon: "wine-outline" },
      { slug: "fine-dining", name: "Fine Dining", icon: "sparkles-outline" },
    ],
    buildpackage: [
      { slug: "dubai-custom", name: "Custom Dubai Plan", icon: "construct-outline" },
      { slug: "family-builder", name: "Family Itinerary", icon: "people-outline" },
      { slug: "honeymoon-plan", name: "Honeymoon Custom Plan", icon: "heart-outline" },
      { slug: "multi-city", name: "Multi-City Explorer", icon: "trail-sign-outline" },
      { slug: "budget-builder", name: "Smart Budget Builder", icon: "calculator-outline" },
      { slug: "luxury-bespoke", name: "Luxury Bespoke Tour", icon: "diamond-outline" },
    ],
  };

  // Filter or build categories
  let categories = categoriesSeed
    .filter((c: any) => {
      const catModule = (c.module || "").toLowerCase();
      return (
        catModule === moduleName ||
        (moduleName === "tours" && (catModule === "activities" || catModule === "tours")) ||
        (moduleName === "packages" && (catModule === "packages" || catModule === "holidays"))
      );
    })
    .map((c: any) => ({
      slug: c.slug || "",
      name: c.name?.en || c.title || c.slug || "Category",
      title: c.name?.en || c.title || c.slug || "Category",
      icon: c.icon || "grid-outline",
      order: c.order || 0,
      module: moduleName,
    }))
    .slice(0, 10);

  if (categories.length === 0) {
    categories = (defaultCategoryMap[moduleName] || defaultCategoryMap.hotels).map((c, idx) => ({
      ...c,
      title: c.name,
      order: idx + 1,
      module: moduleName,
    }));
  }

  // Generate Featured Items with authentic high-resolution photography
  let featured: any[] = [];
  switch (moduleName) {
    case "hotels":
      featured = hotelsSeed.slice(0, 6).map((h: any, idx: number) => {
        const cityName = h.destination?.cityName || h.city || "Dubai";
        const countryName = h.destination?.country || h.country || "India";
        const slug = h.slug || h.id || `hotel-${idx}`;
        const images = Array.isArray(h.images) ? h.images : [];
        const actualImg = getActualImageUrl(images[0], {
          title: h.title,
          city: cityName,
          module: "hotels",
          id: h.id || slug || idx,
        });
        return {
          id: h.id || slug,
          slug,
          title: h.title || "Luxury Hotel",
          city: cityName,
          country: countryName,
          price: h.pricePerNight || 6500,
          originalPrice: h.compareAtPrice || 8500,
          rating: h.rating || 4.8,
          reviewCount: h.reviewCount || 320,
          starRating: h.starRating || 5,
          imageUrl: actualImg,
          propertyType: h.propertyType || "Hotel",
          badge: "Best Seller",
          detailUrl: `/en/hotels/${cityName.toLowerCase().replace(/ /g, "-")}/${slug}`,
          features: ["Free Wifi", "Pure Veg Option", "Swimming Pool", "Breakfast Included"],
        };
      });
      break;

    case "tours":
      featured = activitiesSeed.slice(0, 6).map((t: any, idx: number) => {
        const cityName = t.city || (typeof t.destination === "string" ? t.destination : t.destination?.cityName) || "Dubai";
        const countryName = t.country || (typeof t.destination === "object" ? t.destination?.country : null) || "India";
        const slug = t.slug || t.id || `tour-${idx}`;
        const images = Array.isArray(t.images) ? t.images : [];
        const actualImg = getActualImageUrl(images[0] || t.image, {
          title: t.title,
          city: cityName,
          module: "tours",
          id: t.id || slug || idx,
        });
        return {
          id: t.id || slug,
          slug,
          title: t.title || "Desert Safari & City Tour",
          city: cityName,
          country: countryName,
          price: t.price || 3200,
          originalPrice: t.originalPrice || (t.price || 3200) * 1.25,
          rating: t.rating || 4.9,
          reviewCount: t.reviews || t.reviewCount || 450,
          imageUrl: actualImg,
          duration: t.duration || "6 Hours",
          badge: "Top Attraction",
          detailUrl: `/en/tours/${slug}`,
          features: ["Hotel Pickup", "Guided Tour", "Jain Meal Available", "Instant Confirmation"],
        };
      });
      break;

    case "packages":
      featured = packagesSeed.slice(0, 6).map((p: any, idx: number) => {
        const slug = p.slug || p.id || `package-${idx}`;
        const cityName = p.city || (typeof p.destination === "string" ? p.destination : p.destination?.cityName) || "Jaipur";
        const countryName = p.country || "India";
        const images = Array.isArray(p.images) ? p.images : [];
        const actualImg = getActualImageUrl(images[0] || p.image, {
          title: p.title,
          city: cityName,
          module: "packages",
          id: p.id || slug || idx,
        });
        return {
          id: p.id || slug,
          slug,
          title: p.title || "Exotic Holiday Package",
          city: cityName,
          country: countryName,
          duration: p.duration || "5 Days / 4 Nights",
          price: p.price || p.startingPrice || 35000,
          originalPrice: p.originalPrice || (p.price || 35000) * 1.2,
          rating: p.rating || 4.8,
          reviewCount: p.reviews || p.reviewCount || 210,
          imageUrl: actualImg,
          badge: "All Inclusive",
          detailUrl: `/en/holidays/${slug}`,
          features: ["Flights Included", "4-Star Hotel", "Daily Gujarati Meals", "Visa Support"],
        };
      });
      break;

    case "flights":
      featured = flightsSeed.slice(0, 6).map((f: any, idx: number) => {
        const slug = f.slug || f.id || `flight-${idx}`;
        const fromCity = f.fromAirport?.city || f.from || "Delhi";
        const toCity = f.toAirport?.city || f.to || "Mumbai";
        const toCountry = f.toAirport?.country || "India";
        const airline = f.airline || "AeroBharat Express";
        const flightNum = f.flightNumber || "AB-101";
        const title = `${airline} ${flightNum}: ${fromCity} → ${toCity}`;
        const actualImg = getActualImageUrl(null, {
          title,
          city: toCity,
          module: "flights",
          id: f.id || slug || idx,
        });
        return {
          id: f.id || slug,
          slug,
          title,
          city: toCity,
          country: toCountry,
          airline,
          flightNumber: flightNum,
          duration: f.duration || "2h 15m",
          price: f.price || 3880,
          originalPrice: f.originalPrice || 4600,
          rating: f.rating || 4.7,
          reviewCount: f.reviews || 180,
          imageUrl: actualImg,
          badge: "Direct Flight",
          detailUrl: `/en/flights/${slug}`,
          features: ["Pure Veg Meal", "15kg Check-in", "Free Cancellation", "Instant Confirmation"],
        };
      });
      break;

    case "transfers": {
      const seenCities = new Set<string>();
      const diverseTrf: any[] = [];
      for (const tr of transfersSeed) {
        const c = tr.city || "Dubai";
        if (!seenCities.has(c)) {
          seenCities.add(c);
          diverseTrf.push(tr);
          if (diverseTrf.length >= 6) break;
        }
      }
      if (diverseTrf.length < 6) {
        for (const tr of transfersSeed) {
          if (!diverseTrf.includes(tr)) {
            diverseTrf.push(tr);
            if (diverseTrf.length >= 6) break;
          }
        }
      }

      featured = diverseTrf.slice(0, 6).map((tr: any, idx: number) => {
        const slug = tr.slug || tr.id || `transfer-${idx}`;
        const vehicleLabel = tr.vehicleLabel || tr.vehicleType || "Executive Sedan";
        const city = tr.city || "Goa";
        const country = tr.country || "India";
        const title = tr.title || `${city}: ${vehicleLabel} Transfer`;
        const actualImg = getActualImageUrl(null, {
          title,
          city,
          module: "transfers",
          id: tr.id || slug || idx,
        });
        return {
          id: tr.id || slug,
          slug,
          title,
          city,
          country,
          price: tr.price || 2180,
          originalPrice: tr.originalPrice || 2600,
          rating: tr.rating || 4.9,
          reviewCount: tr.reviews || 95,
          imageUrl: actualImg,
          badge: "Private Transfer",
          detailUrl: `/en/transfers/${slug}`,
          features: ["Meet & Greet", "Flight Tracking", "AC Vehicle", "Free Waiting Time"],
        };
      });
      break;
    }

    case "visas": {
      const seenCountries = new Set<string>();
      const diverseVisas: any[] = [];
      for (const v of visasSeed) {
        const c = v.country || "United Arab Emirates";
        if (!seenCountries.has(c)) {
          seenCountries.add(c);
          diverseVisas.push(v);
          if (diverseVisas.length >= 6) break;
        }
      }
      if (diverseVisas.length < 6) {
        for (const v of visasSeed) {
          if (!diverseVisas.includes(v)) {
            diverseVisas.push(v);
            if (diverseVisas.length >= 6) break;
          }
        }
      }

      featured = diverseVisas.slice(0, 6).map((v: any, idx: number) => {
        const slug = v.slug || v.id || `visa-${idx}`;
        const country = v.country || "United Arab Emirates";
        const title = v.title || `${country} Tourist eVisa`;
        const actualImg = getActualImageUrl(null, {
          title,
          city: country,
          module: "visas",
          id: v.id || slug || idx,
        });
        return {
          id: v.id || slug,
          slug,
          title,
          city: country,
          country,
          price: v.price || 6730,
          originalPrice: v.originalPrice || 8650,
          rating: v.rating || 4.9,
          reviewCount: v.reviews || 420,
          imageUrl: actualImg,
          badge: "Fast Approval",
          detailUrl: `/en/visas/${slug}`,
          features: ["24-48h Processing", "No Embassy Visit", "Document Verification", "Express Service"],
        };
      });
      break;
    }

    case "restaurants": {
      const seenCities = new Set<string>();
      const diverseRests: any[] = [];
      for (const r of restaurantsSeed) {
        const c = r.city || "Jaipur";
        if (!seenCities.has(c)) {
          seenCities.add(c);
          diverseRests.push(r);
          if (diverseRests.length >= 6) break;
        }
      }
      if (diverseRests.length < 6) {
        for (const r of restaurantsSeed) {
          if (!diverseRests.includes(r)) {
            diverseRests.push(r);
            if (diverseRests.length >= 6) break;
          }
        }
      }

      featured = diverseRests.slice(0, 6).map((r: any, idx: number) => {
        const slug = r.slug || r.id || `restaurant-${idx}`;
        const city = r.city || "Jaipur";
        const country = r.country || "India";
        const cuisine = r.cuisineLabel || r.cuisine || "Indian Cuisine";
        const title = r.title || r.name || "Saffron Clay Tandoor";
        const cost = r.costForTwo || r.averageCost || 1710;
        const actualImg = getActualImageUrl(null, {
          title,
          city,
          module: "restaurants",
          id: r.id || slug || idx,
        });
        return {
          id: r.id || slug,
          slug,
          title,
          city,
          country,
          cuisine,
          price: cost,
          originalPrice: Math.round(cost * 1.25),
          rating: r.rating || 4.8,
          reviewCount: r.reviews || 120,
          imageUrl: actualImg,
          badge: r.isPureVeg ? "100% Pure Veg" : "Jain Friendly",
          detailUrl: `/en/restaurants/${slug}`,
          features: ["Pure Veg Options", "Jain Meals Available", "Family Seating", "AC Dining"],
        };
      });
      break;
    }

    case "buildpackage":
      featured = buildOptionsSeed.slice(0, 6).map((b: any, idx: number) => {
        const slug = b.destinationSlug || b.slug || b.id || `custom-${idx}`;
        const dest = b.destinationName || b.title || "Dubai & Abu Dhabi";
        const country = b.country || "United Arab Emirates";
        const startPrice = b.startingPrice || b.basePrice || 42000;
        const title = `Custom ${dest} Vacation Plan`;
        const actualImg = getActualImageUrl(null, {
          title,
          city: dest,
          module: "buildpackage",
          id: b.id || slug || idx,
        });
        return {
          id: b.id || slug,
          slug,
          title,
          city: dest,
          country,
          price: startPrice,
          originalPrice: Math.round(startPrice * 1.2),
          rating: b.rating || 4.9,
          reviewCount: b.reviews || 411,
          imageUrl: actualImg,
          badge: b.badge || "Customizable",
          detailUrl: "/en/buildpackage",
          features: ["Pick Your Hotels", "Choose Tours", "Add Private Cabs", "Instant Cost Calculator"],
        };
      });
      break;
  }

  // Count destinations per module
  const counts: Record<string, number> = {};
  if (moduleName === "hotels") {
    hotelsSeed.forEach((h: any) => {
      const c = h.destination?.cityName || "Dubai";
      counts[c] = (counts[c] || 0) + 1;
    });
  } else if (moduleName === "tours") {
    activitiesSeed.forEach((t: any) => {
      const c = t.destination?.cityName || t.city || "Dubai";
      counts[c] = (counts[c] || 0) + 1;
    });
  } else if (moduleName === "transfers") {
    transfersSeed.forEach((tr: any) => {
      const c = tr.city || "Dubai";
      counts[c] = (counts[c] || 0) + 1;
    });
  } else if (moduleName === "restaurants") {
    restaurantsSeed.forEach((r: any) => {
      const c = r.city || "Dubai";
      counts[c] = (counts[c] || 0) + 1;
    });
  } else {
    packagesSeed.forEach((p: any) => {
      const c = p.destination?.cityName || "Dubai";
      counts[c] = (counts[c] || 0) + 1;
    });
  }

  const defaultCities = [
    { name: "Dubai", country: "United Arab Emirates", img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80" },
    { name: "Abu Dhabi", country: "United Arab Emirates", img: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&q=80" },
    { name: "Goa", country: "India", img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80" },
    { name: "Singapore", country: "Singapore", img: "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=600&q=80" },
    { name: "Bangkok", country: "Thailand", img: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80" },
    { name: "London", country: "United Kingdom", img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80" },
  ];

  const unitMap: Record<string, string> = {
    hotels: "hotels",
    tours: "activities",
    packages: "packages",
    flights: "flight routes",
    transfers: "transfer routes",
    visas: "visa categories",
    restaurants: "dining places",
    buildpackage: "custom plans",
  };
  const unit = unitMap[moduleName] || "options";

  const destinations = defaultCities.map((c) => {
    const count = counts[c.name] || 12;
    return {
      id: c.name.toLowerCase(),
      name: c.name,
      country: c.country,
      itemCount: count,
      label: `${count} ${unit}`,
      imageUrl: c.img,
      tag: count > 10 ? "Popular" : "Trending",
      detailUrl: `/en/${moduleName}?destination=${encodeURIComponent(c.name)}`,
    };
  });

  // Dynamic Promotional Offer Banners per Module
  const offersMap: Record<string, any[]> = {
    hotels: [
      {
        id: "banner-bnpl",
        title: "Book Now, Pay Later",
        subtitle: "Pay only 20% now to reserve your luxury stay. Balance before travel with free date changes.",
        tag: "Flexible Booking",
        buttonText: "Explore Stays",
        buttonUrl: "/en/hotels",
        bgGradient: "from-sky-700 via-blue-800 to-indigo-900",
      },
      {
        id: "banner-luxury",
        title: "Save up to 30% on Luxury Stays",
        subtitle: "5-Star resorts, beachfront villas, and city center suites with Pure Veg & Jain dining options.",
        tag: "Limited Offer",
        buttonText: "View Luxury Hotels",
        buttonUrl: "/en/hotels",
        bgGradient: "from-emerald-700 via-teal-800 to-cyan-900",
      },
    ],
    tours: [
      {
        id: "banner-tour-pass",
        title: "Dubai Attractions Mega Pass",
        subtitle: "Save up to 35% on top theme parks, desert safaris, and Burj Khalifa observation fast-track tickets.",
        tag: "Super Saver",
        buttonText: "Explore Top Tours",
        buttonUrl: "/en/tours",
        bgGradient: "from-amber-600 via-orange-700 to-rose-800",
      },
      {
        id: "banner-safari-deal",
        title: "Red Dune Desert Safari & BBQ",
        subtitle: "Enjoy 4x4 dune bashing, camel rides, sandboarding, and pure veg BBQ dinner with live shows.",
        tag: "Best Seller",
        buttonText: "Book Desert Safari",
        buttonUrl: "/en/tours",
        bgGradient: "from-purple-700 via-indigo-800 to-blue-900",
      },
    ],
    packages: [
      {
        id: "banner-holiday",
        title: "All-Inclusive Family Holidays",
        subtitle: "All-inclusive packages with flights, 4-star stays, daily Gujarati & Jain meals, and VIP transfers.",
        tag: "Family Favorite",
        buttonText: "View Packages",
        buttonUrl: "/en/holidays",
        bgGradient: "from-emerald-700 via-teal-800 to-cyan-900",
      },
      {
        id: "banner-intl",
        title: "Save up to ₹15,000 on World Tours",
        subtitle: "Dubai, Singapore, Bali, and Europe group departures with experienced tour managers.",
        tag: "Limited Departure",
        buttonText: "Explore World Holidays",
        buttonUrl: "/en/holidays",
        bgGradient: "from-sky-700 via-blue-800 to-indigo-900",
      },
    ],
    flights: [
      {
        id: "banner-flight-airfares",
        title: "Exclusive Airline Airfares",
        subtitle: "Flat 15% off on direct flights to Dubai, Singapore, and London with zero convenience fees.",
        tag: "Exclusive Fares",
        buttonText: "Search Flights",
        buttonUrl: "/en/flights",
        bgGradient: "from-blue-700 via-indigo-800 to-sky-900",
      },
      {
        id: "banner-flight-meals",
        title: "Guaranteed Veg & Jain In-Flight Meals",
        subtitle: "Confirm your Asian Vegetarian (AVML) and Jain (VJML) meal preferences at zero extra cost.",
        tag: "Meal Guaranteed",
        buttonText: "Book Air Tickets",
        buttonUrl: "/en/flights",
        bgGradient: "from-teal-700 via-cyan-800 to-emerald-900",
      },
    ],
    transfers: [
      {
        id: "banner-trf-roundtrip",
        title: "Airport Roundtrip Discount: Flat 20% Off",
        subtitle: "Book your airport arrival pickup and return transfer together for guaranteed savings.",
        tag: "Airport Special",
        buttonText: "Book Airport Transfer",
        buttonUrl: "/en/transfers",
        bgGradient: "from-neutral-800 via-neutral-900 to-black",
      },
      {
        id: "banner-trf-intercity",
        title: "Dubai to Abu Dhabi Intercity Flat Rates",
        subtitle: "Private luxury sedans and family SUVs with English-speaking chauffeurs and free waiting time.",
        tag: "Fixed Fares",
        buttonText: "Explore Cab Routes",
        buttonUrl: "/en/transfers",
        bgGradient: "from-amber-700 via-yellow-800 to-stone-900",
      },
    ],
    visas: [
      {
        id: "banner-visa-express",
        title: "Express 24-Hour UAE Visa Guaranteed",
        subtitle: "Rapid document pre-verification and fast-track immigration submission with 99.4% approval.",
        tag: "Express Processing",
        buttonText: "Apply Express Visa",
        buttonUrl: "/en/visas",
        bgGradient: "from-blue-800 via-sky-800 to-indigo-950",
      },
      {
        id: "banner-visa-family",
        title: "Flat ₹500 Off Family Visas",
        subtitle: "Apply for 3 or more family tourist visas and receive free travel insurance coverage.",
        tag: "Family Package",
        buttonText: "Start Application",
        buttonUrl: "/en/visas",
        bgGradient: "from-emerald-800 via-teal-900 to-slate-900",
      },
    ],
    restaurants: [
      {
        id: "banner-dining-thali",
        title: "Unlimited Gujarati Thali Dining Pass",
        subtitle: "Pre-book authentic 100% Pure Veg and Jain thali experiences in Dubai with guaranteed table seating.",
        tag: "Pure Veg & Jain",
        buttonText: "View Thali Menus",
        buttonUrl: "/en/restaurants",
        bgGradient: "from-amber-700 via-orange-800 to-rose-900",
      },
      {
        id: "banner-dining-cruise",
        title: "Dubai Marina Pure Veg Dinner Cruise",
        subtitle: "Enjoy a lavish vegetarian buffet and live entertainment while cruising past the illuminated marina skyline.",
        tag: "Special Evening",
        buttonText: "Book Dinner Cruise",
        buttonUrl: "/en/restaurants",
        bgGradient: "from-indigo-800 via-violet-900 to-purple-950",
      },
    ],
    buildpackage: [
      {
        id: "banner-build-save",
        title: "Build Your Dream Trip & Save 25%",
        subtitle: "Bundle hotels, private cabs, desert safaris, and flights into one personalized itinerary.",
        tag: "Dynamic Pricing",
        buttonText: "Start Building",
        buttonUrl: "/en/buildpackage",
        bgGradient: "from-cyan-800 via-blue-900 to-indigo-950",
      },
      {
        id: "banner-build-concierge",
        title: "Free Custom Itinerary Review",
        subtitle: "Have our destination specialists fine-tune your custom itinerary for optimal timing and transfers.",
        tag: "Concierge Assistance",
        buttonText: "Design Itinerary",
        buttonUrl: "/en/buildpackage",
        bgGradient: "from-emerald-800 via-slate-800 to-neutral-900",
      },
    ],
  };

  const offers = offersMap[moduleName] || offersMap.hotels;

  // Dynamic Videos per Module
  const videosMap: Record<string, any[]> = {
    hotels: [
      {
        id: "vid-h1",
        title: "Atlantis The Palm Royal Suite & Beachfront Tour",
        location: "Palm Jumeirah, Dubai",
        duration: "1:20",
        thumbnail: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hotel-room-with-a-view-of-the-city-41712-large.mp4",
      },
      {
        id: "vid-h2",
        title: "Downtown Dubai Luxury Penthouse Stays",
        location: "Downtown Dubai",
        duration: "0:55",
        thumbnail: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-luxury-penthouse-terrace-view-41714-large.mp4",
      },
      {
        id: "vid-h3",
        title: "Beachfront Infinity Pool & Sunset Suites",
        location: "JBR Beach, Dubai",
        duration: "1:10",
        thumbnail: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-swimming-pool-in-a-luxury-hotel-41716-large.mp4",
      },
    ],
    tours: [
      {
        id: "vid-t1",
        title: "Sunrise Dune Bashing & Camel Safari",
        location: "Dubai Desert Reserve",
        duration: "0:45",
        thumbnail: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-safari-jeep-driving-through-the-desert-41123-large.mp4",
      },
      {
        id: "vid-t2",
        title: "Burj Khalifa Top Floor Sunset View",
        location: "Downtown Dubai",
        duration: "1:15",
        thumbnail: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-skyscrapers-at-night-41584-large.mp4",
      },
      {
        id: "vid-t3",
        title: "Luxury Yacht Cruise at Dubai Marina",
        location: "Dubai Marina",
        duration: "0:50",
        thumbnail: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-motorboat-speeding-in-the-sea-41566-large.mp4",
      },
    ],
    packages: [
      {
        id: "vid-p1",
        title: "Memorable Dubai Family Holiday Highlights",
        location: "Dubai & Abu Dhabi",
        duration: "1:30",
        thumbnail: "https://images.unsplash.com/photo-1546412414-e1885259563a?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-safari-jeep-driving-through-the-desert-41123-large.mp4",
      },
      {
        id: "vid-p2",
        title: "Escorted Group Tour Memories in UAE",
        location: "Grand Mosque, Abu Dhabi",
        duration: "1:05",
        thumbnail: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-skyscrapers-at-night-41584-large.mp4",
      },
      {
        id: "vid-p3",
        title: "Exotic Desert Camp Dining & Entertainment",
        location: "Al Marmoom Desert",
        duration: "0:55",
        thumbnail: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-motorboat-speeding-in-the-sea-41566-large.mp4",
      },
    ],
    flights: [
      {
        id: "vid-f1",
        title: "Emirates Business Class Experience",
        location: "Ahmedabad to Dubai",
        duration: "1:10",
        thumbnail: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-airplane-flying-over-clouds-41611-large.mp4",
      },
      {
        id: "vid-f2",
        title: "Smooth International Boarding & Transit",
        location: "Dubai Terminal 3",
        duration: "0:50",
        thumbnail: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-skyscrapers-at-night-41584-large.mp4",
      },
      {
        id: "vid-f3",
        title: "In-Flight Hospitality & Gourmet Dining",
        location: "Airbus A380 Cabin",
        duration: "1:00",
        thumbnail: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-motorboat-speeding-in-the-sea-41566-large.mp4",
      },
    ],
    transfers: [
      {
        id: "vid-tr1",
        title: "VIP Airport Chauffeur Meet & Greet",
        location: "Dubai Airport Arrivals",
        duration: "0:45",
        thumbnail: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-driving-on-a-highway-at-sunset-41625-large.mp4",
      },
      {
        id: "vid-tr2",
        title: "Dubai Marina to Abu Dhabi Luxury Sedan Ride",
        location: "Sheikh Zayed Road",
        duration: "1:15",
        thumbnail: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-skyscrapers-at-night-41584-large.mp4",
      },
      {
        id: "vid-tr3",
        title: "Executive Family Van City Sightseeing Drive",
        location: "Dubai City Hub",
        duration: "0:55",
        thumbnail: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-motorboat-speeding-in-the-sea-41566-large.mp4",
      },
    ],
    visas: [
      {
        id: "vid-v1",
        title: "24-Hour Express Visa Approval Process",
        location: "Immigration Clearance Hub",
        duration: "0:40",
        thumbnail: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-skyscrapers-at-night-41584-large.mp4",
      },
      {
        id: "vid-v2",
        title: "Dubai Airport Smart Gate Entry Experience",
        location: "DXB Smart Gates",
        duration: "0:50",
        thumbnail: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-safari-jeep-driving-through-the-desert-41123-large.mp4",
      },
      {
        id: "vid-v3",
        title: "Hassle-Free Document Upload & Verification",
        location: "Gujju Tours Digital Hub",
        duration: "0:35",
        thumbnail: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-motorboat-speeding-in-the-sea-41566-large.mp4",
      },
    ],
    restaurants: [
      {
        id: "vid-r1",
        title: "Authentic Gujarati Thali & Dining in Dubai",
        location: "Karama, Dubai",
        duration: "1:05",
        thumbnail: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-chef-plating-a-dish-41650-large.mp4",
      },
      {
        id: "vid-r2",
        title: "Dhow Dinner Cruise Pure Veg Royal Buffet",
        location: "Dubai Marina",
        duration: "0:50",
        thumbnail: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-motorboat-speeding-in-the-sea-41566-large.mp4",
      },
      {
        id: "vid-r3",
        title: "Chef's Special Jain Gourmet Kitchen",
        location: "Rasoi Ghar Dubai",
        duration: "1:15",
        thumbnail: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-chef-plating-a-dish-41650-large.mp4",
      },
    ],
    buildpackage: [
      {
        id: "vid-b1",
        title: "How Custom Itinerary Builder Works",
        location: "Custom Travel Studio",
        duration: "1:00",
        thumbnail: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-skyscrapers-at-night-41584-large.mp4",
      },
      {
        id: "vid-b2",
        title: "Travelers Crafting Their Own Dream Vacations",
        location: "Dubai & Singapore Journey",
        duration: "1:20",
        thumbnail: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-safari-jeep-driving-through-the-desert-41123-large.mp4",
      },
      {
        id: "vid-b3",
        title: "Seamless Hotel and Transfer Sync",
        location: "Concierge Planning Suite",
        duration: "0:45",
        thumbnail: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-motorboat-speeding-in-the-sea-41566-large.mp4",
      },
    ],
  };

  const videos = videosMap[moduleName] || videosMap.hotels;

  // Dynamic Curated Packages / Combos / Collections Row per Module
  let packagesList: any[] = [];
  switch (moduleName) {
    case "hotels":
      packagesList = [
        {
          id: "pkg-h1",
          slug: "atlantis-the-palm-luxury-package",
          title: "Atlantis The Palm 3N Luxury Stay + Waterpark",
          category: "Luxury Stays",
          city: "Dubai",
          price: 48000,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80",
          detailUrl: "/en/hotels/dubai/atlantis-the-palm",
        },
        {
          id: "pkg-h2",
          slug: "burj-al-arab-royal-suite",
          title: "Burj Al Arab Suite Experience + Chauffeur",
          category: "Iconic Stays",
          city: "Dubai",
          price: 125000,
          rating: 5.0,
          imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
          detailUrl: "/en/hotels/dubai/burj-al-arab",
        },
        {
          id: "pkg-h3",
          slug: "marina-beachfront-escape",
          title: "Dubai Marina 5-Star Weekend Escape",
          category: "Marina Stays",
          city: "Dubai",
          price: 24000,
          rating: 4.8,
          imageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80",
          detailUrl: "/en/hotels/dubai/marina-beachfront",
        },
        {
          id: "pkg-h4",
          slug: "abu-dhabi-emirates-palace",
          title: "Emirates Palace Mandarin Oriental Stay",
          category: "Palace Stays",
          city: "Abu Dhabi",
          price: 52000,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80",
          detailUrl: "/en/hotels/abu-dhabi/emirates-palace",
        },
        {
          id: "pkg-h5",
          slug: "jw-marriott-downtown",
          title: "JW Marriott Marquis Downtown View",
          category: "City Center",
          city: "Dubai",
          price: 18500,
          rating: 4.8,
          imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80",
          detailUrl: "/en/hotels/dubai/jw-marriott",
        },
        {
          id: "pkg-h6",
          slug: "raffles-the-palm",
          title: "Raffles The Palm Beachfront Villa Stay",
          category: "Private Villas",
          city: "Dubai",
          price: 68000,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80",
          detailUrl: "/en/hotels/dubai/raffles-the-palm",
        },
      ];
      break;

    case "tours":
      packagesList = [
        {
          id: "pkg-t1",
          slug: "dubai-super-saver-trio",
          title: "Dubai 3-in-1 Combo: Safari + Dhow + Burj",
          category: "Best Seller Combo",
          city: "Dubai",
          price: 6999,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&q=80",
          detailUrl: "/en/tours/dubai-super-saver-trio",
        },
        {
          id: "pkg-t2",
          slug: "abu-dhabi-ferrari-world-combo",
          title: "Abu Dhabi Grand Tour & Ferrari World Pass",
          category: "Theme Park Combo",
          city: "Abu Dhabi",
          price: 8500,
          rating: 4.8,
          imageUrl: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&q=80",
          detailUrl: "/en/tours/abu-dhabi-ferrari-world-combo",
        },
        {
          id: "pkg-t3",
          slug: "red-dune-safari-vip",
          title: "Evening Red Dune Safari & VIP BBQ Dinner",
          category: "Desert Safari",
          city: "Dubai",
          price: 2499,
          rating: 5.0,
          imageUrl: "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=600&q=80",
          detailUrl: "/en/tours/red-dune-safari-vip",
        },
        {
          id: "pkg-t4",
          slug: "marina-sunset-yacht-dinner",
          title: "Dubai Marina Luxury Yacht Cruise & Dinner",
          category: "Luxury Yacht",
          city: "Dubai",
          price: 3800,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80",
          detailUrl: "/en/tours/marina-sunset-yacht-dinner",
        },
        {
          id: "pkg-t5",
          slug: "burj-khalifa-sky-views-pass",
          title: "Burj Khalifa At The Top + Sky Views Observatory",
          category: "Observation Decks",
          city: "Dubai",
          price: 4200,
          rating: 4.8,
          imageUrl: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=600&q=80",
          detailUrl: "/en/tours/burj-khalifa-sky-views-pass",
        },
        {
          id: "pkg-t6",
          slug: "aquaventure-lost-chambers-pass",
          title: "Atlantis Aquaventure & Lost Chambers Pass",
          category: "Water Parks",
          city: "Dubai",
          price: 6200,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
          detailUrl: "/en/tours/aquaventure-lost-chambers-pass",
        },
      ];
      break;

    case "transfers":
      packagesList = [
        {
          id: "pkg-tr1",
          slug: "dxb-roundtrip-private-sedan",
          title: "DXB Airport Roundtrip VIP Private Sedan",
          category: "Airport Roundtrip",
          city: "Dubai",
          price: 3800,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80",
          detailUrl: "/en/transfers/dxb-roundtrip-private-sedan",
        },
        {
          id: "pkg-tr2",
          slug: "dubai-abu-dhabi-intercity-cab",
          title: "Dubai to Abu Dhabi Intercity Chauffeur",
          category: "Intercity Transfer",
          city: "Dubai",
          price: 4500,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80",
          detailUrl: "/en/transfers/dubai-abu-dhabi-intercity-cab",
        },
        {
          id: "pkg-tr3",
          slug: "full-day-10h-chauffeur-drive",
          title: "Full Day 10-Hour Private Chauffeur Drive",
          category: "Hourly Chauffeur",
          city: "Dubai",
          price: 7500,
          rating: 5.0,
          imageUrl: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&q=80",
          detailUrl: "/en/transfers/full-day-10h-chauffeur-drive",
        },
        {
          id: "pkg-tr4",
          slug: "luxury-stretch-limousine-1h",
          title: "Luxury Stretch Limousine City Tour (1 Hour)",
          category: "VIP Limousine",
          city: "Dubai",
          price: 9999,
          rating: 4.8,
          imageUrl: "https://images.unsplash.com/photo-1559297434-fae8a1916a79?w=600&q=80",
          detailUrl: "/en/transfers/luxury-stretch-limousine-1h",
        },
        {
          id: "pkg-tr5",
          slug: "dxb-to-dubai-marina-suv",
          title: "DXB Terminal to Dubai Marina Family SUV",
          category: "Family SUV",
          city: "Dubai",
          price: 3200,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80",
          detailUrl: "/en/transfers/dxb-to-dubai-marina-suv",
        },
        {
          id: "pkg-tr6",
          slug: "sharjah-to-dubai-transfer",
          title: "Sharjah Airport to Dubai Hotels Private Cab",
          category: "Inter-Emirate Cab",
          city: "Sharjah",
          price: 2800,
          rating: 4.8,
          imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80",
          detailUrl: "/en/transfers/sharjah-to-dubai-transfer",
        },
      ];
      break;

    case "visas":
      packagesList = [
        {
          id: "pkg-v1",
          slug: "express-30-days-tourist-visa",
          title: "30-Day Express Tourist Visa + Airport SIM",
          category: "Express Visa",
          city: "Dubai",
          price: 6800,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=80",
          detailUrl: "/en/visas/express-30-days-tourist-visa",
        },
        {
          id: "pkg-v2",
          slug: "multiple-entry-60-days-visa",
          title: "60-Day Multiple Entry Tourist Visa",
          category: "Multiple Entry",
          city: "Dubai",
          price: 15500,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80",
          detailUrl: "/en/visas/multiple-entry-60-days-visa",
        },
        {
          id: "pkg-v3",
          slug: "urgent-same-day-visa",
          title: "Urgent Same-Day 12-Hour Express Visa",
          category: "Urgent Service",
          city: "Dubai",
          price: 9500,
          rating: 5.0,
          imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
          detailUrl: "/en/visas/urgent-same-day-visa",
        },
        {
          id: "pkg-v4",
          slug: "family-tourist-visa-bundle",
          title: "Family Tourist Visa Bundle (4 Passports)",
          category: "Family Special",
          city: "Dubai",
          price: 24000,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=600&q=80",
          detailUrl: "/en/visas/family-tourist-visa-bundle",
        },
        {
          id: "pkg-v5",
          slug: "singapore-e-visa-tourist",
          title: "Singapore 30-Day Multiple Entry E-Visa",
          category: "Asian E-Visa",
          city: "Singapore",
          price: 3200,
          rating: 4.8,
          imageUrl: "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=600&q=80",
          detailUrl: "/en/visas/singapore-e-visa-tourist",
        },
        {
          id: "pkg-v6",
          slug: "thailand-evoa-fast-track",
          title: "Thailand Fast-Track E-Visa on Arrival",
          category: "Fast Track",
          city: "Bangkok",
          price: 4500,
          rating: 4.8,
          imageUrl: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80",
          detailUrl: "/en/visas/thailand-evoa-fast-track",
        },
      ];
      break;

    case "restaurants":
      packagesList = [
        {
          id: "pkg-r1",
          slug: "royal-gujarati-thali-experience",
          title: "Unlimited Royal Gujarati Thali Feast Pass",
          category: "Traditional Thali",
          city: "Dubai",
          price: 850,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&q=80",
          detailUrl: "/en/restaurants/royal-gujarati-thali-experience",
        },
        {
          id: "pkg-r2",
          slug: "dubai-marina-pure-veg-dhow-dinner",
          title: "Dubai Marina Dhow Pure Veg Dinner Cruise",
          category: "Dinner Cruise",
          city: "Dubai",
          price: 1800,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80",
          detailUrl: "/en/restaurants/dubai-marina-pure-veg-dhow-dinner",
        },
        {
          id: "pkg-r3",
          slug: "desert-camp-vip-pure-veg-buffet",
          title: "Desert Camp VIP Pure Veg & Jain Buffet",
          category: "Desert Dining",
          city: "Dubai",
          price: 2200,
          rating: 4.8,
          imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
          detailUrl: "/en/restaurants/desert-camp-vip-pure-veg-buffet",
        },
        {
          id: "pkg-r4",
          slug: "kathiyawadi-family-dining-pass",
          title: "Authentic Kathiyawadi Family Feast Pass",
          category: "Kathiyawadi Thali",
          city: "Dubai",
          price: 1100,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
          detailUrl: "/en/restaurants/kathiyawadi-family-dining-pass",
        },
        {
          id: "pkg-r5",
          slug: "rooftop-pure-veg-sunset-dining",
          title: "Rooftop Pure Veg Skyline Dining Package",
          category: "Rooftop Dining",
          city: "Dubai",
          price: 2400,
          rating: 4.8,
          imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
          detailUrl: "/en/restaurants/rooftop-pure-veg-sunset-dining",
        },
        {
          id: "pkg-r6",
          slug: "govindas-jain-gourmet-experience",
          title: "Govinda's Pure Veg & Jain Gourmet Meal",
          category: "Jain Gourmet",
          city: "Dubai",
          price: 1350,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&q=80",
          detailUrl: "/en/restaurants/govindas-jain-gourmet-experience",
        },
      ];
      break;

    case "flights":
      packagesList = [
        {
          id: "pkg-f1",
          slug: "ahmedabad-to-dubai-return-deal",
          title: "Ahmedabad (AMD) to Dubai (DXB) Return Deal",
          category: "Direct Flight",
          city: "Dubai",
          price: 22500,
          rating: 4.8,
          imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80",
          detailUrl: "/en/flights/ahmedabad-to-dubai-return-deal",
        },
        {
          id: "pkg-f2",
          slug: "mumbai-to-dubai-business-special",
          title: "Mumbai (BOM) to Dubai (DXB) Business Class",
          category: "Business Special",
          city: "Dubai",
          price: 45000,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
          detailUrl: "/en/flights/mumbai-to-dubai-business-special",
        },
        {
          id: "pkg-f3",
          slug: "delhi-to-singapore-family-fare",
          title: "Delhi (DEL) to Singapore (SIN) Family Fare",
          category: "Family Special",
          city: "Singapore",
          price: 26000,
          rating: 4.7,
          imageUrl: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=600&q=80",
          detailUrl: "/en/flights/delhi-to-singapore-family-fare",
        },
        {
          id: "pkg-f4",
          slug: "surat-to-dubai-direct-flight",
          title: "Surat (STV) to Dubai (DXB) Non-Stop Flight",
          category: "Direct Route",
          city: "Dubai",
          price: 21000,
          rating: 4.8,
          imageUrl: "https://images.unsplash.com/photo-1520437358207-323b43b50729?w=600&q=80",
          detailUrl: "/en/flights/surat-to-dubai-direct-flight",
        },
        {
          id: "pkg-f5",
          slug: "ahmedabad-to-london-gatwick",
          title: "Ahmedabad (AMD) to London (LGW) Direct Flight",
          category: "International",
          city: "London",
          price: 52000,
          rating: 4.8,
          imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80",
          detailUrl: "/en/flights/ahmedabad-to-london-gatwick",
        },
        {
          id: "pkg-f6",
          slug: "bangalore-to-bangkok-holiday-fare",
          title: "Bangalore (BLR) to Bangkok (BKK) Holiday Fare",
          category: "Holiday Route",
          city: "Bangkok",
          price: 18500,
          rating: 4.7,
          imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
          detailUrl: "/en/flights/bangalore-to-bangkok-holiday-fare",
        },
      ];
      break;

    case "buildpackage":
      packagesList = [
        {
          id: "pkg-b1",
          slug: "custom-dubai-6d5n-template",
          title: "Custom 6D/5N Dubai & Abu Dhabi Itinerary",
          category: "Custom Itinerary",
          city: "Dubai",
          price: 36000,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80",
          detailUrl: "/en/buildpackage",
        },
        {
          id: "pkg-b2",
          slug: "custom-singapore-bali-combo",
          title: "Custom 7D/6N Singapore & Bali Combo Plan",
          category: "Multi-Country",
          city: "Singapore",
          price: 49000,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80",
          detailUrl: "/en/buildpackage",
        },
        {
          id: "pkg-b3",
          slug: "custom-thailand-island-escape",
          title: "Custom 5D/4N Phuket & Krabi Island Escape",
          category: "Island Escape",
          city: "Phuket",
          price: 28000,
          rating: 4.8,
          imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=80",
          detailUrl: "/en/buildpackage",
        },
        {
          id: "pkg-b4",
          slug: "custom-kerala-backwaters-plan",
          title: "Custom 5D/4N Kerala Houseboat & Hills",
          category: "Domestic Custom",
          city: "Munnar",
          price: 22000,
          rating: 4.9,
          imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80",
          detailUrl: "/en/buildpackage",
        },
        {
          id: "pkg-b5",
          slug: "custom-vietnam-cambodia-expedition",
          title: "Custom 8D/7N Vietnam & Angkor Wat Plan",
          category: "Heritage Circuit",
          city: "Hanoi",
          price: 42000,
          rating: 4.8,
          imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80",
          detailUrl: "/en/buildpackage",
        },
        {
          id: "pkg-b6",
          slug: "custom-europe-3-cities-plan",
          title: "Custom 9D/8N Paris, Swiss & Italy Trip",
          category: "Europe Bespoke",
          city: "Zurich",
          price: 110000,
          rating: 5.0,
          imageUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80",
          detailUrl: "/en/buildpackage",
        },
      ];
      break;

    default: // packages module
      packagesList = packagesSeed.slice(0, 6).map((p: any, idx: number) => {
        const slug = p.slug || p.id || `pkg-${idx}`;
        const actualImg = getActualImageUrl(p.images?.[0] || p.image, {
          title: p.title,
          city: p.city || "Dubai",
          module: "packages",
          id: p.id || slug || idx,
        });
        return {
          id: p.id || slug,
          slug,
          title: p.title || "5D/4N Dubai Grand Tour",
          category: p.category || "Dubai Packages",
          city: p.destination?.cityName || p.city || "Dubai",
          price: p.price || 32500,
          rating: 4.9,
          imageUrl: actualImg,
          detailUrl: `/en/holidays/${slug}`,
        };
      });
      break;
  }

  // Dynamic Customer Reviews per Module
  const reviewsMap: Record<string, any[]> = {
    hotels: [
      {
        id: "rev-h1",
        author: "Pooja Shah",
        city: "Surat, India",
        rating: 5,
        platform: "TripAdvisor",
        date: "3 days ago",
        text: "Our family hotel stay in Atlantis The Palm was handled exceptionally well. Got complimentary room upgrades, early check-in, and pure vegetarian breakfast confirmed with the chef.",
      },
      {
        id: "rev-h2",
        author: "Harish Mehta",
        city: "Ahmedabad, India",
        rating: 5,
        platform: "Google Reviews",
        date: "1 week ago",
        text: "Booked JW Marriott Marquis through Gujju Tours. Best rates online, zero hidden resort fees, and the 24/7 concierge was always accessible via WhatsApp.",
      },
      {
        id: "rev-h3",
        author: "Snehal Patel",
        city: "Vadodara, India",
        rating: 5,
        platform: "Trustpilot",
        date: "2 weeks ago",
        text: "Flawless hotel booking experience in Dubai Marina. Even when our flight was delayed by 3 hours, the concierge informed the hotel and held our room without penalty.",
      },
    ],
    tours: [
      {
        id: "rev-t1",
        author: "Rajesh Patel",
        city: "Ahmedabad, India",
        rating: 5,
        platform: "Google Reviews",
        date: "2 days ago",
        text: "The evening red dune desert safari was the highlight of our Dubai trip! Punctual Land Cruiser pickup, thrilling dune bashing, and Jain food was specifically served at the desert camp.",
      },
      {
        id: "rev-t2",
        author: "Ketan Trivedi",
        city: "Rajkot, India",
        rating: 5,
        platform: "TripAdvisor",
        date: "5 days ago",
        text: "Burj Khalifa fast-track vouchers with QR codes worked like magic. No queue at the ticket counter, straight to the 124th floor elevator. Highly recommended!",
      },
      {
        id: "rev-t3",
        author: "Bhavna Joshi",
        city: "Mumbai, India",
        rating: 5,
        platform: "Trustpilot",
        date: "1 week ago",
        text: "Booked the Dubai 3-in-1 combo (Safari + Dhow Cruise + Abu Dhabi). Excellent coordination, friendly drivers, and huge savings compared to buying tickets individually.",
      },
    ],
    packages: [
      {
        id: "rev-p1",
        author: "Dipen Zaveri",
        city: "Surat, India",
        rating: 5,
        platform: "Google Reviews",
        date: "4 days ago",
        text: "Our 6D/5N Dubai package was perfectly managed. The Gujarati tour manager made sure my parents were comfortable every single day. 100% Pure Veg and Jain meals guaranteed throughout.",
      },
      {
        id: "rev-p2",
        author: "Alpa Parekh",
        city: "Ahmedabad, India",
        rating: 5,
        platform: "TripAdvisor",
        date: "1 week ago",
        text: "Smooth holiday booking from flights to luxury hotel stays and sightseeing. Transparent pricing with no surprise charges. Gujju Tours is our family travel partner forever.",
      },
      {
        id: "rev-p3",
        author: "Jignesh Vora",
        city: "Baroda, India",
        rating: 5,
        platform: "Trustpilot",
        date: "2 weeks ago",
        text: "We booked the Singapore & Malaysia combo package. All transfers, flights, and daily excursions were on time. Outstanding concierge support on WhatsApp.",
      },
    ],
    flights: [
      {
        id: "rev-f1",
        author: "Nirav Gandhi",
        city: "Ahmedabad, India",
        rating: 5,
        platform: "Google Reviews",
        date: "3 days ago",
        text: "Booked Emirates flight from Ahmedabad to Dubai. The fare was significantly lower than other portals, and our Jain meals (VJML) were pre-confirmed without hassle.",
      },
      {
        id: "rev-f2",
        author: "Swati Shah",
        city: "Mumbai, India",
        rating: 5,
        platform: "TripAdvisor",
        date: "6 days ago",
        text: "Zero convenience fee policy saved our family ₹3,500 on return tickets. Instant PNR delivery and seamless web check-in assistance from customer care.",
      },
      {
        id: "rev-f3",
        author: "Mahesh Panchal",
        city: "Surat, India",
        rating: 5,
        platform: "Trustpilot",
        date: "2 weeks ago",
        text: "Direct Surat to Dubai flight booking was smooth and transparent. Baggage allowance details were clear and ticket cancellation terms were very fair.",
      },
    ],
    transfers: [
      {
        id: "rev-tr1",
        author: "Sanjay Doshi",
        city: "Ahmedabad, India",
        rating: 5,
        platform: "Google Reviews",
        date: "2 days ago",
        text: "Our driver was waiting at DXB Terminal 3 arrivals holding a clear name sign. Assisted with 4 large suitcases, pristine Lexus sedan, and smooth drive to Palm Jumeirah.",
      },
      {
        id: "rev-tr2",
        author: "Meera Thakkar",
        city: "Vadodara, India",
        rating: 5,
        platform: "TripAdvisor",
        date: "4 days ago",
        text: "Booked intercity transfer from Dubai to Abu Dhabi. The vehicle was spotless, air conditioning was fantastic, and the driver was extremely polite and professional.",
      },
      {
        id: "rev-tr3",
        author: "Chetan Modi",
        city: "Surat, India",
        rating: 5,
        platform: "Trustpilot",
        date: "1 week ago",
        text: "Flight was delayed by 45 minutes, but the chauffeur tracked our flight and did not charge any extra waiting fees. Outstanding airport transfer service!",
      },
    ],
    visas: [
      {
        id: "rev-v1",
        author: "Amit Desai",
        city: "Vadodara, India",
        rating: 5,
        platform: "Trustpilot",
        date: "1 day ago",
        text: "Express UAE tourist visa was approved in less than 18 hours! Document upload was straightforward and the team double checked all passport details before submission.",
      },
      {
        id: "rev-v2",
        author: "Priti Sanghavi",
        city: "Ahmedabad, India",
        rating: 5,
        platform: "Google Reviews",
        date: "5 days ago",
        text: "Applied for 5 family tourist visas. All 5 were approved together without asking for unnecessary extra papers. Truly fast and reliable visa service.",
      },
      {
        id: "rev-v3",
        author: "Kashyap Bhatt",
        city: "Rajkot, India",
        rating: 5,
        platform: "TripAdvisor",
        date: "1 week ago",
        text: "Affordable visa rates with no hidden processing surcharges. Received PDF e-visa directly on WhatsApp and email. Highly recommended for Dubai travelers.",
      },
    ],
    restaurants: [
      {
        id: "rev-r1",
        author: "Bipin Shah",
        city: "Ahmedabad, India",
        rating: 5,
        platform: "Google Reviews",
        date: "2 days ago",
        text: "Finding 100% Pure Veg and authentic Jain food in Dubai was our main worry, but Gujju Tours dining passes took care of everything. Rasoi Ghar thali was heavenly!",
      },
      {
        id: "rev-r2",
        author: "Rekha Somani",
        city: "Surat, India",
        rating: 5,
        platform: "TripAdvisor",
        date: "4 days ago",
        text: "The Dubai Marina Dhow dinner cruise with Pure Veg & Jain buffet was magical. Fresh rotis, dal, paneer, and sweets while sailing past skyscrapers.",
      },
      {
        id: "rev-r3",
        author: "Manoj Choksi",
        city: "Mumbai, India",
        rating: 5,
        platform: "Trustpilot",
        date: "1 week ago",
        text: "Great discounts on pre-booked restaurant meals. No waiting in line, table reserved in advance, and special Swaminarayan food was prepared upon request.",
      },
    ],
    buildpackage: [
      {
        id: "rev-b1",
        author: "Darshan Solanki",
        city: "Ahmedabad, India",
        rating: 5,
        platform: "Google Reviews",
        date: "3 days ago",
        text: "The custom package builder allowed us to choose our exact hotel in Downtown, pick private tours for Dubai and Abu Dhabi, and calculate real-time pricing without hidden costs.",
      },
      {
        id: "rev-b2",
        author: "Kinjal Dave",
        city: "Surat, India",
        rating: 5,
        platform: "TripAdvisor",
        date: "1 week ago",
        text: "Customized a 7-day family itinerary. The flexibility to swap tours and upgrade transfer vehicles made planning so enjoyable. Their travel specialist verified our timings.",
      },
      {
        id: "rev-b3",
        author: "Pratik Majithia",
        city: "Baroda, India",
        rating: 5,
        platform: "Trustpilot",
        date: "2 weeks ago",
        text: "Tailor-made package with instant cost breakdown. Everything from airport pickup to theme parks executed seamlessly in Dubai. Superb tech platform!",
      },
    ],
  };

  const reviews = reviewsMap[moduleName] || reviewsMap.hotels;

  // Dynamic FAQs per Module
  const faqMap: Record<string, any[]> = {
    hotels: [
      {
        id: "faq-h1",
        question: "How is post-booking care different from a basic hotel booking portal?",
        answer: "Unlike impersonal aggregators, our dedicated concierge team coordinates directly with hotel front desks. We verify early check-in requests, room configurations, and ensure 100% Pure Veg & Jain breakfast options are prepared by hotel chefs.",
      },
      {
        id: "faq-h2",
        question: "Can I request Pure Vegetarian or Jain breakfast at my hotel?",
        answer: "Yes! All hotels tagged with Pure Veg or Jain friendly have vetted kitchens. Our concierge team communicates your dietary preferences to the hotel chef prior to your arrival.",
      },
      {
        id: "faq-h3",
        question: "What happens if my flight arrives late or travel plans change?",
        answer: "Our team tracks your flight in real time. If your arrival is delayed, we notify the hotel management immediately so your room is securely held for late check-in without penalty.",
      },
      {
        id: "faq-h4",
        question: "Are tourism taxes and resort fees included in the displayed rate?",
        answer: "All mandatory taxes and municipal fees are itemized transparently before payment. You will never face surprise surcharges at the hotel reception.",
      },
    ],
    tours: [
      {
        id: "faq-t1",
        question: "What is included in the Desert Safari tour?",
        answer: "Our desert safari includes roundtrip 4x4 Land Cruiser hotel pickup, 30 minutes red dune bashing, camel rides, sandboarding, falcon photography, live cultural shows (Tanoura & Fire show), and a lavish BBQ dinner with verified Pure Veg & Jain food counters.",
      },
      {
        id: "faq-t2",
        question: "How do I redeem my attraction tickets and tour vouchers?",
        answer: "All attraction vouchers (Burj Khalifa, Theme Parks, Dhow Cruises) include digital QR codes delivered instantly via email and WhatsApp. Simply present the QR code on your mobile phone at the gate for fast-track entry.",
      },
      {
        id: "faq-t3",
        question: "Can we book private sightseeing tours with Gujarati / Hindi speaking guides?",
        answer: "Yes! We offer customized private tours with dedicated English, Gujarati, and Hindi speaking chauffeurs and licensed tour guides to make family travel relaxing and informative.",
      },
      {
        id: "faq-t4",
        question: "What is the cancellation and refund policy for activities?",
        answer: "Most tours and activities offer free cancellation up to 24 hours prior to scheduled departure. Cancellations are processed immediately with refunds credited back to your original payment method.",
      },
    ],
    packages: [
      {
        id: "faq-p1",
        question: "What is included in curated holiday packages?",
        answer: "Our holiday packages include return flights, 4-star/5-star accommodation, daily buffet breakfast, Indian and Jain dinners, private airport transfers, visa processing, and curated sightseeing tours with entrance tickets.",
      },
      {
        id: "faq-p2",
        question: "Can we customize or add extra nights to an existing holiday package?",
        answer: "Absolutely! Every holiday package can be fully personalized. You can extend your hotel stay, upgrade room categories, or add optional excursions like Ferrari World, hot air ballooning, or helicopter tours.",
      },
      {
        id: "faq-p3",
        question: "Is an escort or tour manager provided during group holiday departures?",
        answer: "Yes! All group holiday departures are accompanied by an experienced Gujarati and Hindi speaking tour manager who travels with your group from airport departure to your return flight.",
      },
      {
        id: "faq-p4",
        question: "What is the booking deposit required to confirm a holiday package?",
        answer: "You can confirm your holiday package with a nominal 20% deposit under our Book Now Pay Later policy. The remaining balance can be settled 15 days before your travel departure date.",
      },
    ],
    flights: [
      {
        id: "faq-f1",
        question: "Can I book Asian Vegetarian (AVML) and Jain (VJML) meals on my flight?",
        answer: "Yes! Our flight booking engine lets you select your meal preference (Pure Veg, Jain, Hindu Meal, Child Meal) at the time of booking, which is directly transmitted to the airline's passenger manifest.",
      },
      {
        id: "faq-f2",
        question: "What are the baggage allowances included with flight tickets?",
        answer: "International flights typically include 30kg check-in baggage and 7kg cabin baggage per adult passenger. Domestic flights include 15kg check-in and 7kg cabin baggage. Extra baggage can be added during checkout.",
      },
      {
        id: "faq-f3",
        question: "How do I complete web check-in and seat selection?",
        answer: "You can complete web check-in 24 to 48 hours prior to flight departure using your airline PNR from your booking voucher. Our customer care desk can also complete web check-in on your behalf upon request.",
      },
      {
        id: "faq-f4",
        question: "What are the cancellation and date change charges for flights?",
        answer: "Cancellation charges follow the operating airline's fare rules. If you select our Flexi-Fare option, date changes can be made with zero portal penalty fees.",
      },
    ],
    transfers: [
      {
        id: "faq-tr1",
        question: "Will the chauffeur meet me inside the airport terminal?",
        answer: "Yes! Your private chauffeur will monitor your flight number, wait at the airport arrival hall holding a clear digital name sign with your name, assist with your luggage, and escort you to your air-conditioned vehicle.",
      },
      {
        id: "faq-tr2",
        question: "What happens if my flight arrives late or is delayed?",
        answer: "We track all flights in real-time. Your chauffeur's arrival time is adjusted automatically according to your actual flight touchdown time, with complimentary 60 minutes waiting time from landing.",
      },
      {
        id: "faq-tr3",
        question: "Can I request baby booster seats or child safety seats?",
        answer: "Yes, certified child safety seats and infant booster seats are available upon request during booking at no extra surcharge to ensure your family's safety.",
      },
      {
        id: "faq-tr4",
        question: "Can I book inter-city transfers between Dubai and Abu Dhabi?",
        answer: "Yes, we provide fixed-rate private transfers across all emirates including Dubai, Abu Dhabi, Sharjah, Ajman, and Ras Al Khaimah in executive sedans, spacious SUVs, and luxury passenger vans.",
      },
    ],
    visas: [
      {
        id: "faq-v1",
        question: "What documents are required for a Dubai tourist visa?",
        answer: "You only need a clear colored copy of your passport (valid for at least 6 months from the date of travel) and a recent passport-size photograph with white background. No physical embassy visit or biometrics required.",
      },
      {
        id: "faq-v2",
        question: "How fast is express visa processing approved?",
        answer: "Express visa processing is typically approved within 12 to 24 hours. Standard tourist visas are processed within 2 to 3 working days. Upon approval, your official e-visa PDF is sent directly to your email and WhatsApp.",
      },
      {
        id: "faq-v3",
        question: "Do children and infants require a separate visa for the UAE?",
        answer: "Yes, every individual traveler including infants and young children requires an independent tourist visa to enter the United Arab Emirates.",
      },
      {
        id: "faq-v4",
        question: "What is your visa approval success rate?",
        answer: "Gujju Tours maintains a 99.4% approval rate. Our dedicated immigration documentation team pre-screens every passport page and photo to eliminate any chance of immigration query or rejection.",
      },
    ],
    restaurants: [
      {
        id: "faq-r1",
        question: "Are all listed dining places 100% Pure Vegetarian and Jain friendly?",
        answer: "Yes, every restaurant featured in our dining section is physically verified to ensure 100% Pure Vegetarian kitchens with dedicated Jain meal preparations free from onion, garlic, potatoes, and root vegetables.",
      },
      {
        id: "faq-r2",
        question: "Why should I pre-book dining packages through Gujju Tours?",
        answer: "Pre-booking through Gujju Tours gives you guaranteed table reservation without standing in long queues, priority seating, and discounted pre-fixed menu rates including unlimited thali courses and desserts.",
      },
      {
        id: "faq-r3",
        question: "Can special dietary preferences like Swaminarayan meals be arranged?",
        answer: "Yes! Mention your specific dietary preferences during reservation checkout, and our partnered chefs will prepare fresh meals adhering strictly to your dietary rules.",
      },
      {
        id: "faq-r4",
        question: "Are unlimited thali refills included in meal vouchers?",
        answer: "Yes, traditional Gujarati, Rajasthani, and Kathiyawadi thali vouchers include unlimited servings of rotis, puries, dal, kadhi, vegetable gravies, farsan snacks, and traditional sweets.",
      },
    ],
    buildpackage: [
      {
        id: "faq-b1",
        question: "How does the custom package builder calculate pricing in real-time?",
        answer: "Our dynamic packaging engine pulls live wholesale rates for verified hotels, private airport transfers, attraction tickets, and flights, automatically applying bundled package discounts as you add items.",
      },
      {
        id: "faq-b2",
        question: "Can I combine private transfers with shared group sightseeing tours?",
        answer: "Yes, you have full flexibility! You can choose a private luxury sedan for airport transfers and join guided group excursions for desert safaris or city tours to balance budget and convenience.",
      },
      {
        id: "faq-b3",
        question: "Can I share my custom itinerary draft with family members before booking?",
        answer: "Yes! You can save your draft itinerary, download an interactive PDF summary, or share a direct web link with family members to review and finalize before making payment.",
      },
      {
        id: "faq-b4",
        question: "Does a destination specialist review my itinerary before confirmation?",
        answer: "Yes, once you build an itinerary, our destination specialist reviews travel timing, commute durations, and attraction opening hours to ensure your schedule is smooth, realistic, and stress-free.",
      },
    ],
  };

  const faq = faqMap[moduleName] || faqMap.hotels;

  return NextResponse.json({
    success: true,
    websiteId: site,
    module: moduleName,
    meta,
    banners: offers,
    featured,
    destinations,
    categories,
    packages: packagesList,
    videos,
    reviews,
    faq,
  });
}
