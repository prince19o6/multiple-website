/**
 * lib/sectionHelpers.ts
 *
 * Ported from web/lib/sectionHelpers.ts.
 * All Tailwind class strings are replaced with React Native
 * StyleSheet-compatible values (numbers, style objects).
 *
 * Components import these helpers to keep visual logic DRY across
 * all three site styles.
 */

import type { MergedWebsiteConfig } from './mergeWebsiteConfig';
import { RADIUS, SPACING } from '@/constants/theme';

// ─── Button Helpers ───────────────────────────────────────────────────────────

/** Maps button.style from config → border-radius value for RN StyleSheet. */
export function getButtonRadius(buttons: any = {}): number {
  if (buttons.style === 'pill') return RADIUS.full;
  if (buttons.style === 'square') return RADIUS.none;
  if (buttons.style === 'outline') return RADIUS.md;
  return RADIUS.md; // 'rounded' default
}

/** Maps button.size from config → { paddingHorizontal, paddingVertical } */
export function getButtonPadding(buttons: any = {}): {
  paddingHorizontal: number;
  paddingVertical: number;
} {
  if (buttons.size === 'large') {
    return { paddingHorizontal: 40, paddingVertical: 16 };
  }
  return { paddingHorizontal: 32, paddingVertical: 12 };
}

/** True when buttons.uppercase is set. */
export function isButtonUppercase(buttons: any = {}): boolean {
  return buttons.uppercase === true;
}

// ─── Icon Helpers ─────────────────────────────────────────────────────────────

/** Icon container size from config. */
export function getIconSize(icons: any = {}): number {
  if (icons.size === 'small') return 40;
  if (icons.size === 'medium') return 56;
  return 64; // large (default)
}

/** Icon border-radius from config. */
export function getIconRadius(icons: any = {}): number {
  if (icons.style === 'square') return RADIUS.md;
  if (icons.style === 'hexagon') return RADIUS.xl;
  return RADIUS.full; // circle (default)
}

/** Icon container background color from config + theme. */
export function getIconBackground(icons: any = {}, theme: any = {}): string {
  if (icons.background === 'light') return '#f3f4f6';
  if (icons.background === 'dark') return '#111827';
  // 'primary' background → subtle tint of primary color
  return `${(theme.primary || '#2563eb')}1a`;
}

// ─── Card Helpers ─────────────────────────────────────────────────────────────

/** Card border-radius from config. */
export function getCardRadius(cards: any = {}): number {
  if (cards.radius === 'small') return RADIUS.sm;
  if (cards.radius === 'large') return RADIUS.lg;
  return RADIUS.md; // medium (default)
}

// ─── Navigation helpers ───────────────────────────────────────────────────────

/**
 * The hero/CTA "action" value from config maps to an internal screen path.
 * Destinations and activities fall back to explore until real screens exist.
 */
export const ACTION_TO_SCREEN: Record<string, string> = {
  explore: '/explore',
  activities: '/explore',
  destinations: '/explore',
};

export function actionToScreen(action: string | undefined): string {
  return ACTION_TO_SCREEN[action ?? 'explore'] ?? '/explore';
}

// ─── Typography Helpers ───────────────────────────────────────────────────────

/**
 * Resolve heading font family string for use in RN `fontFamily` style prop.
 *
 * Expo Font loads fonts by family name (the key passed to Font.loadAsync).
 * We keep the same logic as web but return the raw family name instead of
 * CSS stack — RN only uses the first family name anyway.
 */
export function getHeadingFontFamily(config: MergedWebsiteConfig | any): string | undefined {
  const family = config?.typography?.headingFont;
  if (typeof family !== 'string' || !family.trim()) return undefined;
  // Strip quotes, return clean name
  return family.replace(/['"]/g, '').trim() || undefined;
}

/**
 * True when the heading font is a serif (Playfair, Georgia, etc.).
 * Used by components to pick the correct system fallback.
 */
export function isSerifFont(fontFamily: string | undefined): boolean {
  if (!fontFamily) return false;
  return /playfair|georgia|merriweather|lora|cormorant|garamond|baskerville|times/i.test(
    fontFamily
  );
}

/**
 * Returns a safe system font fallback for RN when the custom font hasn't
 * loaded yet or isn't available.
 */
export function getSystemFontFallback(isSerif: boolean): string {
  // RN doesn't support font stacks — pick one
  if (isSerif) {
    return 'Georgia'; // iOS & Android both have Georgia
  }
  return 'System'; // RN default system font
}
