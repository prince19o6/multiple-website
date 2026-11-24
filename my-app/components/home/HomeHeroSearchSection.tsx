/**
 * components/home/HomeHeroSearchSection.tsx
 *
 * Module-driven Hero & Search widget for the ToursApp Homepage.
 * Integrates dedicated interactive forms with native bottom sheets for:
 *   - Hotels, Tours, Packages, Flights, Transfers, Visas, Restaurants, Build Package
 * Features:
 *   1. High-impact Scenic Hero Banner with dark gradient vignette
 *   2. Centered Badge, Dynamic Hero Title & Subtitle overlay
 *   3. Floating elevated card overlapping hero with soft elevation and rounded corners
 *   4. Module selector tabs with smooth horizontal scroll and left/right arrows
 *   5. Full custom native-feeling bottom sheets with validation & error highlighting
 */

import React, { useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { useActiveModule, type CanonicalModule, type ModuleItem } from '@/store/ModuleContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';

import HotelsForm from '@/components/search/HotelsForm';
import ToursForm from '@/components/search/ToursForm';
import PackagesForm from '@/components/search/PackagesForm';
import FlightsForm from '@/components/search/FlightsForm';
import TransfersForm from '@/components/search/TransfersForm';
import VisasForm from '@/components/search/VisasForm';
import RestaurantsForm from '@/components/search/RestaurantsForm';
import BuildPackageForm from '@/components/search/BuildPackageForm';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface HomeHeroSearchSectionProps {
  onOpenTravelHub?: () => void;
  onOpenEnquiry?: (service: string) => void;
}

export function HomeHeroSearchSection({
  onOpenTravelHub,
  onOpenEnquiry,
}: HomeHeroSearchSectionProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const { activeModule, setActiveModule, enabledModules } = useActiveModule();

  const moduleScrollRef = useRef<any>(null);

  // Active module item definition
  const activeItem = useMemo(
    () => enabledModules.find((m: ModuleItem) => m.id === activeModule) || enabledModules[0] || {
      id: 'hotels',
      label: 'Hotels',
      icon: 'business-outline',
    },
    [enabledModules, activeModule]
  );

  // Next / Prev module navigation
  const handlePrevModule = () => {
    const currentIndex = enabledModules.findIndex((m: ModuleItem) => m.id === activeModule);
    if (currentIndex > 0) {
      const prevModule = enabledModules[currentIndex - 1].id;
      setActiveModule(prevModule);
      moduleScrollRef.current?.scrollTo({ x: Math.max(0, (currentIndex - 1) * 96 - 40), animated: true });
      if (Platform.OS !== 'web') {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      }
    }
  };

  const handleNextModule = () => {
    const currentIndex = enabledModules.findIndex((m: ModuleItem) => m.id === activeModule);
    if (currentIndex < enabledModules.length - 1) {
      const nextModule = enabledModules[currentIndex + 1].id;
      setActiveModule(nextModule);
      moduleScrollRef.current?.scrollTo({ x: (currentIndex + 1) * 96 - 40, animated: true });
      if (Platform.OS !== 'web') {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      }
    }
  };

  // Dynamic hero imagery and marketing text per module
  const moduleMeta = useMemo(() => {
    switch (activeModule) {
      case 'flights':
        return {
          image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=85',
          badge: '✨ EXCLUSIVE AIRFARES',
          title: 'Find Cheap Flights & Exclusive Airfares',
          subtitle:
            'Search hundreds of global airlines, compare routes, and lock in the guaranteed best rates with zero hidden fees.',
        };
      case 'hotels':
        return {
          image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85',
          badge: '✨ LUXURY STAYS & RESORTS',
          title: 'Handpicked Hotels, Resorts & Aparthotels',
          subtitle:
            'Verified properties, beachfront villas, and city center stays with dedicated Pure Veg & Jain dining options.',
        };
      case 'tours':
        return {
          image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85',
          badge: '✨ HANDCRAFTED EXPERIENCES',
          title: 'Unforgettable Sightseeing & Curated Tours',
          subtitle:
            'Skip-the-line admissions, expert local guides, and private cultural expeditions worldwide.',
        };
      case 'packages':
        return {
          image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85',
          badge: '✨ ALL-INCLUSIVE VACATIONS',
          title: 'Curated Holiday Packages & Family Getaways',
          subtitle:
            'Complete travel packages featuring flights, 4/5-star hotels, transfers, daily sightseeing, and Indian meals.',
        };
      case 'transfers':
        return {
          image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=85',
          badge: '✨ RELIABLE CHAUFFEURED RIDES',
          title: 'Private Airport Transfers & City Chauffeurs',
          subtitle:
            'Professional meet & greet at arrivals, fixed upfront pricing, free waiting time, and flight tracking.',
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
          subtitle: 'Verified experiences, instant bookings, and 24/7 dedicated customer care.',
        };
    }
  }, [activeModule, activeItem]);

  return (
    <View style={styles.rootContainer}>
      {/* ─── 1. HERO BANNER WITH SCENIC IMAGE ─── */}
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
            <Ionicons name="chevron-back" size={18} color={isDark ? '#cbd5e1' : '#475569'} />
          </TouchableOpacity>

          {/* Horizontal Modules List */}
          <ScrollView
            ref={moduleScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moduleTabsScroll}
            style={styles.moduleTabsContainer}
          >
            {enabledModules.map((item: ModuleItem, index: number) => {
              const isSelected = item.id === activeModule;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setActiveModule(item.id);
                    moduleScrollRef.current?.scrollTo({ x: Math.max(0, index * 96 - 40), animated: true });
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
                    name={item.icon as any}
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
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#cbd5e1' : '#475569'} />
          </TouchableOpacity>
        </View>

        {/* Subtle Horizontal Divider */}
        <View style={[styles.cardDivider, { backgroundColor: isDark ? colors.border : '#f1f5f9' }]} />

        {/* ─── 3. MODULE SPECIFIC SEARCH FORMS ─── */}
        <View style={styles.formContainer}>
          {activeModule === 'hotels' && <HotelsForm />}
          {activeModule === 'tours' && <ToursForm />}
          {activeModule === 'packages' && <PackagesForm />}
          {activeModule === 'flights' && <FlightsForm />}
          {activeModule === 'transfers' && <TransfersForm />}
          {activeModule === 'visas' && <VisasForm />}
          {activeModule === 'restaurants' && <RestaurantsForm />}
          {activeModule === 'buildpackage' && <BuildPackageForm onOpenEnquiry={onOpenEnquiry} />}
        </View>
      </View>
    </View>
  );
}

export default HomeHeroSearchSection;

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
    textShadowRadius: 3,
    maxWidth: 380,
  },

  // 2. Elevated Search Card
  searchCard: {
    marginHorizontal: 16,
    marginTop: -55,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  moduleBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  arrowNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  moduleTabsContainer: {
    flex: 1,
    marginHorizontal: 6,
  },
  moduleTabsScroll: {
    alignItems: 'center',
    paddingVertical: 2,
    gap: 8,
  },
  moduleTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  moduleTabLabel: {
    fontSize: 13,
  },
  cardDivider: {
    height: 1,
    width: '100%',
    marginVertical: 10,
  },
  formContainer: {
    width: '100%',
    paddingTop: 4,
  },
});
