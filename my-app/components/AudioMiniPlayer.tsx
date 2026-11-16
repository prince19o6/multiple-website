import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';

export const AudioMiniPlayer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const {
    currentStory,
    isPlaying,
    positionSec,
    durationSec,
    togglePlayPause,
    openPlayerModal,
    nextTrack,
  } = useAudioPlayer();

  if (!currentStory) return null;

  const progressPercent = durationSec > 0 ? Math.min(100, (positionSec / durationSec) * 100) : 0;

  // Position above bottom tab bar
  const bottomOffset = Platform.OS === 'ios' ? Math.max(insets.bottom, 20) + 52 : 64;

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]}>
      <TouchableOpacity testID="btn-openplayermodal"
        style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={openPlayerModal}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Now Playing: ${currentStory.title}`}
      >
        {/* Progress Line on top edge */}
        <View style={[styles.progressTrack, { backgroundColor: `${colors.border}60` }]}>
          <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
        </View>

        <View style={styles.contentRow}>
          {/* Cover Thumbnail */}
          <Image
            source={{ uri: currentStory.coverImage }}
            style={styles.thumbnail}
            resizeMode="cover"
          />

          {/* Info */}
          <View style={styles.textWrap}>
            <Text style={[styles.title, { color: colors.heading }]} numberOfLines={1}>
              {currentStory.title}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
              {currentStory.landmarkName || currentStory.narratorName}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity testID="btn-audiominiplayer-70"
              onPress={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              style={[styles.playBtn, { backgroundColor: colors.primary }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={18}
                color="#FFFFFF"
                style={{ marginLeft: isPlaying ? 0 : 2 }}
              />
            </TouchableOpacity>

            <TouchableOpacity testID="btn-play-skip-forward"
              onPress={(e) => {
                e.stopPropagation();
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                nextTrack();
              }}
              style={styles.nextBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Next story"
            >
              <Ionicons name="play-skip-forward" size={18} color={colors.heading} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 999,
  },
  container: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  progressTrack: {
    height: 3,
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  thumbnail: {
    width: 42,
    height: 42,
    borderRadius: 8,
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
