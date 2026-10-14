/**
 * components/sections/DifficultySection.tsx
 *
 * Adventure World (website2) difficulty level selector.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { SectionProps } from '@/types';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';

export default function DifficultySection({ config, onNavigate }: SectionProps) {
  const colors = useColors();
  const theme = config?.theme || {};
  const difficultyConfig = (config as any)?.difficulty || {};

  if (difficultyConfig.enabled === false || !difficultyConfig.levels?.length) return null;

  const borderColor = theme.primary || colors.primary || '#16a34a';

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.heading }]}>
        {difficultyConfig.title || 'Choose Your Difficulty'}
      </Text>

      <View style={styles.grid}>
        {difficultyConfig.levels.map((level: any) => (
          <TouchableOpacity
            key={level.id}
            activeOpacity={0.85}
            onPress={() => onNavigate?.('/explore')}
            style={[styles.levelBtn, { borderColor }]}
          >
            <Text style={styles.icon}>{level.icon}</Text>
            <Text style={[styles.label, { color: colors.heading }]}>{level.label}</Text>
            {level.description ? (
              <Text style={[styles.desc, { color: colors.mutedText }]}>{level.description}</Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.md,
    width: '100%',
  },
  levelBtn: {
    width: '46%',
    borderWidth: 2,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  desc: {
    fontSize: 11,
    textAlign: 'center',
  },
});
