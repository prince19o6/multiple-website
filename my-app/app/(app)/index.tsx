/**
 * app/(app)/index.tsx
 *
 * Home screen — renders home sections in the order the API returns.
 * Equivalent to web's app/[site]/page.tsx.
 *
 * Uses DynamicRenderer to map section keys → RN components.
 * Pull-to-refresh reloads config + tours data from the API.
 * The top navbar is rendered by the root (app)/_layout.tsx.
 */

import { useCallback, useRef, useState } from 'react';
import { ScrollView, RefreshControl, StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { useTours } from '@/hooks/useTours';
import { useDestinations } from '@/hooks/useDestinations';
import { queryKeys } from '@/store/queryClient';
import DynamicRenderer from '@/components/DynamicRenderer';
import Footer from '@/components/Footer';

export default function HomeScreen() {
  const config = useSiteConfig();
  const colors = useColors();
  const { siteId } = useSelectedSite();
  const { tours } = useTours(siteId);
  const { destinations } = useDestinations(siteId);
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);

  // Determine section order from config (same logic as web's homeSections)
  const sections: string[] = Array.isArray((config as any).homeSections)
    ? (config as any).homeSections
    : ['hero', 'whyChooseUs', 'featuredTours', 'destinations', 'stats', 'cta'];

  const handleRefresh = useCallback(async () => {
    if (!siteId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.siteConfig(siteId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.tours(siteId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.destinations(siteId) }),
    ]);
  }, [siteId, queryClient]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await handleRefresh();
    setRefreshing(false);
  }, [handleRefresh]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
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
        <DynamicRenderer
          sections={sections}
          config={config}
          data={{ tours, destinations }}
        />
        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
});
