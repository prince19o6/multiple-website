import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSite } from '@/store/SiteConfigContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { AudioPlaybackSpeed } from '../types';

interface AudioPlayerModalProps {
  visible: boolean;
  onClose: () => void;
}

const SPEED_OPTIONS: AudioPlaybackSpeed[] = [0.75, 1.0, 1.25, 1.5];

export const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { siteName } = useSite();
  const {
    currentStory,
    isPlaying,
    positionSec,
    durationSec,
    playbackSpeed,
    togglePlayPause,
    seekTo,
    skipSeconds,
    setSpeed,
    nextTrack,
    previousTrack,
    toggleSaveOffline,
  } = useAudioPlayer();

  const [showTranscript, setShowTranscript] = useState<boolean>(false);

  if (!currentStory) return null;

  const progressPercent = durationSec > 0 ? Math.min(100, (positionSec / durationSec) * 100) : 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleShareStory = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Share.share({
        title: currentStory.title,
        message: `Listen to "${currentStory.title}" (${currentStory.landmarkName || siteName}) on the ${siteName} companion app! 🎧\n\n"${currentStory.subtitle}"`,
      });
    } catch {}
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Top Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 14), borderBottomColor: colors.border }]}>
          <TouchableOpacity testID="btn-navigate" accessibilityLabel="Navigate" onPress={onClose} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-down" size={26} color={colors.heading} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerBrandText, { color: colors.primary }]}>{siteName.toUpperCase()}</Text>
            <Text style={[styles.headerTitle, { color: colors.heading }]}>Expedition Audio Story</Text>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity testID="btn-audioplayermodal-89"
              onPress={() => toggleSaveOffline(currentStory.id)}
              style={styles.headerBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={currentStory.isSavedOffline ? 'Remove offline' : 'Save offline'}
            >
              <Ionicons
                name={currentStory.isSavedOffline ? 'cloud-done' : 'cloud-download-outline'}
                size={22}
                color={currentStory.isSavedOffline ? '#10B981' : colors.heading}
              />
            </TouchableOpacity>

            <TouchableOpacity testID="btn-share" accessibilityLabel="Share" onPress={handleShareStory} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="share-outline" size={22} color={colors.heading} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Large Artwork Card */}
          <View style={styles.artworkContainer}>
            <Image
              source={{ uri: currentStory.coverImage }}
              style={styles.artwork}
              resizeMode="cover"
            />
            {/* Category Pill Tag */}
            <View style={[styles.categoryPill, { backgroundColor: 'rgba(0, 0, 0, 0.75)' }]}>
              <Ionicons name="headset" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.categoryPillText}>{currentStory.category.toUpperCase()}</Text>
            </View>
          </View>

          {/* Story Meta */}
          <View style={styles.metaBox}>
            {currentStory.landmarkName && (
              <View style={styles.landmarkRow}>
                <Ionicons name="location-sharp" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.landmarkText, { color: colors.primary }]}>
                  {currentStory.landmarkName}
                </Text>
              </View>
            )}

            <Text style={[styles.title, { color: colors.heading }]}>{currentStory.title}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>{currentStory.subtitle}</Text>

            <View style={styles.narratorRow}>
              <Ionicons name="mic-outline" size={14} color={colors.mutedText} style={{ marginRight: 5 }} />
              <Text style={[styles.narratorText, { color: colors.mutedText }]}>
                Narrated by {currentStory.narratorName} • {currentStory.formattedDuration}
              </Text>
            </View>
          </View>

          {/* Interactive Scrub Bar */}
          <View style={styles.scrubberBox}>
            <TouchableOpacity testID="btn-audioplayermodal-150" accessibilityLabel="audioplayermodal action"
              style={styles.trackTouchTarget}
              activeOpacity={1}
              onPress={(e) => {
                const { locationX } = e.nativeEvent;
                const width = 320; // approximate width
                const newRatio = Math.max(0, Math.min(1, locationX / width));
                seekTo(newRatio * durationSec);
              }}
            >
              <View style={[styles.trackBackground, { backgroundColor: `${colors.border}60` }]}>
                <View
                  style={[
                    styles.trackFill,
                    { width: `${progressPercent}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>
            </TouchableOpacity>

            <View style={styles.timeRow}>
              <Text style={[styles.timeText, { color: colors.mutedText }]}>{formatTime(positionSec)}</Text>
              <Text style={[styles.timeText, { color: colors.mutedText }]}>
                -{formatTime(Math.max(0, durationSec - positionSec))}
              </Text>
            </View>
          </View>

          {/* Primary Playback Controls */}
          <View style={styles.mainControlsRow}>
            {/* Rewind 15s */}
            <TouchableOpacity testID="btn-refresh"
              onPress={() => skipSeconds(-15)}
              style={styles.auxControlBtn}
              accessibilityLabel="Rewind 15 seconds"
            >
              <Ionicons name="refresh" size={24} color={colors.heading} style={{ transform: [{ scaleX: -1 }] }} />
              <Text style={[styles.skipSecLabel, { color: colors.heading }]}>15</Text>
            </TouchableOpacity>

            {/* Previous Track */}
            <TouchableOpacity testID="btn-play-skip-back"
              onPress={previousTrack}
              style={styles.navTrackBtn}
              accessibilityLabel="Previous track"
            >
              <Ionicons name="play-skip-back" size={26} color={colors.heading} />
            </TouchableOpacity>

            {/* Big Play / Pause Button */}
            <TouchableOpacity testID="btn-playpause"
              onPress={togglePlayPause}
              style={[styles.bigPlayBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
              accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={34}
                color="#FFFFFF"
                style={{ marginLeft: isPlaying ? 0 : 3 }}
              />
            </TouchableOpacity>

            {/* Next Track */}
            <TouchableOpacity testID="btn-play-skip-forward"
              onPress={nextTrack}
              style={styles.navTrackBtn}
              accessibilityLabel="Next track"
            >
              <Ionicons name="play-skip-forward" size={26} color={colors.heading} />
            </TouchableOpacity>

            {/* Forward 15s */}
            <TouchableOpacity testID="btn-refresh"
              onPress={() => skipSeconds(15)}
              style={styles.auxControlBtn}
              accessibilityLabel="Forward 15 seconds"
            >
              <Ionicons name="refresh" size={24} color={colors.heading} />
              <Text style={[styles.skipSecLabel, { color: colors.heading }]}>15</Text>
            </TouchableOpacity>
          </View>

          {/* Playback Speed Selector */}
          <View style={styles.speedRow}>
            <Text style={[styles.speedLabel, { color: colors.mutedText }]}>SPEED</Text>
            <View style={styles.speedChipsWrap}>
              {SPEED_OPTIONS.map((speed) => {
                const isSelected = playbackSpeed === speed;
                return (
                  <TouchableOpacity testID="btn-audioplayermodal-241" accessibilityLabel="audioplayermodal action"
                    key={speed}
                    style={[
                      styles.speedChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSpeed(speed)}
                  >
                    <Text
                      style={[
                        styles.speedChipText,
                        { color: isSelected ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {speed}x
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Synchronized Transcript Section */}
          <View style={[styles.transcriptCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity testID="btn-document-text-outline" accessibilityLabel="document text outline"
              style={styles.transcriptHeader}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                setShowTranscript(!showTranscript);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.transcriptTitleWrap}>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.transcriptTitle, { color: colors.heading }]}>Full Narration Script</Text>
              </View>
              <Ionicons
                name={showTranscript ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.mutedText}
              />
            </TouchableOpacity>

            {showTranscript && (
              <View style={styles.transcriptBody}>
                <Text style={[styles.transcriptText, { color: colors.text }]}>
                  {currentStory.transcript}
                </Text>
                <View style={[styles.transcriptFooter, { borderTopColor: colors.border }]}>
                  <Text style={[styles.transcriptFooterText, { color: colors.mutedText }]}>
                    Language: {currentStory.language.toUpperCase()} • Verified by Heritage & Cultural Trust
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerBrandText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  artworkContainer: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 320,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  categoryPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaBox: {
    width: '100%',
    maxWidth: 340,
    marginBottom: 20,
  },
  landmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  landmarkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  narratorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  narratorText: {
    fontSize: 12,
  },
  scrubberBox: {
    width: '100%',
    maxWidth: 340,
    marginBottom: 20,
  },
  trackTouchTarget: {
    height: 30,
    justifyContent: 'center',
  },
  trackBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mainControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 320,
    marginBottom: 24,
  },
  auxControlBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  skipSecLabel: {
    fontSize: 9,
    fontWeight: '800',
    position: 'absolute',
    top: 15,
  },
  navTrackBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigPlayBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 340,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  speedLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  speedChipsWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  speedChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  transcriptCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  transcriptTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transcriptTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  transcriptBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  transcriptText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  transcriptFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  transcriptFooterText: {
    fontSize: 11,
  },
});
