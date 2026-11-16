/**
 * components/home/ServiceTabsGrid.tsx
 *
 * Dynamic Service Navigation Grid mirroring the live reference site's ServiceTabs.
 * Renders dynamically from config.services.moduleList with curated icons,
 * tenant branding, and haptic feedback.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import type { WebsiteModuleItem } from '@/lib/websiteModules';

interface ServiceTabsGridProps {
  onOpenEnquiry?: (serviceName: string) => void;
  activeServiceCode?: string;
  onSelectService?: (code: string) => void;
}

function getServiceIcon(code: string): keyof typeof Ionicons.glyphMap {
  switch (code.toUpperCase()) {
    case 'HOTEL':
      return 'business-outline';
    case 'TOUR':
    case 'ACTIVITY':
    case 'ACTIVITIES':
      return 'compass-outline';
    case 'PACKAGE':
    case 'HOLIDAYS':
      return 'airplane-outline';
    case 'FLIGHT':
      return 'paper-plane-outline';
    case 'TRANSFER':
    case 'CARRENTAL':
      return 'car-sport-outline';
    case 'VISA':
      return 'document-text-outline';
    case 'RESTAURANT':
      return 'restaurant-outline';
    case 'BUILDPACKAGE':
      return 'construct-outline';
    default:
      return 'grid-outline';
  }
}

export function ServiceTabsGrid({
  onOpenEnquiry,
  activeServiceCode = 'ALL',
  onSelectService,
}: ServiceTabsGridProps) {
  const router = useRouter();
  const config = useSiteConfig();
  const colors = useColors();

  const moduleList = config.services?.moduleList || [];

  const handlePress = (module: WebsiteModuleItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignored
    }

    if (onSelectService) {
      onSelectService(module.serviceCode);
    }

    const code = module.serviceCode.toUpperCase();
    if (code === 'FLIGHT') {
      router.push({ pathname: '/(tabs)/explore', params: { service: 'flights' } } as any);
      return;
    }

    if (code === 'VISA') {
      router.push('/visa-hub' as any);
      return;
    }

    if (code === 'TRANSFER' || code === 'CARRENTAL') {
      router.push('/airport-transfer' as any);
      return;
    }

    if (code === 'RESTAURANT') {
      router.push('/culinary-guide' as any);
      return;
    }

    if (code === 'BUILDPACKAGE') {
      router.push('/group-planning' as any);
      return;
    }

    if (code === 'PACKAGE' || code === 'HOLIDAYS') {
      router.push({ pathname: '/(tabs)/explore', params: { service: 'packages' } } as any);
      return;
    }

    if (code === 'HOTEL') {
      router.push({ pathname: '/(tabs)/explore', params: { service: 'hotels', category: 'hotel' } } as any);
      return;
    }

    // Default to explore tours
    router.push({ pathname: '/(tabs)/explore', params: { service: 'tours' } } as any);
  };

  if (!moduleList || moduleList.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.heading }]}>
        Explore Services
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {moduleList.map((mod) => {
          const isSelected = activeServiceCode.toUpperCase() === mod.serviceCode.toUpperCase();
          const iconName = getServiceIcon(mod.serviceCode);

          return (
            <TouchableOpacity testID="btn-servicetabsgrid-128" accessibilityLabel="servicetabsgrid action"
              key={`${mod.serviceCode}-${mod.serviceTypeId}`}
              style={[
                styles.servicePill,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
                SHADOW.sm,
              ]}
              onPress={() => handlePress(mod)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(255, 255, 255, 0.2)'
                      : `${colors.primary}12`,
                  },
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={16}
                  color={isSelected ? '#ffffff' : colors.primary}
                />
              </View>
              <Text
                style={[
                  styles.serviceName,
                  {
                    color: isSelected ? '#ffffff' : colors.heading,
                    fontWeight: isSelected ? '700' : '600',
                  },
                ]}
              >
                {mod.serviceName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  scrollList: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs + 2,
  },
  serviceName: {
    fontSize: FONT_SIZE.xs,
  },
});
