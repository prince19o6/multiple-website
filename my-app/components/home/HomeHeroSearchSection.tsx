/**
 * components/home/HomeHeroSearchSection.tsx
 *
 * Pixel-accurate, module-driven Hero & Search widget for the ToursApp Homepage.
 * Matches the reference design:
 *   1. High-impact Scenic Hero Banner (Dubai skyline at dusk) with dark gradient vignette
 *   2. Centered Badge ('✨ EXCLUSIVE AIRFARES'), Hero Title & Subtitle overlay
 *   3. Floating elevated card overlapping hero with soft elevation and rounded corners
 *   4. Card Header: Circular '<' and '>' arrow navigation buttons flanking the module selector tabs
 *   5. Interactive Search Widget matching the active module:
 *      - Flights: One-Way / Round Trip / Multi City radios, Economy dropdown, Direct Flights checkbox,
 *                 WHERE FROM? (STV - Surat Airport), Swap button, WHERE TO? (DXB - Dubai Airport),
 *                 Departure Date, Passengers & Cabin, and Solid Blue 'Search Flights' CTA.
 *      - Hotels: Destination, Check-in/Check-out, Rooms & Guests, 'Search Hotels' CTA.
 *      - Tours: Destination / Activity, Date, Travelers, 'Search Tours' CTA.
 *      - Packages: Dream Destination, Duration & Month, 'Search Holiday Packages' CTA.
 *      - Transfers, Visas, Restaurants, Build Package with dedicated forms.
 *   6. Full interactive modal pickers for Airports, Destinations, Cabin, and Passengers.
 */

import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { useActiveModule, type CanonicalModule, type ModuleItem } from '@/store/ModuleContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface HomeHeroSearchSectionProps {
  onOpenTravelHub?: () => void;
  onOpenEnquiry?: (service: string) => void;
}

export type TripType = 'oneWay' | 'roundTrip' | 'multiCity';
export type CabinClass = 'Economy' | 'Premium Economy' | 'Business' | 'First Class';

export interface AirportOption {
  code: string;
  name: string;
  city: string;
  country: string;
}

const POPULAR_AIRPORTS: AirportOption[] = [
  { code: 'STV', name: 'Surat (Surat Gujarat Airport)', city: 'Surat', country: 'India' },
  { code: 'DXB', name: 'Dubai (Dubai International Airport)', city: 'Dubai', country: 'UAE' },
  { code: 'BOM', name: 'Mumbai (Chhatrapati Shivaji Maharaj Intl)', city: 'Mumbai', country: 'India' },
  { code: 'DEL', name: 'Delhi (Indira Gandhi International Airport)', city: 'Delhi', country: 'India' },
  { code: 'AMD', name: 'Ahmedabad (Sardar Vallabhbhai Patel Intl)', city: 'Ahmedabad', country: 'India' },
  { code: 'BLR', name: 'Bengaluru (Kempegowda Intl Airport)', city: 'Bengaluru', country: 'India' },
  { code: 'GOI', name: 'Goa (Dabolim Goa International)', city: 'Goa', country: 'India' },
  { code: 'SIN', name: 'Singapore (Changi Airport)', city: 'Singapore', country: 'Singapore' },
  { code: 'BKK', name: 'Bangkok (Suvarnabhumi Airport)', city: 'Bangkok', country: 'Thailand' },
  { code: 'LHR', name: 'London (Heathrow Airport)', city: 'London', country: 'United Kingdom' },
];

const CABIN_CLASSES: CabinClass[] = [
  'Economy',
  'Premium Economy',
  'Business',
  'First Class',
];

const POPULAR_DESTINATIONS = [
  'Dubai, United Arab Emirates',
  'Abu Dhabi, United Arab Emirates',
  'Bali, Indonesia',
  'Singapore',
  'Bangkok & Phuket, Thailand',
  'Switzerland & Europe',
  'Kashmir & Himachal, India',
  'Goa, India',
];

