/**
 * constants/theme.ts
 *
 * App-wide design tokens — spacing, border-radius, font sizes, shadow
 * presets. Components should import from here instead of hard-coding.
 *
 * Colors are NOT in this file; they come from ThemeContext (dynamic, per site).
 */

import { Platform } from 'react-native';

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 38,
  hero: 46,
} as const;

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const LINE_HEIGHT = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const SHADOW = {
  none: {},
  xs: Platform.select({
    web: {
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    } as any,
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
  }),
  sm: Platform.select({
    web: {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    } as any,
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
  }),
  md: Platform.select({
    web: {
      boxShadow: '0 3px 8px rgba(0, 0, 0, 0.12)',
    } as any,
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 5,
    },
  }),
  lg: Platform.select({
    web: {
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.16)',
    } as any,
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 10,
    },
  }),
  xl: Platform.select({
    web: {
      boxShadow: '0 10px 24px rgba(0, 0, 0, 0.22)',
    } as any,
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.22,
      shadowRadius: 24,
      elevation: 16,
    },
  }),
} as const;

/** Duration presets for Animated / Reanimated. */
export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { damping: 15, stiffness: 200 },
} as const;

/** Screen edge padding — apply to every scrollable screen's contentContainerStyle. */
export const SCREEN_PADDING_H = SPACING.md;
export const SCREEN_PADDING_V = SPACING.lg;

/** Card/image height presets (used in section components). */
export const IMAGE_HEIGHT = {
  card: 200,
  cardLarge: 260,
  hero: 500,
  heroLarge: 640,
  destination: 240,
  banner: 180,
} as const;
