/**
 * components/home/GujjuFlightHeroSearch.tsx
 *
 * Pixel-accurate implementation of the GujjuTours Mobile Flight Search screen.
 * Replicates the exact visual structure from the reference design:
 *   1. Airplane Wing Hero Banner with Title & Subtitle overlay
 *   2. Horizontal Service Vertical Icons (Hotels, Tour, Package, Flight, More)
 *   3. Sub-Options: One-Way, Round Trip, Multi City radios + Economy & Direct Flights
 *   4. Form Card: From (Surat Airport STV) + Centered Swap Button + Flying To +
 *      Travel Date + Passengers + Airlines Dropdown + Solid Blue Search Button
 *   5. Promotional Cards Carousel (Domestic Flights, International Flights)
 *   6. Dynamic switching to Hotels, Tours, and Packages
 *   7. Interactive Pickers for Airports, Dates, Passengers, Cabin Class & Airlines
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';

export type ServiceVertical = 'hotels' | 'tour' | 'package' | 'flight' | 'more';
export type TripType = 'oneWay' | 'roundTrip' | 'multiCity';
export type CabinClass = 'Economy' | 'Premium Economy' | 'Business' | 'First Class';

export interface GujjuFlightHeroSearchProps {
  onOpenMore?: () => void;
  onOpenEnquiry?: (service: string) => void;
}

interface AirportItem {
  code: string;
  name: string;
  city: string;
  country: string;
}

const POPULAR_AIRPORTS: AirportItem[] = [
  { code: 'STV', name: 'Surat Gujarat Airport', city: 'Surat', country: 'India' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj Intl', city: 'Mumbai', country: 'India' },
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi', country: 'India' },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel Intl', city: 'Ahmedabad', country: 'India' },
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE' },
  { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India' },
  { code: 'GOI', name: 'Dabolim Goa International Airport', city: 'Goa', country: 'India' },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand' },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
  { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom' },
];

const AIRLINE_OPTIONS = [
  'All Airlines',
  'IndiGo',
  'Air India',
  'Emirates',
  'SpiceJet',
  'Akasa Air',
  'Vistara',
  'Etihad Airways',
  'Flydubai',
  'Air Arabia',
];

const CABIN_CLASSES: CabinClass[] = [
  'Economy',
  'Premium Economy',
  'Business',
  'First Class',
];

export function GujjuFlightHeroSearch({
  onOpenMore,
  onOpenEnquiry,
}: GujjuFlightHeroSearchProps) {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDark();
  const { siteId } = useSite();
  const config = useSiteConfig();

  // Active Vertical state: default to 'flight' as in user's screenshot
  const [activeVertical, setActiveVertical] = useState<ServiceVertical>('flight');

  // Flight states
  const [tripType, setTripType] = useState<TripType>('oneWay');
  const [cabinClass, setCabinClass] = useState<CabinClass>('Economy');
  const [directFlightsOnly, setDirectFlightsOnly] = useState(false);
  const [selectedAirline, setSelectedAirline] = useState('Airlines');

  // Locations
  const [fromAirport, setFromAirport] = useState<AirportItem>(POPULAR_AIRPORTS[0]); // Surat STV
  const [toAirport, setToAirport] = useState<AirportItem | null>(null); // Flying to

  // Date & Passengers
  const [travelDate, setTravelDate] = useState('Oct 29');
  const [returnDate, setReturnDate] = useState('Nov 05');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  // Modals
  const [airportPickerMode, setAirportPickerMode] = useState<'from' | 'to' | null>(null);
  const [cabinModalVisible, setCabinModalVisible] = useState(false);
  const [passengerModalVisible, setPassengerModalVisible] = useState(false);
  const [airlineModalVisible, setAirlineModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  const totalPassengers = adults + children + infants;
  const passengerLabel = `${totalPassengers} Passenger${totalPassengers > 1 ? 's' : ''}`;

  // Swap From & To handler
  const handleSwapAirports = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignore
    }
    if (!toAirport) {
      setToAirport(fromAirport);
      setFromAirport(POPULAR_AIRPORTS[4]); // DXB Dubai
      return;
    }
    const temp = fromAirport;
    setFromAirport(toAirport);
    setToAirport(temp);
  };

  // Switch vertical tab
  const handleTabPress = (vertical: ServiceVertical) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    if (vertical === 'more') {
      if (onOpenMore) {
        onOpenMore();
      }
      return;
    }
    setActiveVertical(vertical);
  };

  // Perform search
  const handleSearch = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignore
    }

    if (activeVertical === 'flight') {
      const destinationText = toAirport ? `${toAirport.code} (${toAirport.city})` : 'Popular Destinations';
      setSearchFeedback(`Searching flights from ${fromAirport.code} to ${destinationText}...`);
      setTimeout(() => {
        setSearchFeedback(null);
        router.push({
          pathname: '/(tabs)/explore',
          params: {
            service: 'flights',
            from: fromAirport.code,
            to: toAirport?.code || 'ANY',
            date: travelDate,
            passengers: String(totalPassengers),
            cabin: cabinClass,
          },
        } as any);
      }, 900);
    } else if (activeVertical === 'hotels') {
      router.push({
        pathname: '/(tabs)/explore',
        params: { service: 'hotels', destination: toAirport?.city || 'Dubai' },
      } as any);
    } else if (activeVertical === 'tour') {
      router.push({
        pathname: '/(tabs)/explore',
        params: { service: 'tours', q: toAirport?.city || '' },
      } as any);
    } else if (activeVertical === 'package') {
      if (onOpenEnquiry) {
        onOpenEnquiry('Holiday Packages');
      } else {
        router.push({
          pathname: '/(tabs)/explore',
          params: { service: 'packages' },
        } as any);
      }
    }
  };

  // Dynamic hero headlines
  const heroContent = {
    flight: {
      title: 'Book Cheap Flights Online',
      subtitle: 'Find, compare, and book the best flight at unbeatable prices.',
    },
    hotels: {
      title: 'Book Hotels & Resorts Online',
      subtitle: 'Luxury villas, budget stays, and boutique hotels worldwide.',
    },
    tour: {
      title: 'Book Handcrafted Tours Online',
      subtitle: 'Guided sightseeing, desert safaris, and authentic cultural trails.',
    },
    package: {
      title: 'All-Inclusive Holiday Packages',
      subtitle: 'Flights, hotels, transfers, and activities customized for you.',
    },
    more: {
      title: 'Explore All Travel Services',
      subtitle: 'Visas, insurance, transfers, forex, and concierge assistance.',
    },
  }[activeVertical];

  return (
    <View style={styles.container}>
      {/* ─── 1. HERO BANNER IMAGE WITH SUNNY SKY OVERLAY ─── */}
      <View style={styles.heroCardContainer}>
        <ExpoImage
          source={{ uri: (config as any)?.hero?.flightImage || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&h=600&fit=crop' }}
          style={styles.heroImage}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
        />
        {/* Soft vignette overlay to ensure pristine contrast */}
        <View style={styles.heroGradientOverlay} />

        {/* Text Overlay */}
        <View style={styles.heroTextContainer}>
          <Text style={styles.heroTitle} numberOfLines={2}>
            {heroContent.title}
          </Text>
          <Text style={styles.heroSubtitle} numberOfLines={2}>
            {heroContent.subtitle}
          </Text>
        </View>
      </View>

      {/* ─── 2. SERVICE VERTICAL ICONS ROW (TABS) ─── */}
      <View
        style={[
          styles.servicesRowCard,
          {
            backgroundColor: isDark ? colors.surface : '#ffffff',
            borderColor: colors.border,
          },
        ]}
      >
        {/* Hotels Tab */}
        <TouchableOpacity testID="btn-business-outline" accessibilityLabel="business outline"
          style={[
            styles.serviceTabItem,
            activeVertical === 'hotels' && styles.serviceTabActive,
          ]}
          onPress={() => handleTabPress('hotels')}
          activeOpacity={0.75}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeVertical === 'hotels' }}
        >
          <Ionicons
            name="business-outline"
            size={22}
            color={activeVertical === 'hotels' ? '#1d75b8' : '#64748b'}
          />
          <Text
            style={[
              styles.serviceTabLabel,
              activeVertical === 'hotels' && styles.serviceTabLabelActive,
            ]}
          >
            Hotels
          </Text>
        </TouchableOpacity>

        {/* Tour Tab */}
        <TouchableOpacity testID="btn-navigate-circle-outline" accessibilityLabel="navigate circle outline"
          style={[
            styles.serviceTabItem,
            activeVertical === 'tour' && styles.serviceTabActive,
          ]}
          onPress={() => handleTabPress('tour')}
          activeOpacity={0.75}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeVertical === 'tour' }}
        >
          <Ionicons
            name="navigate-circle-outline"
            size={22}
            color={activeVertical === 'tour' ? '#1d75b8' : '#64748b'}
          />
          <Text
            style={[
              styles.serviceTabLabel,
              activeVertical === 'tour' && styles.serviceTabLabelActive,
            ]}
          >
            Tour
          </Text>
        </TouchableOpacity>

        {/* Package Tab */}
        <TouchableOpacity testID="btn-umbrella-outline" accessibilityLabel="umbrella outline"
          style={[
            styles.serviceTabItem,
            activeVertical === 'package' && styles.serviceTabActive,
          ]}
          onPress={() => handleTabPress('package')}
          activeOpacity={0.75}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeVertical === 'package' }}
        >
          <Ionicons
            name="umbrella-outline"
            size={22}
            color={activeVertical === 'package' ? '#1d75b8' : '#64748b'}
          />
          <Text
            style={[
              styles.serviceTabLabel,
              activeVertical === 'package' && styles.serviceTabLabelActive,
            ]}
          >
            Package
          </Text>
        </TouchableOpacity>

        {/* Flight Tab (Active by default in screenshot) */}
        <TouchableOpacity testID="btn-airplane" accessibilityLabel="airplane"
          style={[
            styles.serviceTabItem,
            activeVertical === 'flight' && styles.serviceTabActive,
          ]}
          onPress={() => handleTabPress('flight')}
          activeOpacity={0.75}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeVertical === 'flight' }}
        >
          <Ionicons
            name="airplane"
            size={22}
            color={activeVertical === 'flight' ? '#1d75b8' : '#64748b'}
          />
          <Text
            style={[
              styles.serviceTabLabel,
              activeVertical === 'flight' && styles.serviceTabLabelActive,
            ]}
          >
            Flight
          </Text>
        </TouchableOpacity>

        {/* More Tab */}
        <TouchableOpacity testID="btn-apps-outline" accessibilityLabel="apps outline"
          style={styles.serviceTabItem}
          onPress={() => handleTabPress('more')}
          activeOpacity={0.75}
          accessibilityRole="tab"
        >
          <View style={styles.moreIconRow}>
            <Ionicons name="apps-outline" size={20} color="#64748b" />
            <View style={styles.moreMiniCircle}>
              <Ionicons name="chevron-forward" size={10} color="#64748b" />
            </View>
          </View>
          <Text style={styles.serviceTabLabel}>More</Text>
        </TouchableOpacity>
      </View>

      {/* ─── 3. SUB-OPTIONS: TRIP TYPE RADIOS + FILTERS ─── */}
      {activeVertical === 'flight' && (
        <View style={styles.subOptionsContainer}>
          {/* Trip Type Radios */}
          <View style={styles.radiosRow}>
            {/* One-Way */}
            <TouchableOpacity testID="btn-gujjuflightherosearch-390" accessibilityLabel="gujjuflightherosearch action"
              style={styles.radioOption}
              onPress={() => setTripType('oneWay')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.radioOuter,
                  tripType === 'oneWay' && { borderColor: '#1d75b8' },
                ]}
              >
                {tripType === 'oneWay' && <View style={styles.radioInner} />}
              </View>
              <Text
                style={[
                  styles.radioLabel,
                  tripType === 'oneWay' && styles.radioLabelActive,
                ]}
              >
                One-Way
              </Text>
            </TouchableOpacity>

            {/* Round Trip */}
            <TouchableOpacity testID="btn-gujjuflightherosearch-414" accessibilityLabel="gujjuflightherosearch action"
              style={styles.radioOption}
              onPress={() => setTripType('roundTrip')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.radioOuter,
                  tripType === 'roundTrip' && { borderColor: '#1d75b8' },
                ]}
              >
                {tripType === 'roundTrip' && <View style={styles.radioInner} />}
              </View>
              <Text
                style={[
                  styles.radioLabel,
                  tripType === 'roundTrip' && styles.radioLabelActive,
                ]}
              >
                Round Trip
              </Text>
            </TouchableOpacity>

            {/* Multi City */}
            <TouchableOpacity testID="btn-gujjuflightherosearch-438" accessibilityLabel="gujjuflightherosearch action"
              style={styles.radioOption}
              onPress={() => setTripType('multiCity')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.radioOuter,
                  tripType === 'multiCity' && { borderColor: '#1d75b8' },
                ]}
              >
                {tripType === 'multiCity' && <View style={styles.radioInner} />}
              </View>
              <Text
                style={[
                  styles.radioLabel,
                  tripType === 'multiCity' && styles.radioLabelActive,
                ]}
              >
                Multi City
              </Text>
            </TouchableOpacity>
          </View>

          {/* Economy Dropdown & Direct Flights Checkbox */}
          <View style={styles.filterPillsRow}>
            {/* Economy Dropdown Pill */}
            <TouchableOpacity testID="btn-navigate" accessibilityLabel="Navigate"
              style={[
                styles.economyPill,
                {
                  borderColor: colors.border,
                  backgroundColor: isDark ? colors.surface : '#ffffff',
                },
              ]}
              onPress={() => setCabinModalVisible(true)}
              activeOpacity={0.75}
            >
              <Text style={[styles.economyPillText, { color: colors.heading }]}>
                {cabinClass}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#64748b" style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            {/* Direct Flights Only Checkbox */}
            <TouchableOpacity testID="btn-gujjuflightherosearch-483" accessibilityLabel="gujjuflightherosearch action"
              style={styles.checkboxRow}
              onPress={() => setDirectFlightsOnly((prev) => !prev)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkboxSquare,
                  {
                    borderColor: directFlightsOnly ? '#1d75b8' : '#cbd5e1',
                    backgroundColor: directFlightsOnly ? '#1d75b8' : 'transparent',
                  },
                ]}
              >
                {directFlightsOnly && <Ionicons name="checkmark" size={12} color="#ffffff" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.heading }]}>
                Direct Flights Only
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ─── 4. SEARCH FORM CARD ─── */}
      <View
        style={[
          styles.formCard,
          {
            backgroundColor: isDark ? colors.surface : '#ffffff',
            borderColor: colors.border,
          },
        ]}
      >
        {/* Input 1: From */}
        <TouchableOpacity testID="btn-location-outline" accessibilityLabel="location outline"
          style={[
            styles.inputBox,
            {
              borderColor: colors.border,
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
            },
          ]}
          onPress={() => setAirportPickerMode('from')}
          activeOpacity={0.8}
        >
          <View style={styles.inputIconCircle}>
            <Ionicons name="location-outline" size={20} color="#94a3b8" />
          </View>
          <View style={styles.inputTextCol}>
            <Text style={[styles.inputPrimaryText, { color: colors.heading }]} numberOfLines={1}>
              {fromAirport.code},{fromAirport.name},{fromAirport.city} {fromAirport.country}
            </Text>
            <Text style={styles.inputSubText}>Where do you want to fly from?</Text>
          </View>
        </TouchableOpacity>

        {/* Centered Swap Button (positioned exactly between From & To) */}
        <View style={styles.swapButtonWrap}>
          <TouchableOpacity testID="btn-swap-vertical"
            style={[
              styles.swapButton,
              {
                backgroundColor: isDark ? colors.surface : '#ffffff',
                borderColor: colors.border,
              },
            ]}
            onPress={handleSwapAirports}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Swap departure and destination"
          >
            <Ionicons name="swap-vertical" size={18} color="#334155" />
          </TouchableOpacity>
        </View>

        {/* Input 2: To */}
        <TouchableOpacity testID="btn-location-outline" accessibilityLabel="location outline"
          style={[
            styles.inputBox,
            {
              borderColor: colors.border,
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
            },
          ]}
          onPress={() => setAirportPickerMode('to')}
          activeOpacity={0.8}
        >
          <View style={styles.inputIconCircle}>
            <Ionicons name="location-outline" size={20} color="#94a3b8" />
          </View>
          <View style={styles.inputTextCol}>
            <Text
              style={[
                styles.inputPrimaryText,
                { color: toAirport ? colors.heading : '#0f172a' },
              ]}
              numberOfLines={1}
            >
              {toAirport
                ? `${toAirport.code},${toAirport.name},${toAirport.city} ${toAirport.country}`
                : 'Flying to'}
            </Text>
            <Text style={styles.inputSubText}>Where you want to fly to?</Text>
          </View>
        </TouchableOpacity>

        {/* Input 3: Travel Date */}
        <TouchableOpacity testID="btn-calendar-outline" accessibilityLabel="calendar outline"
          style={[
            styles.inputBox,
            {
              borderColor: colors.border,
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
              marginTop: 10,
            },
          ]}
          onPress={() => setDateModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.inputIconCircle}>
            <Ionicons name="calendar-outline" size={20} color="#94a3b8" />
          </View>
          <View style={styles.inputTextCol}>
            <Text style={[styles.inputPrimaryText, { color: colors.heading }]}>
              {tripType === 'roundTrip' ? `${travelDate} - ${returnDate}` : travelDate}
            </Text>
            <Text style={styles.inputSubText}>Travel Date</Text>
          </View>
        </TouchableOpacity>

        {/* Input 4: Passenger */}
        <TouchableOpacity testID="btn-person-outline" accessibilityLabel="person outline"
          style={[
            styles.inputBox,
            {
              borderColor: colors.border,
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
              marginTop: 10,
            },
          ]}
          onPress={() => setPassengerModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.inputIconCircle}>
            <Ionicons name="person-outline" size={20} color="#94a3b8" />
          </View>
          <View style={styles.inputTextCol}>
            <Text style={[styles.inputPrimaryText, { color: colors.heading }]}>
              {passengerLabel}
            </Text>
            <Text style={styles.inputSubText}>Passenger</Text>
          </View>
        </TouchableOpacity>

        {/* Input 5: Airlines Dropdown Box */}
        {activeVertical === 'flight' && (
          <TouchableOpacity testID="btn-navigate" accessibilityLabel="Navigate"
            style={[
              styles.airlineSelectBox,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                borderColor: colors.border,
              },
            ]}
            onPress={() => setAirlineModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.airlineSelectText, { color: colors.heading }]}>
              {selectedAirline}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#64748b" />
          </TouchableOpacity>
        )}

        {/* Search Feedback Message */}
        {searchFeedback && (
          <View style={styles.feedbackBanner}>
            <Ionicons name="sync-circle-outline" size={16} color="#1d75b8" />
            <Text style={styles.feedbackText}>{searchFeedback}</Text>
          </View>
        )}

        {/* Solid Blue Search Button */}
        <TouchableOpacity testID="btn-search"
          style={[styles.searchButton, { backgroundColor: '#2080c5' }]}
          onPress={handleSearch}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Search Flights"
        >
          <Text style={styles.searchButtonText}>
            {activeVertical === 'flight'
              ? 'Search'
              : activeVertical === 'hotels'
              ? 'Search Hotels'
              : activeVertical === 'tour'
              ? 'Search Tours'
              : 'Search Packages'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── 5. PROMOTIONAL CARDS CAROUSEL (BELOW SEARCH) ─── */}
      <View style={styles.promoSectionWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promoScrollContent}
        >
          {/* Card 1: Domestic Flights */}
          <TouchableOpacity testID="btn-gujjuflightherosearch-694" accessibilityLabel="gujjuflightherosearch action"
            style={[
              styles.promoCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              setToAirport(POPULAR_AIRPORTS[1]); // Mumbai BOM
              handleSearch();
            }}
            activeOpacity={0.85}
          >
            <ExpoImage
              source={{ uri: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=450&fit=crop' }}
              style={styles.promoImage}
              contentFit="cover"
              transition={250}
              cachePolicy="memory-disk"
            />
          </TouchableOpacity>

          {/* Card 2: International Flights */}
          <TouchableOpacity testID="btn-gujjuflightherosearch-718" accessibilityLabel="gujjuflightherosearch action"
            style={[
              styles.promoCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              setToAirport(POPULAR_AIRPORTS[4]); // Dubai DXB
              handleSearch();
            }}
            activeOpacity={0.85}
          >
            <ExpoImage
              source={{ uri: 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=800&h=450&fit=crop' }}
              style={styles.promoImage}
              contentFit="cover"
              transition={250}
              cachePolicy="memory-disk"
            />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ─── MODAL: AIRPORT SELECTOR ─── */}
      <Modal
        visible={airportPickerMode !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAirportPickerMode(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.pickerModalContent,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.heading }]}>
                {airportPickerMode === 'from' ? 'Select Departure Airport' : 'Select Destination'}
              </Text>
              <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={() => setAirportPickerMode(null)}>
                <Ionicons name="close" size={24} color={colors.heading} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={POPULAR_AIRPORTS}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity testID="btn-gujjuflightherosearch-770" accessibilityLabel="gujjuflightherosearch action"
                  style={[
                    styles.airportListItem,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => {
                    if (airportPickerMode === 'from') {
                      setFromAirport(item);
                    } else {
                      setToAirport(item);
                    }
                    setAirportPickerMode(null);
                  }}
                >
                  <View style={styles.airportCodeBadge}>
                    <Text style={styles.airportCodeText}>{item.code}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.airportNameText, { color: colors.heading }]}>
                      {item.city}, {item.country}
                    </Text>
                    <Text style={styles.airportSubText}>{item.name}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: CABIN CLASS SELECTOR ─── */}
      <Modal
        visible={cabinModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCabinModalVisible(false)}
      >
        <TouchableOpacity testID="btn-gujjuflightherosearch-807" accessibilityLabel="gujjuflightherosearch action"
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCabinModalVisible(false)}
        >
          <View
            style={[
              styles.smallModalContent,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.heading, marginBottom: 12 }]}>
              Select Cabin Class
            </Text>
            {CABIN_CLASSES.map((cls) => (
              <TouchableOpacity testID="btn-gujjuflightherosearch-822" accessibilityLabel="gujjuflightherosearch action"
                key={cls}
                style={[
                  styles.optionRow,
                  cabinClass === cls && { backgroundColor: `${colors.primary}15` },
                ]}
                onPress={() => {
                  setCabinClass(cls);
                  setCabinModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: cabinClass === cls ? '#1d75b8' : colors.heading,
                      fontWeight: cabinClass === cls ? '700' : '500',
                    },
                  ]}
                >
                  {cls}
                </Text>
                {cabinClass === cls && (
                  <Ionicons name="checkmark" size={18} color="#1d75b8" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── MODAL: PASSENGER COUNTER ─── */}
      <Modal
        visible={passengerModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPassengerModalVisible(false)}
      >
        <TouchableOpacity testID="btn-gujjuflightherosearch-860" accessibilityLabel="gujjuflightherosearch action"
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPassengerModalVisible(false)}
        >
          <View
            style={[
              styles.smallModalContent,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.heading, marginBottom: 16 }]}>
              Passengers
            </Text>

            {/* Adults */}
            <View style={styles.passengerCountRow}>
              <View>
                <Text style={[styles.passengerTypeTitle, { color: colors.heading }]}>Adults</Text>
                <Text style={styles.passengerTypeSub}>Age 12+ years</Text>
              </View>
              <View style={styles.stepperWrap}>
                <TouchableOpacity testID="btn-remove" accessibilityLabel="remove"
                  style={[styles.stepperBtn, adults <= 1 && styles.stepperDisabled]}
                  onPress={() => adults > 1 && setAdults(adults - 1)}
                  disabled={adults <= 1}
                >
                  <Ionicons name="remove" size={16} color={adults <= 1 ? '#94a3b8' : colors.heading} />
                </TouchableOpacity>
                <Text style={[styles.stepperValue, { color: colors.heading }]}>{adults}</Text>
                <TouchableOpacity testID="btn-add" accessibilityLabel="add"
                  style={styles.stepperBtn}
                  onPress={() => adults < 9 && setAdults(adults + 1)}
                >
                  <Ionicons name="add" size={16} color={colors.heading} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Children */}
            <View style={styles.passengerCountRow}>
              <View>
                <Text style={[styles.passengerTypeTitle, { color: colors.heading }]}>Children</Text>
                <Text style={styles.passengerTypeSub}>Age 2-12 years</Text>
              </View>
              <View style={styles.stepperWrap}>
                <TouchableOpacity testID="btn-remove" accessibilityLabel="remove"
                  style={[styles.stepperBtn, children <= 0 && styles.stepperDisabled]}
                  onPress={() => children > 0 && setChildren(children - 1)}
                  disabled={children <= 0}
                >
                  <Ionicons name="remove" size={16} color={children <= 0 ? '#94a3b8' : colors.heading} />
                </TouchableOpacity>
                <Text style={[styles.stepperValue, { color: colors.heading }]}>{children}</Text>
                <TouchableOpacity testID="btn-add" accessibilityLabel="add"
                  style={styles.stepperBtn}
                  onPress={() => children < 6 && setChildren(children + 1)}
                >
                  <Ionicons name="add" size={16} color={colors.heading} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Infants */}
            <View style={styles.passengerCountRow}>
              <View>
                <Text style={[styles.passengerTypeTitle, { color: colors.heading }]}>Infants</Text>
                <Text style={styles.passengerTypeSub}>Under 2 years</Text>
              </View>
              <View style={styles.stepperWrap}>
                <TouchableOpacity testID="btn-remove" accessibilityLabel="remove"
                  style={[styles.stepperBtn, infants <= 0 && styles.stepperDisabled]}
                  onPress={() => infants > 0 && setInfants(infants - 1)}
                  disabled={infants <= 0}
                >
                  <Ionicons name="remove" size={16} color={infants <= 0 ? '#94a3b8' : colors.heading} />
                </TouchableOpacity>
                <Text style={[styles.stepperValue, { color: colors.heading }]}>{infants}</Text>
                <TouchableOpacity testID="btn-add" accessibilityLabel="add"
                  style={styles.stepperBtn}
                  onPress={() => infants < 4 && setInfants(infants + 1)}
                >
                  <Ionicons name="add" size={16} color={colors.heading} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity testID="btn-done" accessibilityLabel="Done"
              style={[styles.applyBtn, { backgroundColor: '#2080c5' }]}
              onPress={() => setPassengerModalVisible(false)}
            >
              <Text style={styles.applyBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── MODAL: AIRLINE SELECTOR ─── */}
      <Modal
        visible={airlineModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAirlineModalVisible(false)}
      >
        <TouchableOpacity testID="btn-gujjuflightherosearch-964" accessibilityLabel="gujjuflightherosearch action"
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setAirlineModalVisible(false)}
        >
          <View
            style={[
              styles.smallModalContent,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.heading, marginBottom: 12 }]}>
              Select Airline
            </Text>
            <FlatList
              data={AIRLINE_OPTIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity testID="btn-gujjuflightherosearch-982" accessibilityLabel="gujjuflightherosearch action"
                  style={[
                    styles.optionRow,
                    selectedAirline === item && { backgroundColor: `${colors.primary}15` },
                  ]}
                  onPress={() => {
                    setSelectedAirline(item === 'All Airlines' ? 'Airlines' : item);
                    setAirlineModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          selectedAirline === item ||
                          (item === 'All Airlines' && selectedAirline === 'Airlines')
                            ? '#1d75b8'
                            : colors.heading,
                        fontWeight:
                          selectedAirline === item ||
                          (item === 'All Airlines' && selectedAirline === 'Airlines')
                            ? '700'
                            : '500',
                      },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── MODAL: DATE SELECTOR ─── */}
      <Modal
        visible={dateModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDateModalVisible(false)}
      >
        <TouchableOpacity testID="btn-gujjuflightherosearch-1025" accessibilityLabel="gujjuflightherosearch action"
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setDateModalVisible(false)}
        >
          <View
            style={[
              styles.smallModalContent,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.heading, marginBottom: 12 }]}>
              Select Departure Date
            </Text>
            {['Oct 29', 'Oct 30', 'Oct 31', 'Nov 01', 'Nov 05', 'Nov 10', 'Nov 15'].map((d) => (
              <TouchableOpacity testID="btn-gujjuflightherosearch-1040" accessibilityLabel="gujjuflightherosearch action"
                key={d}
                style={[
                  styles.optionRow,
                  travelDate === d && { backgroundColor: `${colors.primary}15` },
                ]}
                onPress={() => {
                  setTravelDate(d);
                  setDateModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: travelDate === d ? '#1d75b8' : colors.heading,
                      fontWeight: travelDate === d ? '700' : '500',
                    },
                  ]}
                >
                  {d}, 2026
                </Text>
                {travelDate === d && <Ionicons name="checkmark" size={18} color="#1d75b8" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },

  // 1. Hero Card
  heroCardContainer: {
    height: 175,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: SPACING.xs,
    marginBottom: SPACING.sm,
    ...SHADOW.sm,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
  },
  heroTextContainer: {
    position: 'absolute',
    top: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // 2. Service Tabs Row
  servicesRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginHorizontal: SPACING.xs,
    marginBottom: SPACING.sm,
    ...SHADOW.xs,
  },
  serviceTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    minWidth: 58,
  },
  serviceTabActive: {
    backgroundColor: '#e8f4fc',
  },
  serviceTabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 4,
  },
  serviceTabLabelActive: {
    color: '#1d75b8',
    fontWeight: '700',
  },
  moreIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  moreMiniCircle: {
    position: 'absolute',
    right: -10,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 3. Sub-Options: Radios & Pills
  subOptionsContainer: {
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.xs + 2,
  },
  radiosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#1d75b8',
  },
  radioLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  radioLabelActive: {
    color: '#1d75b8',
    fontWeight: '700',
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  economyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  economyPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxSquare: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  // 4. Form Card
  formCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
    marginHorizontal: SPACING.xs,
    position: 'relative',
    ...SHADOW.sm,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.md + 2,
    borderWidth: 1,
  },
  inputIconCircle: {
    marginRight: 12,
  },
  inputTextCol: {
    flex: 1,
  },
  inputPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  inputSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  swapButtonWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 12,
    zIndex: 10,
  },
  swapButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.xs,
  },
  airlineSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 12,
  },
  airlineSelectText: {
    fontSize: 13,
    fontWeight: '600',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4fc',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  feedbackText: {
    color: '#1d75b8',
    fontSize: 12,
    fontWeight: '600',
  },
  searchButton: {
    height: 48,
    borderRadius: RADIUS.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    ...SHADOW.sm,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // 5. Promotional Cards
  promoSectionWrap: {
    marginTop: SPACING.md,
  },
  promoScrollContent: {
    paddingHorizontal: SPACING.xs,
    gap: 12,
  },
  promoCard: {
    width: 270,
    height: 145,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    ...SHADOW.xs,
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  pickerModalContent: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
    ...SHADOW.lg,
  },
  smallModalContent: {
    width: '85%',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    ...SHADOW.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cbd5e1',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  airportListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  airportCodeBadge: {
    backgroundColor: '#e8f4fc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  airportCodeText: {
    color: '#1d75b8',
    fontSize: 14,
    fontWeight: '800',
  },
  airportNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  airportSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 14,
  },
  passengerCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  passengerTypeTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  passengerTypeSub: {
    fontSize: 11,
    color: '#64748b',
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDisabled: {
    opacity: 0.4,
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: '700',
    minWidth: 18,
    textAlign: 'center',
  },
  applyBtn: {
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
