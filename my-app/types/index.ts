/**
 * types/index.ts
 *
 * All shared TypeScript types for the mobile app.
 * Includes multi-tenant config types, tour models, booking schemas,
 * user authentication entities, section props, and wishlist definitions.
 */

// ─── Imports & Re-exports from lib ──────────────────────────────────────────
import type { MergedWebsiteConfig } from '@/lib/mergeWebsiteConfig';
import type { SiteConfigResult } from '@/lib/siteConfig';

export type { MergedWebsiteConfig, SiteConfigResult };
export * from './siteConfig';

// ─── User & Authentication Types ─────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  avatar?: string;
  phone?: string;
  phoneCountryCode?: string;
  role?: 'user' | 'admin' | 'Admin' | 'SuperAdmin' | 'Customer';
  websiteId?: string;
  isEmailVerified?: boolean;
  dietaryPreference?: 'None' | 'PureVeg' | 'Jain' | 'Swaminarayan' | 'Halal';
  preferredCurrency?: string;
  marketingOptIn?: boolean;
  termsAcceptedAt?: string;
  createdAt?: string;
  isDisabled?: boolean;
  status?: string;
}

export interface RegisterRequest {
  name?: string;
  fullName?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phone?: string;
  phoneCountryCode?: string;
  dietaryPreference?: 'None' | 'PureVeg' | 'Jain' | 'Swaminarayan' | 'Halal';
  marketingOptIn?: boolean;
  termsAccepted?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  data?: {
    token: string;
    user: User;
  };
  refreshToken?: string;
  expiresAt?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ─── Website / Site Types ─────────────────────────────────────────────────────

export type WebsiteId = 'website1' | 'website2' | 'website3';

export type DataSourceId =
  | 'gujjutourdata'
  | 'tripgoasia'
  | 'technoheaven'
  | (string & {});

export interface SiteDefinition {
  id: string;
  label: string;
  dataSource: DataSourceId;
  staticConfig: Record<string, unknown>;
  createConfig?: (dynamic: SiteConfigResult | null) => MergedWebsiteConfig;
}

// ─── Tour Models ──────────────────────────────────────────────────────────────

export interface Tour {
  id: number | string;
  _id?: string;
  slug?: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  rating: number;
  reviews: number;
  reviewCount?: number;
  duration: string;
  durationDays?: number;
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
  excluded?: string[];
  itinerary: ItineraryDay[];
  guestReviews: GuestReview[];
  category?: string;
  destination?: string;
  country?: string;
  featured?: boolean;
  popular?: boolean;
}

export { tourHref } from '@/lib/navigation';

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  time?: string;
  meals?: string[];
  accommodation?: string;
  activityType?: string;
  highlights?: string[];
}

export interface GuestReview {
  author: string;
  rating: number;
  text: string;
  date?: string;
  avatar?: string;
}

export interface DestinationItem {
  id?: string;
  name: string;
  image: string;
  tours: number;
  tagline?: string;
}

export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  icon: string;
  image?: string;
  count?: number;
}

export type TourSortOption = 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest';

export interface TourFilterState {
  sort: TourSortOption;
  category: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: string;
  difficulty?: string;
}

export interface TourSearchParams {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  difficulty?: string;
  category?: string;
  duration?: string;
  sort?: TourSortOption | string;
}

// ─── Booking Models ───────────────────────────────────────────────────────────

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'expired'
  | 'completed'
  | 'upcoming';

export interface CancellationRequestDto {
  requestedAt: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
}

export interface BookingEmailOutboxItem {
  id?: string;
  to: string;
  subject: string;
  sentAt: string;
  template: string;
  status?: string;
  error?: string;
}

export interface InboxCountsDto {
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  rejected: number;
  expired: number;
  cancellationRequests: number;
}

export interface ItineraryDaySummary {
  day: number;
  title: string;
  description: string;
}

export interface TourSnapshot {
  tourId: number;
  slug: string;
  title: string;
  coverImage: string;
  destination: string;
  category: string;
  duration: string;
  pricePerPerson: number;
  currency: string;
  itinerarySummary?: ItineraryDaySummary[];
  includedSummary?: string[];
  excludedSummary?: string[];
}

export interface TourAddOn {
  id: string;
  name: string;
  description: string;
  priceUSD: number;
  perPerson: boolean;
  icon: string;
  badge?: string;
  brandRecommendation?: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  code: string;
  title: string;
  description: string;
  discountPercent: number;
  discountAmount: number;
  newTotal: number;
  message: string;
}

export interface BookingPriceBreakdown {
  subtotal: number;
  discount: number;
  taxes: number;
  addOnsTotal?: number;
  total: number;
}

export interface BookingStatusHistoryItem {
  status: string;
  changedAt: string;
  note?: string;
  changedBy?: string;
}

export interface BookingTraveler {
  id?: string;
  name: string;
  type: 'Adult' | 'Child' | string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other' | string;
  passportOrId?: string;
}

export interface Booking {
  id: string;
  _id?: string;
  reference?: string;
  tourId: number;
  tourSlug?: string;
  tourName: string;
  tourImage: string;
  location?: string;
  destination?: string;
  guestName: string;
  email: string;
  phone: string;
  date: string;
  startDate?: string;
  endDate?: string;
  travelDate?: string;
  adults?: number;
  children?: number;
  travelers: number;
  travelersList?: BookingTraveler[];
  totalPrice: number;
  unitPrice?: number;
  originalPrice?: number;
  duration?: string;
  currency?: string;
  status: BookingStatus;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: string;
  specialRequest?: string;
  websiteId: string;
  website?: string;
  source?: 'web' | 'app' | string;
  createdAt: string;
  updatedAt?: string;
  userId?: string;
  qrCode?: string;
  promoCode?: string;
  discountAmount?: number;
  addOns?: string[];
  addOnsTotal?: number;
  snapshot?: TourSnapshot;
  priceBreakdown?: BookingPriceBreakdown;
  statusHistory?: BookingStatusHistoryItem[];
  cancellationRequest?: CancellationRequestDto;
  emailsSent?: BookingEmailOutboxItem[];
  rejectionReason?: string;
  cancellationReason?: string;
}

