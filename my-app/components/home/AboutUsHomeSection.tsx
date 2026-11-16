/**
 * components/home/AboutUsHomeSection.tsx
 *
 * About Us & Basic Information Section for the Home screen.
 * Config-driven, responsive, brand-tailored, and placed after the E-Ticket section.
 * Features:
 *   - Brand story narrative & mission statement
 *   - Trust & verified stats bar (Rating, Travelers, Destinations, Guarantee)
 *   - Core travel pillars (Verified Safety, Cultural Immersion, Sustainability, Digital Pass)
 *   - Basic Information & Contact Hub (Hotline, Email, Hours, Headquarters, Registration)
 *   - Direct interactive actions: Call, Email, and Read Full Story -> /about
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSiteConfig, useSite } from '@/store/SiteConfigContext';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { DEFAULT_BLURHASH } from '@/lib/imageUtils';
import { SectionHeader } from './SectionHeader';

interface AboutUsHomeSectionProps {
  headingFontFamily?: string;
  title?: string;
  subtitle?: string;
}

export function AboutUsHomeSection({
  headingFontFamily,
  title = 'Our Story & Trust Guarantees',
  subtitle = 'Who we are, trust guarantees & official contact desk',
}: AboutUsHomeSectionProps) {
  const router = useRouter();
  const colors = useColors();
  const config = useSiteConfig();
  const { siteId } = useSelectedSite();
  const { siteName, hostname } = useSite();

  const brandName = config?.name || siteName || 'Tours App';
  const tagline = config?.tagline || 'Making your travel dreams a reality with verified expeditions.';
  const contact = config?.contact || {};

  const phone = contact.phone || config?.content?.contact?.phone || '+1 800 555 0199';
  const email = contact.email || config?.content?.contact?.email || `concierge@${hostname || 'example.com'}`;
  const address = contact.address || config?.content?.contact?.address || 'Headquarters & Global Travel Operations';
  const hours = contact.workingHours || 'Mon – Sun: 9:00 AM – 9:00 PM';

  const bannerImage =
    (config as any)?.about?.image ||
    (config as any)?.assets?.ogImage ||
    (config as any)?.hero?.image ||
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=500&fit=crop';

  const handleCall = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {});
  };

  const handleEmail = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    Linking.openURL(`mailto:${email}?subject=Inquiry%20regarding%20${encodeURIComponent(brandName)}`).catch(() => {});
  };

  const handleOpenAboutPage = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    router.push('/about' as never);
  };

  const configPillars =
    (config as any)?.content?.about?.pillars ||
    (config as any)?.pillars ||
    (config as any)?.about?.pillars;

  const pillars = Array.isArray(configPillars) && configPillars.length > 0
    ? configPillars.map((p: any) => ({
        icon: (p.icon || 'shield-checkmark') as any,
        color: p.color || colors.primary,
        title: p.title || 'Brand Pillar',
        desc: p.desc || p.description || '',
      }))
    : [
        {
          icon: 'shield-checkmark' as const,
          color: '#10b981',
          title: `${brandName} Quality Guarantee`,
          desc: `All itineraries verified by certified destination masters with 24/7 on-ground support.`,
        },
        {
          icon: 'earth' as const,
          color: '#0284c7',
          title: 'Authentic Local Immersion',
          desc: 'Privileged cultural access, curated regional dining trails and landmark experiences.',
        },
        {
          icon: 'leaf' as const,
          color: '#059669',
          title: 'Responsible Travel Standards',
          desc: 'Committed to verified sustainability practices and local community partnerships.',
        },
        {
          icon: 'qr-code' as const,
          color: colors.primary,
          title: 'Instant Digital E-Tickets',
          desc: 'Paperless mobile QR check-in, real-time gate briefs and instant offline vouchers.',
        },
      ];

  return (
    <View style={styles.container}>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        headingFontFamily={headingFontFamily}
        onSeeAll={handleOpenAboutPage}
        seeAllText="Our Story"
      />

      {/* ─── 1. Brand Story Hero Card ─── */}
      <View style={[styles.storyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.imageWrapper}>
          <ExpoImage
            source={{ uri: bannerImage }}
            style={styles.bannerImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            placeholder={{ blurhash: DEFAULT_BLURHASH }}
          />
          <View style={styles.imageOverlay} />

          <View style={styles.imageContent}>
            <View style={[styles.brandPill, { backgroundColor: `${colors.primary}dd` }]}>
              <Ionicons name="sparkles" size={12} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.brandPillText}>OFFICIAL BRAND STORY</Text>
            </View>
            <Text style={[styles.storyCardTitle, { fontFamily: headingFontFamily }]}>{brandName}</Text>
            <Text style={styles.storyCardTagline} numberOfLines={2}>
              {tagline}
            </Text>
          </View>
        </View>

        <View style={styles.storyCardBody}>
          <Text style={[styles.storyParagraph, { color: colors.heading }]}>
            Founded with a passion for transformative journeys, <Text style={{ fontWeight: '800', color: colors.primary }}>{brandName}</Text> bridges the gap between everyday routines and the extraordinary marvels of our planet. From pristine island escapes to culturally immersive expeditions, our team designs each experience with meticulous craftsmanship and verified safety.
          </Text>

          {/* ─── 2. Trust Stats Bar ─── */}
          <View style={[styles.statsGrid, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.statCell}>
              <Text style={[styles.statNum, { color: colors.primary }]}>4.9★</Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>Guest Rating</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statCell}>
              <Text style={[styles.statNum, { color: colors.primary }]}>50K+</Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>Travelers</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statCell}>
              <Text style={[styles.statNum, { color: colors.primary }]}>150+</Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>Destinations</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statCell}>
              <Text style={[styles.statNum, { color: '#10b981' }]}>100%</Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>Verified</Text>
            </View>
          </View>

          {/* ─── 3. Core Travel Pillars ─── */}
          <Text style={[styles.subHeader, { color: colors.heading, fontFamily: headingFontFamily }]}>
            Why Travelers Choose {brandName}
          </Text>
          <View style={styles.pillarsGrid}>
            {pillars.map((item, idx) => (
              <View
                key={`pillar_${idx}`}
                style={[styles.pillarCard, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <View style={[styles.pillarIconBox, { backgroundColor: `${item.color}15` }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pillarTitle, { color: colors.heading }]}>{item.title}</Text>
                  <Text style={[styles.pillarDesc, { color: colors.mutedText }]}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ─── 4. Basic Information & Operations Desk ─── */}
          <Text style={[styles.subHeader, { color: colors.heading, fontFamily: headingFontFamily, marginTop: SPACING.lg }]}>
            Basic Information & Support Desk
          </Text>

          <View style={[styles.infoHubCard, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}25` }]}>
            {/* Headquarters / Operations */}
            <View style={styles.infoRow}>
              <View style={[styles.infoIconPill, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="business-outline" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoRowLabel, { color: colors.mutedText }]}>HEADQUARTERS & DISPATCH HUB</Text>
                <Text style={[styles.infoRowValue, { color: colors.heading }]}>{address}</Text>
              </View>
            </View>

            {/* Support Hotline */}
            <View style={styles.infoRow}>
              <View style={[styles.infoIconPill, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="call-outline" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoRowLabel, { color: colors.mutedText }]}>CONCIERGE & EMERGENCY HOTLINE</Text>
                <Text style={[styles.infoRowValue, { color: colors.heading }]}>{phone}</Text>
              </View>
              <TouchableOpacity testID="btn-call"
                style={[styles.miniActionBtn, { backgroundColor: colors.primary }]}
                onPress={handleCall}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Call concierge"
              >
                <Ionicons name="call" size={12} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.miniActionBtnText}>Call</Text>
              </TouchableOpacity>
            </View>

            {/* Official Email */}
            <View style={styles.infoRow}>
              <View style={[styles.infoIconPill, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="mail-outline" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoRowLabel, { color: colors.mutedText }]}>OFFICIAL SUPPORT DESK</Text>
                <Text style={[styles.infoRowValue, { color: colors.heading }]} numberOfLines={1}>
                  {email}
                </Text>
              </View>
              <TouchableOpacity testID="btn-mail"
                style={[styles.miniActionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                onPress={handleEmail}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Email support desk"
              >
                <Ionicons name="mail" size={12} color={colors.heading} style={{ marginRight: 4 }} />
                <Text style={[styles.miniActionBtnText, { color: colors.heading }]}>Email</Text>
              </TouchableOpacity>
            </View>

            {/* Operating Hours */}
            <View style={styles.infoRow}>
              <View style={[styles.infoIconPill, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="time-outline" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoRowLabel, { color: colors.mutedText }]}>CONCIERGE DESK HOURS</Text>
                <Text style={[styles.infoRowValue, { color: colors.heading }]}>{hours}</Text>
              </View>
            </View>

            {/* License & Security Seal */}
            <View style={styles.securitySealRow}>
              <Ionicons name="shield-checkmark" size={14} color="#10b981" />
              <Text style={[styles.securitySealText, { color: colors.mutedText }]}>
                Verified Tour Operator • 256-Bit SSL Encrypted Pass • ISO-9001 Safety
              </Text>
            </View>
          </View>

          {/* Action Row: Read full about story */}
          <TouchableOpacity testID="btn-book-outline"
            style={[styles.fullAboutBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleOpenAboutPage}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Read full company story and values"
          >
            <Ionicons name="book-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.fullAboutBtnText, { color: colors.heading }]}>
              Read Full Company Story & Heritage
            </Text>
            <Ionicons name="arrow-forward" size={14} color={colors.mutedText} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  storyCard: {
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOW.md,
  },
  imageWrapper: {
    height: 180,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  bannerImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  imageContent: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
  },
  brandPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginBottom: 6,
  },
  brandPillText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  storyCardTitle: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    lineHeight: 26,
    marginBottom: 2,
  },
  storyCardTagline: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: FONT_SIZE.xs,
    lineHeight: 16,
  },
  storyCardBody: {
    padding: SPACING.md,
  },
  storyParagraph: {
    fontSize: FONT_SIZE.xs + 1.5,
    lineHeight: 21,
    fontWeight: '400',
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
  },
  subHeader: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  pillarsGrid: {
    gap: SPACING.xs + 2,
    marginBottom: SPACING.sm,
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  pillarIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTitle: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
    marginBottom: 1,
  },
  pillarDesc: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  infoHubCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm + 2,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoIconPill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRowLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  infoRowValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  miniActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  miniActionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  securitySealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  securitySealText: {
    fontSize: 10,
    fontWeight: '500',
    flex: 1,
  },
  fullAboutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  fullAboutBtnText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
  },
});
