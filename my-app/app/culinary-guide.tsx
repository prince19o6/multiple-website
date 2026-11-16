import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { useCulinary } from '../context/CulinaryContext';
import { DietaryPreference, DiningSpot } from '../types';
import { TableReservationModal } from '../components/TableReservationModal';
import { FeatureGuard } from '@/components/common/FeatureGuard';

type ExplorerTab = 'dishes' | 'spots' | 'etiquette';

function CulinaryGuideContent() {
  const router = useRouter();
  const colors = useColors();
  const { siteId, siteName } = useSite();
  const config = useSiteConfig();

  const {
    currentTrail,
    allTrails,
    selectedDestinationId,
    selectedDietaryFilter,
    searchQuery,
    isLoading,
    isRefreshing,
    activeReservationSpot,
    selectDestination,
    setDietaryFilter,
    setSearchQuery,
    refreshTrails,
    openReservationModal,
    closeReservationModal,
    filteredDishes,
    filteredDiningSpots,
  } = useCulinary();

  const params = useLocalSearchParams<{ city?: string; dietary?: string }>();

  React.useEffect(() => {
    if (params.city) {
      selectDestination(params.city);
    }
    if (params.dietary) {
      setDietaryFilter(params.dietary as DietaryPreference);
    }
  }, [params.city, params.dietary, selectDestination, setDietaryFilter]);

  const [activeTab, setActiveTab] = useState<ExplorerTab>('dishes');

  const dietaryFilterOptions: { key: DietaryPreference; label: string; icon: string }[] = [
    { key: 'all', label: 'All Flavors', icon: 'sparkles-outline' },
    { key: 'pure_veg', label: '100% Pure Veg', icon: 'leaf-outline' },
    { key: 'jain', label: 'Jain Friendly', icon: 'shield-checkmark-outline' },
    { key: 'halal', label: 'Halal Certified', icon: 'moon-outline' },
    { key: 'vegan', label: 'Vegan', icon: 'nutrition-outline' },
    { key: 'gluten_free', label: 'Gluten-Free', icon: 'fitness-outline' },
    { key: 'seafood', label: 'Coastal Seafood', icon: 'water-outline' },
  ];

  const handleOpenMaps = (spot: DiningSpot) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(spot.name)}@${spot.latitude},${spot.longitude}`,
      android: `geo:0,0?q=${spot.latitude},${spot.longitude}(${encodeURIComponent(spot.name)})`,
      default: `https://maps.google.com/?q=${spot.latitude},${spot.longitude}`,
    });
    Linking.openURL(url || `https://maps.google.com/?q=${spot.latitude},${spot.longitude}`);
  };

  const handleCallSpot = (phoneNumber: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`);
  };

  const brandHeroTitle =
    (config as any)?.content?.culinaryTitle ||
    (config as any)?.culinaryGuide?.title ||
    `${siteName} Curated Culinary Guide`;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={[styles.navHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity testID="btn-navigate"
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={[styles.headerTitle, { color: colors.heading }]} numberOfLines={1}>
            Culinary Trail & Dining
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.primary }]}>
            {brandHeroTitle}
          </Text>
        </View>

        <TouchableOpacity testID="btn-refresh"
          style={styles.refreshBtn}
          onPress={refreshTrails}
          accessibilityRole="button"
          accessibilityLabel="Refresh culinary data"
        >
          <Ionicons name="refresh" size={20} color={colors.mutedText} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshTrails} tintColor={colors.primary} />}
      >
        {/* Destination Switcher Carousel */}
        {allTrails.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.destinationTabsReel}
          >
            {allTrails.map((trail) => {
              const isSelected = trail.destinationId === selectedDestinationId;
              return (
                <TouchableOpacity testID="btn-location-outline" accessibilityLabel="location outline"
                  key={trail.destinationId}
                  style={[
                    styles.destinationTab,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => selectDestination(trail.destinationId)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={isSelected ? '#ffffff' : colors.mutedText}
                  />
                  <Text
                    style={[
                      styles.destinationTabText,
                      { color: isSelected ? '#ffffff' : colors.text },
                    ]}
                  >
                    {trail.destinationName.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        {/* Hero Atmosphere Banner */}
        {currentTrail ? (
          <View style={[styles.heroCard, { borderColor: colors.border }]}>
            <Image source={{ uri: currentTrail.heroImageUrl }} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroOverlay}>
              <View style={[styles.heroTagBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="flame" size={13} color="#ffffff" />
                <Text style={styles.heroTagText}>Regional Specialties</Text>
              </View>
              <Text style={styles.heroTitle}>{currentTrail.destinationName}</Text>
              <Text style={styles.heroTagline}>{currentTrail.tagline}</Text>
            </View>
          </View>
        ) : null}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.mutedText} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search dishes, thalis, cafes, or ingredients..."
              placeholderTextColor={colors.mutedText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery ? (
              <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={() => setSearchQuery('')} accessibilityRole="button">
                <Ionicons name="close-circle" size={18} color={colors.mutedText} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Dietary Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsReel}
        >
          {dietaryFilterOptions.map((opt) => {
            const isSelected = selectedDietaryFilter === opt.key;
            return (
              <TouchableOpacity testID="btn-culinary-guide-208" accessibilityLabel="culinary-guide action"
                key={opt.key}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setDietaryFilter(opt.key)}
                accessibilityRole="button"
              >
                <Ionicons
                  name={opt.icon as unknown as keyof typeof Ionicons.glyphMap}
                  size={14}
                  color={isSelected ? '#ffffff' : colors.mutedText}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#ffffff' : colors.text },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Segmented Control Bar (3 Sections) */}
        <View style={[styles.segmentedBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity testID="btn-restaurant-outline" accessibilityLabel="restaurant outline"
            style={[
              styles.segmentBtn,
              activeTab === 'dishes' && [styles.segmentBtnActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('dishes');
            }}
            accessibilityRole="tab"
          >
            <Ionicons
              name="restaurant-outline"
              size={16}
              color={activeTab === 'dishes' ? '#ffffff' : colors.mutedText}
            />
            <Text
              style={[
                styles.segmentBtnText,
                { color: activeTab === 'dishes' ? '#ffffff' : colors.mutedText },
              ]}
            >
              Iconic Dishes ({filteredDishes.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity testID="btn-cafe-outline" accessibilityLabel="cafe outline"
            style={[
              styles.segmentBtn,
              activeTab === 'spots' && [styles.segmentBtnActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('spots');
            }}
            accessibilityRole="tab"
          >
            <Ionicons
              name="cafe-outline"
              size={16}
              color={activeTab === 'spots' ? '#ffffff' : colors.mutedText}
            />
            <Text
              style={[
                styles.segmentBtnText,
                { color: activeTab === 'spots' ? '#ffffff' : colors.mutedText },
              ]}
            >
              Dining Spots ({filteredDiningSpots.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity testID="btn-shield-checkmark-outline" accessibilityLabel="shield checkmark outline"
            style={[
              styles.segmentBtn,
              activeTab === 'etiquette' && [styles.segmentBtnActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('etiquette');
            }}
            accessibilityRole="tab"
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={activeTab === 'etiquette' ? '#ffffff' : colors.mutedText}
            />
            <Text
              style={[
                styles.segmentBtnText,
                { color: activeTab === 'etiquette' ? '#ffffff' : colors.mutedText },
              ]}
            >
              Food Etiquette
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading Spinner */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedText }]}>
              Gathering regional recipes & authentic tasting spots...
            </Text>
          </View>
        ) : null}

        {/* ─── TAB 1: ICONIC DISHES ─── */}
        {!isLoading && activeTab === 'dishes' ? (
          <View style={styles.dishesList}>
            {filteredDishes.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="search-outline" size={40} color={colors.mutedText} />
                <Text style={[styles.emptyTitle, { color: colors.heading }]}>No dishes found</Text>
                <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
                  Try clearing your search query or adjusting dietary filters.
                </Text>
              </View>
            ) : (
              filteredDishes.map((dish) => {
                return (
                  <View
                    key={dish.id}
                    style={[styles.dishCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Image source={{ uri: dish.imageUrl }} style={styles.dishCardImage} resizeMode="cover" />

                    <View style={styles.dishCardBody}>
                      <View style={styles.dishCardHeader}>
                        <View style={styles.dishTitleCol}>
                          <Text style={[styles.dishCardTitle, { color: colors.heading }]}>
                            {dish.name}
                          </Text>
                          <Text style={[styles.dishCardLocalTitle, { color: colors.primary }]}>
                            {dish.localName}
                          </Text>
                        </View>
                        <View style={[styles.priceTag, { backgroundColor: colors.primary + '14' }]}>
                          <Text style={[styles.priceTagText, { color: colors.primary }]}>
                            {dish.estimatedPrice}
                          </Text>
                        </View>
                      </View>

                      {/* Spice Level & Badges */}
                      <View style={styles.badgesReel}>
                        <View style={[styles.spiceBadge, { backgroundColor: '#f9731618' }]}>
                          <Text style={styles.spiceBadgeLabel}>Spice:</Text>
                          <View style={styles.chiliGroup}>
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Ionicons
                                key={idx}
                                name="flame"
                                size={13}
                                color={idx < dish.spiceLevel ? '#ea580c' : '#d1d5db'}
                              />
                            ))}
                          </View>
                        </View>

                        {dish.dietaryBadges.map((badge) => (
                          <View
                            key={badge}
                            style={[styles.dietaryBadge, { backgroundColor: colors.border + '50' }]}
                          >
                            <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                            <Text style={[styles.dietaryBadgeText, { color: colors.text }]}>
                              {badge}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <Text style={[styles.dishDescription, { color: colors.mutedText }]}>
                        {dish.description}
                      </Text>

                      {/* Cultural Heritage Story Box */}
                      {dish.culturalStory ? (
                        <View style={[styles.storyCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                          <Ionicons name="book-outline" size={15} color={colors.primary} />
                          <Text style={[styles.storyText, { color: colors.text }]}>
                            {dish.culturalStory}
                          </Text>
                        </View>
                      ) : null}

                      {/* Signature Pairing & Best Neighborhood */}
                      <View style={[styles.dishFooterRow, { borderTopColor: colors.border }]}>
                        <View style={styles.footerInfoItem}>
                          <Ionicons name="compass-outline" size={15} color={colors.mutedText} />
                          <Text style={[styles.footerInfoText, { color: colors.mutedText }]}>
                            {dish.bestNeighborhoodToTry}
                          </Text>
                        </View>

                        {dish.signaturePairing ? (
                          <View style={styles.footerInfoItem}>
                            <Ionicons name="wine-outline" size={15} color={colors.mutedText} />
                            <Text style={[styles.footerInfoText, { color: colors.mutedText }]}>
                              Pair with: {dish.signaturePairing}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        {/* ─── TAB 2: DINING SPOTS & TABLE BOOKING ─── */}
        {!isLoading && activeTab === 'spots' ? (
          <View style={styles.spotsList}>
            {filteredDiningSpots.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="restaurant-outline" size={40} color={colors.mutedText} />
                <Text style={[styles.emptyTitle, { color: colors.heading }]}>No dining spots match filters</Text>
                <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
                  Try clearing your dietary criteria.
                </Text>
              </View>
            ) : (
              filteredDiningSpots.map((spot) => {
                return (
                  <View
                    key={spot.id}
                    style={[styles.spotCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={styles.spotHeader}>
                      <View style={styles.spotTitleGroup}>
                        <Text style={[styles.spotName, { color: colors.heading }]}>{spot.name}</Text>
                        <Text style={[styles.spotCuisine, { color: colors.primary }]}>
                          {spot.cuisineType} • {spot.priceTier}
                        </Text>
                      </View>
                    </View>

                    {/* Rating & Atmosphere Badge */}
                    <View style={styles.metaRow}>
                      <View style={[styles.ratingPill, { backgroundColor: '#10b98120' }]}>
                        <Ionicons name="star" size={13} color="#10b981" />
                        <Text style={styles.ratingText}>{spot.rating.toFixed(1)}</Text>
                        <Text style={styles.reviewCountText}>({spot.reviewCount} reviews)</Text>
                      </View>

                      <View style={[styles.atmospherePill, { backgroundColor: colors.primary + '14' }]}>
                        <Text style={[styles.atmosphereText, { color: colors.primary }]}>
                          {spot.atmosphere}
                        </Text>
                      </View>
                    </View>

                    {/* Address & Hours */}
                    <View style={styles.spotInfoRow}>
                      <Ionicons name="location-outline" size={15} color={colors.mutedText} />
                      <Text style={[styles.spotAddressText, { color: colors.mutedText }]}>
                        {spot.address}
                      </Text>
                    </View>

                    <View style={styles.spotInfoRow}>
                      <Ionicons name="time-outline" size={15} color={colors.mutedText} />
                      <Text style={[styles.spotAddressText, { color: colors.mutedText }]}>
                        {spot.openingHours}
                      </Text>
                    </View>

                    {/* Dietary Certifications */}
                    <View style={styles.certificationsReel}>
                      {spot.dietaryCertifications.map((cert) => (
                        <View
                          key={cert}
                          style={[styles.certBadge, { backgroundColor: '#10b98115', borderColor: '#10b98140' }]}
                        >
                          <Ionicons name="shield-checkmark" size={12} color="#10b981" />
                          <Text style={styles.certBadgeText}>{cert}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Signature Dishes */}
                    <View style={styles.signatureBox}>
                      <Text style={[styles.signatureLabel, { color: colors.mutedText }]}>
                        Must Order:
                      </Text>
                      <View style={styles.signaturePillsGroup}>
                        {spot.signatureDishes.map((dish) => (
                          <View
                            key={dish}
                            style={[styles.signaturePill, { backgroundColor: colors.background, borderColor: colors.border }]}
                          >
                            <Ionicons name="restaurant-outline" size={11} color={colors.primary} />
                            <Text style={[styles.signaturePillText, { color: colors.text }]}>{dish}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Action Buttons: Call, Maps & Reserve */}
                    <View style={[styles.spotActionRow, { borderTopColor: colors.border }]}>
                      {spot.phoneNumber ? (
                        <TouchableOpacity testID="btn-call-outline"
                          style={[styles.spotActionBtn, { borderColor: colors.border }]}
                          onPress={() => handleCallSpot(spot.phoneNumber)}
                          accessibilityRole="button"
                          accessibilityLabel="Call restaurant"
                        >
                          <Ionicons name="call-outline" size={16} color={colors.text} />
                          <Text style={[styles.spotActionBtnText, { color: colors.text }]}>Call</Text>
                        </TouchableOpacity>
                      ) : null}

                      <TouchableOpacity testID="btn-navigate-outline"
                        style={[styles.spotActionBtn, { borderColor: colors.border }]}
                        onPress={() => handleOpenMaps(spot)}
                        accessibilityRole="button"
                        accessibilityLabel="Open maps directions"
                      >
                        <Ionicons name="navigate-outline" size={16} color={colors.text} />
                        <Text style={[styles.spotActionBtnText, { color: colors.text }]}>Map</Text>
                      </TouchableOpacity>

                      <TouchableOpacity testID="btn-calendar-outline"
                        style={[styles.reserveTableBtn, { backgroundColor: colors.primary }]}
                        onPress={() => openReservationModal(spot)}
                        accessibilityRole="button"
                        accessibilityLabel="Reserve table"
                      >
                        <Ionicons name="calendar-outline" size={16} color="#ffffff" />
                        <Text style={styles.reserveTableBtnText}>Reserve Table</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        {/* ─── TAB 3: FOOD SAFETY & ETIQUETTE ─── */}
        {!isLoading && activeTab === 'etiquette' && currentTrail ? (
          <View style={styles.etiquetteSection}>
            {/* Water Safety Card */}
            <View style={[styles.etiquetteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconBadge, { backgroundColor: '#3b82f618' }]}>
                  <Ionicons name="water" size={20} color="#3b82f6" />
                </View>
                <Text style={[styles.etiquetteCardTitle, { color: colors.heading }]}>
                  Drinking Water Safety
                </Text>
              </View>
              <Text style={[styles.etiquetteBodyText, { color: colors.mutedText }]}>
                {currentTrail.etiquette.waterSafetyGuide}
              </Text>
            </View>

            {/* Street Food Hygiene Tips */}
            <View style={[styles.etiquetteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconBadge, { backgroundColor: '#10b98118' }]}>
                  <Ionicons name="shield-checkmark" size={20} color="#10b981" />
                </View>
                <Text style={[styles.etiquetteCardTitle, { color: colors.heading }]}>
                  Street Food Inspection Tips
                </Text>
              </View>
              {currentTrail.etiquette.streetFoodHygieneTips.map((tip, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" style={styles.bulletIcon} />
                  <Text style={[styles.bulletText, { color: colors.text }]}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* Cultural Dining Do's and Don'ts */}
            <View style={[styles.etiquetteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconBadge, { backgroundColor: colors.primary + '18' }]}>
                  <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.etiquetteCardTitle, { color: colors.heading }]}>
                  Cultural Dining Etiquette
                </Text>
              </View>

              <Text style={[styles.subGroupTitle, { color: '#10b981' }]}>Recommended Practices (Do's)</Text>
              {currentTrail.etiquette.dos.map((item, idx) => (
                <View key={`do-${idx}`} style={styles.bulletRow}>
                  <Ionicons name="checkmark-done" size={16} color="#10b981" style={styles.bulletIcon} />
                  <Text style={[styles.bulletText, { color: colors.text }]}>{item}</Text>
                </View>
              ))}

              <Text style={[styles.subGroupTitle, { color: '#ef4444', marginTop: 14 }]}>
                Practices to Avoid (Don'ts)
              </Text>
              {currentTrail.etiquette.donts.map((item, idx) => (
                <View key={`dont-${idx}`} style={styles.bulletRow}>
                  <Ionicons name="close-circle" size={16} color="#ef4444" style={styles.bulletIcon} />
                  <Text style={[styles.bulletText, { color: colors.text }]}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Tipping Norms */}
            <View style={[styles.etiquetteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconBadge, { backgroundColor: '#f59e0b18' }]}>
                  <Ionicons name="cash-outline" size={20} color="#f59e0b" />
                </View>
                <Text style={[styles.etiquetteCardTitle, { color: colors.heading }]}>
                  Tipping & Gratuity Culture
                </Text>
              </View>
              <Text style={[styles.etiquetteBodyText, { color: colors.mutedText }]}>
                {currentTrail.etiquette.tippingGuidelines}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Table Reservation Interactive Modal */}
      <TableReservationModal
        spot={activeReservationSpot}
        visible={Boolean(activeReservationSpot)}
        onClose={closeReservationModal}
      />
    </SafeAreaView>
  );
}

export default function CulinaryGuideScreen() {
  return (
    <FeatureGuard featureId="restaurants">
      <CulinaryGuideContent />
    </FeatureGuard>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleGroup: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  refreshBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  destinationTabsReel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  destinationTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    minHeight: 38,
  },
  destinationTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
    height: 170,
    borderWidth: 1,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    padding: 16,
    justifyContent: 'flex-end',
  },
  heroTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginBottom: 6,
  },
  heroTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  heroTagline: {
    color: '#f3f4f6',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
  },
  filterChipsReel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    minHeight: 36,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  segmentedBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    minHeight: 40,
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  dishesList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  dishCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  dishCardImage: {
    width: '100%',
    height: 180,
  },
  dishCardBody: {
    padding: 16,
  },
  dishCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dishTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  dishCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  dishCardLocalTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  priceTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  priceTagText: {
    fontSize: 12,
    fontWeight: '800',
  },
  badgesReel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 10,
    alignItems: 'center',
  },
  spiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  spiceBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ea580c',
  },
  chiliGroup: {
    flexDirection: 'row',
  },
  dietaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  dietaryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dishDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  storyCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
  },
  storyText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
    fontStyle: 'italic',
  },
  dishFooterRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 6,
  },
  footerInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerInfoText: {
    fontSize: 12,
  },
  spotsList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  spotCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  spotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  spotTitleGroup: {
    flex: 1,
    marginRight: 8,
  },
  spotName: {
    fontSize: 16,
    fontWeight: '800',
  },
  spotCuisine: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10b981',
  },
  reviewCountText: {
    fontSize: 11,
    color: '#10b981',
  },
  atmospherePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  atmosphereText: {
    fontSize: 11,
    fontWeight: '700',
  },
  spotInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  spotAddressText: {
    fontSize: 12,
    flex: 1,
  },
  certificationsReel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  certBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  signatureBox: {
    marginTop: 12,
  },
  signatureLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  signaturePillsGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  signaturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  signaturePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  spotActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 12,
    gap: 8,
  },
  spotActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 44,
    gap: 6,
  },
  spotActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reserveTableBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    minHeight: 44,
    gap: 6,
  },
  reserveTableBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  etiquetteSection: {
    paddingHorizontal: 16,
    gap: 14,
  },
  etiquetteCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  etiquetteCardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  etiquetteBodyText: {
    fontSize: 13,
    lineHeight: 19,
  },
  subGroupTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 6,
  },
  bulletIcon: {
    marginTop: 2,
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
