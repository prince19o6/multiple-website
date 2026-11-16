/**
 * components/sections/ActivitiesSection.tsx
 *
 * Adventure World (website2) horizontal scroll activity selector.
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import type { SectionProps } from '@/types';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';

export default function ActivitiesSection({ config, onNavigate }: SectionProps) {
  const theme = config?.theme || {};
  const activitiesConfig = (config as any)?.activities || {};

  if (activitiesConfig.enabled === false || !activitiesConfig.items?.length) return null;

  const bg = theme.secondary || '#052e16';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {activitiesConfig.title || 'Choose Your Adventure'}
        </Text>
        {activitiesConfig.subtitle && (
          <Text style={styles.subtitle}>{activitiesConfig.subtitle}</Text>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {activitiesConfig.items.map((item: any, idx: number) => (
          <TouchableOpacity testID="btn-activitiessection-37" accessibilityLabel="activitiessection action"
            key={`act_${item.id || idx}_${idx}`}
            activeOpacity={0.85}
            onPress={() => onNavigate?.('/explore')}
            style={styles.card}
          >
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc}>{item.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xl,
  },
  header: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  title: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xl + 2,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: FONT_SIZE.sm,
  },
  scrollList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  card: {
    width: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  cardIcon: {
    fontSize: 34,
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardDesc: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
  },
});
