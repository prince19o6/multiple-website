/**
 * app/(app)/about.tsx
 *
 * About Us screen.
 * Config-driven: renders the brand's identity, tagline, mission, values,
 * and key pillars according to the active website.
 * The top navbar is rendered by the root (app)/_layout.tsx.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import Footer from '@/components/Footer';

export default function AboutScreen() {
  const router = useRouter();
  const config = useSiteConfig();
  const colors = useColors();
  const { siteId } = useSelectedSite();
  const headingFontFamily = getHeadingFontFamily(config);

  const siteName = config?.name || 'Tours App';
  const tagline = config?.tagline || 'Making your travel dreams a reality.';
  const aboutImage =
    siteId === 'website2'
      ? 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=500&fit=crop'
      : siteId === 'website3'
      ? 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=500&fit=crop'
      : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=500&fit=crop';

  const pillars = [
    {
      icon: 'shield-checkmark-outline' as const,
      title: 'Verified Safety & Quality',
      desc: 'All expeditions and itineraries are hand-selected, verified by local guides, and adhere to strict safety protocols.',
    },
    {
      icon: 'earth-outline' as const,
      title: 'Authentic Local Immersion',
      desc: 'Connect with indigenous cultures, authentic culinary traditions, and hidden gems inaccessible to mass tourism.',
    },
    {
      icon: 'leaf-outline' as const,
      title: 'Sustainable Journeys',
      desc: 'We are committed to carbon offsetting, minimizing environmental footprint, and uplifting local host communities.',
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero banner */}
        <View style={styles.heroBanner}>
          <Image source={{ uri: aboutImage }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroDarkOverlay} />
          <View style={styles.heroTextContainer}>
            <Text style={[styles.heroPre, { color: colors.accent || '#f59e0b' }]}>ABOUT OUR STORY</Text>
            <Text style={[styles.heroTitle, { fontFamily: headingFontFamily }]}>{siteName}</Text>
            <Text style={styles.heroTagline}>{tagline}</Text>
          </View>
        </View>

        {/* Story Section */}
        <View style={styles.contentSection}>
          <Text style={[styles.storyHeading, { color: colors.heading, fontFamily: headingFontFamily }]}>
            Crafting Journeys That Leave Lasting Impressions
          </Text>
          <Text style={[styles.storyBody, { color: colors.text }]}>
            Founded with a passion for transformative travel, {siteName} bridges the gap between everyday routines and the extraordinary marvels of our planet. Whether you crave the thrill of untouched wilderness, the sanctuary of ultra-luxury resorts, or culturally immersive expeditions, our team designs each experience with meticulous attention to detail.
          </Text>

          {/* Pillars */}
          <Text style={[styles.sectionTitle, { color: colors.heading, marginTop: SPACING.xl }]}>
            Why Travel With Us
          </Text>

          <View style={styles.pillarsGrid}>
            {pillars.map((p, idx) => (
              <View
                key={idx}
                style={[
                  styles.pillarCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={[styles.pillarIconBox, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name={p.icon} size={24} color={colors.primary} />
                </View>
                <Text style={[styles.pillarTitle, { color: colors.heading }]}>{p.title}</Text>
                <Text style={[styles.pillarDesc, { color: colors.mutedText }]}>{p.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  heroBanner: {
    height: 260,
    position: 'relative',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  heroDarkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  heroTextContainer: {
    zIndex: 10,
    alignItems: 'center',
  },
  heroPre: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xxl + 4,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  heroTagline: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    maxWidth: 300,
  },
  contentSection: {
    padding: SPACING.lg,
  },
  storyHeading: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: SPACING.md,
  },
  storyBody: {
    fontSize: FONT_SIZE.sm + 1,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  pillarsGrid: {
    gap: SPACING.md,
  },
  pillarCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOW.sm,
  },
  pillarIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  pillarTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  pillarDesc: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
});
