/**
 * components/home/MobileSearchWidget.tsx
 *
 * API-Driven Multi-Vertical Search Widget for Mobile.
 * Dynamically populated from the Central Feature Registry (`useFeatures().searchFeatures`).
 * Supports:
 *   - Real API icons with semantic Ionicons fallback per vertical (NO generic sparkle icons)
 *   - Dedicated Car Rental form (Pick-up, Dates, Driver Age, "Search Cars")
 *   - Dedicated Attraction / Tour form ("DESTINATION / ACTIVITY", single date, "Search Attractions")
 *   - Dedicated Hotel form ("DESTINATION / HOTEL", dynamic date range, "Search Hotels")
 *   - Dedicated Flights, Transfers, Holidays, Visas, Dining, and Build-Package forms
 *   - Dynamic date calculations (today + offset, timezone aware, no hardcoded '09 Nov 2026')
 *   - Tenant primary color theming and full tactile haptic feedback
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useFeatures } from '@/hooks/useFeature';
import { useDestinations } from '@/hooks/useDestinations';
import { useSiteConfig } from '@/store/SiteConfigContext';
import type { FeatureItem } from '@/lib/features/featureRegistrySchema';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';

export type SearchTabVertical =
  | 'HOTEL'
  | 'TOUR'
  | 'PACKAGE'
  | 'FLIGHT'
  | 'TRANSFER'
  | 'CAR'
  | 'VISA'
  | 'RESTAURANT'
  | 'BUILDPACKAGE';

interface MobileSearchWidgetProps {
  defaultDestination?: string;
  initialVertical?: string;
}

const POPULAR_DESTINATIONS = [
  'Dubai',
  'Abu Dhabi',
  'Singapore',
  'Bali',
  'Bangkok',
  'Phuket',
  'Langkawi',
  'Kuala Lumpur',
  'Goa',
  'Kashmir',
  'London',
  'Paris',
  'Switzerland',
];

const CAR_LOCATIONS = [
  'Kuala Lumpur Intl Airport (KUL)',
  'Singapore Changi Airport (SIN)',
  'Dubai International Airport (DXB)',
  'Bangkok Suvarnabhumi Airport (BKK)',
  'Phuket International Airport (HKT)',
  'Bali Ngurah Rai Airport (DPS)',
  'Penang International Airport (PEN)',
  'City Center / Downtown',
];

const AIRPORTS = [
  { code: 'STV', name: 'Surat Gujarat Airport', city: 'Surat', country: 'India' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Intl', city: 'Mumbai', country: 'India' },
  { code: 'DEL', name: 'Indira Gandhi Intl', city: 'Delhi', country: 'India' },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel', city: 'Ahmedabad', country: 'India' },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE' },
  { code: 'SIN', name: 'Singapore Changi', city: 'Singapore', country: 'Singapore' },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand' },
  { code: 'KUL', name: 'Kuala Lumpur Intl', city: 'Kuala Lumpur', country: 'Malaysia' },
  { code: 'DPS', name: 'Ngurah Rai Bali Intl', city: 'Bali', country: 'Indonesia' },
  { code: 'GOI', name: 'Goa Dabolim Airport', city: 'Goa', country: 'India' },
];

const NATIONALITIES = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'United Arab Emirates',
  'Singapore',
  'Germany',
  'France',
];

const VISA_COUNTRIES = [
  'United Arab Emirates (UAE)',
  'Thailand',
  'Singapore',
  'Malaysia',
  'Schengen (Europe)',
  'United Kingdom',
  'United States',
  'Indonesia (Bali)',
  'Vietnam',
];

/** Helper to format dynamic dates from today + offset days */
function getOffsetDate(offsetDays: number): { display: string; iso: string } {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return {
    display: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    iso: d.toISOString().split('T')[0],
  };
}

/** Map vertical / searchType to a dedicated semantic fallback Ionicons glyph */
function getSemanticFallbackIcon(searchType?: string, id?: string): keyof typeof Ionicons.glyphMap {
  const key = `${searchType || ''} ${id || ''}`.toLowerCase();
  if (key.includes('hotel') || key.includes('stay')) return 'business-outline';
  if (key.includes('car')) return 'car-outline';
  if (key.includes('tour') || key.includes('attraction') || key.includes('activit') || key.includes('sightseeing')) return 'compass-outline';
  if (key.includes('flight')) return 'airplane-outline';
  if (key.includes('transfer')) return 'car-sport-outline';
  if (key.includes('holiday') || key.includes('package')) return 'map-outline';
  if (key.includes('visa')) return 'document-text-outline';
  if (key.includes('restaurant') || key.includes('dining')) return 'restaurant-outline';
  if (key.includes('build') || key.includes('custom')) return 'construct-outline';
  return 'layers-outline';
}

