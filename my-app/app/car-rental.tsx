/**
 * app/car-rental.tsx
 *
 * Dedicated Car Rental & Self-Drive screen for the native mobile app.
 * Protected by <FeatureGuard featureId="car-rental">.
 * If disabled in the feature registry (e.g., GujjuTours), it shows the friendly
 * "Feature Not Available" screen with one-tap return to home.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useCurrency } from '@/context/CurrencyContext';
import { FeatureGuard } from '@/components/common/FeatureGuard';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';

interface CarRentalItem {
  id: string;
  name: string;
  category: 'Economy' | 'SUV' | 'Luxury' | 'People Carrier';
  image: string;
  seats: number;
  doors: number;
  luggage: number;
  transmission: 'Automatic' | 'Manual';
  dailyRate: number;
  supplier: string;
  features: string[];
}

const CAR_FLEET: CarRentalItem[] = [
  {
    id: 'car-1',
    name: 'Executive Comfort Sedan (Dzire / Yaris)',
    category: 'Economy',
    image: '/seed-images/transfers/transfer-sedan.svg',
    seats: 5,
    doors: 4,
    luggage: 2,
    transmission: 'Automatic',
    dailyRate: 35,
    supplier: 'Verified Partner Fleet',
    features: ['Unlimited Mileage', 'Collision Damage Waiver', 'Air Conditioning'],
  },
  {
    id: 'car-2',
    name: 'Family Tour SUV (Innova / CR-V)',
    category: 'SUV',
    image: '/seed-images/transfers/transfer-suv.svg',
    seats: 5,
    doors: 5,
    luggage: 4,
    transmission: 'Automatic',
    dailyRate: 68,
    supplier: 'Verified Partner Fleet',
    features: ['All-Wheel Drive', 'Reverse Camera & GPS', 'Free Cancellation up to 48h'],
  },
  {
    id: 'car-3',
    name: 'VIP Luxury Executive Sedan',
    category: 'Luxury',
    image: '/seed-images/transfers/transfer-luxury.svg',
    seats: 5,
    doors: 4,
    luggage: 3,
    transmission: 'Automatic',
    dailyRate: 145,
    supplier: 'Verified Partner Fleet',
    features: ['Premium Leather', 'Apple CarPlay & Burmester Sound', 'Chauffeur Delivery Option'],
  },
  {
    id: 'car-4',
    name: 'Executive Passenger Van (HiAce / Alphard)',
    category: 'People Carrier',
    image: '/seed-images/transfers/transfer-van.svg',
    seats: 7,
    doors: 5,
    luggage: 6,
    transmission: 'Automatic',
    dailyRate: 120,
    supplier: 'Verified Partner Fleet',
    features: ['Captain Ottoman Seats', 'Dual Sunroof', 'Ideal for Family Expeditions'],
  },
];

export default function CarRentalScreen() {
  const router = useRouter();
  const colors = useColors();
  const { currencySymbol } = useCurrency();
  const params = useLocalSearchParams<{
    pickup?: string;
    pickupDate?: string;
    returnDate?: string;
    driverAge?: string;
  }>();

  const [activeCategory, setActiveCategory] = useState<string>('All');

  const handleBack = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const filteredFleet = activeCategory === 'All'
    ? CAR_FLEET
    : CAR_FLEET.filter((car) => car.category === activeCategory);

  return (
    <FeatureGuard featureId="car-rental">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header Bar */}
        <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            testID="btn-car-rental-back"
            style={styles.backBtn}
            onPress={handleBack}
            accessibilityLabel="Back"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color={colors.heading} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.heading }]} numberOfLines={1}>
              Car Rental &amp; Self-Drive
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]} numberOfLines={1}>
              Verified Fleet Partners
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Reservation Criteria Summary Card */}
          <View style={[styles.criteriaCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOW.sm]}>
            <View style={styles.criteriaRow}>
              <Ionicons name="location" size={16} color={colors.primary} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.criteriaLabel, { color: colors.mutedText }]}>PICK-UP STATION</Text>
                <Text style={[styles.criteriaValue, { color: colors.heading }]} numberOfLines={1}>
                  {params.pickup || 'Kuala Lumpur International (KUL)'}
                </Text>
              </View>
            </View>

            <View style={[styles.criteriaDivider, { backgroundColor: colors.border }]} />

            <View style={styles.criteriaDualRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.criteriaLabel, { color: colors.mutedText }]}>DATES</Text>
                <Text style={[styles.criteriaValueSmall, { color: colors.heading }]} numberOfLines={1}>
                  {params.pickupDate || 'Selected Dates'} — {params.returnDate || '5 Days'}
                </Text>
              </View>
              <View>
                <Text style={[styles.criteriaLabel, { color: colors.mutedText }]}>DRIVER AGE</Text>
                <Text style={[styles.criteriaValueSmall, { color: colors.heading }]}>
                  {params.driverAge || '25-70 Years'}
                </Text>
              </View>
            </View>
          </View>

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPills}
          >
            {['All', 'Economy', 'SUV', 'Luxury', 'People Carrier'].map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catPill,
                    { borderColor: colors.border },
                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => {
                    setActiveCategory(cat);
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.catPillText,
                      { color: isSelected ? '#ffffff' : colors.heading },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Fleet Cards */}
          <View style={styles.fleetList}>
            {filteredFleet.map((car) => (
              <View
                key={car.id}
                style={[
                  styles.carCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  SHADOW.md,
                ]}
              >
                <ExpoImage source={{ uri: car.image }} style={styles.carImage} contentFit="cover" />

                <View style={styles.carBody}>
                  <View style={styles.carHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.carCategory, { color: colors.primary }]}>{car.category}</Text>
                      <Text style={[styles.carName, { color: colors.heading }]}>{car.name}</Text>
                      <Text style={[styles.carSupplier, { color: colors.mutedText }]}>via {car.supplier}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.carPrice, { color: colors.primary }]}>
                        {currencySymbol || '$'}{car.dailyRate}
                      </Text>
                      <Text style={[styles.carPricePeriod, { color: colors.mutedText }]}>per day</Text>
                    </View>
                  </View>

                  {/* Badges / Specs */}
                  <View style={styles.specsRow}>
                    <View style={styles.specBadge}>
                      <Ionicons name="people-outline" size={13} color={colors.mutedText} />
                      <Text style={[styles.specText, { color: colors.mutedText }]}>{car.seats} Seats</Text>
                    </View>
                    <View style={styles.specBadge}>
                      <Ionicons name="briefcase-outline" size={13} color={colors.mutedText} />
                      <Text style={[styles.specText, { color: colors.mutedText }]}>{car.luggage} Bags</Text>
                    </View>
                    <View style={styles.specBadge}>
                      <Ionicons name="cog-outline" size={13} color={colors.mutedText} />
                      <Text style={[styles.specText, { color: colors.mutedText }]}>{car.transmission}</Text>
                    </View>
                  </View>

                  {/* Inclusions */}
                  <View style={styles.inclusionsBox}>
                    {car.features.map((feat, i) => (
                      <View key={i} style={styles.inclusionItem}>
                        <Ionicons name="checkmark-circle" size={14} color="#16a34a" style={{ marginRight: 6 }} />
                        <Text style={[styles.inclusionText, { color: colors.heading }]}>{feat}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Reserve CTA */}
                  <TouchableOpacity
                    testID={`btn-reserve-${car.id}`}
                    accessibilityLabel={`Reserve ${car.name}`}
                    style={[styles.reserveBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      try {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      } catch {}
                      Alert.alert(
                        'Car Reserved!',
                        `Your ${car.name} is reserved with ${car.supplier}. Instant voucher and pick-up voucher will be sent to your account.`
                      );
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.reserveBtnText}>Reserve Vehicle</Text>
                    <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </FeatureGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 50,
    paddingBottom: SPACING.sm + 4,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  criteriaCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  criteriaLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  criteriaValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginTop: 2,
  },
  criteriaValueSmall: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  criteriaDivider: {
    height: 1,
    marginVertical: SPACING.sm,
  },
  criteriaDualRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPills: {
    gap: 8,
    marginBottom: SPACING.md,
  },
  catPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fleetList: {
    gap: SPACING.md,
  },
  carCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  carImage: {
    width: '100%',
    height: 180,
  },
  carBody: {
    padding: SPACING.md,
  },
  carHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  carCategory: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  carName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    marginTop: 2,
  },
  carSupplier: {
    fontSize: 11,
    marginTop: 2,
  },
  carPrice: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  carPricePeriod: {
    fontSize: 10,
  },
  specsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inclusionsBox: {
    gap: 6,
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  inclusionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inclusionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reserveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.lg,
  },
  reserveBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
  },
});

