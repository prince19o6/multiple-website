/**
 * app/(auth)/onboarding.tsx
 *
 * Welcome & onboarding screen for new travelers.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { getSiteEntry } from '@/constants/siteRegistry';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import BrandLogo from '@/components/common/BrandLogo';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const config = useSiteConfig();
  const { siteId } = useSelectedSite();
  const currentSite = getSiteEntry(siteId);
  const headingFontFamily = getHeadingFontFamily(config);

  const heroImage =
    currentSite?.heroImage ||
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=1200&fit=crop';

  return (
    <View style={styles.root}>
      <ImageBackground source={{ uri: heroImage }} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.darkGradient} />

        <View
          style={[
            styles.container,
            {
              paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 16 : 24),
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
        >
          {/* Top Skip Button */}
          <View style={styles.topRow}>
            <View style={styles.logoContainer}>
              <BrandLogo size={36} showTextFallback={true} forceDark={true} />
            </View>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)')}
              style={styles.skipButton}
              activeOpacity={0.8}
            >
              <Text style={styles.skipButtonText}>Explore as Guest</Text>
              <Ionicons name="arrow-forward" size={14} color="#ffffff" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {/* Bottom Card */}
          <View style={styles.bottomCard}>
            <View style={{ marginBottom: 12 }}>
              <BrandLogo size={42} showTextFallback={false} />
            </View>
            <Text style={[styles.title, { fontFamily: headingFontFamily }]}>
              {config?.name || currentSite?.name || 'Tours App'}
            </Text>
            <Text style={styles.tagline}>
              {config?.tagline || 'Experience the world with curated itineraries and local guides.'}
            </Text>

            {/* Action Buttons */}
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: '#ffffff' }]}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryBtnText}>I already have an account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  darkGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    padding: 4,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  skipButtonText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  bottomCard: {
    paddingBottom: SPACING.md,
  },
  title: {
    color: '#ffffff',
    fontSize: FONT_SIZE.hero - 6,
    fontWeight: '800',
    lineHeight: 46,
    marginBottom: SPACING.xs,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: FONT_SIZE.md,
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  primaryBtn: {
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    marginBottom: SPACING.sm + 2,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.base,
    fontWeight: '800',
  },
  secondaryBtn: {
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  secondaryBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
  },
});
