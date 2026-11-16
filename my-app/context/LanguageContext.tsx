/**
 * context/LanguageContext.tsx
 *
 * Multi-Language Localization Engine with Tenant-Scoped Persistence.
 *
 * Features:
 *   - Instant reactive translation via t(key, fallback)
 *   - Tenant-isolated language persistence (@toursapp_language:<siteId>)
 *   - Multi-brand recommendations (Gujarati for GujjuTours, Thai/Vietnamese for TripGoAsia, Arabic for Technoheaven)
 *   - RTL support detection for Arabic
 *   - Zero TypeScript `any`
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import {
  type LanguageCode,
  type LanguageOption,
  type TranslationDictionary,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
} from '@/constants/translations';
import { storeGetObject, storeSetObject } from '@/src/lib/storage';

export interface LanguageContextType {
  language: LanguageCode;
  currentLanguage: LanguageOption;
  supportedLanguages: LanguageOption[];
  isRTL: boolean;
  isLanguageModalVisible: boolean;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
  setLanguage: (code: LanguageCode) => Promise<void>;
  t: (key: keyof TranslationDictionary, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  currentLanguage: SUPPORTED_LANGUAGES[0],
  supportedLanguages: SUPPORTED_LANGUAGES,
  isRTL: false,
  isLanguageModalVisible: false,
  openLanguageModal: () => {},
  closeLanguageModal: () => {},
  setLanguage: async () => {},
  t: (key: keyof TranslationDictionary, fallback?: string) => fallback || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { siteId } = useSite();

  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  // Restore tenant-saved language or set recommended default
  useEffect(() => {
    let active = true;

    async function loadLanguage() {
      try {
        const stored = await storeGetObject<LanguageCode>('app_language', siteId);
        if (active && stored && TRANSLATIONS[stored]) {
          setLanguageState(stored);
          return;
        }

        // Default to English
        if (active) {
          setLanguageState('en');
        }
      } catch {
        if (active) setLanguageState('en');
      }
    }

    loadLanguage();
    return () => {
      active = false;
    };
  }, [siteId]);

  const setLanguage = useCallback(
    async (code: LanguageCode) => {
      if (!TRANSLATIONS[code]) return;
      try {
        Haptics.selectionAsync();
      } catch {}

      setLanguageState(code);
      await storeSetObject('app_language', code, siteId);
    },
    [siteId]
  );

  const t = useCallback(
    (key: keyof TranslationDictionary, fallback?: string): string => {
      const activeDict = TRANSLATIONS[language] || TRANSLATIONS.en;
      if (activeDict && activeDict[key]) {
        return activeDict[key];
      }
      const fallbackDict = TRANSLATIONS.en;
      if (fallbackDict && fallbackDict[key]) {
        return fallbackDict[key];
      }
      return fallback || key;
    },
    [language]
  );

  const openLanguageModal = useCallback(() => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setIsLanguageModalVisible(true);
  }, []);

  const closeLanguageModal = useCallback(() => {
    setIsLanguageModalVisible(false);
  }, []);

  const currentLanguage = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const isRTL = language === 'ar';

  const value = useMemo(
    () => ({
      language,
      currentLanguage,
      supportedLanguages: SUPPORTED_LANGUAGES,
      isRTL,
      isLanguageModalVisible,
      openLanguageModal,
      closeLanguageModal,
      setLanguage,
      t,
    }),
    [
      language,
      currentLanguage,
      isRTL,
      isLanguageModalVisible,
      openLanguageModal,
      closeLanguageModal,
      setLanguage,
      t,
    ]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