export interface BookingPayload {
  tourId: number | string;
  tourSlug?: string;
  tourName?: string;
  tourImage?: string;
  location?: string;
  destination?: string;
  totalPrice?: number;
  unitPrice?: number;
  originalPrice?: number;
  duration?: string;
  currency?: string;
  guestName: string;
  email: string;
  phone: string;
  date?: string;
  travelDate?: string;
  startDate?: string;
  endDate?: string;
  travelers: number;
  adults?: number;
  children?: number;
  travelersList?: BookingTraveler[];
  specialRequest?: string;
  websiteId?: string;
  website?: string;
  userId?: string;
  idempotencyKey?: string;
  source?: 'web' | 'app' | string;
  promoCode?: string;
  discountAmount?: number;
  addOns?: string[];
  addOnsTotal?: number;
}

export interface GuestLookupPayload {
  reference: string;
  email: string;
}

// ─── Wishlist Models ──────────────────────────────────────────────────────────

export interface WishlistItem {
  tourId: number;
  websiteId: string;
  addedAt: string;
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

export interface TourFilters {
  search?: string;
  category?: string;
  difficulty?: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: string;
  minRating?: number;
  sortBy?: 'recommended' | 'price-low' | 'price-high' | 'rating';
}

// ─── Component Registry & Section Types ───────────────────────────────────────

export interface SectionData {
  tours?: Tour[];
  destinations?: DestinationItem[];
  banners?: any[];
  hotels?: any[];
  cities?: any[];
  hero?: any;
  bookings?: any[];
  reviews?: any[];
  stats?: any[];
  faqs?: any[];
  currency?: string;
  onOpenTravelHub?: () => void;
  onOpenEnquiry?: (serviceName?: string) => void;
  [key: string]: any;
}

export interface SectionProps {
  config: MergedWebsiteConfig;
  data: SectionData;
  onNavigate?: (path: string) => void;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiListResponse<T = unknown> {
  success: boolean;
  data: T[];
  error?: string;
}

export interface ApiItemResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
}

// ─── 24/7 Concierge & Travel Specialist Types ───────────────────────────────

export interface ConciergeMessage {
  id: string;
  text: string;
  sender: 'user' | 'concierge';
  timestamp: string;
  isDelivered?: boolean;
  tourId?: number;
  tourName?: string;
  suggestedFollowUps?: string[];
  whatsAppUrl?: string;
}

export interface ConciergeSpecialist {
  specialistName: string;
  role: string;
  bio: string;
  avatarUrl: string;
  languages: string[];
  welcomeGreeting: string;
  status: string;
  typicalReplyTime: string;
  whatsAppNumber: string;
  supportPhone: string;
  supportEmail: string;
  quickInquiries: string[];
}

export interface ConciergeInquiryPayload {
  tourId?: number;
  tourName?: string;
  guestName: string;
  email?: string;
  phone?: string;
  message: string;
  category?: string;
  source?: string;
}

export interface ConciergeInquiryResponse {
  success: boolean;
  inquiryId: string;
  specialistName: string;
  specialistRole: string;
  reply: string;
  suggestedFollowUps: string[];
  whatsAppUrl: string;
  supportPhone: string;
  supportEmail: string;
}

// ─── Destination Landmarks & Map Explorer Types ──────────────────────────────

export interface DestinationLandmark {
  id: string;
  siteId: string;
  tourId?: number;
  tourName?: string;
  title: string;
  subtitle: string;
  category: string;
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  gallery?: string[];
  openingHours: string;
  bestTimeToVisit: string;
  insiderTip: string;
  approximateVisitDuration: string;
  admissionFee: string;
  isFeatured?: boolean;
  tags?: string[];
}

export interface DestinationWaypointsResponse {
  success: boolean;
  siteId: string;
  totalLandmarks: number;
  categories: string[];
  landmarks: DestinationLandmark[];
}

// ─── In-Trip Travel Vault & Emergency Safety Hub Types ───────────────────────

export type VaultDocumentType =
  | 'passport'
  | 'visa'
  | 'boarding_pass'
  | 'insurance'
  | 'id_card'
  | 'hotel_voucher'
  | 'other';

export interface VaultDocument {
  id: string;
  type: VaultDocumentType;
  title: string;
  documentNumber: string;
  holderName: string;
  expiryDate: string; // YYYY-MM-DD
  issuingCountry: string;
  notes?: string;
  createdAt: string;
}

export interface EmergencyContactItem {
  title: string;
  number: string;
  category: 'police' | 'medical' | 'helpline' | 'brand_ops' | 'marine' | 'general';
  description: string;
  isTollFree?: boolean;
}

export interface EmergencyHospitalItem {
  name: string;
  city: string;
  phone: string;
  address: string;
  emergencyHours: string;
}

export interface EmergencyPhraseItem {
  english: string;
  localScript: string;
  phonetic: string;
  category: 'medical' | 'police' | 'direction' | 'lost';
}

export interface EmergencyDirectoryResponse {
  success: boolean;
  siteId: string;
  destinationRegion: string;
  brandHotline: string;
  brandHotlineLabel: string;
  emergencyHotlines: EmergencyContactItem[];
  hospitals: EmergencyHospitalItem[];
  safetyPhrases: EmergencyPhraseItem[];
}

// ─── In-Trip Smart Travel Budget & Expense Tracker Types ──────────────────────

export type ExpenseCategory =
  | 'dining'
  | 'shopping'
  | 'transport'
  | 'activities'
  | 'tipping'
  | 'lodging'
  | 'other';

export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'upi'
  | 'mobile_pay';

export interface TripExpense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  convertedAmount: number;
  displayCurrency: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  paidBy: string;
  splitWith: string[];
  date: string;
  notes?: string;
  location?: string;
  createdAt: string;
}

export interface DestinationCostGuide {
  success: boolean;
  siteId: string;
  destinationName: string;
  baseCurrency: string;
  estimatedDailyBudget: number;
  categoryEstimates: Record<string, number>;
  tippingEtiquette: string;
  bargainingCulture: string;
  popularPaymentMethods: string[];
}

