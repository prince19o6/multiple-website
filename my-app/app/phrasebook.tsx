import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useSite } from '@/store/SiteConfigContext';
import { usePhrasebook } from '../context/PhrasebookContext';
import { PhraseCard } from '../components/PhraseCard';
import { ShowToLocalModal } from '../components/ShowToLocalModal';
import { PhraseItem } from '../types';

export default function PhrasebookScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();
  const { siteId } = useSite();

  const {
    phrasebook,
    isLoading,
    isRefreshing,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    favoritePhraseIds,
    filteredPhrases,
    selectedPhraseForFlashcard,
    openFlashcard,
    closeFlashcard,
    toggleFavorite,
    refreshPhrasebook,
  } = usePhrasebook();

  const [isAdvisoryExpanded, setIsAdvisoryExpanded] = useState<boolean>(true);

  // Derive categories list: 'All', 'Favorites', plus dynamic categories from data
  const categoryPills = React.useMemo(() => {
    const list = ['All', 'Favorites'];
    if (phrasebook?.categories && phrasebook.categories.length > 0) {
      phrasebook.categories.forEach((cat) => {
        if (!list.includes(cat)) list.push(cat);
      });
    } else {
      list.push(
        'Essentials',
        'Dietary & Food',
        'Shopping & Bargaining',
        'Transport',
        'Temple & Etiquette',
        'Emergency'
      );
    }
    return list;
  }, [phrasebook]);

  const renderHeader = () => {
    return (
      <View style={styles.listHeaderContainer}>
        {/* Destination Dialect Banner */}
        <View
          style={[
            styles.destinationBanner,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.bannerRow}>
            <View style={[styles.langIconBox, { backgroundColor: `${colors.primary}18` }]}>
              <Ionicons name="earth" size={24} color={colors.primary} />
            </View>
            <View style={styles.bannerInfo}>
              <View style={styles.badgeRow}>
                <View style={styles.offlinePill}>
                  <Ionicons name="cloud-offline" size={11} color="#15803d" />
                  <Text style={styles.offlinePillText}>100% OFFLINE</Text>
                </View>
                <View style={[styles.dialectPill, { backgroundColor: `${colors.primary}12` }]}>
                  <Text style={[styles.dialectPillText, { color: colors.primary }]}>
                    {phrasebook?.regionDescription || 'REGIONAL DIALECT'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.destTitle, { color: colors.heading }]}>
                {phrasebook?.languageName || 'Local Language'} — {phrasebook?.nativeLanguageName || ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Cultural Etiquette & Local Bargaining Tips Banner */}
        {(phrasebook?.etiquetteTip || phrasebook?.bargainingTip) && (
          <View
            style={[
              styles.advisoryCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity testID="btn-sparkles"
              style={styles.advisoryHeader}
              onPress={() => setIsAdvisoryExpanded(!isAdvisoryExpanded)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Toggle cultural etiquette advice"
            >
              <View style={styles.advisoryTitleRow}>
                <Ionicons name="sparkles" size={18} color="#d97706" />
                <Text style={[styles.advisoryTitle, { color: colors.heading }]}>
                  Local Customs & Etiquette Guide
                </Text>
              </View>
              <Ionicons
                name={isAdvisoryExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.mutedText}
              />
            </TouchableOpacity>

            {isAdvisoryExpanded && (
              <View style={styles.advisoryBody}>
                {phrasebook?.etiquetteTip ? (
                  <View style={styles.advisorySection}>
                    <Text style={[styles.advisoryLabel, { color: colors.primary }]}>
                      CULTURAL ETIQUETTE
                    </Text>
                    <Text style={[styles.advisoryText, { color: colors.mutedText }]}>
                      {phrasebook.etiquetteTip}
                    </Text>
                  </View>
                ) : null}

                {phrasebook?.bargainingTip ? (
                  <View style={styles.advisorySection}>
                    <Text style={[styles.advisoryLabel, { color: '#0284c7' }]}>
                      BARGAINING & MARKET NORMS
                    </Text>
                    <Text style={[styles.advisoryText, { color: colors.mutedText }]}>
                      {phrasebook.bargainingTip}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        )}

        {/* Section Heading with Phrase Count */}
        <View style={styles.sectionHeadingRow}>
          <Text style={[styles.sectionHeading, { color: colors.heading }]}>
            {selectedCategory === 'Favorites'
              ? 'Saved Favorites'
              : selectedCategory === 'All'
              ? 'All Phrases'
              : selectedCategory}
          </Text>
          <Text style={[styles.sectionCount, { color: colors.mutedText }]}>
            {filteredPhrases.length} {filteredPhrases.length === 1 ? 'phrase' : 'phrases'}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.mutedText, marginTop: 12 }]}>
            Loading local phrasebook...
          </Text>
        </View>
      );
    }

    if (selectedCategory === 'Favorites' && filteredPhrases.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={48} color={colors.mutedText} />
          <Text style={[styles.emptyTitle, { color: colors.heading, marginTop: 12 }]}>
            No Starred Phrases Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
            Tap the heart icon on any essential phrase to bookmark it for quick offline access while traveling.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={48} color={colors.mutedText} />
        <Text style={[styles.emptyTitle, { color: colors.heading, marginTop: 12 }]}>
          No matching phrases found
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
          Try searching for food keywords (e.g., "vegetarian", "spicy"), transport, or price queries.
        </Text>
        {searchQuery.length > 0 && (
          <TouchableOpacity testID="btn-clear-search-query" accessibilityLabel="Clear Search Query"
            style={[styles.clearFilterBtn, { backgroundColor: `${colors.primary}15` }]}
            onPress={() => setSearchQuery('')}
          >
            <Text style={[styles.clearFilterBtnText, { color: colors.primary }]}>
              Clear Search Query
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top App Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, 12),
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.topBarRow}>
          <TouchableOpacity testID="btn-navigate"
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={colors.heading} />
          </TouchableOpacity>

          <View style={styles.topBarTitles}>
            <Text style={[styles.topBarHeading, { color: colors.heading }]}>
              Pocket Phrasebook
            </Text>
            <Text style={[styles.topBarSubheading, { color: colors.mutedText }]}>
              Show-to-Local Flashcard Translator
            </Text>
          </View>

          <TouchableOpacity testID="btn-sync-outline"
            style={styles.refreshIconBtn}
            onPress={refreshPhrasebook}
            accessibilityLabel="Reload phrasebook"
            accessibilityRole="button"
          >
            <Ionicons name="sync-outline" size={20} color={colors.heading} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.mutedText} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.heading }]}
              placeholder="Search meaning, phonetic or keywords..."
              placeholderTextColor={colors.mutedText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && Platform.OS !== 'ios' && (
              <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <Ionicons name="close-circle" size={18} color={colors.mutedText} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Horizontal Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
          style={styles.categoryScrollView}
        >
          {categoryPills.map((cat) => {
            const isSelected = selectedCategory === cat;
            const isFav = cat === 'Favorites';

            return (
              <TouchableOpacity testID="btn-wishlist-toggle" accessibilityLabel="Toggle wishlist"
                key={cat}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : `${colors.border}40`,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                {isFav && (
                  <Ionicons
                    name="heart"
                    size={13}
                    color={isSelected ? '#ffffff' : '#ef4444'}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  style={[
                    styles.categoryPillText,
                    {
                      color: isSelected ? '#ffffff' : colors.heading,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List of Phrases */}
      <FlatList
        data={filteredPhrases}
        keyExtractor={(item: PhraseItem) => item.phraseId}
        renderItem={({ item }: { item: PhraseItem }) => (
          <PhraseCard
            phrase={item}
            isFavorite={favoritePhraseIds.includes(item.phraseId)}
            onToggleFavorite={toggleFavorite}
            onShowFlashcard={openFlashcard}
            style={styles.phraseCardSpacing}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 20 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshPhrasebook}
            tintColor={colors.primary}
          />
        }
      />

      {/* Show To Local Flashcard Modal */}
      <ShowToLocalModal
        phrase={selectedPhraseForFlashcard}
        onClose={closeFlashcard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  topBarTitles: {
    flex: 1,
    marginLeft: 4,
  },
  topBarHeading: {
    fontSize: 18,
    fontWeight: '700',
  },
  topBarSubheading: {
    fontSize: 12,
    fontWeight: '400',
  },
  refreshIconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  clearSearchBtn: {
    padding: 4,
  },
  categoryScrollView: {
    paddingTop: 4,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 34,
  },
  categoryPillText: {
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listHeaderContainer: {
    marginBottom: 8,
  },
  destinationBanner: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  langIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  offlinePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
  },
  dialectPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dialectPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  destTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  advisoryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  advisoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  advisoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  advisoryTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  advisoryBody: {
    marginTop: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  advisorySection: {
    gap: 2,
  },
  advisoryLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  advisoryText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  phraseCardSpacing: {
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
  clearFilterBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  clearFilterBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
