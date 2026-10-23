/**
 * components/home/HorizontalList.tsx
 *
 * Generic high-performance horizontal FlatList with card snapping,
 * fixed layouts, memoization, and built-in skeleton states.
 */

import React from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  type ListRenderItem,
} from 'react-native';
import { SPACING } from '@/constants/theme';
import SkeletonLoader from '@/components/SkeletonLoader';

export interface HorizontalListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  itemWidth?: number;
  isLoading?: boolean;
  skeletonCount?: number;
  testID?: string;
}

export function HorizontalList<T>({
  data,
  renderItem,
  keyExtractor,
  itemWidth = 260,
  isLoading = false,
  skeletonCount = 3,
  testID,
}: HorizontalListProps<T>) {
  if (isLoading) {
    return (
      <View style={styles.skeletonContainer}>
        <SkeletonLoader variant="tourCard" count={skeletonCount} />
      </View>
    );
  }

  return (
    <FlatList
      horizontal
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      showsHorizontalScrollIndicator={false}
      snapToInterval={itemWidth + SPACING.md}
      snapToAlignment="start"
      decelerationRate="fast"
      contentContainerStyle={styles.contentContainer}
      testID={testID}
      initialNumToRender={4}
      maxToRenderPerBatch={4}
      windowSize={5}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    gap: SPACING.md,
  },
  skeletonContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
});
