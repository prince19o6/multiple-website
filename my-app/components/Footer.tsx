/**
 * components/Footer.tsx
 *
 * Config-driven native footer matching web's 3 flavors:
 *   - ModernFooter (website1)
 *   - AdventureFooter (website2)
 *   - LuxuryFooter (website3)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';

export default function Footer() {
  const config = useSiteConfig();
  const colors = useColors();
  const router = useRouter();

  const websiteId = config?.id || 'website1';
  const theme = config?.theme || {};
  const footerConfig = (config as any)?.footer || {};
  const contact = config?.contact || (config as any)?.content?.contact || {};

  const name = config?.name || 'Tours App';
  const description =
    footerConfig.description ||
    config?.tagline ||
    (config as any)?.seo?.defaultDescription ||
    'Making your travel dreams a reality with unforgettable curated experiences.';
  const copyright =
    footerConfig.copyright ||
    (config as any)?.content?.footerCopyright ||
    `© ${new Date().getFullYear()} ${name}. All rights reserved.`;

  const footerVariant =
    config?.layout?.footerVariant ||
    footerConfig.variant ||
    footerConfig.style ||
    'default';

  const openLink = (url: string) => {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) Linking.openURL(url);
    });
  };

  // Flavor 2: Columns / Adventure
  if (footerVariant === 'columns' || (footerVariant as string) === 'adventure' || websiteId === 'website2') {
    const accent = theme.accent || colors.accent || '#f97316';
    return (
      <View style={[styles.container, { backgroundColor: '#0a0a0a' }]}>
        <View style={styles.content}>
          <Text style={[styles.brandTitle, { color: '#ffffff' }]}>🔥 {name}</Text>
          <Text style={[styles.brandDesc, { color: '#a3a3a3' }]}>{description}</Text>

          {/* Quick Action Pills */}
          <View style={styles.linksRow}>
            <TouchableOpacity testID="btn-all-expeditions" accessibilityLabel="All Expeditions"
              style={[styles.adventurePill, { borderColor: accent }]}
              onPress={() => router.push('/explore')}
            >
              <Text style={[styles.adventurePillText, { color: accent }]}>All Expeditions</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="btn-get-in-touch" accessibilityLabel="Get in Touch"
              style={[styles.adventurePill, { borderColor: '#404040' }]}
              onPress={() => router.push('/contact')}
            >
              <Text style={[styles.adventurePillText, { color: '#ffffff' }]}>Get in Touch</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="btn-admin" accessibilityLabel="Admin"
              style={[styles.adventurePill, { borderColor: '#404040' }]}
              onPress={() => router.push('/(admin)')}
            >
              <Text style={[styles.adventurePillText, { color: '#ffffff' }]}>Admin</Text>
            </TouchableOpacity>
          </View>

          {/* Contact */}
          {(contact.email || contact.phone) && (
            <View style={styles.contactBlock}>
              {contact.email ? (
                <Text style={[styles.contactLine, { color: '#737373' }]}>✉ {contact.email}</Text>
              ) : null}
              {contact.phone ? (
                <Text style={[styles.contactLine, { color: '#737373' }]}>📞 {contact.phone}</Text>
              ) : null}
            </View>
          )}

          <View style={[styles.divider, { borderBottomColor: '#262626' }]} />
          <Text style={[styles.copyrightText, { color: '#737373' }]}>{copyright}</Text>
        </View>
      </View>
    );
  }

  // Flavor 3: Luxury Holiday Paradise
  if (footerVariant === 'luxury' || websiteId === 'website3') {
    const accent = theme.accent || '#d4af37';
    const bg = theme.secondary || '#1c1311';
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View style={styles.content}>
          <Text style={[styles.luxuryTitle, { color: '#ffffff' }]}>{name}</Text>
          <Text style={[styles.luxurySubtitle, { color: accent }]}>LUXURY ESCAPES & RESORTS</Text>
          <Text style={[styles.brandDesc, { color: '#d4c4bc' }]}>{description}</Text>

          <View style={styles.linksRow}>
            <TouchableOpacity testID="btn-curated-packages" accessibilityLabel="CURATED PACKAGES" onPress={() => router.push('/explore')}>
              <Text style={[styles.luxuryLink, { color: '#ffffff' }]}>CURATED PACKAGES</Text>
            </TouchableOpacity>
            <Text style={{ color: accent }}>•</Text>
            <TouchableOpacity testID="btn-about" accessibilityLabel="ABOUT" onPress={() => router.push('/about')}>
              <Text style={[styles.luxuryLink, { color: '#ffffff' }]}>ABOUT</Text>
            </TouchableOpacity>
            <Text style={{ color: accent }}>•</Text>
            <TouchableOpacity testID="btn-concierge" accessibilityLabel="CONCIERGE" onPress={() => router.push('/contact')}>
              <Text style={[styles.luxuryLink, { color: '#ffffff' }]}>CONCIERGE</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { borderBottomColor: '#362823' }]} />
          <Text style={[styles.copyrightText, { color: '#8c766e' }]}>{copyright}</Text>
        </View>
      </View>
    );
  }

  // Flavor 1: Modern Travel (Default)
  const bg = theme.secondary || '#0f172a';
  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.content}>
        <Text style={[styles.brandTitle, { color: '#ffffff' }]}>{name}</Text>
        <Text style={[styles.brandDesc, { color: '#94a3b8' }]}>{description}</Text>

        {/* Quick Nav Links */}
        <View style={styles.navGrid}>
          <TouchableOpacity testID="btn-featured-tours" accessibilityLabel="Featured Tours" onPress={() => router.push('/explore')} style={styles.navGridItem}>
            <Text style={styles.navGridText}>Featured Tours</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="btn-our-story" accessibilityLabel="Our Story" onPress={() => router.push('/about')} style={styles.navGridItem}>
            <Text style={styles.navGridText}>Our Story</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="btn-customer-support" accessibilityLabel="Customer Support" onPress={() => router.push('/contact')} style={styles.navGridItem}>
            <Text style={styles.navGridText}>Customer Support</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="btn-admin-portal" accessibilityLabel="Admin Portal" onPress={() => router.push('/(admin)')} style={styles.navGridItem}>
            <Text style={styles.navGridText}>Admin Portal</Text>
          </TouchableOpacity>
        </View>

        {/* Contact info */}
        {(contact.email || contact.phone || contact.address) && (
          <View style={styles.contactBlock}>
            {contact.email && (
              <Text style={[styles.contactLine, { color: '#94a3b8' }]}>✉ {contact.email}</Text>
            )}
            {contact.phone && (
              <Text style={[styles.contactLine, { color: '#94a3b8' }]}>📞 {contact.phone}</Text>
            )}
            {contact.address && (
              <Text style={[styles.contactLine, { color: '#94a3b8' }]}>📍 {contact.address}</Text>
            )}
          </View>
        )}

        <View style={[styles.divider, { borderBottomColor: '#1e293b' }]} />
        <Text style={[styles.copyrightText, { color: '#64748b' }]}>{copyright}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  },
  content: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  luxuryTitle: {
    fontSize: FONT_SIZE.xxl,
    fontFamily: 'Playfair Display',
    textAlign: 'center',
    marginBottom: 2,
  },
  luxurySubtitle: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  brandDesc: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: SPACING.lg,
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  adventurePill: {
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
  },
  adventurePillText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  luxuryLink: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  navGridItem: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  navGridText: {
    color: '#cbd5e1',
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  contactBlock: {
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.md,
  },
  contactLine: {
    fontSize: FONT_SIZE.xs,
  },
  divider: {
    width: '100%',
    borderBottomWidth: 1,
    marginVertical: SPACING.md,
  },
  copyrightText: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
  },
});
