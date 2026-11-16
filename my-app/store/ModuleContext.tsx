/**
 * store/ModuleContext.tsx
 *
 * Global Active Module context for React Native / Expo.
 * Keeps module state synchronized across Home, Explore, and dynamic feeds.
 * Multi-tenant aware: persists user's active module selection per tenant with
 * tenant-prefixed keys (@toursapp:active_module:${siteId}).
 *
 * Feature Flags:
 * Strictly filters modules using isFeatureEnabled(config, module.id, 'app').
 * Auto-resets to the first enabled module if the active module is disabled in
 * the current tenant's site configuration.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { isFeatureEnabled } from '@/hooks/useFeature';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';

export type CanonicalModule =
  | 'hotels'
  | 'tours'
  | 'packages'
  | 'flights'
  | 'transfers'
  | 'visas'
  | 'restaurants'
  | 'buildpackage';

export interface ModuleItem {
  id: CanonicalModule;
  label: string;
  code: string;
  icon: keyof typeof Ionicons.glyphMap;
  searchType: string;
  route: string;
}

export const CANONICAL_MODULES: ModuleItem[] = [
  { id: 'hotels', label: 'Hotels', code: 'HOTEL', icon: 'business-outline', searchType: 'hotel', route: '/search-results?type=hotel' },
  { id: 'tours', label: 'Tours', code: 'TOUR', icon: 'compass-outline', searchType: 'tour', route: '/search-results?type=tour' },
  { id: 'packages', label: 'Packages', code: 'PACKAGE', icon: 'briefcase-outline', searchType: 'package', route: '/search-results?type=package' },
  { id: 'flights', label: 'Flights', code: 'FLIGHT', icon: 'airplane-outline', searchType: 'flight', route: '/airport-transfer' },
  { id: 'transfers', label: 'Transfers', code: 'TRANSFER', icon: 'car-outline', searchType: 'transfer', route: '/airport-transfer' },
  { id: 'visas', label: 'Visas', code: 'VISA', icon: 'card-outline', searchType: 'visa', route: '/visa-hub' },
  { id: 'restaurants', label: 'Restaurants', code: 'RESTAURANT', icon: 'restaurant-outline', searchType: 'dining', route: '/culinary-guide' },
  { id: 'buildpackage', label: 'Build Package', code: 'BUILDPACKAGE', icon: 'construct-outline', searchType: 'builder', route: '/search-results?type=package' },
];

export const MODULE_ITEMS = CANONICAL_MODULES;

const getStorageKey = (siteId: string) => `@toursapp:active_module:${siteId || 'default'}`;

interface ModuleContextType {
  activeModule: CanonicalModule;
  activeItem: ModuleItem;
  enabledModules: ModuleItem[];
  setActiveModule: (mod: CanonicalModule) => void;
  isModuleEnabled: (mod: CanonicalModule) => boolean;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const { siteId } = useSite();
  const config = useSiteConfig();

  // Filter modules based on tenant configuration and feature flags
  const enabledModules = useMemo(() => {
    const lang = config?.site?.defaultLanguage || 'en';
    const registry = config?.featureRegistry || [];

    const filtered = CANONICAL_MODULES.filter((m) =>
      isFeatureEnabled(config, m.id, 'app')
    ).map((m) => {
      // Pick localized label if configured in feature registry
      const regItem = registry.find((r: any) => r.id?.toLowerCase() === m.id);
      if (regItem?.label) {
        const localized = regItem.label[lang] || regItem.label['en'] || Object.values(regItem.label)[0];
        if (localized && typeof localized === 'string') {
          return { ...m, label: localized };
        }
      }
      return m;
    });

    return filtered.length > 0 ? filtered : CANONICAL_MODULES;
  }, [config]);

  const [activeModule, setActiveModuleState] = useState<CanonicalModule>(
    () => enabledModules[0].id
  );

  // Restore active module from tenant-prefixed storage on mount or site switch
  useEffect(() => {
    let isMounted = true;
    const key = getStorageKey(siteId);

    AsyncStorage.getItem(key)
      .then((stored) => {
        if (!isMounted) return;
        if (stored && enabledModules.some((m) => m.id === stored)) {
          setActiveModuleState(stored as CanonicalModule);
        } else if (!enabledModules.some((m) => m.id === activeModule)) {
          setActiveModuleState(enabledModules[0].id);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [siteId, enabledModules]);

  // Ensure activeModule is always in enabledModules
  useEffect(() => {
    if (!enabledModules.some((m) => m.id === activeModule)) {
      setActiveModuleState(enabledModules[0].id);
    }
  }, [enabledModules, activeModule]);

  const setActiveModule = useCallback(
    (mod: CanonicalModule) => {
      setActiveModuleState(mod);
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      }
      AsyncStorage.setItem(getStorageKey(siteId), mod).catch(() => {});
    },
    [siteId]
  );

  const activeItem = useMemo(() => {
    return enabledModules.find((m) => m.id === activeModule) || enabledModules[0];
  }, [enabledModules, activeModule]);

  const isModuleEnabled = useCallback(
    (mod: CanonicalModule) => {
      return enabledModules.some((m) => m.id === mod);
    },
    [enabledModules]
  );

  const value = useMemo(
    () => ({
      activeModule,
      activeItem,
      enabledModules,
      setActiveModule,
      isModuleEnabled,
    }),
    [activeModule, activeItem, enabledModules, setActiveModule, isModuleEnabled]
  );

  return (
    <ModuleContext.Provider value={value}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useActiveModule() {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useActiveModule must be used within a ModuleProvider');
  }
  return context;
}

export interface ModuleSelectorStripProps {
  style?: StyleProp<ViewStyle>;
  activeModuleOverride?: CanonicalModule;
  onSelectModule?: (mod: CanonicalModule) => void;
}

/**
 * Reusable horizontal module selector strip for Home and Explore screens.
 * Responsive, accessible touch targets (min 44pt), theme-aware styling.
 */
export function ModuleSelectorStrip({
  style,
  activeModuleOverride,
  onSelectModule,
}: ModuleSelectorStripProps) {
  const { activeModule, enabledModules, setActiveModule } = useActiveModule();
  const colors = useColors();

  const currentActive = activeModuleOverride || activeModule;

  const handleSelect = (mod: CanonicalModule) => {
    if (onSelectModule) {
      onSelectModule(mod);
    } else {
      setActiveModule(mod);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {enabledModules.map((item) => {
          const isSelected = item.id === currentActive;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleSelect(item.id)}
              activeOpacity={0.8}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.primary : ((colors as any).card || colors.surface),
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${item.label} module`}
            >
              <Ionicons
                name={item.icon}
                size={16}
                color={isSelected ? '#ffffff' : (colors.mutedText || '#64748b')}
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? '#ffffff' : colors.text,
                    fontWeight: isSelected ? '700' : '600',
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

/**
 * Backwards compatibility alias for ModuleSelectorStrip
 */
export const ModuleChipsBar = ModuleSelectorStrip;

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xs,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44, // 44pt accessible touch target
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginRight: 6,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: FONT_SIZE.xs,
  },
});
