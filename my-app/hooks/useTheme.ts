/**
 * hooks/useTheme.ts
 *
 * Dedicated theme hook providing dynamic brand colors, light/dark mode variants,
 * typography presets, border radius tokens, and elevation shadows.
 * Reads directly from ThemeContext and SiteConfigContext.
 */

import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSite } from '@/store/SiteConfigContext';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { RADIUS, SHADOW, SPACING, FONT_SIZE, FONT_WEIGHT } from '@/constants/theme';
import type { ThemeColors } from '@/types/siteConfig';

export interface UseThemeResult {
  theme: ThemeColors;
  colors: ThemeColors;
  isDark: boolean;
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  radius: typeof RADIUS;
  spacing: typeof SPACING;
  fontSize: typeof FONT_SIZE;
  fontWeight: typeof FONT_WEIGHT;
  shadows: typeof SHADOW;
}

export function useTheme(): UseThemeResult {
  const colors = useColors();
  const isDark = useIsDark();
  const { typography } = useSite();

  return useMemo(
    () => ({
      theme: colors,
      colors,
      isDark,
      typography,
      radius: RADIUS,
      spacing: SPACING,
      fontSize: FONT_SIZE,
      fontWeight: FONT_WEIGHT,
      shadows: SHADOW,
    }),
    [colors, isDark, typography]
  );
}

export default useTheme;