export interface GroupBalanceItem {
  traveler: string;
  totalPaid: number;
  fairShare: number;
  netBalance: number;
}

export type AudioStoryCategory = 'history' | 'architecture' | 'legends' | 'nature';

export type AudioPlaybackSpeed = 0.75 | 1.0 | 1.25 | 1.5;

export interface AudioStory {
  id: string;
  siteId: string;
  tourId?: string;
  title: string;
  subtitle: string;
  category: AudioStoryCategory;
  durationSeconds: number;
  formattedDuration: string;
  audioUrl: string;
  coverImage: string;
  transcript: string;
  narratorName: string;
  language: string;
  landmarkName?: string;
  latitude: number;
  longitude: number;
  playCount: number;
  tags: string[];
  isSavedOffline?: boolean;
}

export type StampShape = 'circle' | 'oval' | 'hexagon' | 'shield';

export interface ExpeditionStamp {
  id: string;
  title: string;
  destination: string;
  iconName: string;
  colorHex: string;
  stampShape: StampShape;
  unlocked: boolean;
  unlockedDate?: string;
  xpReward: number;
  description: string;
  coordinates?: string;
}

export interface MilestoneChallenge {
  id: string;
  title: string;
  description: string;
  category: 'exploration' | 'audio' | 'budget' | 'vault' | 'booking';
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  xpReward: number;
  iconName: string;
}

export interface LoyaltyTier {
  tierName: string;
  tierBadgeColor: string;
  currentXp: number;
  nextTierXp: number;
  progressPercent: number;
  perks: string[];
}

export interface PassportProfile {
  passportNumber: string;
  holderName: string;
  siteId: string;
  brandCrestTitle: string;
  tier: LoyaltyTier;
  totalStampsCount: number;
  unlockedStampsCount: number;
  stamps: ExpeditionStamp[];
  challenges: MilestoneChallenge[];
  issuedDate: string;
}

export type TemperatureUnit = 'C' | 'F';

export interface HourlyForecast {
  time: string;
  tempC: number;
  tempF: number;
  condition: string;
  icon: string;
  rainProbabilityPercent: number;
}

export interface DailyForecast {
  dayName: string;
  date: string;
  tempMaxC: number;
  tempMinC: number;
  tempMaxF: number;
  tempMinF: number;
  condition: string;
  icon: string;
  rainProbabilityPercent: number;
  activityFeasibility: string;
}

