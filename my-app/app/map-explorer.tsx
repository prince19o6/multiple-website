import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { DestinationLandmark } from '../types';
import { fetchDestinationLandmarks } from '../services/api';
import { ExpeditionMapView } from '../components/ExpeditionMapView';
import { LandmarkCard } from '../components/LandmarkCard';
import { LandmarkDetailsSheet } from '../components/LandmarkDetailsSheet';

export default function MapExplorerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ tourId?: string; tourName?: string }>();
  const tourIdFilter = params.tourId ? parseInt(params.tourId, 10) : undefined;

  const { siteId, siteName } = useSite();
  const colors = useColors();

  const [isLoading, setIsLoading] = useState(true);
  const [landmarks, setLandmarks] = useState<DestinationLandmark[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLandmark, setSelectedLandmark] = useState<DestinationLandmark | null>(null);
  const [detailsLandmark, setDetailsLandmark] = useState<DestinationLandmark | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const flatListRef = useRef<FlatList<DestinationLandmark>>(null);

  // Load landmarks from backend
  const loadLandmarks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchDestinationLandmarks(siteId, {
        tourId: tourIdFilter,
      });
      if (response && response.landmarks) {
        setLandmarks(response.landmarks);
        setCategories(['All', ...response.categories]);
        if (response.landmarks.length > 0) {
          setSelectedLandmark(response.landmarks[0]);
        }
      }
    } catch {
      // Offline fallback handling or default state
    } finally {
      setIsLoading(false);
    }
  }, [siteId, tourIdFilter]);

  useEffect(() => {
    loadLandmarks();
  }, [loadLandmarks]);

  // Filtered landmarks based on category and search
  const filteredLandmarks = useMemo(() => {
    return landmarks.filter((l) => {
      const matchCategory =
        selectedCategory === 'All' ||
        l.category.toLowerCase().includes(selectedCategory.toLowerCase());

      const matchSearch =
        !searchQuery.trim() ||
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.subtitle.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [landmarks, selectedCategory, searchQuery]);

  const handleSelectLandmarkFromMap = (landmark: DestinationLandmark) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics fallback
    }
    setSelectedLandmark(landmark);

    const index = filteredLandmarks.findIndex((l) => l.id === landmark.id);
    if (index >= 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }
  };

  const handleSelectFromCard = (landmark: DestinationLandmark) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics fallback
    }
    setSelectedLandmark(landmark);
  };

  const handleOpenDetails = (landmark: DestinationLandmark) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics fallback
    }
    setDetailsLandmark(landmark);
    setDetailsVisible(true);
  };

  const handleCategoryPress = (category: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics fallback
    }
    setSelectedCategory(category);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Floating Control Bar */}
      <View
        style={[
          styles.topBarContainer,
          {
            paddingTop: Math.max(insets.top, 10),
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <TouchableOpacity testID="btn-navigate"
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() => router.back()}
            accessibilityLabel="Back to Explorer"
          >
            <Ionicons name="arrow-back" size={20} color={colors.heading} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.heading }]}>
              {params.tourName ? `${params.tourName} Map` : 'Expedition Map Explorer'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
              {filteredLandmarks.length} Curated Waypoints • {siteName}
            </Text>
          </View>

          <TouchableOpacity testID="btn-sync-outline"
            style={[styles.refreshBtn, { backgroundColor: `${colors.primary}12` }]}
            onPress={loadLandmarks}
            accessibilityLabel="Refresh Waypoints"
          >
            <Ionicons name="sync-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.mutedText} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search landmarks, temples, islands, cities..."
            placeholderTextColor={colors.mutedText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && Platform.OS !== 'ios' && (
            <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.mutedText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Horizontal Filter Chips */}
        {categories.length > 1 && (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.categoryChipsList}
            renderItem={({ item }) => {
              const isSelected = selectedCategory === item;
              return (
                <TouchableOpacity testID="btn-map-explorer-198" accessibilityLabel="map-explorer action"
                  style={[
                    styles.categoryChip,
                    isSelected
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => handleCategoryPress(item)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected ? { color: '#FFFFFF', fontWeight: '700' } : { color: colors.heading },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* Map Body */}
      <View style={styles.mapWrapper}>
        {isLoading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedText }]}>
              Plotting expedition coordinates...
            </Text>
          </View>
        ) : (
          <ExpeditionMapView
            landmarks={filteredLandmarks}
            selectedLandmarkId={selectedLandmark?.id}
            onSelectLandmark={handleSelectLandmarkFromMap}
            primaryColor={colors.primary}
            isDarkMode={siteId.includes('techno')}
          />
        )}
      </View>

      {/* Bottom Landmark Card Carousel */}
      {filteredLandmarks.length > 0 && (
        <View
          style={[
            styles.carouselContainer,
            {
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <FlatList
            ref={flatListRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            data={filteredLandmarks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.carouselList}
            snapToInterval={332} // 320 card width + 12 margin
            decelerationRate="fast"
            getItemLayout={(_, index) => ({
              length: 332,
              offset: 332 * index,
              index,
            })}
            renderItem={({ item }) => (
              <LandmarkCard
                landmark={item}
                isSelected={selectedLandmark?.id === item.id}
                onPress={() => handleSelectFromCard(item)}
                onOpenDetails={() => handleOpenDetails(item)}
              />
            )}
          />
        </View>
      )}

      {/* Landmark Details Modal Sheet */}
      <LandmarkDetailsSheet
        landmark={detailsLandmark}
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBarContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
  },
  categoryChipsList: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mapWrapper: {
    flex: 1,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
    fontWeight: '500',
  },
  carouselContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  carouselList: {
    paddingHorizontal: 16,
  },
});
