// Shared Tour shape, matching exactly what the .NET backend's
// /api/tours endpoints return as JSON. Used by every page that now
// fetches tours live from the database instead of the old static
// lib/toursData.ts file.
//
// Tours created through the admin panel only fill in a few fields
// (id, name, description, price, duration, rating, reviews, image) —
// everything else arrives as an empty array or a backend default, so
// every consumer of this type should treat gallery/highlights/included/
// itinerary/guestReviews/fullDescription as possibly empty.
export type Tour = {
  _id?: string;
  id: number;
  website?: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  rating: number;
  reviews: number;
  image: string;
  gallery: string[];
  difficulty: string;
  groupSize: string;
  bestTime: string;
  language: string;
  fullDescription?: string;
  highlights: string[];
  included: string[];
  itinerary: { day: number; title: string; description: string }[];
  guestReviews: { author: string; rating: number; text: string }[];
  category?: string;
  slug?: string;
  destination?: string;
  location?: string;
  featured?: boolean;
  popular?: boolean;
};