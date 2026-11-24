/**
 * components/cards/ModuleItemCard.tsx
 *
 * Universal, high-performance module card shared between Home and Explore screens.
 * Implements dedicated layout variants for all 8 canonical modules:
 * 1. Hotels: photo, star rating, city, price per night
 * 2. Tours: photo, duration, rating, review count, price
 * 3. Packages: photo, days/nights badge, multi-city highlights, total price
 * 4. Flights: airline badge, route strip (from -> to), departure/arrival times, price
 * 5. Transfers: vehicle type, capacity, luggage allowance, transfer price
 * 6. Visas: country badge, processing turnaround, validity, visa fee
 * 7. Restaurants: photo, cuisine, Pure Veg / Jain Available badges, cost for two
 * 8. Build Package: interactive builder CTA card with customization highlights
 *
 * Zero duplicate code: 100% reusable across carousels, grids, and vertical lists.
 */

import React, { memo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useWishlist } from '@/context/WishlistContext';
import { type CanonicalModule } from '@/store/ModuleContext';
import { type ModuleFeaturedItem } from '@/services/api';
import { resolveImageUrl, getActualImageUrl, PLACEHOLDER_IMAGE, DEFAULT_BLURHASH } from '@/lib/imageUtils';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';

export interface ModuleItemCardProps {
  module: CanonicalModule;
  item: ModuleFeaturedItem;
  width?: number | string;
  onPress?: () => void;
  onAction?: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ModuleItemCard = memo(function ModuleItemCard({
  module,
  item,
  width = 280,
  onPress,
  onAction,
  isWishlisted: propIsWishlisted,
  onToggleWishlist: propOnToggleWishlist,
  style,
}: ModuleItemCardProps) {
  const router = useRouter();
  const colors = useColors();
  const { formatPrice } = useCurrency();
  const { isWishlisted: checkWishlist, toggleWishlist: defaultToggle } = useWishlist();
  const [imageError, setImageError] = useState(false);
  const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(null);
  const lastWishlistPressRef = useRef<number>(0);

  // Resolve item identifier for wishlist
  const itemIdentifier = item.id || item.slug || item.title;
  const isSaved = propIsWishlisted !== undefined
    ? propIsWishlisted
    : Boolean(
        (item.id && checkWishlist(item.id, module)) ||
        (item.slug && checkWishlist(item.slug, module)) ||
        (item.title && checkWishlist(item.title, module)) ||
        (itemIdentifier && checkWishlist(itemIdentifier, module))
      );

  const displaySaved = optimisticSaved !== null ? optimisticSaved : isSaved;

  useEffect(() => {
    if (optimisticSaved !== null && optimisticSaved === isSaved) {
      setOptimisticSaved(null);
    }
  }, [isSaved, optimisticSaved]);

  const handleToggleWishlist = async (e?: any) => {
    lastWishlistPressRef.current = Date.now();
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (e.nativeEvent) {
        if (typeof e.nativeEvent.stopPropagation === 'function') e.nativeEvent.stopPropagation();
        if (typeof e.nativeEvent.stopImmediatePropagation === 'function') e.nativeEvent.stopImmediatePropagation();
        if (typeof e.nativeEvent.preventDefault === 'function') e.nativeEvent.preventDefault();
      }
    }
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }

    const nextState = !displaySaved;
    setOptimisticSaved(nextState);

    if (propOnToggleWishlist) {
      propOnToggleWishlist();
    } else if (itemIdentifier) {
      try {
        await defaultToggle(
          itemIdentifier,
          {
            id: item.id || itemIdentifier,
            slug: item.slug,
            title: item.title,
            name: item.title,
            price: item.price,
            originalPrice: item.originalPrice,
            rating: item.rating,
            reviewCount: item.reviewCount,
            image: item.imageUrl,
            imageUrl: item.imageUrl,
            duration: item.duration,
            category: item.category || module.toUpperCase(),
            city: item.city,
            country: item.country,
            badge: item.badge,
            stars: item.stars,
            module,
          },
          module
        );
      } catch {
        setOptimisticSaved(null);
      }
    }
  };