export interface DestinationWeather {
  destinationId: string;
  destinationName: string;
  region: string;
  country: string;
  tempC: number;
  tempF: number;
  feelsLikeC: number;
  feelsLikeF: number;
  condition: string;
  conditionIcon: string;
  humidityPercent: number;
  windKmh: number;
  uvIndex: number;
  uvLevel: string;
  airQualityIndex: number;
  airQualityStatus: string;
  sunrise: string;
  sunset: string;
  tideStatus: string;
  advisoryMessage: string;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

// ─── Destination Culinary Trail & Dining Explorer Types ──────────────────────

export type DietaryPreference =
  | 'all'
  | 'pure_veg'
  | 'jain'
  | 'halal'
  | 'vegan'
  | 'gluten_free'
  | 'seafood';

export interface DishRecommendation {
  id: string;
  name: string;
  localName: string;
  category: string;
  description: string;
  imageUrl: string;
  dietaryBadges: string[];
  spiceLevel: number;
  estimatedPrice: string;
  culturalStory: string;
  bestNeighborhoodToTry: string;
  signaturePairing: string;
}

export interface DiningSpot {
  id: string;
  name: string;
  cuisineType: string;
  destinationId: string;
  destinationName: string;
  rating: number;
  reviewCount: number;
  priceTier: string;
  averageCostForTwo: string;
  dietaryCertifications: string[];
  signatureDishes: string[];
  address: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  phoneNumber: string;
  dressCode: string;
  requiresReservation: boolean;
  atmosphere: string;
}

export interface FoodEtiquette {
  dos: string[];
  donts: string[];
  waterSafetyGuide: string;
  streetFoodHygieneTips: string[];
  tippingGuidelines: string;
}

export interface CulinaryTrail {
  destinationId: string;
  destinationName: string;
  tagline: string;
  overview: string;
  heroImageUrl: string;
  dishes: DishRecommendation[];
  diningSpots: DiningSpot[];
  etiquette: FoodEtiquette;
}

export interface DiningReservationRequest {
  guestName: string;
  phoneNumber: string;
  email?: string;
  diningSpotId: string;
  diningSpotName: string;
  destinationId: string;
  partySize: number;
  reservationDate: string;
  timeSlot: string;
  dietaryRequests: string[];
  specialNotes?: string;
}

export interface DiningReservationResponse {
  reservationReference: string;
  status: string;
  estimatedResponseTime: string;
  confirmationMessage: string;
  conciergeContact: string;
  createdAt: string;
}

// ─── Day-Of Expedition Cockpit & Crew Dispatch Types ─────────────────────────

export interface AssignedCrew {
  leadGuideName: string;
  guidePhone: string;
  guideAvatar: string;
  guideRating: number;
  driverName: string;
  driverPhone: string;
  vehicleModel: string;
  vehiclePlateNumber: string;
  vehicleColor: string;
  luggageCapacity: string;
  pickupLocation: string;
  pickupTime: string;
  driverStatus: string;
}

export interface ExpeditionStopProgress {
  stopId: string;
  orderIndex: number;
  stopName: string;
  scheduledTime: string;
  estimatedDuration: string;
  status: 'Completed' | 'Current' | 'Upcoming';
  description: string;
  meetingPointName: string;
  meetingPointNotes: string;
  latitude: number;
  longitude: number;
  audioStoryId?: string;
  audioStoryTitle?: string;
  culinaryTip?: string;
  dressCodeReminder?: string;
}

export interface GuideAnnouncement {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  priority: 'Normal' | 'Important' | 'Urgent';
  sentBy: string;
}

export interface DayOfDispatch {
  siteId: string;
  tourId: string;
  tourName: string;
  bookingReference: string;
  destination: string;
  date: string;
  currentStatusSummary: string;
  overallProgressPercent: number;
  assignedCrew: AssignedCrew;
  stops: ExpeditionStopProgress[];
  announcements: GuideAnnouncement[];
  emergencyHotline: string;
  conciergeDesk: string;
}

// ─── Collaborative Group Trip Planning & Expedition Party Types ───────────────

export interface GroupMember {
  memberId: string;
  name: string;
  avatarUrl: string;
  role: 'Leader' | 'Co-Planner' | 'Traveler';
  dietaryTag: string; // "Strict Jain", "100% Pure Veg", "Halal Certified", "Vegan", "Gluten-Free", "None"
  phone: string;
  rsvpStatus: 'Confirmed' | 'Tentative' | 'Invited';
}

export interface PollOption {
  optionId: string;
  title: string;
  subtitle: string;
  votesCount: number;
  votePercent: number;
  votedMemberNames: string[];
}

export interface GroupPoll {
  pollId: string;
  question: string;
  category: 'Activity' | 'Dining' | 'Timing' | 'Budget';
  options: PollOption[];
  totalVotes: number;
  isActive: boolean;
  createdBy: string;
}

export interface GroupGearItem {
  itemId: string;
  title: string;
  category: string; // "Electronics", "Medical/Safety", "Snacks & Food", "Religious/Puja", "Documentation", "General"
  assignedToMemberName: string;
  isPacked: boolean;
}

export interface DietarySummaryItem {
  dietType: string;
  count: number;
  memberNames: string[];
  diningTip: string;
}

export interface GroupTrip {
  groupId: string;
  siteId: string;
  groupName: string;
  destination: string;
  travelDates: string;
  inviteCode: string;
  shareableInviteUrl: string;
  members: GroupMember[];
  polls: GroupPoll[];
  gearItems: GroupGearItem[];
  dietarySummary: DietarySummaryItem[];
  totalEstimatedCost: string;
  perPersonEstimatedCost: string;
}

export interface CastVoteRequest {
  groupId?: string;
  pollId: string;
  optionId: string;
  voterName: string;
}

export interface CreateGearItemRequest {
  groupId?: string;
  title: string;
  category: string;
  assignedToMemberName: string;
}

// ─── Expedition Memory Scrapbook & Travel Journal Types ───────────────────────

export interface JournalEntry {
  entryId: string;
  tripId: string;
  dayNumber: number;
  date: string;
  title: string;
  notes: string;
  photoUrl: string;
  locationName: string;
  moodTag: string; // "Spiritual & Serene", "Thrilled & Adventurous", "Awestruck", "Relaxed & Peaceful", "Foodie Heaven"
  authorName: string;
  likesCount: number;
  createdAt: string;
}

export interface ScrapbookStats {
  stopsCompleted: number;
  totalDays: number;
  totalPhotos: number;
  audioStoriesPlayed: number;
  stampsEarned: number;
  signatureDish: string;
  distanceTraveledKm: number;
}

export interface TripScrapbook {
  tripId: string;
  siteId: string;
  tourName: string;
  destination: string;
  travelerName: string;
  heroCoverImage: string;
  travelDates: string;
  inspirationalQuote: string;
  stats: ScrapbookStats;
  entries: JournalEntry[];
  shareableStoryUrl: string;
}

export interface CreateJournalEntryRequest {
  tripId?: string;
  dayNumber: number;
  title: string;
  notes: string;
  photoUrl?: string;
  locationName: string;
  moodTag?: string;
  authorName?: string;
}

// ─── Smart Flight & Airport Chauffeur Transfer Types ─────────────────────────

export interface FlightDetails {
  flightNumber: string;
  airline: string;
  airlineLogo: string;
  originAirportCode: string;
  originCity: string;
  destAirportCode: string;
  destCity: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  status: 'On Time' | 'Boarding' | 'In Flight' | 'Landed' | 'Delayed';
  terminal: string;
  gate: string;
  baggageCarousel: string;
  duration: string;
}

export interface TerminalAmenity {
  name: string;
  location: string;
  badge: string;
}

export interface AirportTransfer {
  transferId: string;
  siteId: string;
  bookingReference: string;
  guestName: string;
  flight: FlightDetails;
  arrivalAirportName: string;
  pickupMeetingPoint: string;
  digitalPagingBoardText: string;
  chauffeurName: string;
  chauffeurPhone: string;
  chauffeurAvatar: string;
  chauffeurRating: number;
  vehicleModel: string;
  vehiclePlateNumber: string;
  vehicleType: string;
  transferStatus: string;
  waitingBay: string;
  amenities: TerminalAmenity[];
  emergencyTransferHotline: string;
}

export interface UpdateTransferStatusRequest {
  transferId?: string;
  status: string;
  notes?: string;
}

// ─── Destination Offline Pocket Phrasebook & Translator Types ─────────────────

export interface PhraseItem {
  phraseId: string;
  category: 'Essentials' | 'Dietary & Food' | 'Shopping & Bargaining' | 'Transport & Directions' | 'Temple & Etiquette' | 'Emergency';
  englishText: string;
  targetScriptText: string;
  phoneticText: string;
  culturalContextNote: string;
  isDietarySafe: boolean;
}

export interface DestinationPhrasebook {
  siteId: string;
  languageName: string;
  nativeLanguageName: string;
  regionDescription: string;
  totalPhrases: number;
  categories: string[];
  bargainingTip: string;
  etiquetteTip: string;
  phrases: PhraseItem[];
}

// ─── Destination Tax-Free Shopping & Customs Refund Types ─────────────────────

export interface AirportRefundCounter {
  terminalName: string;
  locationType: string;
  stepInstruction: string;
  operatingHours: string;
  payoutMethods: string[];
}

export interface DestinationTaxRule {
  countryCode: string;
  countryName: string;
  taxSchemeName: string;
  vatRatePercent: number;
  estimatedRefundPercent: number;
  currencyCode: string;
  currencySymbol: string;
  minimumSpendPerStore: number;
  minimumTotalAirportClaim: number;
  customsInspectionThreshold: number;
  luxuryInspectionNotice: string;
  claimDeadlineDays: number;
  airportCounters: AirportRefundCounter[];
}

export interface CustomsAllowanceRule {
  destinationOrHomeCountry: string;
  dutyFreeGeneralAllowance: string;
  alcoholAllowance: string;
  tobaccoAllowance: string;
  goldJewelleryAllowanceMale: string;
  goldJewelleryAllowanceFemale: string;
  currencyDeclarationLimit: string;
  prohibitedItems: string[];
}

export interface TaxRefundReceipt {
  claimId: string;
  siteId: string;
  storeName: string;
  storeBranch: string;
  purchaseDate: string;
  invoiceNumber: string;
  taxFormNumber: string;
  category: string;
  purchaseAmount: number;
  estimatedRefundAmount: number;
  currency: string;
  status: 'Draft' | 'Customs_Inspected' | 'Refund_Claimed';
  requiresPhysicalInspection: boolean;
  receiptImageUrl: string;
  notes: string;
}

export interface TaxRefundSummary {
  totalPurchases: number;
  totalEstimatedRefund: number;
  claimedRefund: number;
  pendingRefund: number;
  totalReceiptsCount: number;
  pendingInspectionCount: number;
  currency: string;
}

export interface CreateTaxReceiptRequest {
  storeName: string;
  storeBranch?: string;
  purchaseDate?: string;
  invoiceNumber?: string;
  taxFormNumber?: string;
  category?: string;
  purchaseAmount: number;
  receiptImageUrl?: string;
  notes?: string;
}

export interface UpdateClaimStatusRequest {
  status: 'Draft' | 'Customs_Inspected' | 'Refund_Claimed';
  notes?: string;
}

// ─── Smart International eSIM Roaming & Cellular Hub Types ───────────────────

export interface EsimPackage {
  packageId: string;
  siteId: string;
  title: string;
  countryCode: string;
  destinationName: string;
  dataAllowanceGb: number;
  isUnlimited: boolean;
  validityDays: number;
  price: number;
  currency: string;
  networkType: string;
  carrierPartners: string[];
  supportsHotspot: boolean;
  includesLocalCalls: boolean;
  callMinutes: number;
  isPopular: boolean;
}

export interface ActiveEsimProfile {
  profileId: string;
  siteId: string;
  iccid: string;
  packageTitle: string;
  destinationName: string;
  qrCodeUrl: string;
  smdpAddress: string;
  activationCode: string;
  status: 'Active' | 'Installed_Ready' | 'Expired';
  totalDataGb: number;
  usedDataGb: number;
  remainingDataGb: number;
  expiryDate: string;
  daysRemaining: number;
  carrierName: string;
  apnSetting: string;
  roamingEnabled: boolean;
}

export interface AirportWifiGuide {
  airportCode: string;
  airportName: string;
  ssid: string;
  loginSteps: string;
  timeLimit: string;
  speedTier: string;
  helpDeskLocation: string;
}

export interface EsimHubData {
  siteId: string;
  activeProfile: ActiveEsimProfile | null;
  packages: EsimPackage[];
  wifiGuides: AirportWifiGuide[];
  emergencyUssdCodes: Record<string, string>;
}

export interface ActivateEsimRequest {
  packageId: string;
}

export interface TopUpDataRequest {
  profileId: string;
  additionalGb: number;
}

export interface InsuranceBenefit {
  benefitKey: string;
  title: string;
  coverageLimit: string;
  deductible: string;
  description: string;
  isCovered: boolean;
  iconName: string;
}

export interface HospitalDirectoryItem {
  hospitalId: string;
  name: string;
  city: string;
  district: string;
  rating: number;
  address: string;
  emergencyPhone: string;
  isCashlessApproved: boolean;
  hasEnglishStaff: boolean;
  hasInterpreter: boolean;
  specialties: string[];
  distanceFromCenter: string;
}

export interface InsuranceClaimDoc {
  docId: string;
  claimType: 'Medical Emergency' | 'Baggage Loss' | 'Flight Delay' | 'Trip Cancellation';
  title: string;
  description: string;
  isRequired: boolean;
  isUploaded: boolean;
  fileUrl?: string;
}

export interface TravelInsurancePolicy {
  policyId: string;
  siteId: string;
  policyNumber: string;
  underwriterName: string;
  planTier: string;
  policyHolderName: string;
  beneficiaryCount: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Pending' | 'Expired';
  emergencyAssistancePhone: string;
  emergencyWhatsApp: string;
  claimsEmail: string;
  adventureSportsRider: boolean;
  benefits: InsuranceBenefit[];
  preApprovedHospitals: HospitalDirectoryItem[];
  requiredClaimDocs: InsuranceClaimDoc[];
  emergencyDeclarationGuide: string;
}

export interface SubmitClaimInquiryRequest {
  policyId: string;
  claimType: string;
  hospitalName: string;
  city: string;
  contactPhone: string;
  description: string;
}

export interface ClaimInquiryResponse {
  success: boolean;
  claimReferenceNumber: string;
  message: string;
  contactPhone: string;
  status: string;
}

export type VisaEntryStatus = 'Visa_Free' | 'Visa_On_Arrival' | 'eVisa' | 'Sticker_Visa_Required';

export interface VisaRequirement {
  id: string;
  destinationCountry: string;
  passportNationality: string;
  status: VisaEntryStatus;
  statusBadge: string;
  maxStayDays: number;
  processingTime: string;
  estimatedFee: string;
  passportValidityMonthsRequired: number;
  blankPagesRequired: number;
  mandatoryDocuments: string[];
  officialPortalUrl: string;
  notes: string;
}

export interface DigitalArrivalCard {
  cardId: string;
  destinationCountry: string;
  cardName: string;
  submissionWindow: string;
  isMandatory: boolean;
  officialSubmissionUrl: string;
  requiredDetails: string[];
  customsDutyRules: string;
}

export interface EmbassyConsulate {
  id: string;
  homeCountry: string;
  destinationCountry: string;
  city: string;
  missionName: string;
  address: string;
  emergencyPhone: string;
  consularEmail: string;
  workingHours: string;
  lostPassportInstructions: string;
}

export interface PassportValidityCheckRequest {
  passportExpiryDate: string;
  tripDepartureDate: string;
  destinationCountry?: string;
}

export interface PassportValidityCheckResult {
  isValid: boolean;
  daysRemainingOnDeparture: number;
  monthsRemaining: number;
  minimumMonthsRequired: number;
  status: 'Valid' | 'Warning' | 'Invalid_Expired';
  message: string;
  renewalRecommended: boolean;
}

export interface VisaHubData {
  siteId: string;
  defaultNationality: string;
  defaultDestination: string;
  supportedDestinations: string[];
  supportedNationalities: string[];
  visaRequirements: VisaRequirement[];
  arrivalCards: DigitalArrivalCard[];
  embassies: EmbassyConsulate[];
}

export interface CarbonEmissionBreakdown {
  flightEmissionsKg: number;
  groundTransportEmissionsKg: number;
  hotelStayEmissionsKg: number;
  totalEmissionsKg: number;
  treesEquivalentCount: number;
  carKmEquivalent: number;
}

export interface VerifiedClimateProject {
  projectId: string;
  siteId: string;
  name: string;
  location: string;
  standard: string;
  pricePerTonneUsd: number;
  pricePerTonneLocal: string;
  description: string;
  impactMetric: string;
  badgeAwarded: string;
  iconName: string;
}

export interface OffsetContribution {
  contributionId: string;
  siteId: string;
  travelerName: string;
  bookingId: string;
  projectId: string;
  projectName: string;
  offsetAmountKg: number;
  amountPaidUsd: number;
  certificateNumber: string;
  certifiedDate: string;
  status: string;
}

export interface EcoPledgeItem {
  id: string;
  title: string;
  description: string;
  category: 'Oceans' | 'Wildlife' | 'PlasticFree' | 'Community' | 'Heritage';
  isPledged: boolean;
  iconName: string;
}

export interface EcoHubData {
  siteId: string;
  defaultFlightRoute: string;
  emissions: CarbonEmissionBreakdown;
  projects: VerifiedClimateProject[];
  myContributions: OffsetContribution[];
  pledges: EcoPledgeItem[];
  ecoExplorerLevel: string;
  totalKgOffset: number;
}

export interface CalculateEmissionsRequest {
  originAirport: string;
  destinationAirport: string;
  flightClass: 'Economy' | 'PremiumEconomy' | 'Business';
  nightsCount: number;
  paxCount: number;
}

export interface SubmitOffsetRequest {
  projectId: string;
  travelerName: string;
  bookingId?: string;
  offsetAmountKg: number;
}

export interface SubmitOffsetResponse {
  success: boolean;
  message: string;
  certificateNumber: string;
  data: OffsetContribution;
}

export type SiteType = 'Buddhist_Temple' | 'Grand_Palace' | 'Islamic_Mosque' | 'Hindu_Mandir' | 'Balinese_Pura';

export interface DressCodeRule {
  id: string;
  siteType: SiteType;
  siteName: string;
  destinationCountry: string;
  shouldersAllowed: boolean;
  shortsAllowed: boolean;
  footwearPolicy: string;
  headwearPolicy: string;
  sheerTightClothingAllowed: boolean;
  onSiteCoverupAvailable: boolean;
  onSiteCoverupFee: string;
  keyRules: string[];
}

export interface CulturalEtiquetteItem {
  id: string;
  category: 'Sacred_Sites' | 'Social_Taboos' | 'Legal_Warnings' | 'Tipping_Dining' | 'Monks_Royalty';
  title: string;
  shortSummary: string;
  fullGuidance: string;
  importanceLevel: 'Critical_Law' | 'High_Sacred' | 'Good_Manners';
  iconName: string;
  prohibitedAction: string;
  recommendedAction: string;
}

export interface MedicationCustomsRule {
  id: string;
  medicationCategory: string;
  status: 'Strictly_Prohibited' | 'Requires_FDA_Permit' | 'Carry_Doctor_Letter';
  officialGuidance: string;
}

export interface CultureHubData {
  siteId: string;
  destinationCountry: string;
  dressCodeRules: DressCodeRule[];
  etiquetteGuidelines: CulturalEtiquetteItem[];
  medicationRules: MedicationCustomsRule[];
  localTippingNorms: string;
  sacredAudioGuideText: string;
}

export interface CheckOutfitComplianceRequest {
  siteType: string;
  isShouldersCovered: boolean;
  isKneesCovered: boolean;
  isClothingLooseAndOpaque: boolean;
  isFootwearRemovable: boolean;
  isHeadwearRemovable: boolean;
}

export interface CheckOutfitComplianceResult {
  isCompliant: boolean;
  status: 'Pass' | 'Fail_At_Gate' | 'Needs_Coverup';
  verdictTitle: string;
  verdictDetails: string;
  missingItems: string[];
}

export interface PlugType {
  plugType: string;
  name: string;
  pinCount: number;
  isGrounded: boolean;
  description: string;
  compatibleWithHomePlugs: string[];
  needsAdapterForHome: boolean;
}

export interface VoltageSpec {
  destinationCountry: string;
  standardVoltage: string;
  standardFrequency: string;
  homeCountryComparison: string;
  adapterRequired: boolean;
  voltageConverterRequired: boolean;
}

export interface ApplianceVoltageRule {
  id: string;
  applianceCategory: string;
  typicalRating: string;
  safetyVerdict: 'Safe_Direct' | 'Safe_With_Plug_Adapter' | 'High_Burn_Risk_Needs_Converter';
  safetyWarning: string;
  recommendedAction: string;
  iconName: string;
}

export interface PowerBankKiosk {
  id: string;
  networkName: string;
  locations: string;
  pricing: string;
  cableTypes: string[];
  howToUse: string;
  iconName: string;
}

export interface PowerHubData {
  siteId: string;
  destinationCountry: string;
  voltageSpec: VoltageSpec;
  supportedPlugTypes: PlugType[];
  applianceRules: ApplianceVoltageRule[];
  powerBankKiosks: PowerBankKiosk[];
  quickTips: string[];
}

export interface CheckApplianceRequest {
  applianceCategory: string;
  ratedVoltage: string;
  homePlugType: string;
}

export interface CheckApplianceResult {
  isSafe: boolean;
  verdictStatus: 'Safe_Direct' | 'Safe_With_Adapter' | 'Danger_Burn_Risk';
  headline: string;
  detailedAdvice: string;
  plugAdapterNeeded: boolean;
  voltageTransformerNeeded: boolean;
}

export interface AirlineBaggagePolicy {
  airlineCode: string;
  airlineName: string;
  cabinAllowanceKg: number;
  cabinPieceCount: number;
  cabinDimensions: string;
  checkedAllowanceKg: number;
  checkedPieceLimit: string;
  airportExcessFeePerKg: string;
  prepaidExcessFeePerKg: string;
  specialRules: string[];
}

export interface BaggageHubData {
  siteId: string;
  defaultAirline: AirlineBaggagePolicy;
  supportedAirlines: AirlineBaggagePolicy[];
  prohibitedCabinItems: string[];
  prohibitedCheckedItems: string[];
  packingTips: string[];
}

export interface CalculateBaggageFeeRequest {
  airlineCode: string;
  cabinWeightKg: number;
  checkedWeightKg: number;
  fareClass: string;
}

export interface CalculateBaggageFeeResult {
  isCabinOverweight: boolean;
  cabinExcessKg: number;
  isCheckedOverweight: boolean;
  checkedExcessKg: number;
  airportCounterFeeEst: string;
  prepaidFeeEst: string;
  potentialSavings: string;
  verdictStatus: 'Under_Limit_Safe' | 'Cabin_Heavy_Warning' | 'Checked_Overweight_Penalty';
  headline: string;
  recommendation: string;
}

export interface TransitPhrase {
  english: string;
  nativeText: string;
  phonetic: string;
}

export interface TransitLine {
  lineId: string;
  lineName: string;
  systemType: 'Skytrain' | 'Underground_Metro' | 'Airport_Train' | 'Monorail';
  colorHex: string;
  operatingHours: string;
  paymentMethods: string[];
  keyStations: string[];
}

export interface TransitRouteQuery {
  id: string;
  originStation: string;
  destinationStation: string;
  estimatedFare: string;
  travelTimeMins: number;
  transfersRequired: number;
  routeSummary: string;
}

export interface TaxiFareEstimator {
  city: string;
  baseMeterFare: string;
  ratePerKm: string;
  airportSurcharge: string;
  scamPreventionTips: string[];
  driverPhrases: TransitPhrase[];
}

export interface TransitHubData {
  siteId: string;
  city: string;
  lines: TransitLine[];
  popularRoutes: TransitRouteQuery[];
  taxiGuide: TaxiFareEstimator;
  transitPassAdvice: string;
}

export interface CalculateTransitFareRequest {
  origin: string;
  destination: string;
}

export interface CalculateTransitFareResult {
  origin: string;
  destination: string;
  fareAmount: string;
  fareLocalPrice: number;
  currencySymbol: string;
  durationMins: number;
  stopsCount: number;
  transfers: number;
  recommendedLine: string;
  instruction: string;
}

export interface EstimateTaxiFareRequest {
  distanceKm: number;
  trafficCondition: 'Light' | 'Moderate' | 'Heavy_Gridlock';
  useExpressway: boolean;
}

export interface EstimateTaxiFareResult {
  distanceKm: number;
  fairMeterRange: string;
  estimatedTollFees: string;
  totalEstimatedCost: string;
  grabBoltEstimate: string;
  scamAlertThreshold: string;
  driverAdvice: string;
}

export interface TravelMedicine {
  id: string;
  genericName: string;
  commonHomeNames: string[];
  localBrandNames: string[];
  nativeText: string;
  phonetic: string;
  symptoms: string[];
  typicalDosage: string;
  precautions: string;
  category: 'Fever_Pain' | 'Stomach_Digestion' | 'Motion_Sickness' | 'Allergy_Bites' | 'First_Aid';
  isRestrictedWarning?: boolean;
}

export interface PharmacyDirectoryItem {
  id: string;
  pharmacyName: string;
  chainName: string;
  city: string;
  address: string;
  phone: string;
  isOpen24Hours: boolean;
  operatingHours: string;
  hasEnglishSpeakingPharmacist: boolean;
}

export interface ControlledSubstanceWarning {
  medication: string;
  status: string;
  rule: string;
}

export interface PharmacyHubData {
  siteId: string;
  city: string;
  medicines: TravelMedicine[];
  pharmacies: PharmacyDirectoryItem[];
  controlledSubstances: ControlledSubstanceWarning[];
  emergencyDoctorHotline: string;
  emergencyAmbulanceNumber: string;
}

export interface TippingServiceCategory {
  categoryKey: string;
  categoryName: string;
  icon: string;
  recommendedTip: string;
  customaryRule: string;
  defaultPercentage: number;
  typicalFixedAmount: number;
  isMandatory: boolean;
  serviceChargeExplanation: string;
}

export interface TippingCountryGuide {
  siteId: string;
  country: string;
  currencyCode: string;
  currencySymbol: string;
  generalTippingCulture: string;
  taxAndServiceChargeNote: string;
  categories: TippingServiceCategory[];
  localThankYouPhrase: string;
  localThankYouPhonetic: string;
}

export interface CalculateTipRequest {
  billAmount: number;
  categoryKey: string;
  tipPercentage?: number;
  customTipAmount?: number;
  serviceChargeAlreadyIncluded: boolean;
  splitCount: number;
}

export interface CalculateTipResult {
  billAmount: number;
  tipAmount: number;
  totalAmount: number;
  splitCount: number;
  perPersonTotal: number;
  perPersonTip: number;
  serviceChargeNote: string;
  etiquetteAdvice: string;
  currencyCode: string;
  currencySymbol: string;
}

export interface RoadRuleItem {
  ruleKey: string;
  title: string;
  value: string;
  icon: string;
  description: string;
  penaltyWarning: string;
  isHighRisk: boolean;
}

export interface RentalScamTip {
  tipKey: string;
  title: string;
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY';
  icon: string;
  actionRequired: string;
  scamExplanation: string;
}

export interface PreRideChecklistStep {
  stepId: string;
  title: string;
  detail: string;
  icon: string;
  requiresPhoto: boolean;
}

export interface DriveSafetyHubData {
  siteId: string;
  country: string;
  drivingSide: string;
  idpRequirementSummary: string;
  speedLimitCity: string;
  speedLimitHighway: string;
  bloodAlcoholLimit: string;
  helmetLaw: string;
  roadsideAssistanceNumber: string;
  highwayPoliceNumber: string;
  roadRules: RoadRuleItem[];
  scamWarnings: RentalScamTip[];
  preRideChecklist: PreRideChecklistStep[];
}

export interface ForexCounterRate {
  currencyCode: string;
  currencyName: string;
  flagEmoji: string;
  bankAirportBuyRate: number;
  cityCounterBuyRate: number;
  cityCounterSellRate: number;
  spreadPercent: string;
  airportLossPercent: string;
  noteConditionTips: string;
}

export interface AtmDccTip {
  tipKey: string;
  title: string;
  severity: 'CRITICAL' | 'RECOMMENDED' | 'TIP';
  actionPrompt: string;
  explanation: string;
  atmWithdrawalFeeNotice: string;
}

export interface ForexKioskItem {
  kioskId: string;
  brandName: string;
  branchName: string;
  city: string;
  address: string;
  operatingHours: string;
  isAirportBasementKiosk: boolean;
  googleMapsQuery: string;
  rating: number;
  highlightBadge: string;
}

export interface ForexRadarData {
  destinationCountry: string;
  destinationCurrencyCode: string;
  destinationCurrencySymbol: string;
  lastUpdated: string;
  passportRuleNotice: string;
  baseRates: ForexCounterRate[];
  atmDccShield: AtmDccTip[];
  verifiedKiosks: ForexKioskItem[];
}

// ==========================================
// FEATURE 31: STREET MARKET FAIR PRICE RADAR & BARGAINING COACH
// ==========================================
export interface BargainCategoryItem {
  id: string;
  categoryId?: string;
  categoryName: string;
  icon: string;
  typicalItems?: string;
  benchmarkPriceRange?: string;
  bargainMarginPercent?: number;
  typicalDiscountPercent?: number;
  bargainingFlexibility?: string;
  strategyTip?: string;
  buyingTips?: string[];
}

export interface BargainMarketItem {
  id: string;
  marketName: string;
  localName?: string;
  city: string;
  marketType: string;
  bargainingStrictness?: 'High' | 'Moderate' | 'Fixed' | string;
  bargainingIntensity?: string;
  expectedDiscount?: string;
  hagglingSweetSpot?: string;
  openingHours?: string;
  bestOperatingHours?: string;
  locationArea?: string;
  paymentAdvice?: string;
  insiderSecret?: string;
  proTip?: string;
  bestBuys?: string[];
  bestFor?: string[];
}

export interface BargainPhraseItem {
  id: string;
  phraseId?: string;
  englishMeaning?: string;
  englishText?: string;
  phonetic?: string;
  phoneticPronunciation?: string;
  localScript?: string;
  literalMeaning?: string;
  contextAdvice?: string;
  contextUsage?: string;
  icon?: string;
}

export interface BargainingRuleItem {
  ruleNumber: string;
  title: string;
  description: string;
  icon: string;
}

export interface BargainHubData {
  city: string;
  destinationCountry: string;
  currencyCode: string;
  currencySymbol: string;
  cultureSummary: string;
  rules: BargainingRuleItem[];
  categories: BargainCategoryItem[];
  famousMarkets: BargainMarketItem[];
  markets?: BargainMarketItem[];
  keyPhrases: BargainPhraseItem[];
  phrases?: BargainPhraseItem[];
}

export interface BargainHistoryLog {
  id: string;
  itemName: string;
  marketName: string;
  initialPrice: number;
  finalPrice: number;
  savings: number;
  currency: string;
  timestamp: string;
}

// ==========================================
// Phase 40: Expedition Summary & Loyalty DTOs
// ==========================================

export interface ExpeditionWrappedStats {
  travelerName: string;
  year: string;
  totalKmTraveled: number;
  countriesVisited: number;
  citiesExplored: number;
  toursCompleted: number;
  carbonOffsetKg: number;
  treesPlantedEquivalent: number;
  totalBargainingSavings: number;
  totalVatRefundClaimed: number;
  audioStoriesListenedMinutes: number;
  favoriteCategory: string;
  topLandmarksVisited: string[];
  unlockedBadges: string[];
  travelerArchetype: string;
  highlightQuote: string;
}

export interface LoyaltyTierData {
  memberId: string;
  memberName: string;
  currentTier: string;
  tierBadgeEmoji: string;
  currentPoints: number;
  pointsToNextTier: number;
  nextTierName: string;
  progressPercentage: number;
  multiplierBadge: string;
  perks: string[];
}

export interface LoyaltyRewardVoucher {
  voucherId: string;
  voucherCode: string;
  title: string;
  description: string;
  discountLabel: string;
  pointsCost: number;
  isClaimed: boolean;
  expiryDate: string;
  category: string;
}

export interface ExpeditionCertificate {
  certificateId: string;
  recipientName: string;
  title: string;
  citation: string;
  issueDate: string;
  expeditionSignature: string;
  goldSealText: string;
}

export interface ExpeditionSummaryHubData {
  destinationHub: string;
  currencySymbol: string;
  wrapped: ExpeditionWrappedStats;
  loyalty: LoyaltyTierData;
  availableRewards: LoyaltyRewardVoucher[];
  certificate: ExpeditionCertificate;
}

export interface ClaimRewardResult {
  voucherCode: string;
  title: string;
  discountLabel: string;
  expiryDate: string;
  remainingPoints: number;
  usageInstructions: string;
}

export interface ReviewBoostResult {
  pointsAwarded: number;
  newTotalPoints: number;
  boostBadge: string;
}
















