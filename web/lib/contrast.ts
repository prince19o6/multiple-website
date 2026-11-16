/**
 * lib/contrast.ts
 *
 * Implements WCAG 2.1 contrast ratio calculations and automatic readable
 * color variant derivation to ensure accessibility (minimum 4.5:1 for body text)
 * on light (white #FFFFFF) and dark surfaces.
 */

export interface ContrastResult {
  ratio: number;
  passesAA: boolean; // >= 4.5:1
  passesAALarge: boolean; // >= 3:1
  passesAAA: boolean; // >= 7:1
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

/** Parse any hex color string (#rgb, #rrggbb) into { r, g, b } in [0, 255] */
export function hexToRgb(hex: string): RGB | null {
  if (!hex || typeof hex !== "string") return null;
  const clean = hex.trim().replace(/^#/, "");
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

/** Convert RGB to hex string */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/** Convert RGB to HSL */
function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/** Convert HSL to RGB */
function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tVal = t;
    if (tVal < 0) tVal += 1;
    if (tVal > 1) tVal -= 1;
    if (tVal < 1 / 6) return p + (q - p) * 6 * tVal;
    if (tVal < 1 / 2) return q;
    if (tVal < 2 / 3) return p + (q - p) * (2 / 3 - tVal) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

/**
 * Calculates WCAG 2.1 relative luminance for an sRGB color.
 * Returns value in [0, 1].
 */
export function getRelativeLuminance(rgb: RGB): number {
  const srgb = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
  const linear = srgb.map((c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/**
 * Calculates the contrast ratio between two hex colors according to WCAG 2.1.
 * Ratio is expressed as a number between 1 and 21.
 */
export function getContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const fg = hexToRgb(foregroundHex);
  const bg = hexToRgb(backgroundHex);

  if (!fg || !bg) return 1;

  const l1 = getRelativeLuminance(fg);
  const l2 = getRelativeLuminance(bg);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Number(ratio.toFixed(2));
}

/** Check contrast compliance against WCAG levels */
export function checkContrast(foregroundHex: string, backgroundHex: string): ContrastResult {
  const ratio = getContrastRatio(foregroundHex, backgroundHex);
  return {
    ratio,
    passesAA: ratio >= 4.5,
    passesAALarge: ratio >= 3.0,
    passesAAA: ratio >= 7.0,
  };
}

/**
 * Derives the optimal foreground text color (#ffffff or #0f172a) for a given
 * button or badge background to ensure maximum readability.
 */
export function getContrastTextColor(backgroundHex: string): string {
  const whiteRatio = getContrastRatio("#ffffff", backgroundHex);
  const darkRatio = getContrastRatio("#0f172a", backgroundHex);
  // If dark text passes AA (>= 4.5:1) and white text fails (< 4.0:1), use dark
  if (darkRatio >= 4.5 && whiteRatio < 4.0) {
    return "#0f172a";
  }
  // Otherwise if dark text significantly exceeds white text on low-contrast backgrounds
  if (darkRatio > whiteRatio && whiteRatio < 3.5) {
    return "#0f172a";
  }
  return "#ffffff";
}

/**
 * Checks a brand color against a white (#ffffff) background.
 * If contrast is below the WCAG AA threshold of 4.5:1, it automatically derives
 * a darker, readable variant by stepping down luminance until >= 4.5:1 is achieved.
 */
export function ensureAccessibleTextColor(
  colorHex: string,
  backgroundHex: string = "#ffffff",
  siteId?: string,
  colorLabel: string = "primary"
): { accessibleHex: string; wasAdjusted: boolean; contrastRatio: number } {
  const initialRatio = getContrastRatio(colorHex, backgroundHex);

  if (initialRatio >= 4.5) {
    return {
      accessibleHex: colorHex,
      wasAdjusted: false,
      contrastRatio: initialRatio,
    };
  }

  const rgb = hexToRgb(colorHex);
  if (!rgb) {
    return {
      accessibleHex: "#0f172a",
      wasAdjusted: true,
      contrastRatio: 16.0,
    };
  }

  const hsl = rgbToHsl(rgb);
  let adjustedHex = colorHex;
  let currentRatio = initialRatio;

  // Decrease lightness in steps of 2% until contrast is >= 4.5:1 or bottomed out
  while (hsl.l > 8 && currentRatio < 4.5) {
    hsl.l = Math.max(0, hsl.l - 2);
    adjustedHex = rgbToHex(hslToRgb(hsl));
    currentRatio = getContrastRatio(adjustedHex, backgroundHex);
  }

  // Automatically derived accessible text variant for WCAG AA compliance
  if (process.env.DEBUG_THEME_CONTRAST === "true" && typeof console !== "undefined" && console.debug) {
    console.debug(
      `[ThemeEngine] Brand ${colorLabel} '${colorHex}' for site '${siteId || "unknown"}' has contrast ratio ${initialRatio}:1 (< 4.5:1) against ${backgroundHex}. Automatically derived accessible text variant '${adjustedHex}' (${currentRatio}:1).`
    );
  }

  return {
    accessibleHex: adjustedHex,
    wasAdjusted: true,
    contrastRatio: currentRatio,
  };
}

export const contrastRatioHex = getContrastRatio;
export function deriveReadableTextColorHex(
  colorHex: string,
  backgroundHex: string = "#ffffff",
  _targetRatio: number = 4.5
): string {
  return ensureAccessibleTextColor(colorHex, backgroundHex).accessibleHex;
}
