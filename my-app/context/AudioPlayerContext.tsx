import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import { AudioStory, AudioPlaybackSpeed } from '../types';
import { fetchAudioStories, recordAudioStoryListen } from '../services/api';
import { storeGetObject, storeSetObject } from '../src/lib/storage';

interface AudioPlayerContextType {
  stories: AudioStory[];
  currentStory: AudioStory | null;
  isPlaying: boolean;
  positionSec: number;
  durationSec: number;
  playbackSpeed: AudioPlaybackSpeed;
  isPlayerModalVisible: boolean;
  savedOfflineIds: string[];
  isLoading: boolean;
  playStory: (story: AudioStory) => void;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => void;
  skipSeconds: (delta: number) => void;
  setSpeed: (speed: AudioPlaybackSpeed) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  toggleSaveOffline: (storyId: string) => Promise<void>;
  openPlayerModal: () => void;
  closePlayerModal: () => void;
  refreshStories: () => Promise<void>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

const getSavedAudioStorageKey = (siteId: string) => `@toursapp_audio_saved:${siteId}`;

export const AudioPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [stories, setStories] = useState<AudioStory[]>([]);
  const [currentStory, setCurrentStory] = useState<AudioStory | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [positionSec, setPositionSec] = useState<number>(0);
  const [durationSec, setDurationSec] = useState<number>(180);
  const [playbackSpeed, setPlaybackSpeed] = useState<AudioPlaybackSpeed>(1.0);
  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState<boolean>(false);
  const [savedOfflineIds, setSavedOfflineIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const playbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load stories & offline saved IDs
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedStories, saved] = await Promise.all([
        fetchAudioStories(undefined, siteId).catch(() => []),
        storeGetObject<string[]>(getSavedAudioStorageKey(siteId)).catch(() => []),
      ]);

      const savedList = saved || [];
      setSavedOfflineIds(savedList);

      const enhanced = (fetchedStories || []).map((s) => ({
        ...s,
        isSavedOffline: savedList.includes(s.id),
      }));

      setStories(enhanced);
    } catch {
      // offline fallback
    } finally {
      setIsLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Audio Playback Timer
  useEffect(() => {
    if (isPlaying && currentStory) {
      playbackTimerRef.current = setInterval(() => {
        setPositionSec((prev) => {
          const next = prev + 1 * playbackSpeed;
          if (next >= durationSec) {
            setIsPlaying(false);
            return durationSec;
          }
          return next;
        });
      }, 1000);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    }

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    };
  }, [isPlaying, currentStory, durationSec, playbackSpeed]);

  const playStory = useCallback((story: AudioStory) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setCurrentStory(story);
    setPositionSec(0);
    setDurationSec(story.durationSeconds || 180);
    setIsPlaying(true);

    // Record engagement asynchronously
    recordAudioStoryListen(story.id, 0, siteId).catch(() => {});
  }, [siteId]);

  const togglePlayPause = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    setIsPlaying((prev) => !prev);
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, durationSec));
    setPositionSec(clamped);
  }, [durationSec]);

  const skipSeconds = useCallback((delta: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    setPositionSec((prev) => Math.max(0, Math.min(prev + delta, durationSec)));
  }, [durationSec]);

  const setSpeed = useCallback((speed: AudioPlaybackSpeed) => {
    try {
      Haptics.selectionAsync();
    } catch {}

    setPlaybackSpeed(speed);
  }, []);

  const nextTrack = useCallback(() => {
    if (!currentStory || stories.length === 0) return;
    const currentIndex = stories.findIndex((s) => s.id === currentStory.id);
    const nextIndex = (currentIndex + 1) % stories.length;
    playStory(stories[nextIndex]);
  }, [currentStory, stories, playStory]);

  const previousTrack = useCallback(() => {
    if (!currentStory || stories.length === 0) return;
    const currentIndex = stories.findIndex((s) => s.id === currentStory.id);
    const prevIndex = (currentIndex - 1 + stories.length) % stories.length;
    playStory(stories[prevIndex]);
  }, [currentStory, stories, playStory]);

  const toggleSaveOffline = useCallback(async (storyId: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const isSaved = savedOfflineIds.includes(storyId);
    const updated = isSaved ? savedOfflineIds.filter((id) => id !== storyId) : [...savedOfflineIds, storyId];

    setSavedOfflineIds(updated);
    await storeSetObject(getSavedAudioStorageKey(siteId), updated);

    setStories((prev) =>
      prev.map((s) => (s.id === storyId ? { ...s, isSavedOffline: !isSaved } : s))
    );
  }, [savedOfflineIds, siteId]);

  const openPlayerModal = useCallback(() => {
    setIsPlayerModalVisible(true);
  }, []);

  const closePlayerModal = useCallback(() => {
    setIsPlayerModalVisible(false);
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        stories,
        currentStory,
        isPlaying,
        positionSec,
        durationSec,
        playbackSpeed,
        isPlayerModalVisible,
        savedOfflineIds,
        isLoading,
        playStory,
        togglePlayPause,
        seekTo,
        skipSeconds,
        setSpeed,
        nextTrack,
        previousTrack,
        toggleSaveOffline,
        openPlayerModal,
        closePlayerModal,
        refreshStories: loadData,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = (): AudioPlayerContextType => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
