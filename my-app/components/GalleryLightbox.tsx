/**
 * components/GalleryLightbox.tsx
 *
 * Full-screen photo gallery lightbox with pinch-to-zoom and swipe gestures.
 * Features:
 *   - Native pinch-to-zoom using ScrollView zoom scaling
 *   - Paging horizontal swipe between all gallery images
 *   - Photo index counter (e.g. 2 / 8)
 *   - Top header with safe-area padding, close button, and share action
 *   - Bottom tour title banner with interactive thumbnail scrub strip
 *   - Haptic feedback on image transitions
 *   - 44px minimum touch targets and accessibility labels
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  FlatList,
  useWindowDimensions,
  Platform,
  StatusBar as RNStatusBar,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { resolveImageUrl, DEFAULT_BLURHASH } from '@/lib/imageUtils';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';

interface GalleryLightboxProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  tourTitle?: string;
  onClose: () => void;
  onShare?: () => void;
}

export default function GalleryLightbox({
  visible,
  images,
  initialIndex = 0,
  tourTitle,
  onClose,
  onShare,
}: GalleryLightboxProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList<string>>(null);

  // Sync index when opened with a specific image
  useEffect(() => {
    if (visible) {
      const target = Math.max(0, Math.min(initialIndex, images.length - 1));
      setCurrentIndex(target);
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: target, animated: false });
      }, 50);
    }
  }, [visible, initialIndex, images.length]);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / windowWidth);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < images.length) {
        setCurrentIndex(newIndex);
        try {
          Haptics.selectionAsync();
        } catch {
          // Haptics fallback
        }
      }
    },
    [windowWidth, currentIndex, images.length]
  );

  const jumpToIndex = (index: number) => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    setCurrentIndex(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleClose = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    onClose();
  };

  const renderImageItem = ({ item }: { item: string }) => {
    const uri = resolveImageUrl(item);
    return (
      <View style={{ width: windowWidth, height: windowHeight, justifyContent: 'center', alignItems: 'center' }}>
        <ScrollView
          style={{ width: windowWidth, height: windowHeight }}
          contentContainerStyle={{ width: windowWidth, height: windowHeight, justifyContent: 'center', alignItems: 'center' }}
          maximumZoomScale={3.0}
          minimumZoomScale={1.0}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          centerContent
        >
          <ExpoImage
            source={{ uri: uri || undefined }}
            style={{ width: windowWidth, height: windowHeight * 0.75 }}
            contentFit="contain"
            transition={200}
            cachePolicy="memory-disk"
            placeholder={{ blurhash: DEFAULT_BLURHASH }}
          />
        </ScrollView>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Top Header Bar */}
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(
                insets.top,
                Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) + 8 : 16
              ),
            },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={handleClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close gallery lightbox"
          >
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* Photo Counter Pill */}
          <View style={styles.counterPill}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>

          {/* Share Button (if provided) */}
          {onShare ? (
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={onShare}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Share tour photos"
            >
              <Ionicons name="share-social-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        {/* Main Swipable Image FlatList */}
        <FlatList
          ref={flatListRef}
          data={images}
          keyExtractor={(_, idx) => String(idx)}
          renderItem={renderImageItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={3}
          getItemLayout={(_, index) => ({
            length: windowWidth,
            offset: windowWidth * index,
            index,
          })}
        />

        {/* Bottom Tour Title & Thumbnail Strip */}
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {tourTitle && (
            <Text style={styles.tourTitleText} numberOfLines={1}>
              {tourTitle}
            </Text>
          )}

          {/* Thumbnail scrub row */}
          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbsRow}
            >
              {images.map((img, idx) => {
                const isSelected = currentIndex === idx;
                const thumbUri = resolveImageUrl(img);
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => jumpToIndex(idx)}
                    style={[
                      styles.thumbItem,
                      isSelected && styles.thumbItemSelected,
                    ]}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Go to photo ${idx + 1}`}
                  >
                    <ExpoImage
                      source={{ uri: thumbUri || undefined }}
                      style={styles.thumbImage}
                      contentFit="cover"
                      transition={150}
                      cachePolicy="memory-disk"
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
  },
  counterText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingTop: SPACING.sm,
    alignItems: 'center',
  },
  tourTitleText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xs + 2,
  },
  thumbsRow: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs + 2,
    alignItems: 'center',
    paddingVertical: 4,
  },
  thumbItem: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
    opacity: 0.6,
  },
  thumbItemSelected: {
    borderColor: '#ffffff',
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
});
