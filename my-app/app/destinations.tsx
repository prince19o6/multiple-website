/**
 * app/destinations.tsx
 *
 * Dedicated "See all" screen for Trending Destinations.
 * Features:
 *   - Native header with back button
 *   - Search input to filter destinations by name or country
 *   - 2-column grid of image cards with tour counts
 *   - Direct link to explore tours filtered by destination
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useDestinations } from '@/hooks/useDestinations';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { resolveImageUrl, DEFAULT_BLURHASH } from '@/lib/imageUtils';
import AppHeader from '@/components/common/AppHeader';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import type { DestinationItem } from '@/hooks/useDestinations';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.md * 3) / 2;

export default function DestinationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { destinations, isLoading, isError, error, refetch } = useDestinations();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return destinations;
    const q = search.toLowerCase();
    return destinations.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.country && d.country.toLowerCase().includes(q))
    );
  }, [destinations, search]);

  const renderCard = ({ item }: { item: DestinationItem }) => (
    <TouchableOpacity testID="btn-destinations-54"
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      onPress={() => {
        const primaryDest = item.name.split(',')[0].trim();
        router.push({
          pathname: '/(tabs)/explore',
          params: { q: primaryDest },
        } as any);
      }}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.tours} tours`}
    >
      <ExpoImage
        source={{ uri: resolveImageUrl(item.image) || undefined }}
        style={styles.image}
        contentFit="cover"
        transition={250}
        cachePolicy="memory-disk"
        placeholder={{ blurhash: DEFAULT_BLURHASH }}
      />
      <View style={styles.overlay} />
      <View style={styles.textWrap}>
        <Text style={styles.destName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.destCount}>
          {item.tours} {item.tours === 1 ? 'Tour' : 'Tours'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Trending Destinations"
        showBackButton
        onBackPress={() => router.back()}
      />

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.mutedText} style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search destinations or countries..."
            placeholderTextColor={colors.mutedText}
            style={[styles.input, { color: colors.heading }]}
            clearButtonMode="while-editing"
          />
          {search ? (
            <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.mutedText} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Grid */}
      {isLoading ? (
        <View style={styles.loaderWrap}>
          <SkeletonLoader variant="tourCard" count={4} />
        </View>
      ) : isError ? (
        <View style={styles.centerWrap}>
          <Text style={[styles.errorTitle, { color: colors.heading }]}>Unable to load destinations</Text>
          <Text style={[styles.errorDesc, { color: colors.mutedText }]}>{error?.message}</Text>
          <TouchableOpacity testID="btn-retry" accessibilityLabel="Retry"
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="earth-outline"
          title={search ? `No destinations found for "${search}"` : 'No destinations available'}
          description="Try a different search query or clear the filter."
          actionLabel={search ? 'Clear Search' : 'Refresh'}
          onAction={() => (search ? setSearch('') : refetch())}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, idx) => item.id || `dest_${idx}`}
          renderItem={renderCard}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchWrap: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    height: 44,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
  },
  gridContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  card: {
    width: CARD_WIDTH,
    height: 200,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    ...SHADOW.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  textWrap: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  destName: {
    color: '#ffffff',
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  destCount: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 2,
  },
  loaderWrap: {
    padding: SPACING.md,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  errorTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  errorDesc: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: FONT_SIZE.xs,
  },
});