export function MobileSearchWidget({
  defaultDestination = '',
  initialVertical,
}: MobileSearchWidgetProps) {
  const router = useRouter();
  const colors = useColors();
  const { searchFeatures } = useFeatures();

  // Dynamic Tabs from Feature Registry
  const tabs = useMemo(() => {
    if (Array.isArray(searchFeatures) && searchFeatures.length > 0) {
      return searchFeatures;
    }
    // Fallback if registry not ready - All 8 platform verticals matching web & API
    return [
      {
        id: 'hotels',
        label: { en: 'Hotels' },
        icon: { fallbackKey: 'hotel' },
        searchType: 'hotel',
        enabled: true,
        platforms: ['app', 'web'],
      },
      {
        id: 'tours',
        label: { en: 'Tours' },
        icon: { fallbackKey: 'tour' },
        searchType: 'tour',
        enabled: true,
        platforms: ['app', 'web'],
      },
      {
        id: 'holidays',
        label: { en: 'Packages' },
        icon: { fallbackKey: 'holiday' },
        searchType: 'holiday',
        enabled: true,
        platforms: ['app', 'web'],
      },
      {
        id: 'flights',
        label: { en: 'Flights' },
        icon: { fallbackKey: 'flight' },
        searchType: 'flight',
        enabled: true,
        platforms: ['app', 'web'],
      },
      {
        id: 'transfers',
        label: { en: 'Transfers' },
        icon: { fallbackKey: 'transfer' },
        searchType: 'transfer',
        enabled: true,
        platforms: ['app', 'web'],
      },
      {
        id: 'visas',
        label: { en: 'Visas' },
        icon: { fallbackKey: 'visa' },
        searchType: 'visa',
        enabled: true,
        platforms: ['app', 'web'],
      },
      {
        id: 'restaurants',
        label: { en: 'Restaurants' },
        icon: { fallbackKey: 'restaurant' },
        searchType: 'restaurant',
        enabled: true,
        platforms: ['app', 'web'],
      },
      {
        id: 'build-package',
        label: { en: 'Build Package' },
        icon: { fallbackKey: 'buildpackage' },
        searchType: 'buildpackage',
        enabled: true,
        platforms: ['app', 'web'],
      },
    ] as unknown as FeatureItem[];
  }, [searchFeatures]);

  // Selected Tab state
  const [selectedTabId, setSelectedTabId] = useState<string>(() => {
    if (initialVertical) {
      const match = tabs.find(
        (t) =>
          t.id.toLowerCase() === initialVertical.toLowerCase() ||
          t.searchType?.toLowerCase() === initialVertical.toLowerCase()
      );
      if (match) return match.id;
    }
    return tabs[0]?.id || 'hotels';
  });

  const activeFeature = useMemo(() => {
    return tabs.find((t) => t.id === selectedTabId) || tabs[0];
  }, [tabs, selectedTabId]);

  const searchType = activeFeature?.searchType || 'hotel';

  const { destinations: apiDestinations } = useDestinations();
  const config = useSiteConfig();

  const dynamicDestinations = useMemo(() => {
    if (apiDestinations && apiDestinations.length > 0) {
      return apiDestinations.map(d => d.name.split(',')[0].trim());
    }
    return ['Dubai', 'Abu Dhabi', 'Singapore', 'Bali', 'Bangkok', 'Phuket'];
  }, [apiDestinations]);

  const dynamicCarLocations = useMemo(() => {
    if (apiDestinations && apiDestinations.length > 0) {
      return apiDestinations.map(d => `${d.name.split(',')[0].trim()} Airport / Downtown`);
    }
    return ['Dubai Airport (DXB)', 'Singapore Changi (SIN)', 'Bangkok Airport (BKK)'];
  }, [apiDestinations]);

  const dynamicAirports = useMemo(() => {
    if (apiDestinations && apiDestinations.length > 0) {
      return apiDestinations.slice(0, 10).map((d) => {
        const city = d.name.split(',')[0].trim();
        const code = city.slice(0, 3).toUpperCase();
        return {
          code,
          name: `${city} International Airport`,
          city,
          country: d.country || 'Global',
        };
      });
    }
    return [
      { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE' },
      { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj Intl', city: 'Mumbai', country: 'India' },
      { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
      { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand' },
    ];
  }, [apiDestinations]);

  const dynamicVisaCountries = useMemo(() => {
    if (apiDestinations && apiDestinations.length > 0) {
      const countries = apiDestinations.map(d => d.country || d.name.split(',')[1]?.trim()).filter(Boolean);
      return Array.from(new Set(countries)) as string[];
    }
    return ['United Arab Emirates (UAE)', 'Thailand', 'Singapore', 'Malaysia', 'United Kingdom', 'Schengen (Europe)'];
  }, [apiDestinations]);

  // ─── Search Form States (Dynamic Defaults, No Hardcoded '09 Nov 2026') ───
  const [destination, setDestination] = useState(defaultDestination);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // Dynamic Dates
  const [checkInDate, setCheckInDate] = useState(() => getOffsetDate(3));
  const [checkOutDate, setCheckOutDate] = useState(() => getOffsetDate(6));
  const [tourDate, setTourDate] = useState(() => getOffsetDate(3));

  // Car Rental State
  const [carPickupLocation, setCarPickupLocation] = useState(CAR_LOCATIONS[0]);
  const [carPickupDate, setCarPickupDate] = useState(() => getOffsetDate(2));
  const [carReturnDate, setCarReturnDate] = useState(() => getOffsetDate(5));
  const [driverAge, setDriverAge] = useState('25-70');

  // Flights State
  const [tripType, setTripType] = useState<'oneWay' | 'roundTrip'>('oneWay');
  const [fromAirport, setFromAirport] = useState(AIRPORTS[0]);
  const [toAirport, setToAirport] = useState(AIRPORTS[4]);
  const [flightCabin, setFlightCabin] = useState<'Economy' | 'Business'>('Economy');

  // Transfers State
  const [transferPickup, setTransferPickup] = useState('Dubai Airport (DXB)');
  const [transferDropoff, setTransferDropoff] = useState('Downtown Dubai Hotel');
  const [transferTime, setTransferTime] = useState('10:00 AM');

  // Visa State
  const [nationality, setNationality] = useState('India');
  const [visaCountry, setVisaCountry] = useState('United Arab Emirates (UAE)');

  // Restaurant State
  const [diningCity, setDiningCity] = useState('Dubai');
  const [dietaryPref, setDietaryPref] = useState<'all' | 'pure_veg' | 'jain' | 'halal'>('jain');
  const [diningGuests, setDiningGuests] = useState(2);

  // Build package State
  const [originCity, setOriginCity] = useState('Surat / Mumbai');
  const [packageDays, setPackageDays] = useState('5 Days / 4 Nights');

  // Modals
  const [destModalVisible, setDestModalVisible] = useState(false);
  const [carLocModalVisible, setCarLocModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState<'checkin' | 'checkout' | 'tour' | 'car' | null>(null);
  const [occupancyModalVisible, setOccupancyModalVisible] = useState(false);
  const [airportModalVisible, setAirportModalVisible] = useState<'from' | 'to' | null>(null);
  const [visaModalVisible, setVisaModalVisible] = useState<'nat' | 'dest' | null>(null);

  const handleSwapAirports = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    const temp = fromAirport;
    setFromAirport(toAirport);
    setToAirport(temp);
  };

  const handleSearch = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const type = activeFeature?.searchType;
    const featId = activeFeature?.id?.toLowerCase();

    // 1. Car Rental
    if (type === 'car' || featId === 'car-rental') {
      router.push({
        pathname: '/car-rental',
        params: {
          pickup: carPickupLocation,
          pickupDate: carPickupDate.iso,
          returnDate: carReturnDate.iso,
          driverAge,
        },
      } as any);
      return;
    }

    // 2. Hotels
    if (type === 'hotel' || featId === 'hotels') {
      router.push({
        pathname: '/(tabs)/explore',
        params: {
          service: 'hotels',
          category: 'hotel',
          destination: destination || 'Dubai',
          checkIn: checkInDate.iso,
          checkOut: checkOutDate.iso,
          adults: String(adults),
          children: String(children),
        },
      } as any);
      return;
    }

    // 3. Tours / Attractions
    if (type === 'tour' || featId === 'tours' || featId === 'attractions' || featId === 'activities') {
      router.push({
        pathname: '/(tabs)/explore',
        params: {
          service: 'tours',
          destination: destination || 'Dubai',
          date: tourDate.iso,
          adults: String(adults),
        },
      } as any);
      return;
    }

    // 4. Holidays / Packages
    if (type === 'holiday' || featId === 'holidays' || featId === 'packages') {
      router.push({
        pathname: '/(tabs)/explore',
        params: {
          service: 'packages',
          destination: destination || 'Dubai',
          duration: packageDays,
          adults: String(adults),
        },
      } as any);
      return;
    }

    // 5. Flights
    if (type === 'flight' || featId === 'flights') {
      router.push({
        pathname: '/(tabs)/explore',
        params: {
          service: 'flights',
          from: fromAirport.code,
          to: toAirport.code,
          tripType,
          cabin: flightCabin,
          passengers: String(adults + children),
        },
      } as any);
      return;
    }

    // 6. Airport Transfers
    if (type === 'transfer' || featId === 'transfers' || featId === 'airport-transfer') {
      router.push({
        pathname: '/airport-transfer',
        params: {
          pickup: transferPickup,
          dropoff: transferDropoff,
          time: transferTime,
          passengers: String(adults + children),
        },
      } as any);
      return;
    }

    // 7. Visas
    if (featId === 'visas') {
      router.push({
        pathname: '/visa-hub',
        params: {
          nationality,
          destination: visaCountry,
        },
      } as any);
      return;
    }

    // 8. Dining / Restaurants
    if (featId === 'restaurants') {
      router.push({
        pathname: '/culinary-guide',
        params: {
          city: diningCity,
          dietary: dietaryPref,
          guests: String(diningGuests),
        },
      } as any);
      return;
    }

    // 9. Build Package
    if (featId === 'build-package') {
      router.push({
        pathname: '/group-planning',
        params: {
          origin: originCity,
          destination: destination || 'Dubai',
          duration: packageDays,
        },
      } as any);
      return;
    }

    // Default route
    router.push({
      pathname: '/(tabs)/explore',
      params: {
        destination: destination || 'Dubai',
      },
    } as any);
  };

  // CTA Button Label
  const getCtaLabel = () => {
    const type = activeFeature?.searchType;
    const featId = activeFeature?.id?.toLowerCase();
    const label = activeFeature?.label?.en || activeFeature?.id || 'Experiences';

    if (type === 'car' || featId === 'car-rental') return 'Search Cars';
    if (type === 'hotel' || featId === 'hotels') return 'Search Hotels';
    if (type === 'tour' || featId === 'tours' || featId === 'attractions') return `Search ${label}`;
    if (type === 'flight' || featId === 'flights') return 'Search Flights';
    if (type === 'transfer' || featId === 'transfers') return 'Search Transfers';
    if (type === 'holiday' || featId === 'holidays') return 'Search Holidays';
    if (featId === 'packages') return 'Search Packages';
    if (featId === 'visas') return 'Check Visa Requirements';
    if (featId === 'restaurants') return 'Find Dining';
    if (featId === 'build-package') return 'Plan Custom Tour';
    return `Search ${label}`;
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOW.md]}>
      {/* ─── 1. DYNAMIC API-DRIVEN SERVICE TABS ─── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBarScroll}
        style={styles.tabBarContainer}
      >
        {tabs.map((tab) => {
          const isSelected = selectedTabId === tab.id;
          const tabLabel = tab.label?.en || Object.values(tab.label || {})[0] || tab.id;
          const fallbackIcon = getSemanticFallbackIcon(tab.searchType, tab.id);

          return (
            <TouchableOpacity
              testID={`btn-tab-${tab.id.toLowerCase()}`}
              accessibilityLabel={`Select ${tabLabel} service tab`}
              key={tab.id}
              style={[
                styles.tabBtn,
                isSelected && {
                  borderBottomColor: colors.primary,
                  borderBottomWidth: 2,
                  backgroundColor: `${colors.primary}12`,
                },
              ]}
              onPress={() => {
                setSelectedTabId(tab.id);
                try {
                  Haptics.selectionAsync();
                } catch {}
              }}
              activeOpacity={0.75}
            >
              {tab.icon?.url ? (
                <ExpoImage
                  source={{ uri: tab.icon.url }}
                  style={{ width: 16, height: 16, marginRight: 6 }}
                  contentFit="contain"
                />
              ) : (
                <Ionicons
                  name={fallbackIcon}
                  size={15}
                  color={isSelected ? colors.primary : colors.mutedText}
                  style={{ marginRight: 6 }}
                />
              )}
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color: isSelected ? colors.primary : colors.mutedText,
                    fontWeight: isSelected ? '700' : '600',
                  },
                ]}
              >
                {tabLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ─── 2. DYNAMIC INPUT FORMS PER ACTIVE VERTICAL ─── */}

      {/* 2A. HOTELS (Destination, Date Range, Occupancy) */}
      {(searchType === 'hotel' || activeFeature?.id === 'hotels') && (
        <View>
          <TouchableOpacity
            testID="btn-destination-picker"
            accessibilityLabel="Choose destination city or hotel"
            style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setDestModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="location-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Destination / Hotel</Text>
              <Text style={[styles.fieldValue, { color: destination ? colors.heading : colors.mutedText }]}>
                {destination || 'City, Landmark or Hotel name'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
          </TouchableOpacity>

          <View style={styles.dualRow}>
            <TouchableOpacity
              testID="btn-hotel-dates"
              accessibilityLabel="Select check-in and check-out dates"
              style={[styles.inputRowHalf, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setDateModalVisible('checkin')}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Check-in — Check-out</Text>
                <Text style={[styles.fieldValueSmall, { color: colors.heading }]} numberOfLines={1}>
                  {checkInDate.display} — {checkOutDate.display}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              testID="btn-guests-modal"
              accessibilityLabel="Select guests and rooms count"
              style={[styles.inputRowHalf, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setOccupancyModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="people-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Guests &amp; Rooms</Text>
                <Text style={[styles.fieldValueSmall, { color: colors.heading }]} numberOfLines={1}>
                  {adults} Guests, 1 Room
                </Text>
              </View>
              <Ionicons name="chevron-down" size={14} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 2B. TOURS & ATTRACTIONS (Destination, Single Travel Date, Guests) */}
      {(searchType === 'tour' ||
        activeFeature?.id === 'tours' ||
        activeFeature?.id === 'attractions' ||
        activeFeature?.id === 'activities') && (
        <View>
          <TouchableOpacity
            testID="btn-tour-destination"
            accessibilityLabel="Destination or activity name"
            style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setDestModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="compass-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Destination / Activity</Text>
              <Text style={[styles.fieldValue, { color: destination ? colors.heading : colors.mutedText }]}>
                {destination || 'Where are you travelling?'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
          </TouchableOpacity>

          <View style={styles.dualRow}>
            <TouchableOpacity
              testID="btn-tour-date"
              accessibilityLabel="Select activity date"
              style={[styles.inputRowHalf, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setDateModalVisible('tour')}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Travel Date</Text>
                <Text style={[styles.fieldValueSmall, { color: colors.heading }]} numberOfLines={1}>
                  {tourDate.display}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              testID="btn-tour-travelers"
              accessibilityLabel="Select travelers"
              style={[styles.inputRowHalf, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setOccupancyModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="people-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Travelers</Text>
                <Text style={[styles.fieldValueSmall, { color: colors.heading }]} numberOfLines={1}>
                  {adults} Adults{children > 0 ? `, ${children} Ch` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={14} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 2C. CAR RENTAL (Pick-up, Pick-up Date/Time, Drop-off Date/Time, Driver Age) */}
      {(searchType === 'car' || activeFeature?.id === 'car-rental') && (
        <View>
          <TouchableOpacity
            testID="btn-car-pickup"
            accessibilityLabel="Pick-up airport or city location"
            style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setCarLocModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="car-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Pick-up Location</Text>
              <Text style={[styles.fieldValue, { color: colors.heading }]} numberOfLines={1}>
                {carPickupLocation}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
          </TouchableOpacity>

          <View style={styles.dualRow}>
            <TouchableOpacity
              testID="btn-car-pickup-dates"
              accessibilityLabel="Pick-up and Return Dates"
              style={[styles.inputRowHalf, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setDateModalVisible('car')}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Pick-up — Return</Text>
                <Text style={[styles.fieldValueSmall, { color: colors.heading }]} numberOfLines={1}>
                  {carPickupDate.display} — {carReturnDate.display}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              testID="btn-driver-age"
              accessibilityLabel="Driver Age Selection"
              style={[styles.inputRowHalf, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => {
                setDriverAge((prev) => (prev === '25-70' ? '21-24' : prev === '21-24' ? '70+' : '25-70'));
                try {
                  Haptics.selectionAsync();
                } catch {}
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="person-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Driver Age</Text>
                <Text style={[styles.fieldValueSmall, { color: colors.heading }]}>{driverAge}</Text>
              </View>
              <Ionicons name="swap-vertical" size={14} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 2D. HOLIDAYS / PACKAGES */}
      {(searchType === 'holiday' || activeFeature?.id === 'holidays' || activeFeature?.id === 'packages') && (
        <View>
          <TouchableOpacity
            testID="btn-holiday-dest"
            accessibilityLabel="Holiday Destination"
            style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setDestModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="map-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Holiday Destination</Text>
              <Text style={[styles.fieldValue, { color: destination ? colors.heading : colors.mutedText }]}>
                {destination || 'Explore Southeast Asia & UAE'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
          </TouchableOpacity>

          <View style={styles.dualRow}>
            <TouchableOpacity
              testID="btn-holiday-duration"
              accessibilityLabel="Holiday Duration"
              style={[styles.inputRowHalf, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => {
                setPackageDays((d) => (d.includes('5') ? '7 Days / 6 Nights' : d.includes('7') ? '10 Days / 9 Nights' : '5 Days / 4 Nights'));
                try {
                  Haptics.selectionAsync();
                } catch {}
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="time-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Duration</Text>
                <Text style={[styles.fieldValueSmall, { color: colors.heading }]}>{packageDays}</Text>
              </View>
              <Ionicons name="swap-vertical" size={14} color={colors.mutedText} />
            </TouchableOpacity>

            <TouchableOpacity
              testID="btn-holiday-travelers"
              accessibilityLabel="Select guests"
              style={[styles.inputRowHalf, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setOccupancyModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="people-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Travelers</Text>
                <Text style={[styles.fieldValueSmall, { color: colors.heading }]}>
                  {adults} Adults{children > 0 ? `, ${children} Ch` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={14} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 2E. FLIGHTS */}
      {(searchType === 'flight' || activeFeature?.id === 'flights') && (
        <View>
          <View style={styles.flightSubRow}>
            <View style={styles.pillGroup}>
              <TouchableOpacity
                testID="btn-trip-oneway"
                accessibilityLabel="One Way Flight"
                style={[styles.miniPill, tripType === 'oneWay' && { backgroundColor: colors.primary }]}
                onPress={() => setTripType('oneWay')}
              >
                <Text style={[styles.miniPillText, { color: tripType === 'oneWay' ? '#ffffff' : colors.mutedText }]}>
                  One-Way
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="btn-trip-round"
                accessibilityLabel="Round Trip Flight"
                style={[styles.miniPill, tripType === 'roundTrip' && { backgroundColor: colors.primary }]}
                onPress={() => setTripType('roundTrip')}
              >
                <Text style={[styles.miniPillText, { color: tripType === 'roundTrip' ? '#ffffff' : colors.mutedText }]}>
                  Round-Trip
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              testID="btn-cabin-toggle"
              accessibilityLabel="Toggle cabin class"
              onPress={() => setFlightCabin((c) => (c === 'Economy' ? 'Business' : 'Economy'))}
              style={[styles.cabinPill, { borderColor: colors.border }]}
            >
              <Ionicons name="ribbon-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.cabinPillText, { color: colors.heading }]}>{flightCabin}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dualRowWithSwap}>
            <TouchableOpacity
              testID="btn-from-airport"
              accessibilityLabel="Select departure airport"
              style={[styles.airportBox, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setAirportModalVisible('from')}
            >
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>From</Text>
              <Text style={[styles.airportCode, { color: colors.primary }]}>{fromAirport.code}</Text>
              <Text style={[styles.airportCity, { color: colors.heading }]} numberOfLines={1}>
                {fromAirport.city}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="btn-swap-airports"
              accessibilityLabel="Swap departure and arrival airports"
              style={[styles.swapBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleSwapAirports}
            >
              <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              testID="btn-to-airport"
              accessibilityLabel="Select arrival airport"
              style={[styles.airportBox, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setAirportModalVisible('to')}
            >
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>To</Text>
              <Text style={[styles.airportCode, { color: colors.primary }]}>{toAirport.code}</Text>
              <Text style={[styles.airportCity, { color: colors.heading }]} numberOfLines={1}>
                {toAirport.city}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 2F. TRANSFERS */}
      {(searchType === 'transfer' || activeFeature?.id === 'transfers') && (
        <View>
          <TouchableOpacity
            testID="btn-transfer-pickup"
            accessibilityLabel="Airport pickup location"
            style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => {
              setTransferPickup((p) =>
                p.includes('DXB') ? 'Abu Dhabi Airport (AUH)' : 'Dubai Airport (DXB)'
              );
              try {
                Haptics.selectionAsync();
              } catch {}
            }}
          >
            <Ionicons name="airplane-sharp" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Pickup Location</Text>
              <Text style={[styles.fieldValue, { color: colors.heading }]} numberOfLines={1}>
                {transferPickup}
              </Text>
            </View>
            <Ionicons name="swap-vertical" size={14} color={colors.mutedText} />
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-transfer-dropoff"
            accessibilityLabel="Transfer dropoff location"
            style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => {
              setTransferDropoff((d) =>
                d.includes('Downtown') ? 'Palm Jumeirah Luxury Resort' : 'Downtown Dubai Hotel'
              );
              try {
                Haptics.selectionAsync();
              } catch {}
            }}
          >
            <Ionicons name="business" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Drop-off Location</Text>
              <Text style={[styles.fieldValue, { color: colors.heading }]} numberOfLines={1}>
                {transferDropoff}
              </Text>
            </View>
            <Ionicons name="swap-vertical" size={14} color={colors.mutedText} />
          </TouchableOpacity>
        </View>
      )}

      {/* 2G. VISAS */}
      {activeFeature?.id === 'visas' && (
        <View>
          <TouchableOpacity
            testID="btn-visa-nationality"
            accessibilityLabel="Select your citizen nationality"
            style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setVisaModalVisible('nat')}
          >
            <Ionicons name="flag-outline" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Citizen / Passport</Text>
              <Text style={[styles.fieldValue, { color: colors.heading }]}>{nationality}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.mutedText} />
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-visa-destination"
            accessibilityLabel="Select target visa country"
            style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setVisaModalVisible('dest')}
          >
            <Ionicons name="earth" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Visa Destination</Text>
              <Text style={[styles.fieldValue, { color: colors.heading }]}>{visaCountry}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.mutedText} />
          </TouchableOpacity>
        </View>
      )}

      {/* 2H. RESTAURANTS / DINING */}
      {activeFeature?.id === 'restaurants' && (
        <View>
          <TouchableOpacity
            testID="btn-restaurant-city"
            accessibilityLabel="Select restaurant city"
            style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => {
              setDiningCity((c) => (c === 'Dubai' ? 'Singapore' : c === 'Singapore' ? 'Bangkok' : 'Dubai'));
              try {
                Haptics.selectionAsync();
              } catch {}
            }}
          >
            <Ionicons name="restaurant-outline" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Dining City</Text>
              <Text style={[styles.fieldValue, { color: colors.heading }]}>{diningCity}</Text>
            </View>
            <Ionicons name="swap-vertical" size={14} color={colors.mutedText} />
          </TouchableOpacity>

          <View style={styles.dietaryRow}>
            {(
              [
                { id: 'jain', label: '100% Jain Pure' },
                { id: 'pure_veg', label: 'Pure Veg' },
                { id: 'halal', label: 'Halal' },
                { id: 'all', label: 'All Cuisines' },
              ] as const
            ).map((d) => (
              <TouchableOpacity
                testID={`btn-diet-${d.id}`}
                accessibilityLabel={`Select ${d.label} dietary preference`}
                key={d.id}
                style={[
                  styles.dietPill,
                  { borderColor: colors.border },
                  dietaryPref === d.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setDietaryPref(d.id)}
              >
                <Text
                  style={[
                    styles.dietPillText,
                    { color: dietaryPref === d.id ? '#ffffff' : colors.mutedText },
                  ]}
                >
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 2I. BUILD PACKAGE */}
      {activeFeature?.id === 'build-package' && (
        <View>
          <TouchableOpacity
            testID="btn-bp-origin"
            accessibilityLabel="Starting from city"
            style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => {
              setOriginCity((o) => (o.includes('Surat') ? 'Delhi / NCR' : 'Surat / Mumbai'));
              try {
                Haptics.selectionAsync();
              } catch {}
            }}
          >
            <Ionicons name="home-outline" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Starting From</Text>
              <Text style={[styles.fieldValue, { color: colors.heading }]}>{originCity}</Text>
            </View>
            <Ionicons name="swap-vertical" size={14} color={colors.mutedText} />
          </TouchableOpacity>

          <View style={styles.dualRow}>
            <TouchableOpacity
              testID="btn-bp-destination"
              accessibilityLabel="Dream holiday destination"
              style={[styles.inputRowHalf, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setDestModalVisible(true)}
            >
              <Ionicons name="map-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Destination</Text>
                <Text style={[styles.fieldValueSmall, { color: colors.heading }]} numberOfLines={1}>
                  {destination || 'Dubai'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              testID="btn-bp-duration"
              accessibilityLabel="Custom trip duration"
              style={[styles.inputRowHalf, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => {
                setPackageDays((d) => (d.includes('5') ? '7 Days / 6 Nights' : '5 Days / 4 Nights'));
                try {
                  Haptics.selectionAsync();
                } catch {}
              }}
            >
              <Ionicons name="time-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Duration</Text>
                <Text style={[styles.fieldValueSmall, { color: colors.heading }]} numberOfLines={1}>
                  {packageDays}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ─── 3. DYNAMIC SEARCH CTA BUTTON ─── */}
      <TouchableOpacity
        testID="btn-search-cta"
        accessibilityLabel={getCtaLabel()}
        style={[styles.searchButton, { backgroundColor: colors.primary }]}
        onPress={handleSearch}
        activeOpacity={0.85}
      >
        <Ionicons name="search" size={16} color="#ffffff" style={{ marginRight: 6 }} />
        <Text style={styles.searchButtonText}>{getCtaLabel()}</Text>
      </TouchableOpacity>

      {/* ─── MODAL 1: DESTINATION AUTOCOMPLETE ─── */}
      <Modal
        visible={destModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.heading }]}>Choose Destination</Text>
              <TouchableOpacity
                testID="btn-close-dest-modal"
                accessibilityLabel="Close destination selector"
                onPress={() => setDestModalVisible(false)}
              >
                <Ionicons name="close" size={22} color={colors.heading} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchBarBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="search" size={16} color={colors.mutedText} style={{ marginRight: 8 }} />
              <TextInput
                value={destination}
                onChangeText={setDestination}
                placeholder="Search city, island or landmark..."
                placeholderTextColor={colors.mutedText}
                style={[styles.textInput, { color: colors.heading }]}
                autoFocus
              />
              {destination.length > 0 && (
                <TouchableOpacity
                  testID="btn-clear-destination"
                  accessibilityLabel="Clear destination input"
                  onPress={() => setDestination('')}
                >
                  <Ionicons name="close-circle" size={16} color={colors.mutedText} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.popularTitle, { color: colors.mutedText }]}>Popular Destinations</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {dynamicDestinations.map((city) => (
                <TouchableOpacity
                  testID={`btn-dest-${city.toLowerCase().replace(/\s+/g, '-')}`}
                  accessibilityLabel={`Select destination ${city}`}
                  key={city}
                  style={[styles.cityRow, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setDestination(city);
                    setDestModalVisible(false);
                  }}
                >
                  <Ionicons name="location" size={16} color={colors.primary} style={{ marginRight: 10 }} />
                  <Text style={[styles.cityName, { color: colors.heading }]}>{city}</Text>
                  <Text style={[styles.cityTag, { color: colors.mutedText }]}>Top Choice</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 2: CAR RENTAL LOCATION ─── */}
      <Modal
        visible={carLocModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCarLocModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.heading }]}>Select Pick-up Station</Text>
              <TouchableOpacity
                testID="btn-close-car-loc-modal"
                accessibilityLabel="Close location selector"
                onPress={() => setCarLocModalVisible(false)}
              >
                <Ionicons name="close" size={22} color={colors.heading} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {dynamicCarLocations.map((loc) => (
                <TouchableOpacity
                  testID={`btn-carloc-${loc.slice(0, 5).toLowerCase()}`}
                  accessibilityLabel={`Select ${loc}`}
                  key={loc}
                  style={[styles.cityRow, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setCarPickupLocation(loc);
                    setCarLocModalVisible(false);
                  }}
                >
                  <Ionicons name="car-sport" size={16} color={colors.primary} style={{ marginRight: 10 }} />
                  <Text style={[styles.cityName, { color: colors.heading }]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 3: DYNAMIC DATES SELECTION ─── */}
      <Modal
        visible={dateModalVisible !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setDateModalVisible(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.heading }]}>
                {dateModalVisible === 'car'
                  ? 'Select Rental Dates'
                  : dateModalVisible === 'tour'
                  ? 'Select Tour Date'
                  : 'Select Travel Dates'}
              </Text>
              <TouchableOpacity
                testID="btn-close-date-modal"
                accessibilityLabel="Close date selector"
                onPress={() => setDateModalVisible(null)}
              >
                <Ionicons name="close" size={22} color={colors.heading} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.popularTitle, { color: colors.mutedText }]}>Quick Travel Presets</Text>
            <View style={{ gap: 8, marginVertical: 12 }}>
              {[
                { label: 'This Weekend (Sat — Sun)', offsetIn: 1, offsetOut: 3 },
                { label: 'Next Weekend (Fri — Sun)', offsetIn: 5, offsetOut: 7 },
                { label: 'Next Week (7 Days Trip)', offsetIn: 7, offsetOut: 14 },
                { label: 'In 2 Weeks (10 Days Holiday)', offsetIn: 14, offsetOut: 24 },
                { label: 'Next Month (14 Days Getaway)', offsetIn: 30, offsetOut: 44 },
              ].map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.cityRow, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    if (dateModalVisible === 'car') {
                      setCarPickupDate(getOffsetDate(preset.offsetIn));
                      setCarReturnDate(getOffsetDate(preset.offsetOut));
                    } else if (dateModalVisible === 'tour') {
                      setTourDate(getOffsetDate(preset.offsetIn));
                    } else {
                      setCheckInDate(getOffsetDate(preset.offsetIn));
                      setCheckOutDate(getOffsetDate(preset.offsetOut));
                    }
                    setDateModalVisible(null);
                  }}
                >
                  <Ionicons name="calendar" size={16} color={colors.primary} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cityName, { color: colors.heading }]}>{preset.label}</Text>
                    <Text style={[styles.counterSub, { color: colors.mutedText }]}>
                      {getOffsetDate(preset.offsetIn).display} — {getOffsetDate(preset.offsetOut).display}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 4: OCCUPANCY & TRAVELERS ─── */}
      <Modal
        visible={occupancyModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setOccupancyModalVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.centerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.heading, marginBottom: SPACING.md }]}>
              Travelers &amp; Guests
            </Text>

            {/* Adults Counter */}
            <View style={styles.counterRow}>
              <View>
                <Text style={[styles.counterLabel, { color: colors.heading }]}>Adults</Text>
                <Text style={[styles.counterSub, { color: colors.mutedText }]}>12+ years</Text>
              </View>
              <View style={styles.counterControls}>
                <TouchableOpacity
                  testID="btn-adults-decrement"
                  accessibilityLabel="Decrease adult guests"
                  style={[styles.counterBtn, { borderColor: colors.border }]}
                  disabled={adults <= 1}
                  onPress={() => setAdults((prev) => Math.max(1, prev - 1))}
                >
                  <Text style={[styles.counterBtnText, { color: colors.heading }]}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.counterVal, { color: colors.heading }]}>{adults}</Text>
                <TouchableOpacity
                  testID="btn-adults-increment"
                  accessibilityLabel="Increase adult guests"
                  style={[styles.counterBtn, { borderColor: colors.border }]}
                  onPress={() => setAdults((prev) => prev + 1)}
                >
                  <Text style={[styles.counterBtnText, { color: colors.heading }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Children Counter */}
            <View style={styles.counterRow}>
              <View>
                <Text style={[styles.counterLabel, { color: colors.heading }]}>Children</Text>
                <Text style={[styles.counterSub, { color: colors.mutedText }]}>2 - 11 years</Text>
              </View>
              <View style={styles.counterControls}>
                <TouchableOpacity
                  testID="btn-children-decrement"
                  accessibilityLabel="Decrease child guests"
                  style={[styles.counterBtn, { borderColor: colors.border }]}
                  disabled={children <= 0}
                  onPress={() => setChildren((prev) => Math.max(0, prev - 1))}
                >
                  <Text style={[styles.counterBtnText, { color: colors.heading }]}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.counterVal, { color: colors.heading }]}>{children}</Text>
                <TouchableOpacity
                  testID="btn-children-increment"
                  accessibilityLabel="Increase child guests"
                  style={[styles.counterBtn, { borderColor: colors.border }]}
                  onPress={() => setChildren((prev) => prev + 1)}
                >
                  <Text style={[styles.counterBtnText, { color: colors.heading }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              testID="btn-confirm-guests"
              accessibilityLabel="Confirm Guests"
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => setOccupancyModalVisible(false)}
            >
              <Text style={styles.doneBtnText}>Confirm Guests</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 5: AIRPORT SELECTION ─── */}
      <Modal
        visible={airportModalVisible !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setAirportModalVisible(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.heading }]}>
                {airportModalVisible === 'from' ? 'Select Origin Airport' : 'Select Destination Airport'}
              </Text>
              <TouchableOpacity
                testID="btn-close-airport-modal"
                accessibilityLabel="Close airport selector"
                onPress={() => setAirportModalVisible(null)}
              >
                <Ionicons name="close" size={22} color={colors.heading} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {dynamicAirports.map((air) => (
                <TouchableOpacity
                  testID={`btn-air-${air.code.toLowerCase()}`}
                  accessibilityLabel={`Select airport ${air.name}`}
                  key={air.code}
                  style={[styles.cityRow, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    if (airportModalVisible === 'from') setFromAirport(air);
                    else setToAirport(air);
                    setAirportModalVisible(null);
                  }}
                >
                  <View style={styles.airportBadge}>
                    <Text style={styles.airportBadgeText}>{air.code}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.cityName, { color: colors.heading }]}>{air.city}</Text>
                    <Text style={[styles.counterSub, { color: colors.mutedText }]} numberOfLines={1}>
                      {air.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 6: VISA NATIONALITY & DESTINATION ─── */}
      <Modal
        visible={visaModalVisible !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setVisaModalVisible(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.heading }]}>
                {visaModalVisible === 'nat' ? 'Select Citizen Country' : 'Select Visa Destination'}
              </Text>
              <TouchableOpacity
                testID="btn-close-visa-modal"
                accessibilityLabel="Close visa selector"
                onPress={() => setVisaModalVisible(null)}
              >
                <Ionicons name="close" size={22} color={colors.heading} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {(visaModalVisible === 'nat' ? NATIONALITIES : dynamicVisaCountries).map((item) => (
                <TouchableOpacity
                  testID={`btn-visa-item-${item.slice(0, 5).toLowerCase()}`}
                  accessibilityLabel={`Select ${item}`}
                  key={item}
                  style={[styles.cityRow, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    if (visaModalVisible === 'nat') setNationality(item);
                    else setVisaCountry(item);
                    setVisaModalVisible(null);
                  }}
                >
                  <Ionicons name="globe-outline" size={16} color={colors.primary} style={{ marginRight: 10 }} />
                  <Text style={[styles.cityName, { color: colors.heading }]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    marginTop: -SPACING.xl,
    marginBottom: SPACING.md,
  },
  tabBarContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    marginBottom: SPACING.md,
  },
  tabBarScroll: {
    paddingRight: SPACING.md,
    gap: 4,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 3,
    paddingHorizontal: SPACING.sm + 4,
    borderRadius: RADIUS.sm,
    marginBottom: -1,
  },
  tabBtnText: {
    fontSize: FONT_SIZE.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  dualRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  inputRowHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  flightSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  pillGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: RADIUS.full,
    padding: 2,
  },
  miniPill: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  miniPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cabinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  cabinPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dualRowWithSwap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  airportBox: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  airportCode: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  airportCity: {
    fontSize: 11,
    fontWeight: '600',
  },
  swapBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dietaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.md,
  },
  dietPill: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  dietPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
    marginTop: 1,
  },
  fieldValueSmall: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    marginTop: 1,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.lg,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    flex: 1,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    padding: 0,
  },
  popularTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  airportBadge: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  airportBadgeText: {
    fontWeight: '900',
    fontSize: 12,
  },
  cityName: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  cityTag: {
    fontSize: 10,
    fontWeight: '500',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  centerCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  counterLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  counterSub: {
    fontSize: 10,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  counterVal: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    width: 24,
    textAlign: 'center',
  },
  doneBtn: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
  },
});
