/**
 * app/site-switcher.tsx
 *
 * Site Switcher modal screen.
 * Guarded behind the EXPO_PUBLIC_ENABLE_SITE_SWITCHER development flag.
 * In single-site mode, informs the user that the app is scoped to the configured website.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSite } from '@/store/SiteConfigContext';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { getSiteEntry, ALLOWED_SITE_IDS } from '@/constants/siteRegistry';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { ENV, ACTIVE_SITE_INFO } from '@/config/env';
import type { WebsiteId } from '@/types';

export default function SiteSwitcherModal() {
  const router = useRouter();
  const { siteId: activeSiteId, siteName, hostname } = useSite();
  const { selectSite } = useSelectedSite();

  const handleSelect = async (id: WebsiteId) => {
    if (!ENV.enableSiteSwitcher) {
      router.back();
      return;
    }
    await selectSite(id);
    router.replace('/(app)');
  };

  // If switcher is disabled, show single-site information
  if (!ENV.enableSiteSwitcher) {
    return (
      <View style={styles.disabledContainer}>
        <View style={styles.disabledCard}>
          <View style={[styles.iconBox, { backgroundColor: `${ACTIVE_SITE_INFO.primaryColor}20` }]}>
            <Text style={{ fontSize: 32 }}>{ACTIVE_SITE_INFO.icon}</Text>
          </View>
          <Text style={styles.disabledTitle}>Single-Site Mode Active</Text>
          <Text style={styles.disabledSubtitle}>
            This application is currently running exclusively for:
          </Text>
          <Text style={[styles.siteHighlight, { color: ACTIVE_SITE_INFO.primaryColor }]}>
            {siteName} ({hostname})
          </Text>
          <Text style={styles.instructionsText}>
            To launch a different brand site, run one of the site-specific npm commands:
          </Text>
          <View style={styles.snippetBox}>
            <Text style={styles.snippetText}>npm run start:gujjutours</Text>
            <Text style={styles.snippetText}>npm run start:tripgoasia</Text>
            <Text style={styles.snippetText}>npm run start:technoheaven</Text>
          </View>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: ACTIVE_SITE_INFO.primaryColor }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.closeBtnText}>Return to App</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>[DEV ONLY] Select Brand</Text>
        <Text style={styles.subtitle}>
          Running with EXPO_PUBLIC_ENABLE_SITE_SWITCHER=true for dev diagnostics.
        </Text>
      </View>

      <View style={styles.cardsList}>
        {ALLOWED_SITE_IDS.map((id: WebsiteId) => {
          const site = getSiteEntry(id);
          const isSelected = activeSiteId === id;

          return (
            <TouchableOpacity
              key={id}
              activeOpacity={0.88}
              onPress={() => handleSelect(id)}
              style={[
                styles.siteCard,
                isSelected && styles.siteCardActive,
              ]}
            >
              <Image
                source={{ uri: site.heroImage }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.darkOverlay} />

              <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.badge, { backgroundColor: site.primaryColor }]}>
                    <Text style={styles.badgeText}>{site.themeName}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.activeCheck}>
                      <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                    </View>
                  )}
                </View>

                <Text style={styles.siteLabel}>{site.label}</Text>
                <Text style={styles.siteTagline}>{site.tagline}</Text>
                <Text style={styles.sourceTag}>Hostname: {site.hostname}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Text style={styles.cancelText}>Cancel & Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  header: { marginBottom: SPACING.lg },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: '#0f172a', marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZE.sm, color: '#64748b', lineHeight: 22 },
  cardsList: { gap: SPACING.md },
  siteCard: {
    height: 180,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOW.md,
  },
  siteCardActive: {
    borderColor: '#2563eb',
  },
  cardImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  darkOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.48)' },
  cardContent: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  cardTopRow: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeCheck: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: RADIUS.full,
  },
  siteLabel: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    marginBottom: 2,
  },
  siteTagline: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: FONT_SIZE.xs + 1,
    marginBottom: 4,
  },
  sourceTag: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelText: {
    color: '#64748b',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  disabledContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  disabledCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  disabledTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  disabledSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  siteHighlight: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 10,
  },
  snippetBox: {
    backgroundColor: '#020617',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    marginBottom: 20,
    gap: 4,
  },
  snippetText: {
    color: '#38bdf8',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  closeBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});
