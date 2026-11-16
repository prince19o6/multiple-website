import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSite } from '@/store/SiteConfigContext';
import { useJournal } from '../context/JournalContext';
import { JournalEntryCard } from '../components/JournalEntryCard';
import { StoryReelCard } from '../components/StoryReelCard';

export default function TravelJournalScreen() {
  const router = useRouter();
  const colors = useColors();
  const { siteId } = useSite();
  const {
    scrapbook,
    isLoading,
    isRefreshing,
    selectedDayFilter,
    setSelectedDayFilter,
    selectedMoodFilter,
    setSelectedMoodFilter,
    likedEntryIds,
    filteredEntries,
    refreshScrapbook,
    toggleLikeEntry,
    addMemoryEntry,
    shareStoryReel,
  } = useJournal();

  // Add Memory Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [locationName, setLocationName] = useState('');
  const [moodTag, setMoodTag] = useState('Awestruck');
  const [photoUrl, setPhotoUrl] = useState('');
  const [dayNumber, setDayNumber] = useState(1);

  const moodOptions = [
    'Spiritual & Serene',
    'Thrilled & Adventurous',
    'Awestruck',
    'Relaxed & Peaceful',
    'Foodie Heaven',
  ];

  const photoPresets = [
    { label: 'Temple / Heritage', url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80' },
    { label: 'Island / Ocean', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
    { label: 'Desert Sunset', url: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?auto=format&fit=crop&w=800&q=80' },
    { label: 'Skyline / Modern', url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80' },
  ];

  const handleSaveMemory = async () => {
    if (!title.trim() || !notes.trim()) {
      Alert.alert('Required Fields', 'Please enter a title and reflection notes for your memory.');
      return;
    }

    const success = await addMemoryEntry(
      title.trim(),
      notes.trim(),
      locationName.trim() || scrapbook?.destination || 'Expedition Landmark',
      moodTag,
      photoUrl.trim() || photoPresets[0].url,
      dayNumber
    );

    if (success) {
      setTitle('');
      setNotes('');
      setLocationName('');
      setPhotoUrl('');
      setIsModalVisible(false);
    }
  };

  const handleBack = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/bookings');
    }
  };

  if (isLoading && !scrapbook) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity testID="btn-navigate" style={styles.backBtn} onPress={handleBack} accessibilityLabel="Back" accessibilityRole="button">
            <Ionicons name="chevron-back" size={24} color={colors.heading} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.heading }]} numberOfLines={1}>
              Expedition Scrapbook
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]} numberOfLines={1}>
              Connecting...
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Loading expedition scrapbook & memories...
          </Text>
        </View>
      </View>
    );
  }

  if (!scrapbook) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity testID="btn-navigate" style={styles.backBtn} onPress={handleBack} accessibilityLabel="Back" accessibilityRole="button">
            <Ionicons name="chevron-back" size={24} color={colors.heading} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.heading }]} numberOfLines={1}>
              Expedition Scrapbook
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
              Memories & Stories
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <Ionicons name="book-outline" size={54} color={colors.mutedText} />
          <Text style={[styles.emptyTitle, { color: colors.heading }]}>
            No Travel Scrapbook Found
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedText }]}>
            Complete an expedition or log your first memory to begin your scrapbook.
          </Text>
          <TouchableOpacity testID="btn-retry" accessibilityLabel="Retry"
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={refreshScrapbook}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="btn-return-to-reservation" accessibilityLabel="Return to Reservation"
            style={[styles.retryBtn, { backgroundColor: `${colors.primary}18`, marginTop: 10 }]}
            onPress={handleBack}
          >
            <Text style={[styles.retryBtnText, { color: colors.primary }]}>Return to Reservation</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Days list for tabs
  const maxDays = scrapbook.stats.totalDays || 5;
  const dayTabs: (number | 'all')[] = ['all', ...Array.from({ length: maxDays }, (_, i) => i + 1)];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header Bar */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity testID="btn-navigate"
          style={styles.backBtn}
          onPress={handleBack}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={colors.heading} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.heading }]} numberOfLines={1}>
            Expedition Scrapbook
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]} numberOfLines={1}>
            {scrapbook.destination} • {scrapbook.entries.length} Memories
          </Text>
        </View>

        <TouchableOpacity testID="btn-add"
          style={[styles.addHeaderBtn, { backgroundColor: colors.primary }]}
          onPress={() => setIsModalVisible(true)}
          accessibilityLabel="Log new memory"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshScrapbook}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Hero Cover Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {scrapbook.heroCoverImage ? (
            <ExpoImage
              source={{ uri: scrapbook.heroCoverImage }}
              style={styles.heroCover}
              contentFit="cover"
              transition={300}
            />
          ) : null}

          <View style={styles.heroOverlay}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.journalBadge}>
                <Ionicons name="sparkles" size={12} color="#ffffff" />
                <Text style={styles.journalBadgeText}>DIGITAL TRAVEL JOURNAL</Text>
              </View>

              <TouchableOpacity testID="btn-share"
                style={styles.shareHeroBtn}
                onPress={shareStoryReel}
                accessibilityLabel="Share Story"
              >
                <Ionicons name="share-social-outline" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.heroTourTitle}>{scrapbook.tourName}</Text>
            <Text style={styles.heroTravelerText}>
              Expedition Journal of {scrapbook.travelerName}
            </Text>
          </View>
        </View>

        {/* Day Filter Pills */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterHeading, { color: colors.heading }]}>
            Timeline by Day
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsRow}
          >
            {dayTabs.map((day) => {
              const isSelected = selectedDayFilter === day;
              return (
                <TouchableOpacity testID="btn-travel-journal-283" accessibilityLabel="travel-journal action"
                  key={String(day)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSelectedDayFilter(day);
                  }}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      {
                        color: isSelected ? '#ffffff' : colors.heading,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {day === 'all' ? 'All Days' : `Day ${day}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Mood Filter Pills */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsRow}
          >
            {['all', ...moodOptions].map((mood) => {
              const isSelected = selectedMoodFilter === mood;
              return (
                <TouchableOpacity testID="btn-travel-journal-326" accessibilityLabel="travel-journal action"
                  key={mood}
                  style={[
                    styles.moodFilterPill,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSelectedMoodFilter(mood);
                  }}
                >
                  <Text
                    style={[
                      styles.moodFilterText,
                      {
                        color: isSelected ? '#ffffff' : colors.mutedText,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {mood === 'all' ? 'All Moods' : mood}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Official Keepsake Story Reel Card */}
        <StoryReelCard
          scrapbook={scrapbook}
          onShare={shareStoryReel}
          style={{ marginBottom: 20 }}
        />

        {/* Timeline Entries Heading */}
        <View style={styles.entriesHeaderRow}>
          <Text style={[styles.entriesHeading, { color: colors.heading }]}>
            Memories & Milestones ({filteredEntries.length})
          </Text>
          <TouchableOpacity testID="btn-camera-outline" accessibilityLabel="camera outline"
            style={[styles.addInlineBtn, { borderColor: colors.primary }]}
            onPress={() => setIsModalVisible(true)}
          >
            <Ionicons name="camera-outline" size={14} color={colors.primary} />
            <Text style={[styles.addInlineBtnText, { color: colors.primary }]}>
              Log Memory
            </Text>
          </TouchableOpacity>
        </View>

        {/* Timeline Entries List */}
        {filteredEntries.length === 0 ? (
          <View
            style={[
              styles.noEntriesBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="images-outline" size={38} color={colors.mutedText} />
            <Text style={[styles.noEntriesTitle, { color: colors.heading }]}>
              No memories matching filter
            </Text>
            <Text style={[styles.noEntriesSub, { color: colors.mutedText }]}>
              Tap "Log Memory" to record your experiences and photo moments.
            </Text>
          </View>
        ) : (
          filteredEntries.map((entry) => (
            <JournalEntryCard
              key={entry.entryId}
              entry={entry}
              isLiked={likedEntryIds.includes(entry.entryId)}
              onToggleLike={toggleLikeEntry}
            />
          ))
        )}
      </ScrollView>

      {/* Add Memory Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="journal-outline" size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.heading }]}>
                  Log Expedition Memory
                </Text>
              </View>
              <TouchableOpacity testID="btn-close"
                onPress={() => setIsModalVisible(false)}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={22} color={colors.heading} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { color: colors.heading }]}>
                Memory Title *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.heading,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g. Majestic Aarti at Gomti River"
                placeholderTextColor={colors.mutedText}
                value={title}
                onChangeText={setTitle}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.fieldLabel, { color: colors.heading }]}>
                    Day Number
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.heading,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    keyboardType="number-pad"
                    value={String(dayNumber)}
                    onChangeText={(val) => setDayNumber(parseInt(val, 10) || 1)}
                  />
                </View>

                <View style={{ flex: 2 }}>
                  <Text style={[styles.fieldLabel, { color: colors.heading }]}>
                    Landmark / Location
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.heading,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="e.g. Dwarkadhish Mandir"
                    placeholderTextColor={colors.mutedText}
                    value={locationName}
                    onChangeText={setLocationName}
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.heading }]}>
                Vibe & Mood
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.moodPillsRow}
              >
                {moodOptions.map((mood) => {
                  const isSelected = moodTag === mood;
                  return (
                    <TouchableOpacity testID="btn-travel-journal-510" accessibilityLabel="travel-journal action"
                      key={mood}
                      style={[
                        styles.moodPillBtn,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setMoodTag(mood)}
                    >
                      <Text
                        style={[
                          styles.moodPillBtnText,
                          { color: isSelected ? '#ffffff' : colors.heading },
                        ]}
                      >
                        {mood}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: colors.heading }]}>
                Photo (Presets or URL)
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoPresetsRow}
              >
                {photoPresets.map((preset) => (
                  <TouchableOpacity testID="btn-travel-journal-545" accessibilityLabel="travel-journal action"
                    key={preset.label}
                    style={[
                      styles.photoPresetBtn,
                      {
                        borderColor:
                          photoUrl === preset.url
                            ? colors.primary
                            : colors.border,
                        backgroundColor:
                          photoUrl === preset.url
                            ? `${colors.primary}15`
                            : colors.background,
                      },
                    ]}
                    onPress={() => setPhotoUrl(preset.url)}
                  >
                    <Text
                      style={[
                        styles.photoPresetText,
                        {
                          color:
                            photoUrl === preset.url
                              ? colors.primary
                              : colors.heading,
                        },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.heading,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    marginTop: 6,
                  },
                ]}
                placeholder="Or paste photo image URL..."
                placeholderTextColor={colors.mutedText}
                value={photoUrl}
                onChangeText={setPhotoUrl}
              />

              <Text style={[styles.fieldLabel, { color: colors.heading, marginTop: 12 }]}>
                Personal Reflections & Diary Notes *
              </Text>
              <TextInput
                style={[
                  styles.textarea,
                  {
                    color: colors.heading,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                multiline
                numberOfLines={4}
                placeholder="Write your reflections, sensory impressions, quotes, or travel moments..."
                placeholderTextColor={colors.mutedText}
                value={notes}
                onChangeText={setNotes}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity testID="btn-cancel" accessibilityLabel="Cancel"
                  style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={[styles.modalCancelText, { color: colors.mutedText }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity testID="btn-save-to-scrapbook" accessibilityLabel="Save to Scrapbook"
                  style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveMemory}
                >
                  <Text style={styles.modalSubmitText}>Save to Scrapbook</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  addHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 18,
    overflow: 'hidden',
    height: 200,
    marginBottom: 16,
    borderWidth: 1,
    position: 'relative',
  },
  heroCover: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 16,
    justifyContent: 'space-between',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  journalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  journalBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  shareHeroBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTourTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroTravelerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.9,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: 'center',
  },
  filterPillText: {
    fontSize: 12,
  },
  moodFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
  },
  moodFilterText: {
    fontSize: 11,
  },
  entriesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entriesHeading: {
    fontSize: 16,
    fontWeight: '700',
  },
  addInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 36,
  },
  addInlineBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  noEntriesBox: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  noEntriesTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  noEntriesSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    borderWidth: 1,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 44,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  moodPillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: 'center',
  },
  moodPillBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  photoPresetsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  photoPresetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: 'center',
  },
  photoPresetText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 16,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  modalCancelText: {
    fontWeight: '600',
    fontSize: 14,
  },
  modalSubmitBtn: {
    flex: 1.6,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  modalSubmitText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
