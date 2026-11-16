export type SupportedSiteId = "gujjutours" | "tripgoasia" | "technoheaven" | "website1" | "website2" | "website3";

export interface LiveWeatherInfo {
  minTemp: number;
  maxTemp: number;
  weatherCode?: string;
  condition?: string;
  icon?: string;
  aqiValue?: string;
  aqiIcon?: string;
}

export interface CatalogDiscount {
  isDiscount?: number | boolean | null;
  discountPrice?: number | null;
  discountPercentage?: number | null;
  originalPrice?: number | null;
}

export interface CatalogItem {
  id: number | string;
  slug: string;
  title: string;
  defaultTitle?: string;
  description: string;
  shortDescription?: string;
  image: string;
  gallery?: string[];
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  currencyCode: string;
  rating: number;
  reviewsCount?: number;
  badge?: string;
  category: string;
  categoryId?: number | string;
  cityName?: string;
  countryName?: string;
  address?: string;
  starRating?: number | string;
  weather?: LiveWeatherInfo;
  serviceType: "HOTEL" | "TOUR" | "PACKAGE" | "FLIGHT" | "TRANSFER" | "VISA" | "STATIC" | "B2B";
  raw?: Record<string, unknown>;
}

export interface BannerSection {
  bannerMasterId: number;
  name: string;
  tagLine?: string;
  patternName: string;
  serviceType: string;
  items: CatalogItem[];
  rawCount?: number;
}

export interface CityDestination {
  id: number | string;
  name: string;
  countryName: string;
  image: string;
  hotelCount?: number;
  tourCount?: number;
  weather?: LiveWeatherInfo;
  slug: string;
}

export interface HotelRoomOption {
  id: string | number;
  name: string;
  price: number;
  capacity: string;
  boardType?: string;
  cancellationPolicy?: string;
}

export interface HotelItem extends CatalogItem {
  starRating: number;
  address: string;
  latitude?: number;
  longitude?: number;
  amenities: string[];
  rooms?: HotelRoomOption[];
}

export interface ActivityOption {
  id: string | number;
  title: string;
  price: number;
  duration?: string;
  description?: string;
}

export interface ActivityItem extends CatalogItem {
  duration?: string;
  difficulty?: string;
  groupSize?: string;
  highlights?: string[];
  inclusions?: string[];
  exclusions?: string[];
  cancellationPolicy?: string;
  options?: ActivityOption[];
}

export interface ReviewItem {
  id: string | number;
  author: string;
  rating: number;
  date?: string;
  comment: string;
  avatar?: string;
  location?: string;
}

export interface HotelSearchParams {
  cityIdOrName?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  minStars?: number;
  propertyType?: string;
}

export interface TourSearchParams {
  destination?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "rating" | "popular";
}

export interface CatalogProvider {
  getBanners(siteId: SupportedSiteId, lang?: string): Promise<BannerSection[]>;
  getDestinations(siteId: SupportedSiteId, lang?: string): Promise<CityDestination[]>;
  getHotels(siteId: SupportedSiteId, params?: HotelSearchParams): Promise<HotelItem[]>;
  getHotelDetail(siteId: SupportedSiteId, slugOrId: string | number): Promise<HotelItem | null>;
  getTours(siteId: SupportedSiteId, params?: TourSearchParams): Promise<ActivityItem[]>;
  getTourDetail(siteId: SupportedSiteId, slugOrId: string | number): Promise<ActivityItem | null>;
  getReviews(siteId: SupportedSiteId): Promise<ReviewItem[]>;
  getWeather(siteId: SupportedSiteId, cityIdOrName: string): Promise<LiveWeatherInfo | null>;
}