  const handleCardPress = () => {
    if (Date.now() - lastWishlistPressRef.current < 600) {
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }

    if (onPress) {
      onPress();
      return;
    }

    // Default route mapping per module
    switch (module) {
      case 'tours':
        router.push(`/tour/${encodeURIComponent(item.slug || item.id)}` as any);
        break;
      case 'hotels':
      case 'packages':
        if (item.slug || item.id) {
          router.push(`/tour/${encodeURIComponent(item.slug || item.id)}` as any);
        } else if (onAction) {
          onAction();
        }
        break;
      case 'transfers':
      case 'flights':
        router.push('/airport-transfer' as any);
        break;
      case 'visas':
        router.push('/visa-hub' as any);
        break;
      case 'restaurants':
        router.push('/culinary-guide' as any);
        break;
      case 'buildpackage':
        if (onAction) {
          onAction();
        } else {
          router.push('/destinations' as any);
        }
        break;
      default:
        if (item.slug || item.id) {
          router.push(`/tour/${encodeURIComponent(item.slug || item.id)}` as any);
        }
        break;
    }
  };

  const rawImage =
    item.imageUrl ||
    (item as any).image ||
    ((item as any).images && (item as any).images[0]) ||
    '';
  const fallbackImage = getActualImageUrl(null, { module, title: item.title, city: item.city });
  const resolvedImage =
    resolveImageUrl(rawImage, undefined, {
      module,
      title: item.title,
      city: item.city,
      id: item.id || item.slug,
    }) || fallbackImage;

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. HOTEL VARIANT
  // ─────────────────────────────────────────────────────────────────────────────
  if (module === 'hotels') {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleCardPress}
        style={[
          styles.cardContainer,
          { width: width as any, backgroundColor: colors.surface, borderColor: colors.border },
          style,
        ]}
        role={Platform.OS === 'web' ? 'article' : undefined}
        accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
        accessibilityLabel={`${item.title}, hotel in ${item.city || 'destination'}`}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: imageError ? fallbackImage : resolvedImage }}
            style={styles.cardImage}
            contentFit="cover"
            placeholder={{ blurhash: DEFAULT_BLURHASH }}
            transition={300}
            onError={() => setImageError(true)}
          />
          <View style={styles.starsBadge}>
            <Ionicons name="star" size={13} color="#f59e0b" />
            <Text style={styles.starsText}>
              {item.stars ? `${item.stars} Star` : (item.rating ? `${item.rating.toFixed(1)} ★` : '5 Star')}
            </Text>
          </View>
          {item.badge ? (
            <View style={[styles.topRightBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.topRightBadgeText}>{item.badge}</Text>
            </View>
          ) : null}

          {/* Wishlist Button on top-right */}
          <TouchableOpacity
            testID={`btn-wishlist-${item.id || item.slug || item.title}`}
            style={styles.wishlistBtn}
            onPress={handleToggleWishlist}
            {...(Platform.OS === 'web' ? {
              onClick: (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); },
              onPointerDown: (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); },
            } : {})}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={displaySaved ? `Remove ${item.title} from wishlist` : `Save ${item.title} to wishlist`}
          >
            <Ionicons
              name={displaySaved ? 'heart' : 'heart-outline'}
              size={18}
              color={displaySaved ? '#ef4444' : '#ffffff'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.mutedText} />
            <Text style={[styles.metaText, { color: colors.mutedText }]} numberOfLines={1}>
              {item.city || item.country || 'Prime Location'}
            </Text>
          </View>

          <Text style={[styles.cardTitle, { color: colors.heading }]} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.footerRow}>
            <View>
              <Text style={[styles.pricePrefix, { color: colors.mutedText }]}>Starts from</Text>
              <Text style={[styles.priceValue, { color: colors.primary }]}>
                {formatPrice(item.price || 0, item.currency)}
                <Text style={[styles.priceUnit, { color: colors.mutedText }]}> / night</Text>
              </Text>
            </View>
            <View style={[styles.miniCta, { backgroundColor: `${colors.primary}15` }]}>
              <Text style={[styles.miniCtaText, { color: colors.primary }]}>View Rooms</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. TOUR VARIANT
  // ─────────────────────────────────────────────────────────────────────────────
  if (module === 'tours') {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleCardPress}
        style={[
          styles.cardContainer,
          { width: width as any, backgroundColor: colors.surface, borderColor: colors.border },
          style,
        ]}
        role={Platform.OS === 'web' ? 'article' : undefined}
        accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
        accessibilityLabel={`${item.title}, tour`}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: imageError ? fallbackImage : resolvedImage }}
            style={styles.cardImage}
            contentFit="cover"
            placeholder={{ blurhash: DEFAULT_BLURHASH }}
            transition={300}
            onError={() => setImageError(true)}
          />
          {item.duration ? (
            <View style={styles.durationPill}>
              <Ionicons name="time-outline" size={12} color="#ffffff" />
              <Text style={styles.durationPillText}>{item.duration}</Text>
            </View>
          ) : null}
          {item.rating ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.ratingBadgeText}>
                {item.rating.toFixed(1)} {item.reviewCount ? `(${item.reviewCount})` : ''}
              </Text>
            </View>
          ) : null}

          {/* Wishlist Button on top-right */}
          <TouchableOpacity
            testID={`btn-wishlist-${item.id || item.slug || item.title}`}
            style={styles.wishlistBtn}
            onPress={handleToggleWishlist}
            {...(Platform.OS === 'web' ? {
              onClick: (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); },
              onPointerDown: (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); },
            } : {})}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={displaySaved ? `Remove ${item.title} from wishlist` : `Save ${item.title} to wishlist`}
          >
            <Ionicons
              name={displaySaved ? 'heart' : 'heart-outline'}
              size={18}
              color={displaySaved ? '#ef4444' : '#ffffff'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.categorySubtitle, { color: colors.primary }]} numberOfLines={1}>
            {item.category || item.city || 'Guided Sightseeing'}
          </Text>

          <Text style={[styles.cardTitle, { color: colors.heading }]} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.footerRow}>
            <View>
              <Text style={[styles.pricePrefix, { color: colors.mutedText }]}>Per Person</Text>
              <Text style={[styles.priceValue, { color: colors.primary }]}>
                {formatPrice(item.price || 0, item.currency)}
              </Text>
            </View>
            <View style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.actionBtnText}>Explore</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. PACKAGE VARIANT
  // ─────────────────────────────────────────────────────────────────────────────
  if (module === 'packages') {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleCardPress}
        style={[
          styles.cardContainer,
          { width: width as any, backgroundColor: colors.surface, borderColor: colors.border },
          style,
        ]}
        role={Platform.OS === 'web' ? 'article' : undefined}
        accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
        accessibilityLabel={`${item.title}, holiday package`}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: imageError ? fallbackImage : resolvedImage }}
            style={styles.cardImage}
            contentFit="cover"
            placeholder={{ blurhash: DEFAULT_BLURHASH }}
            transition={300}
            onError={() => setImageError(true)}
          />
          <View style={[styles.durationPill, { backgroundColor: 'rgba(15, 23, 42, 0.85)' }]}>
            <Ionicons name="calendar-outline" size={12} color="#ffffff" />
            <Text style={styles.durationPillText}>
              {item.duration || '5 Days / 4 Nights'}
            </Text>
          </View>
          <View style={[styles.topRightBadge, { backgroundColor: '#10b981' }]}>
            <Text style={styles.topRightBadgeText}>{item.badge || 'All Inclusive'}</Text>
          </View>

          {/* Wishlist Button on top-right */}
          <TouchableOpacity
            testID={`btn-wishlist-${item.id || item.slug || item.title}`}
            style={styles.wishlistBtn}
            onPress={handleToggleWishlist}
            {...(Platform.OS === 'web' ? {
              onClick: (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); },
              onPointerDown: (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); },
            } : {})}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={displaySaved ? `Remove ${item.title} from wishlist` : `Save ${item.title} to wishlist`}
          >
            <Ionicons
              name={displaySaved ? 'heart' : 'heart-outline'}
              size={18}
              color={displaySaved ? '#ef4444' : '#ffffff'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.metaRow}>
            <Ionicons name="map-outline" size={14} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.primary, fontWeight: '600' }]} numberOfLines={1}>
              {item.city || item.country || 'Multi-City Tour'}
            </Text>
          </View>

          <Text style={[styles.cardTitle, { color: colors.heading }]} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.footerRow}>
            <View>
              <Text style={[styles.pricePrefix, { color: colors.mutedText }]}>Complete Package</Text>
              <Text style={[styles.priceValue, { color: colors.primary }]}>
                {formatPrice(item.price || 0, item.currency)}
              </Text>
            </View>
            <View style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.actionBtnText}>View Deal</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. FLIGHT VARIANT
  // ─────────────────────────────────────────────────────────────────────────────
  if (module === 'flights') {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleCardPress}
        style={[
          styles.flightCard,
          { width: width as any, backgroundColor: colors.surface, borderColor: colors.border },
          style,
        ]}
        role={Platform.OS === 'web' ? 'article' : undefined}
        accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
        accessibilityLabel={`${item.airline || 'Flight'} from ${item.fromCity || 'Origin'} to ${item.toCity || 'Destination'}`}
      >
        {/* Flight Header */}
        <View style={styles.flightHeader}>
          <View style={styles.airlineBadgeRow}>
            <View style={[styles.airlineIconBox, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="airplane" size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.airlineName, { color: colors.heading }]}>
                {item.airline || item.title || 'Direct Flight'}
              </Text>
              <Text style={[styles.flightCode, { color: colors.mutedText }]}>
                {item.flightNumber || 'Scheduled'}
              </Text>
            </View>
          </View>
          {item.badge ? (
            <View style={[styles.flightTag, { backgroundColor: '#dcfce7' }]}>
              <Text style={[styles.flightTagText, { color: '#166534' }]}>{item.badge}</Text>
            </View>
          ) : null}
        </View>

        {/* Route Strip */}
        <View style={styles.flightRouteStrip}>
          <View style={styles.routeCol}>
            <Text style={[styles.airportCode, { color: colors.heading }]}>
              {item.fromCity || 'BOM'}
            </Text>
            <Text style={[styles.flightTime, { color: colors.mutedText }]}>
              {item.departureTime || '08:00'}
            </Text>
          </View>

          <View style={styles.routeCenter}>
            <Text style={[styles.flightDurationText, { color: colors.mutedText }]}>
              {item.duration || 'Direct'}
            </Text>
            <View style={styles.flightLineRow}>
              <View style={[styles.flightDot, { backgroundColor: colors.border }]} />
              <View style={[styles.flightDash, { backgroundColor: colors.border }]} />
              <Ionicons name="airplane-sharp" size={14} color={colors.primary} style={{ marginHorizontal: 2 }} />
              <View style={[styles.flightDash, { backgroundColor: colors.border }]} />
              <View style={[styles.flightDot, { backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.stopsLabel, { color: colors.mutedText }]}>Non-stop</Text>
          </View>

          <View style={[styles.routeCol, { alignItems: 'flex-end' }]}>
            <Text style={[styles.airportCode, { color: colors.heading }]}>
              {item.toCity || 'DXB'}
            </Text>
            <Text style={[styles.flightTime, { color: colors.mutedText }]}>
              {item.arrivalTime || '11:15'}
            </Text>
          </View>
        </View>

        {/* Flight Footer */}
        <View style={[styles.flightFooter, { borderTopColor: colors.border }]}>
          <View>
            <Text style={[styles.pricePrefix, { color: colors.mutedText }]}>One-way fare</Text>
            <Text style={[styles.priceValue, { color: colors.primary }]}>
              {formatPrice(item.price || 0, item.currency)}
            </Text>
          </View>
          <View style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.actionBtnText}>Select</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. TRANSFER VARIANT
  // ─────────────────────────────────────────────────────────────────────────────
  if (module === 'transfers') {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleCardPress}
        style={[
          styles.cardContainer,
          { width: width as any, backgroundColor: colors.surface, borderColor: colors.border },
          style,
        ]}
        role={Platform.OS === 'web' ? 'article' : undefined}
        accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
        accessibilityLabel={`${item.title}, private transfer`}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: imageError ? fallbackImage : resolvedImage }}
            style={styles.cardImage}
            contentFit="cover"
            placeholder={{ blurhash: DEFAULT_BLURHASH }}
            transition={300}
            onError={() => setImageError(true)}
          />
          <View style={[styles.topRightBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.topRightBadgeText}>{item.vehicle || 'Luxury Chauffeur'}</Text>
          </View>
          {/* Wishlist Button on top-right */}
          <TouchableOpacity
            testID={`btn-wishlist-${item.id || item.slug || item.title}`}
            style={styles.wishlistBtn}
            onPress={handleToggleWishlist}
            {...(Platform.OS === 'web' ? {
              onClick: (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); },
              onPointerDown: (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); },
            } : {})}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={displaySaved ? `Remove ${item.title} from wishlist` : `Save ${item.title} to wishlist`}
          >
            <Ionicons
              name={displaySaved ? 'heart' : 'heart-outline'}
              size={18}
              color={displaySaved ? '#ef4444' : '#ffffff'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.heading }]} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.featuresPillRow}>
            <View style={[styles.featurePill, { backgroundColor: `${colors.primary}10` }]}>
              <Ionicons name="people-outline" size={13} color={colors.primary} />
              <Text style={[styles.featurePillText, { color: colors.primary }]}>
                {item.capacity || '4 Passengers'}
              </Text>
            </View>
            <View style={[styles.featurePill, { backgroundColor: `${colors.primary}10` }]}>
              <Ionicons name="briefcase-outline" size={13} color={colors.primary} />
              <Text style={[styles.featurePillText, { color: colors.primary }]}>
                {item.luggage || '3 Luggage'}
              </Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <View>
              <Text style={[styles.pricePrefix, { color: colors.mutedText }]}>Fixed Rate</Text>
              <Text style={[styles.priceValue, { color: colors.primary }]}>
                {formatPrice(item.price || 0, item.currency)}
              </Text>
            </View>
            <View style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.actionBtnText}>Book Cab</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. VISA VARIANT
  // ─────────────────────────────────────────────────────────────────────────────
  if (module === 'visas') {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleCardPress}
        style={[
          styles.visaCard,
          { width: width as any, backgroundColor: colors.surface, borderColor: colors.border },
          style,
        ]}
        role={Platform.OS === 'web' ? 'article' : undefined}
        accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
        accessibilityLabel={`${item.country || item.title} visa application`}
      >
        <View style={styles.visaHeader}>
          <View style={[styles.visaFlagBox, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="earth" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.visaCountry, { color: colors.heading }]} numberOfLines={1}>
              {item.country || item.title}
            </Text>
            <Text style={[styles.visaType, { color: colors.mutedText }]} numberOfLines={1}>
              {item.validity || 'Tourist E-Visa (Single/Multiple Entry)'}
            </Text>
          </View>
          <TouchableOpacity
            testID={`btn-wishlist-${item.id || item.country || item.title}`}
            style={styles.headerWishlistBtn}
            onPress={handleToggleWishlist}
            {...(Platform.OS === 'web' ? {
              onClick: (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); },
              onPointerDown: (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); },
            } : {})}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={displaySaved ? 'Remove visa from wishlist' : 'Save visa to wishlist'}
          >
            <Ionicons
              name={displaySaved ? 'heart' : 'heart-outline'}
              size={18}
              color={displaySaved ? '#ef4444' : colors.mutedText}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.visaDetailBox}>
          <View style={styles.visaInfoCol}>
            <Ionicons name="flash-outline" size={14} color="#f59e0b" />
            <Text style={[styles.visaInfoLabel, { color: colors.mutedText }]}>Processing</Text>
            <Text style={[styles.visaInfoVal, { color: colors.heading }]}>
              {item.processingTime || '3-5 Working Days'}
            </Text>
          </View>
          <View style={[styles.visaDivider, { backgroundColor: colors.border }]} />
          <View style={styles.visaInfoCol}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#10b981" />
            <Text style={[styles.visaInfoLabel, { color: colors.mutedText }]}>Approval Rate</Text>
            <Text style={[styles.visaInfoVal, { color: '#10b981' }]}>99.4%</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View>
            <Text style={[styles.pricePrefix, { color: colors.mutedText }]}>All-inclusive Fee</Text>
            <Text style={[styles.priceValue, { color: colors.primary }]}>
              {formatPrice(item.price || 0, item.currency)}
            </Text>
          </View>
          <View style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.actionBtnText}>Apply Now</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. RESTAURANT VARIANT
  // ─────────────────────────────────────────────────────────────────────────────
  if (module === 'restaurants') {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleCardPress}
        style={[
          styles.cardContainer,
          { width: width as any, backgroundColor: colors.surface, borderColor: colors.border },
          style,
        ]}
        role={Platform.OS === 'web' ? 'article' : undefined}
        accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
        accessibilityLabel={`${item.title}, dining`}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: imageError ? fallbackImage : resolvedImage }}
            style={styles.cardImage}
            contentFit="cover"
            placeholder={{ blurhash: DEFAULT_BLURHASH }}
            transition={300}
            onError={() => setImageError(true)}
          />
          <View style={styles.dietaryBadgeContainer}>
            {item.isVeg !== false && (
              <View style={[styles.dietaryBadge, { backgroundColor: '#16a34a' }]}>
                <View style={styles.pureVegDot} />
                <Text style={styles.dietaryBadgeText}>Pure Veg</Text>
              </View>
            )}
            {item.isJain && (
              <View style={[styles.dietaryBadge, { backgroundColor: '#d97706', marginLeft: 4 }]}>
                <Text style={styles.dietaryBadgeText}>Jain Available</Text>
              </View>
            )}
          </View>
          {item.rating ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.ratingBadgeText}>{item.rating.toFixed(1)}</Text>
            </View>
          ) : null}
          {/* Wishlist Button on top-right */}
          <TouchableOpacity
            testID={`btn-wishlist-${item.id || item.slug || item.title}`}
            style={styles.wishlistBtn}
            onPress={handleToggleWishlist}
            {...(Platform.OS === 'web' ? {
              onClick: (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); },
              onPointerDown: (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); },
            } : {})}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={displaySaved ? `Remove ${item.title} from wishlist` : `Save ${item.title} to wishlist`}
          >
            <Ionicons
              name={displaySaved ? 'heart' : 'heart-outline'}
              size={18}
              color={displaySaved ? '#ef4444' : '#ffffff'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.categorySubtitle, { color: colors.primary }]} numberOfLines={1}>
            {item.cuisine || 'Authentic Regional Indian & Global'}
          </Text>

          <Text style={[styles.cardTitle, { color: colors.heading }]} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.footerRow}>
            <View>
              <Text style={[styles.pricePrefix, { color: colors.mutedText }]}>Cost for Two</Text>
              <Text style={[styles.priceValue, { color: colors.primary }]}>
                {formatPrice(item.costForTwo || item.price || 0, item.currency)}
              </Text>
            </View>
            <View style={[styles.miniCta, { backgroundColor: `${colors.primary}15` }]}>
              <Text style={[styles.miniCtaText, { color: colors.primary }]}>Book Table</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. BUILD PACKAGE VARIANT
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handleCardPress}
      style={[
        styles.buildPackageCard,
        { width: width as any, backgroundColor: colors.surface, borderColor: colors.primary },
        style,
      ]}
      role={Platform.OS === 'web' ? 'article' : undefined}
      accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
      accessibilityLabel="Custom travel package builder"
    >
      <View style={[styles.buildHeader, { backgroundColor: `${colors.primary}12` }]}>
        <View style={[styles.buildIconBox, { backgroundColor: colors.primary }]}>
          <Ionicons name="construct-outline" size={24} color="#ffffff" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.buildTitle, { color: colors.heading }]} numberOfLines={1}>
            {item.title || 'Custom Travel Builder'}
          </Text>
          <Text style={[styles.buildSubtitle, { color: colors.mutedText }]} numberOfLines={1}>
            {item.badge || 'Tailor flights, stays, tours & transfers'}
          </Text>
        </View>
      </View>

      <View style={styles.buildBody}>
        <View style={styles.buildBullet}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={[styles.buildBulletText, { color: colors.text }]}>
            100% Flexible Stays & Guided Tours
          </Text>
        </View>
        <View style={styles.buildBullet}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={[styles.buildBulletText, { color: colors.text }]}>
            Instant WhatsApp Quotation & Consultation
          </Text>
        </View>
        <View style={styles.buildBullet}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={[styles.buildBulletText, { color: colors.text }]}>
            Guaranteed Best Group & Family Rates
          </Text>
        </View>
      </View>

      <View style={[styles.buildFooter, { borderTopColor: colors.border }]}>
        <View style={[styles.buildFullBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.buildFullBtnText}>Build My Itinerary</Text>
          <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  imageWrapper: {
    width: '100%',
    height: 150,
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  starsBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  starsText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  topRightBadge: {
    position: 'absolute',
    top: 8,
    right: 48,
    zIndex: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  headerWishlistBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  topRightBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  durationPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  durationPillText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    gap: 3,
  },
  ratingBadgeText: {
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: SPACING.sm + 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metaText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  categorySubtitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '700',
    lineHeight: 20,
    minHeight: 40,
    marginBottom: SPACING.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xs,
  },
  pricePrefix: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: '500',
  },
  miniCta: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.sm,
  },
  miniCtaText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  actionBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.sm,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },

  // Flight specific
  flightCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  flightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  airlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  airlineIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  airlineName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  flightCode: {
    fontSize: 11,
    fontWeight: '500',
  },
  flightTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  flightTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  flightRouteStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  routeCol: {
    width: 65,
  },
  airportCode: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  flightTime: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  routeCenter: {
    flex: 1,
    alignItems: 'center',
  },
  flightDurationText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  flightLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    justifyContent: 'center',
  },
  flightDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  flightDash: {
    flex: 1,
    height: 1,
  },
  stopsLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  flightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },

  // Transfers specific
  featuresPillRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: SPACING.xs,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  featurePillText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Visa specific
  visaCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  visaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  visaFlagBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visaCountry: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  visaType: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  visaDetailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginVertical: SPACING.xs,
  },
  visaInfoCol: {
    flex: 1,
    alignItems: 'center',
  },
  visaInfoLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  visaInfoVal: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  visaDivider: {
    width: 1,
    height: 28,
  },

  // Restaurant specific
  dietaryBadgeContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dietaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  pureVegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  dietaryBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },

  // Build package specific
  buildPackageCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  buildHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  buildIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  buildSubtitle: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  buildBody: {
    padding: SPACING.md,
    gap: 8,
  },
  buildBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buildBulletText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '500',
    flex: 1,
  },
  buildFooter: {
    borderTopWidth: 1,
    padding: SPACING.md,
  },
  buildFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.sm,
  },
  buildFullBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: FONT_SIZE.sm,
  },
});

export default ModuleItemCard;

