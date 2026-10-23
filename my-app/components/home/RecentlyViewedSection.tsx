/**
 * components/home/RecentlyViewedSection.tsx
 *
 * Renders horizontally scrolled recently viewed tour cards.
 * Critical: Returns null when empty, avoiding useless whitespace.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useTours } from '@/hooks/useTours';
import { SectionHeader } from './SectionHeader';
import { HorizontalList } from './HorizontalList';
import { MemoizedTourCardHorizontal as TourCardHorizontal } from '@/components/TourCardHorizontal';
import { useCurrency } from '@/context/CurrencyContext';
import { useSite } from '@/store/SiteConfigContext';
import { tourHref } from '@/lib/navigation';
import type { Tour } from '@/types';

export interface RecentlyViewedSectionProps {
  headingFontFamily?: string;
}

export function RecentlyViewedSection({ headingFontFamily }: RecentlyViewedSectionProps) {
  const router = useRouter();
  const { recentSearches } = useRecentSearches();
  const { tours, isLoading } = useTours();
  const { currencySymbol } = useCurrency();
  const { currency: siteCurrency } = useSite();
  const currency = currencySymbol || siteCurrency?.symbol || '$';

  // Filter tours matching recent searches
  const matchingTours = React.useMemo<Tour[]>(() => {
    if (!recentSearches || recentSearches.length === 0 || !tours) return [];
    const searchTerms = recentSearches.map((s) => s.toLowerCase());
    return tours
      .filter((t) =>
        searchTerms.some(
          (term) =>
            t.name.toLowerCase().includes(term) ||
            t.location?.toLowerCase().includes(term) ||
            t.category?.toLowerCase().includes(term)
        )
      )
      .slice(0, 5);
  }, [recentSearches, tours]);

  if (matchingTours.length === 0) {
    return null; // Return null so zero space is consumed when empty
  }

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Recently Viewed"
        subtitle="Pick up where you left off"
        headingFontFamily={headingFontFamily}
      />
      <HorizontalList<Tour>
        data={matchingTours}
        itemWidth={250}
        keyExtractor={(item) => `recent_${item.id}`}
        isLoading={isLoading}
        renderItem={({ item }) => (
          <TourCardHorizontal
            tour={item}
            onPress={() => router.push(tourHref(item) as any)}
            currency={currency}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
});
