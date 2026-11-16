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

export interface HotelItem extends CatalogItem {
  starRating: number;
  address: string;
  amenities: string[];
}

export interface ActivityItem extends CatalogItem {
  duration?: string;
  difficulty?: string;
  groupSize?: string;
  highlights?: string[];
  inclusions?: string[];
  exclusions?: string[];
  cancellationPolicy?: string;
}

export interface ReviewItem {
  id: string | number;
  author: string;
  rating: number;
  comment: string;
  avatar?: string;
  location?: string;
}

