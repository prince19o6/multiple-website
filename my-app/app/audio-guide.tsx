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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { AudioStory, AudioStoryCategory } from '../types';
import { AudioPlayerModal } from '../components/AudioPlayerModal';

const CATEGORIES: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All Stories', icon: 'grid-outline' },
  { key: 'history', label: 'History', icon: 'time-outline' },
  { key: 'architecture', label: 'Architecture', icon: 'business-outline' },
  { key: 'legends', label: 'Legends', icon: 'sparkles-outline' },
  { key: 'nature', label: 'Nature', icon: 'leaf-outline' },
];

export default function AudioGuideScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { siteName } = useSite();
  const colors = useColors();

  const {
    stories,
    currentStory,
    isPlaying,
    playStory,
    togglePlayPause,
    toggleSaveOffline,
    isPlayerModalVisible,
    closePlayerModal,
    openPlayerModal,
    isLoading,
  } = useAudioPlayer();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyOffline, setShowOnlyOffline] = useState<boolean>(false);

  const filteredStories = stories.filter((story) => {
    if (showOnlyOffline && !story.isSavedOffline) return false;
    if (selectedCategory !== 'all' && story.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = story.title.toLowerCase().includes(q);
      const matchSubtitle = story.subtitle.toLowerCase().includes(q);
      const matchLandmark = story.landmarkName?.toLowerCase().includes(q);
      const matchNarrator = story.narratorName.toLowerCase().includes(q);
      const matchTags = story.tags.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchSubtitle || matchLandmark || matchNarrator || matchTags;
    }
    return true;
  });

  const featuredStory = stories[0];

  const handlePlayStory = (story: AudioStory) => {
    if (currentStory?.id === story.id) {
      togglePlayPause();
    } else {
      playStory(story);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 12),
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity testID="btn-navigate"
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() => router.back()}
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.heading} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.heading }]}>Audio Guide & Stories</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
              {stories.length} Narratives • {siteName}
            </Text>
          </View>

          <TouchableOpacity testID="btn-audio-guide-107" accessibilityLabel="audio-guide action"
            style={[
              styles.offlineToggleBtn,
              {
                backgroundColor: showOnlyOffline ? `${colors.primary}18` : colors.background,
                borderColor: showOnlyOffline ? colors.primary : colors.border,
              },
            ]}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              setShowOnlyOffline(!showOnlyOffline);
            }}
          >
            <Ionicons
              name={showOnlyOffline ? 'cloud-done' : 'cloud-download-outline'}
              size={16}
              color={showOnlyOffline ? colors.primary : colors.mutedText}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.offlineToggleText,
                { color: showOnlyOffline ? colors.primary : colors.mutedText },
              ]}
            >
              Offline
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search" size={17} color={colors.mutedText} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.heading }]}
            placeholder="Search audio stories, landmarks, narrators..."
            placeholderTextColor={colors.mutedText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.mutedText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <TouchableOpacity testID="btn-audio-guide-162" accessibilityLabel="audio-guide action"
                key={cat.key}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.background,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  setSelectedCategory(cat.key);
                }}
              >
                <Ionicons
                  name={cat.icon}
                  size={13}
                  color={isSelected ? '#FFFFFF' : colors.text}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.categoryPillText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedText }]}>Loading narrated stories...</Text>
          </View>
        ) : (
          <>
            {/* Featured Story Card (if no search active) */}
            {!searchQuery && selectedCategory === 'all' && !showOnlyOffline && featuredStory && (
              <TouchableOpacity testID="btn-audio-guide-207" accessibilityLabel="audio-guide action"
                style={[styles.featuredCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => playStory(featuredStory)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: featuredStory.coverImage }}
                  style={styles.featuredImage}
                  resizeMode="cover"
                />
                <View style={styles.featuredOverlay}>
                  <View style={styles.featuredBadgeRow}>
                    <View style={styles.featuredBadge}>
                      <Ionicons name="star" size={12} color="#F59E0B" style={{ marginRight: 4 }} />
                      <Text style={styles.featuredBadgeText}>FEATURED AUDIO</Text>
                    </View>
                    <View style={styles.durationPill}>
                      <Ionicons name="time-outline" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.durationPillText}>{featuredStory.formattedDuration}</Text>
                    </View>
                  </View>

                  <Text style={styles.featuredTitle}>{featuredStory.title}</Text>
                  <Text style={styles.featuredSubtitle} numberOfLines={2}>
                    {featuredStory.subtitle}
                  </Text>

                  <View style={styles.featuredActionRow}>
                    <View style={[styles.playFab, { backgroundColor: colors.primary }]}>
                      <Ionicons
                        name={currentStory?.id === featuredStory.id && isPlaying ? 'pause' : 'play'}
                        size={18}
                        color="#FFFFFF"
                      />
                      <Text style={styles.playFabText}>
                        {currentStory?.id === featuredStory.id && isPlaying ? 'Pause' : 'Listen Now'}
                      </Text>
                    </View>

                    <Text style={styles.narratorTag}>By {featuredStory.narratorName}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Stories Section Title */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.heading }]}>
                {showOnlyOffline
                  ? `Saved Offline Stories (${filteredStories.length})`
                  : selectedCategory === 'all'
                  ? `All Expedition Audio Guides (${filteredStories.length})`
                  : `${CATEGORIES.find((c) => c.key === selectedCategory)?.label || ''} Guides (${filteredStories.length})`}
              </Text>
            </View>

            {/* Stories List */}
            {filteredStories.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="headset-outline" size={44} color={colors.mutedText} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyTitle, { color: colors.heading }]}>No Audio Stories Found</Text>
                <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
                  {showOnlyOffline
                    ? 'You have not saved any audio stories for offline playback yet.'
                    : 'No matching audio narratives found for your search query.'}
                </Text>
              </View>
            ) : (
              filteredStories.map((story) => {
                const isCurrent = currentStory?.id === story.id;
                const isThisPlaying = isCurrent && isPlaying;

                return (
                  <TouchableOpacity testID="btn-audio-guide-280" accessibilityLabel="audio-guide action"
                    key={story.id}
                    style={[
                      styles.storyCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: isCurrent ? colors.primary : colors.border,
                        borderWidth: isCurrent ? 2 : 1,
                      },
                    ]}
                    onPress={() => handlePlayStory(story)}
                    activeOpacity={0.8}
                  >
                    {/* Thumbnail */}
                    <View style={styles.thumbWrap}>
                      <Image source={{ uri: story.coverImage }} style={styles.storyThumb} resizeMode="cover" />
                      {isThisPlaying && (
                        <View style={styles.playingOverlay}>
                          <Ionicons name="volume-high" size={20} color="#FFFFFF" />
                        </View>
                      )}
                    </View>

                    {/* Meta */}
                    <View style={styles.storyInfo}>
                      <View style={styles.storyTopRow}>
                        <View style={[styles.storyCatBadge, { backgroundColor: `${colors.primary}12` }]}>
                          <Text style={[styles.storyCatText, { color: colors.primary }]}>
                            {story.category.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={[styles.storyDuration, { color: colors.mutedText }]}>
                          {story.formattedDuration}
                        </Text>
                      </View>

                      <Text style={[styles.storyTitle, { color: colors.heading }]} numberOfLines={2}>
                        {story.title}
                      </Text>

                      {story.landmarkName && (
                        <View style={styles.storyLandmarkRow}>
                          <Ionicons name="location-outline" size={11} color={colors.mutedText} style={{ marginRight: 3 }} />
                          <Text style={[styles.storyLandmark, { color: colors.mutedText }]} numberOfLines={1}>
                            {story.landmarkName}
                          </Text>
                        </View>
                      )}

                      <View style={styles.storyFooterRow}>
                        <Text style={[styles.storyNarrator, { color: colors.mutedText }]}>
                          Voice: {story.narratorName}
                        </Text>
                      </View>
                    </View>

                    {/* Actions Column */}
                    <View style={styles.storyActions}>
                      <TouchableOpacity testID="btn-audio-guide-338" accessibilityLabel="audio-guide action"
                        style={[
                          styles.playIconBtn,
                          { backgroundColor: isThisPlaying ? colors.primary : `${colors.primary}15` },
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handlePlayStory(story);
                        }}
                      >
                        <Ionicons
                          name={isThisPlaying ? 'pause' : 'play'}
                          size={16}
                          color={isThisPlaying ? '#FFFFFF' : colors.primary}
                          style={{ marginLeft: isThisPlaying ? 0 : 2 }}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity testID="btn-audio-guide-356" accessibilityLabel="audio-guide action"
                        style={styles.saveOfflineBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleSaveOffline(story.id);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={story.isSavedOffline ? 'cloud-done' : 'cloud-download-outline'}
                          size={18}
                          color={story.isSavedOffline ? '#10B981' : colors.mutedText}
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* Full-screen Player Modal */}
      <AudioPlayerModal visible={isPlayerModalVisible} onClose={closePlayerModal} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  offlineToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  offlineToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
  },
  featuredCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    height: 220,
    marginBottom: 20,
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 16,
    justifyContent: 'flex-end',
  },
  featuredBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  featuredBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  durationPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  featuredTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  featuredSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  featuredActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playFab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
  },
  playFabText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  narratorTag: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  storyCard: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  thumbWrap: {
    position: 'relative',
    marginRight: 12,
  },
  storyThumb: {
    width: 68,
    height: 68,
    borderRadius: 12,
  },
  playingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyInfo: {
    flex: 1,
    marginRight: 8,
  },
  storyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  storyCatBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  storyCatText: {
    fontSize: 9,
    fontWeight: '800',
  },
  storyDuration: {
    fontSize: 11,
  },
  storyTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 3,
  },
  storyLandmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  storyLandmark: {
    fontSize: 11,
  },
  storyFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyNarrator: {
    fontSize: 10,
  },
  storyActions: {
    alignItems: 'center',
    gap: 8,
  },
  playIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveOfflineBtn: {
    padding: 4,
  },
});
