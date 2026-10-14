/**
 * components/DynamicFontLoader.tsx
 *
 * React Native counterpart to web's DynamicFontLoader.
 * When the API returns custom dynamic font URLs, this component uses
 * expo-font's Font.loadAsync to download and register the font dynamically.
 */

import { useEffect } from 'react';
import * as Font from 'expo-font';

export interface FontFile {
  url: string;
  weight?: number;
}

export interface DynamicFont {
  family: string;
  files: FontFile[];
}

export function DynamicFontLoader({ font }: { font?: DynamicFont | null }) {
  useEffect(() => {
    if (!font?.family || !font.files?.length) return;

    const fontUrl = font.files[0]?.url;
    if (!fontUrl) return;

    const fontKey = font.family.trim();
    if (Font.isLoaded(fontKey)) return;

    Font.loadAsync({
      [fontKey]: fontUrl,
    }).catch((err) => {
      // Gracefully fall back to pre-bundled fonts
      console.warn(`[DynamicFontLoader] Could not load dynamic font ${fontKey}:`, err);
    });
  }, [font?.family, font?.files]);

  return null;
}

export default DynamicFontLoader;
