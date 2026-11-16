/**
 * components/home/TravelHubModal.tsx
 *
 * Full Travel Hub bottom sheet modal.
 * Cleanly organizes all 18+ specialized travel utilities by purpose:
 *   - Logistics & Transit
 *   - Money & Shopping
 *   - Connectivity & Border
 *   - Safety & Health
 *   - Trips & Memories
 *   - Sustainability & Decorum
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';

export interface TravelHubModalProps {
  visible: boolean;
  onClose: () => void;
}

interface HubItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  badge?: string;
}

interface HubCategory {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: HubItem[];
}

const HUB_CATEGORIES: HubCategory[] = [
  {
    title: 'Logistics & Transit',
    icon: 'airplane-outline',
    items: [
      {
        id: 'transfers',
        title: 'Airport Chauffeur Transfer',
        subtitle: 'Pre-book flight meet-and-greet pickup',
        icon: 'car-sport-outline',
        route: '/airport-transfer',
      },
      {
        id: 'transit',
        title: 'Rapid Transit Navigator',
        subtitle: 'Subway lines & taxi meter shields',
        icon: 'subway-outline',
        route: '/transit-guide',
      },
      {
        id: 'baggage',
        title: 'Airline Baggage Sizer',
        subtitle: 'Cabin & checked luggage weight rules',
        icon: 'briefcase-outline',
        route: '/baggage-calculator',
      },
      {
        id: 'drive',
        title: 'Drive & Motorbike Safety',
        subtitle: 'International permits & road rules',
        icon: 'shield-checkmark-outline',
        route: '/drive-safety',
      },
    ],
  },
  {
    title: 'Money & Shopping',
    icon: 'cash-outline',
    items: [
      {
        id: 'forex',
        title: 'Currency & Forex Radar',
        subtitle: 'Live mid-market rates & ATM DCC shield',
        icon: 'trending-up-outline',
        route: '/forex-radar',
        badge: 'LIVE',
      },
      {
        id: 'tax',
        title: 'Duty-Free Tax Refund Pass',
        subtitle: 'VAT/GST receipt scanner & refund kiosks',
        icon: 'receipt-outline',
        route: '/tax-refund',
      },
      {
        id: 'tipping',
        title: 'Tipping Etiquette Guide',
        subtitle: 'Country tipping rules & bill split calculator',
        icon: 'calculator-outline',
        route: '/tipping-guide',
      },
      {
        id: 'bargain',
        title: 'Bargaining Counter-Offer',
        subtitle: 'Local market phrases & polite negotiation',
        icon: 'pricetags-outline',
        route: '/bargain-assistant',
      },
    ],
  },
  {
    title: 'Connectivity & Clearance',
    icon: 'globe-outline',
    items: [
      {
        id: 'esim',
        title: 'Travel eSIM & 5G Roaming',
        subtitle: 'Instant digital data eSIMs for 150+ countries',
        icon: 'cellular-outline',
        route: '/esim-roaming',
        badge: '5G',
      },
      {
        id: 'visa',
        title: 'Visa & Border Clearance',
        subtitle: 'Embassy entry rules & passport validity',
        icon: 'document-text-outline',
        route: '/visa-hub',
      },
      {
        id: 'power',
        title: 'International Power Sockets',
        subtitle: 'Wall plug types, voltage & plug adapters',
        icon: 'flash-outline',
        route: '/power-guide',
      },
      {
        id: 'phrasebook',
        title: 'Offline Pocket Phrasebook',
        subtitle: 'Pronunciation audio & flashcards for locals',
        icon: 'chatbubbles-outline',
        route: '/phrasebook',
      },
    ],
  },
  {
    title: 'Safety & Health',
    icon: 'medkit-outline',
    items: [
      {
        id: 'insurance',
        title: 'Travel Medical Insurance',
        subtitle: 'Cashless hospital network & claims',
        icon: 'heart-outline',
        route: '/insurance',
      },
      {
        id: 'pharmacy',
        title: 'Travel Pharmacy & Medication',
        subtitle: 'Medicine generic translator & customs rules',
        icon: 'bandage-outline',
        route: '/pharmacy-guide',
      },
    ],
  },
  {
    title: 'Trips & Memories',
    icon: 'map-outline',
    items: [
      {
        id: 'group',
        title: 'Group Trip Collaborative Planning',
        subtitle: 'Shared voting polls & expense tally',
        icon: 'people-outline',
        route: '/group-planning',
      },
      {
        id: 'journal',
        title: 'Expedition Memory Scrapbook',
        subtitle: 'Daily travel journal with photo stamps',
        icon: 'book-outline',
        route: '/travel-journal',
      },
      {
        id: 'dispatch',
        title: 'Day-Of Live Cockpit',
        subtitle: 'Tour guide announcements & meeting points',
        icon: 'compass-outline',
        route: '/day-cockpit',
      },
      {
        id: 'wrapped',
        title: 'Travel Wrapped & Loyalty Club',
        subtitle: 'Yearly expedition milestones & badges',
        icon: 'trophy-outline',
        route: '/travel-wrapped',
      },
    ],
  },
  {
    title: 'Culture & Environment',
    icon: 'leaf-outline',
    items: [
      {
        id: 'eco',
        title: 'Eco-Travel & Carbon Offset',
        subtitle: 'Flight carbon footprint gauge & green perks',
        icon: 'leaf-outline',
        route: '/eco-travel',
      },
      {
        id: 'culture',
        title: 'Cultural Decorum & Dress Codes',
        subtitle: 'Sacred temple dress codes & social etiquette',
        icon: 'sparkles-outline',
        route: '/culture-etiquette',
      },
    ],
  },
];

export function TravelHubModal({ visible, onClose }: TravelHubModalProps) {
  const router = useRouter();
  const colors = useColors();

  const handleNavigate = (route: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignored
    }
    onClose();
    router.push(route as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback testID="btn-dismiss" accessibilityLabel="Dismiss" onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback testID="btn-travelhubmodal-254" accessibilityLabel="travelhubmodal action" onPress={(e) => e?.stopPropagation?.()}>
            <View style={[styles.sheetContainer, { backgroundColor: colors.surface }]}>
              {/* Header */}
              <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <View style={[styles.hubIconBadge, { backgroundColor: `${colors.primary}18` }]}>
                    <Ionicons name="apps" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.headerTitle, { color: colors.heading }]}>
                      All Travel Services
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
                      Essential tools, logistics & guides for your journey
                    </Text>
                  </View>
                </View>

                <TouchableOpacity testID="btn-close"
                  onPress={onClose}
                  style={[styles.closeButton, { backgroundColor: colors.background }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Close travel hub"
                >
                  <Ionicons name="close" size={20} color={colors.mutedText} />
                </TouchableOpacity>
              </View>

              {/* Scrollable Categorized Grid */}
              <ScrollView
                style={styles.scrollList}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {HUB_CATEGORIES.map((cat, catIdx) => (
                  <View key={`cat_${catIdx}`} style={styles.categoryBlock}>
                    <View style={styles.categoryTitleRow}>
                      <Ionicons name={cat.icon} size={15} color={colors.primary} style={{ marginRight: 6 }} />
                      <Text style={[styles.categoryTitle, { color: colors.primary }]}>
                        {cat.title}
                      </Text>
                    </View>

                    <View style={styles.itemsGrid}>
                      {cat.items.map((item) => (
                        <TouchableOpacity testID="btn-travelhubmodal-300" accessibilityLabel="travelhubmodal action"
                          key={item.id}
                          style={[
                            styles.itemCard,
                            {
                              backgroundColor: colors.background,
                              borderColor: colors.border,
                            },
                          ]}
                          onPress={() => handleNavigate(item.route)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.cardHeader}>
                            <View
                              style={[
                                styles.cardIconBox,
                                { backgroundColor: `${colors.primary}14` },
                              ]}
                            >
                              <Ionicons name={item.icon} size={20} color={colors.primary} />
                            </View>
                            {item.badge ? (
                              <View style={[styles.badge, { backgroundColor: colors.accent || '#f59e0b' }]}>
                                <Text style={styles.badgeText}>{item.badge}</Text>
                              </View>
                            ) : null}
                          </View>

                          <Text
                            style={[styles.cardTitle, { color: colors.heading }]}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          <Text
                            style={[styles.cardSubtitle, { color: colors.mutedText }]}
                            numberOfLines={2}
                          >
                            {item.subtitle}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '86%',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.md,
    ...SHADOW.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hubIconBadge: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollList: {
    paddingHorizontal: SPACING.lg,
  },
  scrollContent: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl + 16,
    gap: SPACING.lg,
  },
  categoryBlock: {
    gap: SPACING.sm,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  itemCard: {
    width: '48.5%',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    minHeight: 110,
    justifyContent: 'space-between',
    ...SHADOW.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  cardIconBox: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 10,
    lineHeight: 13,
  },
});
