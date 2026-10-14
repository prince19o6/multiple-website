/**
 * app/(app)/explore.tsx
 *
 * Tour Catalogue & Search screen.
 * Config-driven styles, search bar, difficulty filters, and brand tour cards.
 * The top navbar is rendered by the root (app)/_layout.tsx.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { useTours } from '@/hooks/useTours';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import TourCard from '@/components/TourCard';
import AdventureTourCard from '@/components/AdventureTourCard';
import LuxuryTourCard from '@/components/LuxuryTourCard';
import { TourCardSkeleton } from '@/components/SkeletonLoader';
import Footer from '@/components/Footer';
import { tourHref } from '@/lib/navigation';

export default function ExploreScreen() {
  const router = useRouter();
  const config = useSiteConfig();
  const colors = useColors();
  const { siteId } = useSelectedSite();
  const { tours, isLoading, refetch } = useTours(siteId);

  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);

  const theme = config?.theme || {};
  const tourCard = (config as any)?.tourCard;
  const headingFontFamily = getHeadingFontFamily(config);

  const useAdventureCard = tourCard?.layout === 'image-overlay';
  const useLuxuryCard = tourCard?.layout === 'luxury';

  const difficulties = ['All', 'Easy', 'Moderate', 'Challenging', 'Strenuous'];

  const filteredTours = useMemo(() => {
    return (tours || []).filter((tour) => {
      const matchesSearch =
        tour.name.toLowerCase().includes(search.toLowerCase()) ||
        tour.description.toLowerCase().includes(search.toLowerCase()) ||
        (tour.location && tour.location.toLowerCase().includes(search.toLowerCase()));

      const matchesDiff =
        selectedDifficulty === 'All' ||
        tour.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

      return matchesSearch && matchesDiff;
    });
  }, [tours, search, selectedDifficulty]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.heading,
              {
                color: colors.heading,
                fontFamily: useLuxuryCard ? headingFontFamily : undefined,
              },
            ]}
          >
            {siteId === 'website2'
              ? 'Find Your Adventure'
              : siteId === 'website3'
              ? 'Curated Holiday Escapes'
              : 'Explore Tours'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            {filteredTours.length} experiences available from {config?.name || 'our collection'}
          </Text>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.mutedText} />
          <TextInput
            placeholder="Search by destination or tour name..."
            placeholderTextColor={colors.mutedText}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Difficulty Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {difficulties.map((diff) => {
            const isSelected = selectedDifficulty === diff;
            return (
              <TouchableOpacity
                key={diff}
                activeOpacity={0.8}
                onPress={() => setSelectedDifficulty(diff)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#ffffff' : colors.text },
                    isSelected && { fontWeight: '700' },
                  ]}
                >
                  {diff}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tours List */}
        <View style={styles.list}>
          {isLoading ? (
            <>
              <TourCardSkeleton />
              <TourCardSkeleton />
              <TourCardSkeleton />
            </>
          ) : filteredTours.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: colors.border }]}>
              <Ionicons name="compass-outline" size={48} color={colors.mutedText} />
              <Text style={[styles.emptyTitle, { color: colors.heading }]}>No tours match your criteria</Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
                Try adjusting your search or resetting the filters.
              </Text>
              <TouchableOpacity
                style={[styles.resetBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setSearch('');
                  setSelectedDifficulty('All');
                }}
              >
                <Text style={styles.resetBtnText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredTours.map((tour) => {
              const href = tourHref(tour);
              if (useAdventureCard) {
                return (
                  <AdventureTourCard
                    key={tour.id}
                    {...tour}
                    tourCardConfig={tourCard}
                    theme={theme}
                    onBook={() => router.push(href as any)}
                    onPress={() => router.push(href as any)}
                  />
                );
              }

              if (useLuxuryCard) {
                return (
                  <LuxuryTourCard
                    key={tour.id}
                    {...tour}
                    tourCardConfig={tourCard}
                    theme={theme}
                    headingFontFamily={headingFontFamily}
                    onBook={() => router.push(href as any)}
                    onPress={() => router.push(href as any)}
                  />
                );
              }

              return (
                <TourCard
                  key={tour.id}
                  {...tour}
                  onBook={() => router.push(href as any)}
                  onPress={() => router.push(href as any)}
                />
              );
            })
          )}
        </View>

        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: SPACING.xl,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  heading: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    paddingVertical: 0,
  },
  filterRow: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs + 2,
    marginBottom: SPACING.lg,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: SPACING.md,
  },
  emptyBox: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  resetBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  resetBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});