export function HomeHeroSearchSection({
  onOpenTravelHub,
  onOpenEnquiry,
}: HomeHeroSearchSectionProps) {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDark();
  const { siteId } = useSite();
  const config = useSiteConfig();
  const { activeModule, activeItem, enabledModules, setActiveModule } = useActiveModule();

  const moduleScrollRef = useRef<any>(null);

  // Flight specific state
  const [tripType, setTripType] = useState<TripType>('oneWay');
  const [cabinClass, setCabinClass] = useState<CabinClass>('Economy');
  const [directFlightsOnly, setDirectFlightsOnly] = useState(false);
  const [fromAirport, setFromAirport] = useState<AirportOption>(POPULAR_AIRPORTS[0]); // STV - Surat
  const [toAirport, setToAirport] = useState<AirportOption>(POPULAR_AIRPORTS[4]); // DXB - Dubai
  const [travelDate, setTravelDate] = useState('20 Nov 2026');
  const [returnDate, setReturnDate] = useState('27 Nov 2026');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  // General Module state
  const [hotelDestination, setHotelDestination] = useState('Dubai, United Arab Emirates');
  const [hotelCheckIn, setHotelCheckIn] = useState('22 Nov 2026');
  const [hotelCheckOut, setHotelCheckOut] = useState('26 Nov 2026');
  const [hotelRooms, setHotelRooms] = useState(1);
  const [hotelGuests, setHotelGuests] = useState(2);

  const [tourDestination, setTourDestination] = useState('Dubai, Desert Safari, Burj Khalifa');
  const [tourDate, setTourDate] = useState('22 Nov 2026');
  const [tourTravelers, setTourTravelers] = useState(2);

  const [packageDestination, setPackageDestination] = useState('Dubai, Bali & Singapore');
  const [packageDuration, setPackageDuration] = useState('5-7 Days');

  const [transferPickup, setTransferPickup] = useState('Dubai International Airport (DXB)');
  const [transferDropoff, setTransferDropoff] = useState('Downtown Dubai Hotel / Resort');

  const [visaNationality, setVisaNationality] = useState('India');
  const [visaCountry, setVisaCountry] = useState('United Arab Emirates (UAE)');

  const [diningCity, setDiningCity] = useState('Dubai, UAE');
  const [diningCuisine, setDiningCuisine] = useState('Pure Veg & Jain Friendly');

  // Modals
  const [airportModalMode, setAirportModalMode] = useState<'from' | 'to' | null>(null);
  const [destinationModalVisible, setDestinationModalVisible] = useState(false);
  const [cabinModalVisible, setCabinModalVisible] = useState(false);
  const [passengerModalVisible, setPassengerModalVisible] = useState(false);
  const [searchFilterText, setSearchFilterText] = useState('');

  const totalPassengers = adults + children + infants;

  // Swap From & To airports with haptics
  const handleSwapAirports = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
    const temp = fromAirport;
    setFromAirport(toAirport);
    setToAirport(temp);
  };

  // Previous module cycle handler
  const handlePrevModule = () => {
    const idx = enabledModules.findIndex((m) => m.id === activeModule);
    if (idx > 0) {
      const prev = enabledModules[idx - 1];
      setActiveModule(prev.id);
      moduleScrollRef.current?.scrollTo({ x: Math.max(0, (idx - 1) * 90), animated: true });
    } else {
      const last = enabledModules[enabledModules.length - 1];
      setActiveModule(last.id);
      moduleScrollRef.current?.scrollToEnd({ animated: true });
    }
  };

  // Next module cycle handler
  const handleNextModule = () => {
    const idx = enabledModules.findIndex((m) => m.id === activeModule);
    if (idx < enabledModules.length - 1) {
      const next = enabledModules[idx + 1];
      setActiveModule(next.id);
      moduleScrollRef.current?.scrollTo({ x: (idx + 1) * 90, animated: true });
    } else {
      const first = enabledModules[0];
      setActiveModule(first.id);
      moduleScrollRef.current?.scrollTo({ x: 0, animated: true });
    }
  };

  // Module content metadata
  const moduleMeta = useMemo(() => {
    switch (activeModule) {
      case 'flights':
        return {
          image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85',
          badge: '✨ EXCLUSIVE AIRFARES',
          title: 'Popular Flight Routes & Best Airfares',
          subtitle:
            'Compare low airfares across leading domestic and global airlines with meal selections and instant booking.',
        };
      case 'hotels':
        return {
          image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85',
          badge: '✨ LUXURY RETREATS & RESORTS',
          title: 'Perfect Stays in Dubai & Worldwide',
          subtitle:
            'Handpicked luxury resorts, beachside villas, and city center hotels with Pure Veg & Jain dining options.',
        };
      case 'tours':
        return {
          image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&q=85',
          badge: '✨ TOP RATED EXPERIENCES',
          title: 'Authentic Guided Tours & Sightseeing',
          subtitle:
            'Discover iconic attractions, desert safaris, and cultural landmarks tailored for families and groups.',
        };
      case 'packages':
        return {
          image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85',
          badge: '✨ ALL-INCLUSIVE VACATIONS',
          title: 'Curated Holiday & Vacation Packages',
          subtitle:
            'Carefully crafted itineraries with flights, hotels, transfers, and activities customized for you.',
        };
      case 'transfers':
        return {
          image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=85',
          badge: '✨ PREMIUM AIRPORT TRANSFERS',
          title: 'Reliable Airport Transfers & Private Chauffeur',
          subtitle:
            'Door-to-door luxury airport pickups, sanitized executive cabs, and guaranteed transparent pricing worldwide.',
        };
      case 'visas':
        return {
          image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&q=85',
          badge: '✨ FAST-TRACK TOURIST VISAS',
          title: 'Hassle-Free Tourist Visas & Entry Passes',
          subtitle:
            'Expert documentation verification, express processing, and 99.4% approval rate across top global destinations.',
        };
      case 'restaurants':
        return {
          image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=85',
          badge: '✨ FINE DINING & PURE VEG',
          title: 'Handpicked Pure Veg, Jain & Gourmet Dining',
          subtitle:
            'Verified Pure Veg, Jain friendly, and rooftop luxury dining tables booked with instant priority confirmation.',
        };
      case 'buildpackage':
        return {
          image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=85',
          badge: '✨ CUSTOM TRAVEL BUILDER',
          title: 'Build Your Personalized Dream Vacation',
          subtitle:
            'Choose your destinations, hotels, and custom sightseeing for an instant tailor-made itinerary and quote.',
        };
      default:
        return {
          image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85',
          badge: `✨ EXPLORE ${activeItem.label.toUpperCase()}`,
          title: `Discover The Best ${activeItem.label}`,
          subtitle: `Verified experiences, instant bookings, and 24/7 dedicated customer care.`,
        };
    }
  }, [activeModule, activeItem]);

  // Execute Search
  const handleExecuteSearch = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }

    switch (activeModule) {
      case 'flights':
        router.push({
          pathname: '/(tabs)/explore',
          params: {
            service: 'flights',
            from: fromAirport.code,
            to: toAirport.code,
            tripType,
            cabin: cabinClass,
            passengers: String(totalPassengers),
          },
        } as any);
        break;
      case 'hotels':
        router.push({
          pathname: '/search-results',
          params: {
            type: 'hotels',
            service: 'hotels',
            destination: hotelDestination.split(',')[0].trim(),
            q: hotelDestination.split(',')[0].trim(),
            checkIn: hotelCheckIn,
            checkOut: hotelCheckOut,
            guests: String(hotelGuests),
            rooms: String(hotelRooms),
          },
        } as any);
        break;
      case 'tours':
        router.push({
          pathname: '/search-results',
          params: {
            type: 'tours',
            service: 'tours',
            destination: tourDestination.split(',')[0].trim(),
            q: tourDestination.split(',')[0].trim(),
            travelers: String(tourTravelers),
          },
        } as any);
        break;
      case 'packages':
        router.push({
          pathname: '/search-results',
          params: {
            type: 'packages',
            service: 'packages',
            destination: packageDestination.split(',')[0].trim(),
            q: packageDestination.split(',')[0].trim(),
            duration: packageDuration,
          },
        } as any);
        break;
      case 'transfers':
        router.push({
          pathname: '/airport-transfer',
          params: {
            pickup: transferPickup,
            dropoff: transferDropoff,
          },
        } as any);
        break;
      case 'visas':
        router.push({
          pathname: '/visa-hub',
          params: {
            nationality: visaNationality,
            destination: visaCountry,
          },
        } as any);
        break;
      case 'restaurants':
        router.push({
          pathname: '/culinary-guide',
          params: {
            city: diningCity.split(',')[0].trim(),
            cuisine: diningCuisine,
          },
        } as any);
        break;
      case 'buildpackage':
        if (onOpenEnquiry) {
          onOpenEnquiry('Custom Package Builder');
        } else {
          router.push('/(tabs)/explore' as any);
        }
        break;
      default:
        router.push('/(tabs)/explore' as any);
        break;
    }
  };

  // Filtered airport options for modal
  const filteredAirports = useMemo(() => {
    if (!searchFilterText.trim()) return POPULAR_AIRPORTS;
    const q = searchFilterText.toLowerCase();
    return POPULAR_AIRPORTS.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q)
    );
  }, [searchFilterText]);

  // Filtered destinations for modal
  const filteredDestinations = useMemo(() => {
    if (!searchFilterText.trim()) return POPULAR_DESTINATIONS;
    const q = searchFilterText.toLowerCase();
    return POPULAR_DESTINATIONS.filter((d) => d.toLowerCase().includes(q));
  }, [searchFilterText]);

  return (
    <View style={styles.rootContainer}>
      {/* ─── 1. HERO BANNER WITH SCENIC DUBAI SKYLINE IMAGE ─── */}
      <View style={styles.heroBannerWrap}>
        <ExpoImage
          source={{ uri: moduleMeta.image }}
          style={styles.heroImage}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
        />
        {/* Dark Vignette Overlay for Crisp Readability */}
        <View style={styles.heroVignetteOverlay} />

        {/* Hero Header Content */}
        <View style={styles.heroTextContent}>
          {/* Badge Pill */}
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>{moduleMeta.badge}</Text>
          </View>

          {/* Main Title */}
          <Text style={styles.heroTitle} numberOfLines={2}>
            {moduleMeta.title}
          </Text>

          {/* Subtitle */}
          <Text style={styles.heroSubtitle} numberOfLines={3}>
            {moduleMeta.subtitle}
          </Text>
        </View>
      </View>

      {/* ─── 2. ELEVATED SEARCH CARD (OVERLAPPING HERO) ─── */}
      <View
        style={[
          styles.searchCard,
          {
            backgroundColor: isDark ? colors.surface : '#ffffff',
            borderColor: isDark ? colors.border : '#e2e8f0',
          },
          SHADOW.lg,
        ]}
      >
        {/* Module Selector Bar with Left & Right Circular Arrow Buttons */}
        <View style={styles.moduleBarContainer}>
          {/* Left Arrow Button */}
          <TouchableOpacity
            onPress={handlePrevModule}
            style={styles.arrowNavButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Previous service module"
          >
            <Ionicons name="chevron-back" size={18} color="#475569" />
          </TouchableOpacity>

          {/* Horizontal Modules List */}
          <ScrollView
            ref={moduleScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moduleTabsScroll}
            style={styles.moduleTabsContainer}
          >
            {enabledModules.map((item) => {
              const isSelected = item.id === activeModule;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setActiveModule(item.id);
                    if (Platform.OS !== 'web') {
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      } catch {}
                    }
                  }}
                  activeOpacity={0.75}
                  style={[
                    styles.moduleTabItem,
                    isSelected && {
                      backgroundColor: isDark ? 'rgba(32, 128, 197, 0.2)' : '#e0f2fe',
                      borderColor: '#2080c5',
                    },
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={isSelected ? '#2080c5' : (colors.mutedText || '#64748b')}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.moduleTabLabel,
                      {
                        color: isSelected ? '#2080c5' : colors.text,
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Right Arrow Button */}
          <TouchableOpacity
            onPress={handleNextModule}
            style={styles.arrowNavButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Next service module"
          >
            <Ionicons name="chevron-forward" size={18} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Subtle Horizontal Divider */}
        <View style={[styles.cardDivider, { backgroundColor: isDark ? colors.border : '#f1f5f9' }]} />

        {/* ─── 3. MODULE SPECIFIC SEARCH FORM ─── */}
        {activeModule === 'flights' && (
          <View style={styles.formContent}>
            {/* Trip Type Radios */}
            <View style={styles.radiosRow}>
              {(['oneWay', 'roundTrip', 'multiCity'] as TripType[]).map((type) => {
                const isSelected = tripType === type;
                const label =
                  type === 'oneWay' ? 'One-Way' : type === 'roundTrip' ? 'Round Trip' : 'Multi City';
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setTripType(type)}
                    style={styles.radioItem}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radioCircle, isSelected && { borderColor: '#2080c5' }]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <Text
                      style={[
                        styles.radioText,
                        { color: isSelected ? '#2080c5' : colors.text, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Cabin Class Dropdown & Direct Flights Checkbox */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                onPress={() => setCabinModalVisible(true)}
                style={[styles.dropdownPill, { borderColor: isDark ? colors.border : '#cbd5e1' }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownPillText, { color: colors.text }]}>{cabinClass}</Text>
                <Ionicons name="chevron-down" size={14} color="#64748b" style={{ marginLeft: 6 }} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDirectFlightsOnly(!directFlightsOnly)}
                style={styles.checkboxItem}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    directFlightsOnly && { backgroundColor: '#2080c5', borderColor: '#2080c5' },
                    !directFlightsOnly && { borderColor: isDark ? colors.border : '#cbd5e1' },
                  ]}
                >
                  {directFlightsOnly && <Ionicons name="checkmark" size={13} color="#ffffff" />}
                </View>
                <Text style={[styles.checkboxText, { color: colors.text }]}>Direct Flights Only</Text>
              </TouchableOpacity>
            </View>

            {/* From Airport Box */}
            <TouchableOpacity
              onPress={() => {
                setSearchFilterText('');
                setAirportModalMode('from');
              }}
              style={[styles.formInputBox, { borderColor: isDark ? colors.border : '#e2e8f0' }]}
              activeOpacity={0.75}
            >
              <View style={styles.inputInnerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>WHERE FROM?</Text>
                  <Text style={[styles.inputValuePrimary, { color: colors.heading }]} numberOfLines={1}>
                    {fromAirport.code} - {fromAirport.name}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </View>
            </TouchableOpacity>

            {/* Centered Swap Button */}
            <View style={styles.swapButtonRow}>
              <TouchableOpacity
                onPress={handleSwapAirports}
                style={[
                  styles.swapButton,
                  { backgroundColor: isDark ? colors.surface : '#ffffff', borderColor: '#cbd5e1' },
                  SHADOW.sm,
                ]}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Swap departure and arrival airport"
              >
                <Ionicons name="swap-vertical" size={18} color="#2080c5" />
              </TouchableOpacity>
            </View>

            {/* To Airport Box */}
            <TouchableOpacity
              onPress={() => {
                setSearchFilterText('');
                setAirportModalMode('to');
              }}
              style={[styles.formInputBox, { borderColor: isDark ? colors.border : '#e2e8f0', marginTop: -14 }]}
              activeOpacity={0.75}
            >
              <View style={styles.inputInnerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>WHERE TO?</Text>
                  <Text style={[styles.inputValuePrimary, { color: colors.heading }]} numberOfLines={1}>
                    {toAirport.code} - {toAirport.name}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </View>
            </TouchableOpacity>

            {/* Dates & Passengers Row */}
            <View style={styles.inputGridRow}>
              {/* Departure Date */}
              <TouchableOpacity
                onPress={() => {}}
                style={[styles.formInputHalf, { borderColor: isDark ? colors.border : '#e2e8f0' }]}
                activeOpacity={0.75}
              >
                <Text style={styles.inputLabel}>DEPARTURE DATE</Text>
                <View style={styles.inputIconTextRow}>
                  <Ionicons name="calendar-outline" size={16} color="#2080c5" style={{ marginRight: 6 }} />
                  <Text style={[styles.inputValueSmall, { color: colors.heading }]}>{travelDate}</Text>
                </View>
              </TouchableOpacity>

              {/* Passengers / Return Date */}
              <TouchableOpacity
                onPress={() => setPassengerModalVisible(true)}
                style={[styles.formInputHalf, { borderColor: isDark ? colors.border : '#e2e8f0' }]}
                activeOpacity={0.75}
              >
                <Text style={styles.inputLabel}>PASSENGERS</Text>
                <View style={styles.inputIconTextRow}>
                  <Ionicons name="people-outline" size={16} color="#2080c5" style={{ marginRight: 6 }} />
                  <Text style={[styles.inputValueSmall, { color: colors.heading }]} numberOfLines={1}>
                    {totalPassengers} Traveler{totalPassengers > 1 ? 's' : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Solid Blue Search Flights CTA Button */}
            <TouchableOpacity
              onPress={handleExecuteSearch}
              style={[styles.ctaButton, { backgroundColor: '#2080c5' }, SHADOW.md]}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Search Flights"
            >
              <Ionicons name="airplane" size={19} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.ctaButtonText}>Search Flights</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── HOTELS FORM ─── */}
        {activeModule === 'hotels' && (
          <View style={styles.formContent}>
            <TouchableOpacity
              onPress={() => {
                setSearchFilterText('');
                setDestinationModalVisible(true);
              }}
              style={[styles.formInputBox, { borderColor: isDark ? colors.border : '#e2e8f0' }]}
              activeOpacity={0.75}
            >
              <Text style={styles.inputLabel}>DESTINATION / HOTEL NAME</Text>
              <View style={styles.inputInnerRow}>
                <Ionicons name="location-outline" size={18} color="#2080c5" style={{ marginRight: 8 }} />
                <Text style={[styles.inputValuePrimary, { color: colors.heading, flex: 1 }]} numberOfLines={1}>
                  {hotelDestination}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748b" />
              </View>
            </TouchableOpacity>

            <View style={styles.inputGridRow}>
              <View style={[styles.formInputHalf, { borderColor: isDark ? colors.border : '#e2e8f0' }]}>
                <Text style={styles.inputLabel}>CHECK-IN</Text>
                <View style={styles.inputIconTextRow}>
                  <Ionicons name="calendar-outline" size={16} color="#2080c5" style={{ marginRight: 6 }} />
                  <Text style={[styles.inputValueSmall, { color: colors.heading }]}>{hotelCheckIn}</Text>
                </View>
              </View>
              <View style={[styles.formInputHalf, { borderColor: isDark ? colors.border : '#e2e8f0' }]}>
                <Text style={styles.inputLabel}>CHECK-OUT</Text>
                <View style={styles.inputIconTextRow}>
                  <Ionicons name="calendar-outline" size={16} color="#2080c5" style={{ marginRight: 6 }} />
                  <Text style={[styles.inputValueSmall, { color: colors.heading }]}>{hotelCheckOut}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.formInputBox, { borderColor: isDark ? colors.border : '#e2e8f0', marginTop: 12 }]}>
              <Text style={styles.inputLabel}>ROOMS & GUESTS</Text>
              <View style={styles.inputInnerRow}>
                <Ionicons name="bed-outline" size={18} color="#2080c5" style={{ marginRight: 8 }} />
                <Text style={[styles.inputValuePrimary, { color: colors.heading, flex: 1 }]}>
                  {hotelRooms} Room, {hotelGuests} Guests (Pure Veg options)
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleExecuteSearch}
              style={[styles.ctaButton, { backgroundColor: '#2080c5' }, SHADOW.md]}
              activeOpacity={0.85}
            >
              <Ionicons name="bed" size={19} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.ctaButtonText}>Search Hotels</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── TOURS FORM ─── */}
        {activeModule === 'tours' && (
          <View style={styles.formContent}>
            <TouchableOpacity
              onPress={() => {
                setSearchFilterText('');
                setDestinationModalVisible(true);
              }}
              style={[styles.formInputBox, { borderColor: isDark ? colors.border : '#e2e8f0' }]}
              activeOpacity={0.75}
            >
              <Text style={styles.inputLabel}>DESTINATION OR SIGHTSEEING</Text>
              <View style={styles.inputInnerRow}>
                <Ionicons name="compass-outline" size={18} color="#2080c5" style={{ marginRight: 8 }} />
                <Text style={[styles.inputValuePrimary, { color: colors.heading, flex: 1 }]} numberOfLines={1}>
                  {tourDestination}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748b" />
              </View>
            </TouchableOpacity>

            <View style={styles.inputGridRow}>
              <View style={[styles.formInputHalf, { borderColor: isDark ? colors.border : '#e2e8f0' }]}>
                <Text style={styles.inputLabel}>TOUR DATE</Text>
                <View style={styles.inputIconTextRow}>
                  <Ionicons name="calendar-outline" size={16} color="#2080c5" style={{ marginRight: 6 }} />
                  <Text style={[styles.inputValueSmall, { color: colors.heading }]}>{tourDate}</Text>
                </View>
              </View>
              <View style={[styles.formInputHalf, { borderColor: isDark ? colors.border : '#e2e8f0' }]}>
                <Text style={styles.inputLabel}>TRAVELERS</Text>
                <View style={styles.inputIconTextRow}>
                  <Ionicons name="people-outline" size={16} color="#2080c5" style={{ marginRight: 6 }} />
                  <Text style={[styles.inputValueSmall, { color: colors.heading }]}>{tourTravelers} Travelers</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleExecuteSearch}
              style={[styles.ctaButton, { backgroundColor: '#2080c5' }, SHADOW.md]}
              activeOpacity={0.85}
            >
              <Ionicons name="compass" size={19} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.ctaButtonText}>Search Handcrafted Tours</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── PACKAGES FORM ─── */}
        {activeModule === 'packages' && (
          <View style={styles.formContent}>
            <TouchableOpacity
              onPress={() => {
                setSearchFilterText('');
                setDestinationModalVisible(true);
              }}
              style={[styles.formInputBox, { borderColor: isDark ? colors.border : '#e2e8f0' }]}
              activeOpacity={0.75}
            >
              <Text style={styles.inputLabel}>WHERE WOULD YOU LIKE TO GO?</Text>
              <View style={styles.inputInnerRow}>
                <Ionicons name="briefcase-outline" size={18} color="#2080c5" style={{ marginRight: 8 }} />
                <Text style={[styles.inputValuePrimary, { color: colors.heading, flex: 1 }]} numberOfLines={1}>
                  {packageDestination}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748b" />
              </View>
            </TouchableOpacity>

            <View style={styles.inputGridRow}>
              <View style={[styles.formInputHalf, { borderColor: isDark ? colors.border : '#e2e8f0' }]}>
                <Text style={styles.inputLabel}>DURATION</Text>
                <View style={styles.inputIconTextRow}>
                  <Ionicons name="time-outline" size={16} color="#2080c5" style={{ marginRight: 6 }} />
                  <Text style={[styles.inputValueSmall, { color: colors.heading }]}>{packageDuration}</Text>
                </View>
              </View>
              <View style={[styles.formInputHalf, { borderColor: isDark ? colors.border : '#e2e8f0' }]}>
                <Text style={styles.inputLabel}>MEAL PREFERENCE</Text>
                <View style={styles.inputIconTextRow}>
                  <Ionicons name="restaurant-outline" size={16} color="#2080c5" style={{ marginRight: 6 }} />
                  <Text style={[styles.inputValueSmall, { color: colors.heading }]}>Pure Veg / Jain</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleExecuteSearch}
              style={[styles.ctaButton, { backgroundColor: '#2080c5' }, SHADOW.md]}
              activeOpacity={0.85}
            >
              <Ionicons name="briefcase" size={19} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.ctaButtonText}>Search Holiday Packages</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── TRANSFERS FORM ─── */}
        {activeModule === 'transfers' && (
          <View style={styles.formContent}>
            <View style={[styles.formInputBox, { borderColor: isDark ? colors.border : '#e2e8f0' }]}>
              <Text style={styles.inputLabel}>PICK-UP AIRPORT OR HOTEL</Text>
              <View style={styles.inputInnerRow}>
                <Ionicons name="car-outline" size={18} color="#2080c5" style={{ marginRight: 8 }} />
                <Text style={[styles.inputValuePrimary, { color: colors.heading, flex: 1 }]} numberOfLines={1}>
                  {transferPickup}
                </Text>
              </View>
            </View>

            <View style={[styles.formInputBox, { borderColor: isDark ? colors.border : '#e2e8f0', marginTop: 10 }]}>
              <Text style={styles.inputLabel}>DROP-OFF DESTINATION</Text>
              <View style={styles.inputInnerRow}>
                <Ionicons name="navigate-outline" size={18} color="#2080c5" style={{ marginRight: 8 }} />
                <Text style={[styles.inputValuePrimary, { color: colors.heading, flex: 1 }]} numberOfLines={1}>
                  {transferDropoff}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleExecuteSearch}
              style={[styles.ctaButton, { backgroundColor: '#2080c5' }, SHADOW.md]}
              activeOpacity={0.85}
            >
              <Ionicons name="car" size={19} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.ctaButtonText}>Search Airport Transfers</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── VISAS FORM ─── */}
        {activeModule === 'visas' && (
          <View style={styles.formContent}>
            <View style={[styles.formInputBox, { borderColor: isDark ? colors.border : '#e2e8f0' }]}>
              <Text style={styles.inputLabel}>CITIZEN OF</Text>
              <View style={styles.inputInnerRow}>
                <Ionicons name="globe-outline" size={18} color="#2080c5" style={{ marginRight: 8 }} />
                <Text style={[styles.inputValuePrimary, { color: colors.heading, flex: 1 }]}>
                  {visaNationality}
                </Text>
              </View>
            </View>

            <View style={[styles.formInputBox, { borderColor: isDark ? colors.border : '#e2e8f0', marginTop: 10 }]}>
              <Text style={styles.inputLabel}>DESTINATION COUNTRY</Text>
              <View style={styles.inputInnerRow}>
                <Ionicons name="card-outline" size={18} color="#2080c5" style={{ marginRight: 8 }} />
                <Text style={[styles.inputValuePrimary, { color: colors.heading, flex: 1 }]}>
                  {visaCountry}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleExecuteSearch}
              style={[styles.ctaButton, { backgroundColor: '#2080c5' }, SHADOW.md]}
              activeOpacity={0.85}
            >
              <Ionicons name="card" size={19} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.ctaButtonText}>Check Visa Requirements</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── RESTAURANTS FORM ─── */}
        {activeModule === 'restaurants' && (
          <View style={styles.formContent}>
            <View style={[styles.formInputBox, { borderColor: isDark ? colors.border : '#e2e8f0' }]}>
              <Text style={styles.inputLabel}>CITY OR CUISINE</Text>
              <View style={styles.inputInnerRow}>
                <Ionicons name="restaurant-outline" size={18} color="#2080c5" style={{ marginRight: 8 }} />
                <Text style={[styles.inputValuePrimary, { color: colors.heading, flex: 1 }]}>
                  {diningCity} – {diningCuisine}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleExecuteSearch}
              style={[styles.ctaButton, { backgroundColor: '#2080c5' }, SHADOW.md]}
              activeOpacity={0.85}
            >
              <Ionicons name="restaurant" size={19} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.ctaButtonText}>Find Dining Tables</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── BUILD PACKAGE FORM ─── */}
        {activeModule === 'buildpackage' && (
          <View style={styles.formContent}>
            <View style={[styles.formInputBox, { borderColor: isDark ? colors.border : '#e2e8f0' }]}>
              <Text style={styles.inputLabel}>CUSTOM TOUR ITINERARY BUILDER</Text>
              <Text style={[styles.inputValuePrimary, { color: colors.heading, marginTop: 4 }]}>
                Design your multi-city package with custom flights, stays, and activities.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleExecuteSearch}
              style={[styles.ctaButton, { backgroundColor: '#2080c5' }, SHADOW.md]}
              activeOpacity={0.85}
            >
              <Ionicons name="construct" size={19} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.ctaButtonText}>Start Custom Package Builder</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ─── MODAL: AIRPORT SELECTOR ─── */}
      <Modal
        visible={airportModalMode !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAirportModalMode(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.heading }]}>
                {airportModalMode === 'from' ? 'Select Departure Airport' : 'Select Arrival Airport'}
              </Text>
              <TouchableOpacity onPress={() => setAirportModalMode(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={searchFilterText}
              onChangeText={setSearchFilterText}
              placeholder="Search airport code, city or name..."
              placeholderTextColor="#94a3b8"
              style={[
                styles.modalSearchInput,
                { color: colors.text, borderColor: isDark ? colors.border : '#e2e8f0' },
              ]}
            />

            <FlatList
              data={filteredAirports}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    if (airportModalMode === 'from') setFromAirport(item);
                    if (airportModalMode === 'to') setToAirport(item);
                    setAirportModalMode(null);
                  }}
                  style={[styles.modalListItem, { borderBottomColor: isDark ? colors.border : '#f1f5f9' }]}
                >
                  <View style={styles.airportCodeBadge}>
                    <Text style={styles.airportCodeText}>{item.code}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.airportNameText, { color: colors.heading }]}>{item.city}</Text>
                    <Text style={styles.airportSubText}>
                      {item.name}, {item.country}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: DESTINATIONS ─── */}
      <Modal
        visible={destinationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDestinationModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.heading }]}>Choose Destination</Text>
              <TouchableOpacity onPress={() => setDestinationModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={searchFilterText}
              onChangeText={setSearchFilterText}
              placeholder="Search destination, city, country..."
              placeholderTextColor="#94a3b8"
              style={[
                styles.modalSearchInput,
                { color: colors.text, borderColor: isDark ? colors.border : '#e2e8f0' },
              ]}
            />

            <FlatList
              data={filteredDestinations}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    if (activeModule === 'hotels') setHotelDestination(item);
                    if (activeModule === 'tours') setTourDestination(item);
                    if (activeModule === 'packages') setPackageDestination(item);
                    setDestinationModalVisible(false);
                  }}
                  style={[styles.modalListItem, { borderBottomColor: isDark ? colors.border : '#f1f5f9' }]}
                >
                  <Ionicons name="location" size={20} color="#2080c5" />
                  <Text style={[styles.airportNameText, { color: colors.heading, marginLeft: 12 }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: CABIN CLASS ─── */}
      <Modal
        visible={cabinModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCabinModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCabinModalVisible(false)}
        >
          <View style={[styles.modalDialog, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}>
            <Text style={[styles.modalTitle, { color: colors.heading, marginBottom: 12 }]}>
              Select Cabin Class
            </Text>
            {CABIN_CLASSES.map((cls) => (
              <TouchableOpacity
                key={cls}
                onPress={() => {
                  setCabinClass(cls);
                  setCabinModalVisible(false);
                }}
                style={[
                  styles.cabinOptionRow,
                  cabinClass === cls && { backgroundColor: isDark ? 'rgba(32,128,197,0.2)' : '#e0f2fe' },
                ]}
              >
                <Text
                  style={[
                    styles.cabinOptionText,
                    { color: cabinClass === cls ? '#2080c5' : colors.text, fontWeight: cabinClass === cls ? '700' : '500' },
                  ]}
                >
                  {cls}
                </Text>
                {cabinClass === cls && <Ionicons name="checkmark-circle" size={20} color="#2080c5" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── MODAL: PASSENGERS ─── */}
      <Modal
        visible={passengerModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPassengerModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPassengerModalVisible(false)}
        >
          <View style={[styles.modalDialog, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}>
            <Text style={[styles.modalTitle, { color: colors.heading, marginBottom: 16 }]}>Travelers</Text>

            {/* Adults */}
            <View style={styles.stepperRow}>
              <View>
                <Text style={[styles.stepperLabel, { color: colors.heading }]}>Adults</Text>
                <Text style={styles.stepperSubLabel}>Age 12+ years</Text>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  onPress={() => setAdults(Math.max(1, adults - 1))}
                  style={styles.stepperBtn}
                >
                  <Ionicons name="remove" size={16} color="#0f172a" />
                </TouchableOpacity>
                <Text style={[styles.stepperValue, { color: colors.heading }]}>{adults}</Text>
                <TouchableOpacity onPress={() => setAdults(adults + 1)} style={styles.stepperBtn}>
                  <Ionicons name="add" size={16} color="#0f172a" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Children */}
            <View style={styles.stepperRow}>
              <View>
                <Text style={[styles.stepperLabel, { color: colors.heading }]}>Children</Text>
                <Text style={styles.stepperSubLabel}>Age 2 - 11 years</Text>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  onPress={() => setChildren(Math.max(0, children - 1))}
                  style={styles.stepperBtn}
                >
                  <Ionicons name="remove" size={16} color="#0f172a" />
                </TouchableOpacity>
                <Text style={[styles.stepperValue, { color: colors.heading }]}>{children}</Text>
                <TouchableOpacity onPress={() => setChildren(children + 1)} style={styles.stepperBtn}>
                  <Ionicons name="add" size={16} color="#0f172a" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setPassengerModalVisible(false)}
              style={[styles.modalDoneBtn, { backgroundColor: '#2080c5' }]}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    width: '100%',
    marginBottom: 8,
  },

  // 1. Hero Banner
  heroBannerWrap: {
    width: '100%',
    height: 310,
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroVignetteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
  },
  heroTextContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 36,
    paddingHorizontal: 20,
  },
  badgePill: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 12,
  },
  badgePillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    maxWidth: 340,
  },

  // 2. Search Card
  searchCard: {
    borderRadius: 24,
    borderWidth: 1,
    marginHorizontal: 14,
    marginTop: -48,
    padding: 16,
    position: 'relative',
    zIndex: 10,
  },
  moduleBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  arrowNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTabsContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  moduleTabsScroll: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  moduleTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  moduleTabLabel: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
  cardDivider: {
    height: 1,
    width: '100%',
    marginBottom: 16,
  },

  // 3. Search Form Elements
  formContent: {
    width: '100%',
  },
  radiosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginBottom: 14,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#2080c5',
  },
  radioText: {
    fontSize: 13,
  },

  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  dropdownPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxText: {
    fontSize: 12,
    fontWeight: '500',
  },

  formInputBox: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  inputValuePrimary: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  inputGridRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  formInputHalf: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputIconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  inputValueSmall: {
    fontSize: 13,
    fontWeight: '700',
  },

  swapButtonRow: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  swapButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ctaButton: {
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSearchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 14,
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  airportCodeBadge: {
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 46,
    alignItems: 'center',
  },
  airportCodeText: {
    color: '#2080c5',
    fontWeight: '800',
    fontSize: 13,
  },
  airportNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  airportSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },

  modalDialog: {
    marginHorizontal: 24,
    marginVertical: 'auto',
    borderRadius: 20,
    padding: 20,
    ...SHADOW.lg,
  },
  cabinOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  cabinOptionText: {
    fontSize: 14,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepperSubLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  modalDoneBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  modalDoneBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
