/**
 * app/(tabs)/profile.tsx
 *
 * User Profile & Personalization Hub.
 * Features:
 *   - AppHeader with brand logo and quick edit action
 *   - Passenger Identity Hero Card with avatar selector and verified explorer badges
 *   - Journey Stats Dashboard (Reservations, Upcoming, Wishlist)
 *   - Travel Preferences (Dietary, Travel Pace, Notifications, Special Assistance) with tenant persistence
 *   - Multi-Brand Concierge & Priority Support (Phone Dialer, WhatsApp Concierge, Email)
 *   - Interactive Edit Profile Modal for updating name, email, phone, and avatar presets
 *   - Active Website Configuration & Tenant Information
 *   - Complete type safety with zero `any` and 44px minimum touch targets
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Switch,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useNotification } from '@/context/NotificationContext';
import { useLanguage } from '@/context/LanguageContext';
import { useConcierge } from '@/context/ConciergeContext';
import CurrencyModal from '@/components/CurrencyModal';
import { SITE_REGISTRY, type SiteEntry, type WebsiteId } from '@/constants/siteRegistry';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import { ENV } from '@/config/env';
import BrandLogo from '@/components/common/BrandLogo';
import { storeGetObject, storeSetObject } from '@/src/lib/storage';

interface GuestProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
}

interface TravelPreferences {
  dietary: 'all' | 'veg' | 'jain' | 'halal' | 'vegan';
  pace: 'relaxed' | 'moderate' | 'adventure';
  notifications: boolean;
  specialAssistance: boolean;
}

const DEFAULT_PREFERENCES: TravelPreferences = {
  dietary: 'all',
  pace: 'moderate',
  notifications: true,
  specialAssistance: false,
};

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces',
];

export default function ProfileTabScreen() {
  const router = useRouter();
  const colors = useColors();
  const config = useSiteConfig();
  const { siteId, hostname, siteName } = useSite();
  const { selectSite } = useSelectedSite();
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const { bookings, upcomingCount } = useBooking();
  const { wishlistIds } = useWishlist();
  const {
    permissionStatus,
    preferences: notifPrefs,
    updatePreferences: updateNotifPrefs,
    requestPermissions,
    sendTestNotification,
    openCenter,
    unreadCount,
  } = useNotification();
  const { currentLanguage, openLanguageModal, t } = useLanguage();
  const { openConcierge, specialist } = useConcierge();
  const headingFontFamily = getHeadingFontFamily(config);

  // Guest Profile local state (for non-authenticated travelers)
  const [guestProfile, setGuestProfile] = useState<GuestProfile>({
    name: 'Guest Explorer',
    email: '',
    phone: '',
    avatar: AVATAR_PRESETS[0],
  });

  // Travel preferences local state
  const [preferences, setPreferences] = useState<TravelPreferences>(DEFAULT_PREFERENCES);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  // Edit Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Currency Switcher State
  const { currentCurrency } = useCurrency();
  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);

  // Restore guest profile & preferences on mount per tenant
  useEffect(() => {
    let cancelled = false;

    async function loadStoredData() {
      try {
        const storedGuest = await storeGetObject<GuestProfile>('guest_profile');
        if (!cancelled && storedGuest) {
          setGuestProfile(storedGuest);
        }

        const storedPrefs = await storeGetObject<TravelPreferences>('travel_preferences');
        if (!cancelled && storedPrefs) {
          setPreferences(storedPrefs);
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('[ProfileTabScreen] Failed to load stored profile/preferences:', err);
        }
      } finally {
        if (!cancelled) {
          setLoadingPrefs(false);
        }
      }
    }

    loadStoredData();
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  // Derived passenger values
  const activeName = user?.name || guestProfile.name || 'Guest Explorer';
  const activeEmail = user?.email || guestProfile.email || '';
  const activePhone = user?.phone || guestProfile.phone || '';
  const activeAvatar = user?.avatar || guestProfile.avatar || AVATAR_PRESETS[0];

  const handleOpenEditModal = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    setEditName(activeName);
    setEditEmail(activeEmail);
    setEditPhone(activePhone);
    setEditAvatar(activeAvatar);
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Name Required', 'Please enter a passenger display name.');
      return;
    }

    setSavingProfile(true);
    try {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics fallback
      }

      if (isAuthenticated) {
        await updateProfile({
          name: editName.trim(),
          email: editEmail.trim() || undefined,
          phone: editPhone.trim() || undefined,
          avatar: editAvatar,
        });
      } else {
        const updatedGuest: GuestProfile = {
          name: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          avatar: editAvatar,
        };
        await storeSetObject('guest_profile', updatedGuest);
        setGuestProfile(updatedGuest);
      }

      setIsEditModalVisible(false);
      Alert.alert('Profile Updated', 'Your passenger details have been saved.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save profile details.';
      Alert.alert('Save Error', msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePreference = async <K extends keyof TravelPreferences>(
    key: K,
    value: TravelPreferences[K]
  ) => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    const updated: TravelPreferences = { ...preferences, [key]: value };
    setPreferences(updated);
    await storeSetObject('travel_preferences', updated);
  };

  const handleSwitchSite = async (targetId: WebsiteId) => {
    if (targetId === siteId) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics fallback
    }
    await selectSite(targetId);
  };

  const handleSignOut = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Haptics fallback
    }
    Alert.alert('Sign Out', 'Are you sure you want to log out of your account on this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  // Concierge dialer & whatsapp handlers
  const contactConfig = (config as { contact?: { phone?: string; email?: string; whatsapp?: string } } | null)?.contact || {};
  const rawPhone = contactConfig.phone || '+91 79 4000 1234';
  const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
  const supportEmail = contactConfig.email || 'concierge@gujjutours.com';

  const handleCallConcierge = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    const url = `tel:${cleanPhone}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) Linking.openURL(url);
      else Alert.alert('Dialer Unavailable', `Please call our concierge at ${rawPhone}`);
    });
  };

  const handleWhatsAppChat = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    const waNumber = cleanPhone.replace(/^\+/, '');
    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(
      `Hello ${siteName || 'Concierge'}, I have a question regarding my travel expeditions.`
    )}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) Linking.openURL(url);
      else Alert.alert('WhatsApp Unavailable', `Please reach us directly at ${rawPhone}`);
    });
  };

  const handleEmailSupport = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    const url = `mailto:${supportEmail}?subject=${encodeURIComponent(
      `Support Inquiry - ${siteName || 'ToursApp'}`
    )}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) Linking.openURL(url);
      else Alert.alert('Email Unavailable', `Please email our concierge at ${supportEmail}`);
    });
  };

  const handleFAQAlert = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    Alert.alert(
      'Concierge & Help Center',
      `Our concierge desk is active daily from 9:00 AM to 9:00 PM IST.\n\n` +
        `• Phone: ${rawPhone}\n` +
        `• Email: ${supportEmail}\n` +
        `• All bookings are secured with guaranteed refund policies.`,
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Passenger Identity Card ─── */}
        <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            onPress={handleOpenEditModal}
            activeOpacity={0.8}
            style={styles.avatarWrapper}
            accessibilityRole="button"
            accessibilityLabel="Change avatar image"
          >
            <Image
              source={{ uri: activeAvatar }}
              style={styles.avatar}
              contentFit="cover"
              transition={300}
            />
            <View style={[styles.avatarEditBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={12} color="#ffffff" />
            </View>
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <TouchableOpacity
              style={styles.userNameRow}
              onPress={handleOpenEditModal}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Edit profile details"
            >
              <Text
                style={[styles.userName, { color: colors.heading, fontFamily: headingFontFamily }]}
                numberOfLines={1}
              >
                {activeName}
              </Text>
              <View style={[styles.nameEditBadge, { backgroundColor: `${colors.primary}18` }]}>
                <Ionicons name="pencil" size={12} color={colors.primary} />
              </View>
            </TouchableOpacity>

            <Text style={[styles.userEmail, { color: colors.mutedText }]} numberOfLines={1}>
              {activeEmail || (isAuthenticated ? 'No email linked' : 'Tap to link email & phone')}
            </Text>
            {activePhone ? (
              <Text style={[styles.userPhone, { color: colors.mutedText }]} numberOfLines={1}>
                📞 {activePhone}
              </Text>
            ) : null}

            {/* Status Pills */}
            <View style={styles.badgeRow}>
              {isAuthenticated ? (
                <View style={[styles.statusPill, { backgroundColor: `${colors.primary}18` }]}>
                  <Ionicons name="shield-checkmark" size={11} color={colors.primary} style={{ marginRight: 3 }} />
                  <Text style={[styles.statusPillText, { color: colors.primary }]}>Verified Member</Text>
                </View>
              ) : (
                <View style={[styles.statusPill, { backgroundColor: '#64748b18' }]}>
                  <Ionicons name="compass-outline" size={11} color="#64748b" style={{ marginRight: 3 }} />
                  <Text style={[styles.statusPillText, { color: '#64748b' }]}>Guest Explorer</Text>
                </View>
              )}

              {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin') && (
                <View style={[styles.statusPill, { backgroundColor: '#8b5cf618' }]}>
                  <Ionicons name="key" size={11} color="#8b5cf6" style={{ marginRight: 3 }} />
                  <Text style={[styles.statusPillText, { color: '#8b5cf6' }]}>Admin Access</Text>
                </View>
              )}
            </View>
          </View>

          {!isAuthenticated ? (
            <TouchableOpacity
              style={[styles.signInBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <Text style={styles.signInBtnText}>Sign In</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.cardEditActionBtn,
                {
                  backgroundColor: `${colors.primary}12`,
                  borderColor: `${colors.primary}25`,
                },
              ]}
              onPress={handleOpenEditModal}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Ionicons name="pencil" size={15} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Quick Journey Stats Dashboard ─── */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/bookings')}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="View all bookings"
          >
            <View style={[styles.statIconBox, { backgroundColor: `${colors.primary}14` }]}>
              <Ionicons name="briefcase" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.statCount, { color: colors.heading, fontFamily: headingFontFamily }]}>
              {bookings.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedText }]}>Reservations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/bookings')}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="View upcoming trips"
          >
            <View style={[styles.statIconBox, { backgroundColor: '#f59e0b18' }]}>
              <Ionicons name="calendar" size={18} color="#f59e0b" />
            </View>
            <Text style={[styles.statCount, { color: colors.heading, fontFamily: headingFontFamily }]}>
              {upcomingCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedText }]}>Upcoming</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/wishlist')}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="View wishlist"
          >
            <View style={[styles.statIconBox, { backgroundColor: '#ef444418' }]}>
              <Ionicons name="heart" size={18} color="#ef4444" />
            </View>
            <Text style={[styles.statCount, { color: colors.heading, fontFamily: headingFontFamily }]}>
              {wishlistIds.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedText }]}>Wishlist</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Language & Regional Display ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.mutedText }]}>
            {t('profile_language', 'LANGUAGE')} & {t('profile_currency', 'CURRENCY')}
          </Text>

          <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Language Switcher */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={openLanguageModal}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Change app language. Currently ${currentLanguage.nativeName}`}
            >
              <View style={[styles.menuIconBox, { backgroundColor: `${colors.primary}14` }]}>
                <Text style={{ fontSize: 18 }}>{currentLanguage.flag}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  {currentLanguage.nativeName} ({currentLanguage.name})
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Tap to switch app language & itineraries
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Currency Switcher */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {
                  // Haptics fallback
                }
                setIsCurrencyModalVisible(true);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Change display currency. Currently ${currentCurrency.name}`}
            >
              <View style={[styles.menuIconBox, { backgroundColor: `${colors.primary}14` }]}>
                <Text style={{ fontSize: 18 }}>{currentCurrency.flag}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  {currentCurrency.code} ({currentCurrency.symbol.trim()}) · {currentCurrency.name}
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Tap to convert prices across all tours
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            {/* Flight & Airport Chauffeur Transfer */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/airport-transfer' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Flight and Airport Chauffeur Transfer Hub"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#0284C718' }]}>
                <Ionicons name="airplane" size={18} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Flight Tracker & Airport Chauffeur
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Terminal gates, carousel alerts, chauffeur meet & greet sign
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Today's Expedition Cockpit */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/day-cockpit' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Today's Expedition Cockpit"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#EA580C18' }]}>
                <Ionicons name="compass" size={18} color="#EA580C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Today's Expedition Cockpit
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Chauffeur dispatch, live itinerary progress, audio triggers & boarding passes
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Group Expedition Planning Hub */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/group-planning' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Group Expedition Planning Hub"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#8B5CF618' }]}>
                <Ionicons name="people" size={18} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Group Expedition Party & Polls
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Shared gear checklist, co-traveler polls, dietary matrix & WhatsApp invites
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Travel Scrapbook & Memory Journal */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/travel-journal' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Travel Scrapbook and Memory Journal"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#EC489918' }]}>
                <Ionicons name="book" size={18} color="#EC4899" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Travel Scrapbook & Memory Reel
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Photo milestones, mood tags, journey statistics & exportable story reel
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* In-Destination Pocket Phrasebook & Show-to-Local Flashcard */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/phrasebook' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Destination Phrasebook and Show-to-Local Translator"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#10B98118' }]}>
                <Ionicons name="chatbubbles" size={18} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Destination Phrasebook & Translator
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Offline regional dialects, phonetics, dietary cards & show-to-local display
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Tax-Free Duty-Free Shopping & VAT/GST Refund Pass */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/tax-refund' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Tax-Free Shopping and VAT/GST Refund Pass"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#F59E0B18' }]}>
                <Ionicons name="receipt" size={18} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Tax-Free Shopping & VAT/GST Refund
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Airport customs claim pass, invoice vault, min spend tracker & duty-free limits
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Travel eSIM & 5G Cellular Roaming Hub */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/esim-roaming' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Travel eSIM and 5G Roaming Hub"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#0284C718' }]}>
                <Ionicons name="cellular" size={18} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Travel eSIM & 5G Roaming Hub
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Data consumption meter, installation QR code, booster top-ups & free airport Wi-Fi
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Travel Insurance Policy & Medical Claim Concierge */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/insurance' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Travel Insurance Policy and Cashless Medical Concierge"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#05966918' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Travel Insurance & Medical Concierge
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  $500k policy card, cashless hospital directory, 24/7 SOS desk & fast-track GOP
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* International Visa Hub & Consular Clearance */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/visa-hub' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open International Visa Hub and Consular Directory"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#15803D18' }]}>
                <Ionicons name="airplane" size={18} color="#15803D" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  International Visa & Consular Hub
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Entry visa rules, 6-month passport validity test, digital arrival cards & embassies
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Sustainable Travel & Carbon Offset */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/eco-travel' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Sustainable Travel and Carbon Offset Hub"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#05966918' }]}>
                <Ionicons name="leaf" size={18} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Sustainable Travel & Carbon Offset
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Scope 3 flight calculator, verified climate offset certificates & eco-pledges
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Cultural Decorum & Temple Dress Codes */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/culture-etiquette' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Cultural Decorum and Temple Dress Codes Hub"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#B4530918' }]}>
                <Ionicons name="sparkles" size={18} color="#B45309" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Cultural Decorum & Dress Codes
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Sacred temple modesty test, monk etiquette, social taboos & prescription rules
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Power Sockets, Voltage & Battery Rentals */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/power-guide' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Power Sockets, Voltage and Battery Rentals Hub"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#1D4ED818' }]}>
                <Ionicons name="hardware-chip-outline" size={18} color="#1D4ED8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Power Sockets, Voltage & Torch
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Pin compatibility visualizer, appliance voltage tester & power bank kiosks
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Airline Baggage Allowance & Sizer */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/baggage-calculator' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Airline Baggage Allowance and Sizer Hub"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#16A34A18' }]}>
                <Ionicons name="airplane-outline" size={18} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Airline Baggage & Sizer
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Weight allowance calculator, excess fee estimator & dangerous goods rules
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Rapid Transit Navigator & Taxi Scam Shield */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/transit-guide' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Rapid Transit Navigator and Taxi Meter Scam Shield Hub"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#1D4ED818' }]}>
                <Ionicons name="train-outline" size={18} color="#1D4ED8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Transit & Taxi Scam Shield
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Subway line fares, interchange routes & taxi meter scam fair-fare estimator
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Travel Pharmacy & Medicine Translator */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/pharmacy-guide' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Travel Pharmacy and Prescription Medicine Translator Hub"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#DC262618' }]}>
                <Ionicons name="medkit-outline" size={18} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Travel Pharmacy & Meds
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  OTC brand translator, show-pharmacist flashcards & 24/7 Boots directory
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Tipping & Gratuity Etiquette Calculator */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/tipping-guide' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Tipping and Gratuity Etiquette Calculator Hub"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#16A34A18' }]}>
                <Ionicons name="cash-outline" size={18} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Tipping & Gratuity Guide
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Massage, drivers & hotel bellboy norms with smart bill & service charge splitter
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Driving & Motorbike Safety Hub */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/drive-safety' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Driving, Motorbike Safety and Rental Scam Shield Hub"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#2563EB18' }]}>
                <Ionicons name="car-sport" size={18} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Driving & Motorbike Safety
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  IDP license rules, scooter scam shield & pre-ride vehicle inspection wizard
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Currency Exchange & ATM DCC Shield Hub */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/forex-radar' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Currency Exchange Radar and ATM DCC Shield Hub"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#05966918' }]}>
                <Ionicons name="cash-outline" size={18} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Currency Exchange & ATM DCC Shield
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  SuperRich live rates, airport spread comparison & ATM fee dynamic conversion shield
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Local Market Bargaining Counter-Offer & Negotiation Phrases */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/bargain-assistant' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Local Market Bargaining Counter-Offer and Negotiation Phrases Assistant"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#EA580C18' }]}>
                <Ionicons name="pricetags-outline" size={18} color="#EA580C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Market Bargaining & Counter-Offer Assistant
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Souvenir pricing benchmarks, 3-round counter offers & speech-ready polite phrases
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Travel Wrapped & VIP Loyalty Rewards Hub (Phase 40) */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/travel-wrapped' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Travel Wrapped 2026, VIP Loyalty Tier and Honors Diploma"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#F59E0B22' }]}>
                <Ionicons name="sparkles" size={18} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.menuItemText, { color: colors.heading }]}>
                    Travel Wrapped & VIP Loyalty Club
                  </Text>
                  <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#B45309' }}>2026</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Expedition story reel, carbon offset, loyalty vouchers & completion diploma
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            {/* Travel Vault & Emergency SOS */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/travel-vault' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Travel Vault and Emergency SOS"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#DC262618' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Travel Vault & Safety SOS
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Passports, offline boarding passes & 24/7 emergency dispatch
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Trip Budget & Group Splitter */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/trip-budget' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Trip Budget and Expense Splitter"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#10B98118' }]}>
                <Ionicons name="wallet" size={18} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Trip Budget & Expense Splitter
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Multi-currency tracker, group debt settlement & WhatsApp export
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Expedition Audio Guide & Stories */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/audio-guide' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Expedition Audio Guide and Stories"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#8B5CF618' }]}>
                <Ionicons name="headset" size={18} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Expedition Audio Guide
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Narrated cultural histories, offline audio & synchronized scripts
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Expedition Passport & Rewards */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/passport' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Expedition Passport and Rewards"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#F59E0B18' }]}>
                <Ionicons name="ribbon" size={18} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Expedition Passport & Rewards
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Destination stamps, milestone challenges & VIP loyalty perks
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Destination Climate & Marine Radar */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/weather-forecast' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Destination Climate and Weather Radar"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#38BDF818' }]}>
                <Ionicons name="partly-sunny" size={18} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Climate & Tide Radar
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  7-day microclimate forecast, marine swell, UV index & advisories
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Regional Culinary Trail & Dining */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                router.push('/culinary-guide' as never);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Regional Culinary Trail and Dining Guide"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#F9731618' }]}>
                <Ionicons name="restaurant" size={18} color="#EA580C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>
                  Culinary Trail & Dining
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Iconic regional dishes, dietary filters, hygiene guide & VIP table booking
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Travel Preferences (Tenant Isolated) ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.mutedText }]}>
            TRAVEL PREFERENCES
          </Text>

          <View style={[styles.prefsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Dietary Preference */}
            <View style={styles.prefBlock}>
              <Text style={[styles.prefTitle, { color: colors.heading }]}>Dietary Preference</Text>
              <Text style={[styles.prefSub, { color: colors.mutedText }]}>
                Pre-selects dining specifications for tour itineraries
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prefChipsRow}>
                {(
                  [
                    { key: 'all', label: 'All Cuisines' },
                    { key: 'veg', label: 'Pure Veg' },
                    { key: 'jain', label: 'Jain Food' },
                    { key: 'halal', label: 'Halal' },
                    { key: 'vegan', label: 'Vegan' },
                  ] as const
                ).map((opt) => {
                  const isSelected = preferences.dietary === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.prefChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => handleUpdatePreference('dietary', opt.key)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.prefChipText,
                          { color: isSelected ? '#ffffff' : colors.mutedText },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Travel Pace */}
            <View style={styles.prefBlock}>
              <Text style={[styles.prefTitle, { color: colors.heading }]}>Preferred Pace</Text>
              <Text style={[styles.prefSub, { color: colors.mutedText }]}>
                Calibrates expedition suggestions and daily schedules
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prefChipsRow}>
                {(
                  [
                    { key: 'relaxed', label: 'Relaxed & Leisure' },
                    { key: 'moderate', label: 'Moderate Explorer' },
                    { key: 'adventure', label: 'High Adventure' },
                  ] as const
                ).map((opt) => {
                  const isSelected = preferences.pace === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.prefChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => handleUpdatePreference('pace', opt.key)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.prefChipText,
                          { color: isSelected ? '#ffffff' : colors.mutedText },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Special Assistance Switch */}
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={[styles.prefTitle, { color: colors.heading }]}>Special Assistance</Text>
                <Text style={[styles.prefSub, { color: colors.mutedText }]}>
                  Flag mobility or special support requirements to the tour guide
                </Text>
              </View>
              <Switch
                value={preferences.specialAssistance}
                onValueChange={(val) => handleUpdatePreference('specialAssistance', val)}
                trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                thumbColor={preferences.specialAssistance ? colors.primary : '#ffffff'}
              />
            </View>
          </View>
        </View>

        {/* ─── Push Notifications & Departure Reminders ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <Text style={[styles.sectionHeading, { color: colors.mutedText }]}>
              NOTIFICATIONS & DEPARTURE ALERTS
            </Text>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={openCenter} style={styles.inboxPill} activeOpacity={0.8}>
                <Ionicons name="notifications" size={11} color="#ffffff" style={{ marginRight: 3 }} />
                <Text style={styles.inboxPillText}>{unreadCount} unread</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.prefsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Permission Status Banner */}
            <View
              style={[
                styles.permBanner,
                {
                  backgroundColor: permissionStatus === 'granted' ? '#22c55e14' : '#f59e0b14',
                  borderColor: permissionStatus === 'granted' ? '#22c55e30' : '#f59e0b30',
                },
              ]}
            >
              <Ionicons
                name={permissionStatus === 'granted' ? 'shield-checkmark' : 'alert-circle'}
                size={18}
                color={permissionStatus === 'granted' ? '#22c55e' : '#f59e0b'}
                style={{ marginRight: 8 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.permTitle,
                    { color: permissionStatus === 'granted' ? '#22c55e' : '#f59e0b' },
                  ]}
                >
                  {permissionStatus === 'granted'
                    ? 'Push Notifications Active'
                    : 'Enable Push Notifications'}
                </Text>
                <Text style={[styles.permSub, { color: colors.mutedText }]}>
                  {permissionStatus === 'granted'
                    ? 'System alerts, countdowns, and mobile vouchers are active'
                    : 'Grant permissions to receive 24h departure reminders & vouchers'}
                </Text>
              </View>

              {permissionStatus !== 'granted' && (
                <TouchableOpacity
                  style={[styles.enableBtn, { backgroundColor: colors.primary }]}
                  onPress={requestPermissions}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Enable push notifications"
                >
                  <Text style={styles.enableBtnText}>Enable</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Toggle 1: Departure Alerts */}
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={[styles.prefTitle, { color: colors.heading }]}>
                  Departure Countdown Reminders
                </Text>
                <Text style={[styles.prefSub, { color: colors.mutedText }]}>
                  Automatic 24h & 2h notifications before scheduled tour departures
                </Text>
              </View>
              <Switch
                value={notifPrefs.departureAlerts}
                onValueChange={(val) => updateNotifPrefs({ departureAlerts: val })}
                trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                thumbColor={notifPrefs.departureAlerts ? colors.primary : '#ffffff'}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Toggle 2: Booking Confirmations */}
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={[styles.prefTitle, { color: colors.heading }]}>
                  E-Ticket & Booking Updates
                </Text>
                <Text style={[styles.prefSub, { color: colors.mutedText }]}>
                  Instant reservation confirmations and ticket download alerts
                </Text>
              </View>
              <Switch
                value={notifPrefs.bookingUpdates}
                onValueChange={(val) => updateNotifPrefs({ bookingUpdates: val })}
                trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                thumbColor={notifPrefs.bookingUpdates ? colors.primary : '#ffffff'}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Toggle 3: Promotions & Deals */}
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={[styles.prefTitle, { color: colors.heading }]}>
                  Exclusive Member Deals
                </Text>
                <Text style={[styles.prefSub, { color: colors.mutedText }]}>
                  Seasonal flash sales and VIP discounts tailored for {siteName}
                </Text>
              </View>
              <Switch
                value={notifPrefs.promotions}
                onValueChange={(val) => updateNotifPrefs({ promotions: val })}
                trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                thumbColor={notifPrefs.promotions ? colors.primary : '#ffffff'}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Action Buttons: Open Inbox & Send Test Alert */}
            <View style={styles.notifActionsRow}>
              <TouchableOpacity
                style={[styles.inboxBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={openCenter}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Open notification inbox"
              >
                <Ionicons name="mail-unread-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.inboxBtnText, { color: colors.heading }]}>
                  View Inbox {unreadCount > 0 ? `(${unreadCount})` : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.testDispatchBtn, { backgroundColor: `${colors.primary}15` }]}
                onPress={() => sendTestNotification()}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Send test departure notification"
              >
                <Ionicons name="paper-plane" size={15} color={colors.primary} style={{ marginRight: 5 }} />
                <Text style={[styles.testDispatchBtnText, { color: colors.primary }]}>
                  Test Alert
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ─── Concierge & Priority Support ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.mutedText }]}>
            CONCIERGE & SUPPORT
          </Text>

          <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* 24/7 Specialist Live Chat */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => openConcierge()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Chat with travel specialist ${specialist.specialistName}`}
            >
              <View style={[styles.menuIconBox, { backgroundColor: `${colors.primary}18` }]}>
                <Ionicons name="chatbubbles" size={17} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.menuItemText, { color: colors.heading }]}>
                    24/7 Concierge Chat ({specialist.specialistName})
                  </Text>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10b981' }} />
                </View>
                <Text style={[styles.menuItemSub, { color: colors.mutedText }]}>
                  {specialist.role} · {specialist.typicalReplyTime}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />

            {/* Call Concierge */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleCallConcierge}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Call tour concierge"
            >
              <View style={[styles.menuIconBox, { backgroundColor: `${colors.primary}14` }]}>
                <Ionicons name="call" size={17} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>Call Tour Concierge</Text>
                <Text style={[styles.menuItemSub, { color: colors.mutedText }]}>{rawPhone}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />

            {/* WhatsApp Concierge */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleWhatsAppChat}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Chat on WhatsApp"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#22c55e18' }]}>
                <Ionicons name="logo-whatsapp" size={17} color="#22c55e" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>WhatsApp Concierge Desk</Text>
                <Text style={[styles.menuItemSub, { color: colors.mutedText }]}>Instant booking & itinerary assistance</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />

            {/* Email Concierge */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleEmailSupport}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Email concierge"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#3b82f618' }]}>
                <Ionicons name="mail" size={17} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>Email Support Desk</Text>
                <Text style={[styles.menuItemSub, { color: colors.mutedText }]}>{supportEmail}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
            </TouchableOpacity>

            <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />

            {/* FAQ & Service Information */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleFAQAlert}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Help and support information"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#8b5cf618' }]}>
                <Ionicons name="help-circle" size={17} color="#8b5cf6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: colors.heading }]}>Help Center & Service Hours</Text>
                <Text style={[styles.menuItemSub, { color: colors.mutedText }]}>FAQs, refunds, and operating hours</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Active Site Configuration ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.mutedText }]}>
            ACTIVE WEBSITE CONFIGURATION
          </Text>

          <View
            style={[
              styles.siteRow,
              {
                backgroundColor: `${colors.primary}12`,
                borderColor: colors.primary,
                borderWidth: 1.5,
              },
            ]}
          >
            <View style={{ marginRight: 12, justifyContent: 'center' }}>
              <BrandLogo size={36} showTextFallback={false} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.siteName, { color: colors.primary, fontWeight: '800' }]}>
                {siteName}
              </Text>
              <Text style={[styles.siteTheme, { color: colors.mutedText }]}>
                Hostname: {hostname}
              </Text>
              <Text style={[styles.siteTheme, { color: colors.mutedText, fontSize: 11, marginTop: 2 }]}>
                Tenant ID: {siteId}
              </Text>
            </View>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          </View>

          {/* Dev-only site switcher behind EXPO_PUBLIC_ENABLE_SITE_SWITCHER */}
          {ENV.enableSiteSwitcher && (
            <View style={{ marginTop: SPACING.md }}>
              <Text style={[styles.sectionHeading, { color: '#f59e0b', marginBottom: 8 }]}>
                [DEV ONLY] SWITCH TENANT
              </Text>
              <View style={styles.sitesGrid}>
                {SITE_REGISTRY.map((site: SiteEntry) => {
                  const isActive = siteId === site.id;
                  return (
                    <TouchableOpacity
                      key={site.id}
                      style={[
                        styles.siteRow,
                        {
                          backgroundColor: isActive ? `${colors.primary}12` : colors.surface,
                          borderColor: isActive ? colors.primary : colors.border,
                          borderWidth: isActive ? 2 : 1,
                        },
                      ]}
                      onPress={() => handleSwitchSite(site.id as WebsiteId)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Switch to ${site.name}`}
                    >
                      <View style={[styles.siteIconBox, { backgroundColor: `${site.primaryColor}20` }]}>
                        <Text style={{ fontSize: 18 }}>{site.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.siteName,
                            { color: isActive ? colors.primary : colors.heading, fontWeight: isActive ? '800' : '600' },
                          ]}
                        >
                          {site.name}
                        </Text>
                        <Text style={[styles.siteTheme, { color: colors.mutedText }]}>
                          {site.themeName}
                        </Text>
                      </View>
                      {isActive && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* ─── Admin Dashboard Entry (if admin or guest exploring) ─── */}
        {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin' || !isAuthenticated) && (
          <View style={styles.section}>
            <Text style={[styles.sectionHeading, { color: colors.mutedText }]}>ADMINISTRATION</Text>
            <TouchableOpacity
              style={[styles.menuRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push('/(admin)')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open admin management portal"
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#0f172a' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: colors.heading }]}>Admin Management Portal</Text>
                <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                  Manage tours, inventory & incoming bookings
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Sign Out Action ─── */}
        {isAuthenticated && (
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: '#ef4444' }]}
            onPress={handleSignOut}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Sign out of account"
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ─── Interactive Edit Profile Modal ─── */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
                  Edit Traveler Profile
                </Text>
                <Text style={[styles.modalSub, { color: colors.mutedText }]}>
                  Update passenger details for seamless booking check-in
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Close profile editor"
              >
                <Ionicons name="close" size={22} color={colors.heading} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Avatar Preset Selector */}
              <Text style={[styles.inputLabel, { color: colors.heading }]}>CHOOSE AVATAR PRESET</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarPickerRow}>
                {AVATAR_PRESETS.map((preset, index) => {
                  const isSelected = editAvatar === preset;
                  return (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch {
                          // Haptics fallback
                        }
                        setEditAvatar(preset);
                      }}
                      style={[
                        styles.avatarOption,
                        {
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderWidth: isSelected ? 3 : 1,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: preset }} style={styles.avatarOptionImg} contentFit="cover" />
                      {isSelected && (
                        <View style={[styles.avatarSelectedBadge, { backgroundColor: colors.primary }]}>
                          <Ionicons name="checkmark" size={10} color="#ffffff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Full Name Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.heading }]}>FULL PASSENGER NAME *</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.heading,
                    },
                  ]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor={colors.mutedText}
                  autoCapitalize="words"
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.heading }]}>EMAIL ADDRESS</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.heading,
                    },
                  ]}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="e.g. traveler@example.com"
                  placeholderTextColor={colors.mutedText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Phone Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.heading }]}>PHONE / WHATSAPP NUMBER</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.heading,
                    },
                  ]}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="e.g. +91 98765 43210"
                  placeholderTextColor={colors.mutedText}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Modal Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                  onPress={() => setIsEditModalVisible(false)}
                  disabled={savingProfile}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalCancelBtnText, { color: colors.mutedText }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                  activeOpacity={0.8}
                >
                  {savingProfile ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.modalSaveBtnText}>Save Profile</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Interactive Currency Switcher Modal ─── */}
      <CurrencyModal
        visible={isCurrencyModalVisible}
        onClose={() => setIsCurrencyModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  nameEditBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEditActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl + 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.xs,
  },
  userName: {
    fontSize: FONT_SIZE.md + 1,
    fontWeight: '800',
    flexShrink: 1,
  },
  userEmail: {
    fontSize: 12,
  },
  userPhone: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  signInBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    minHeight: 44,
    justifyContent: 'center',
  },
  signInBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    minHeight: 88,
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  statIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statCount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs + 2,
  },
  prefsCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOW.sm,
  },
  prefBlock: {
    gap: 4,
  },
  prefTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  prefSub: {
    fontSize: 11,
    lineHeight: 16,
  },
  prefChipsRow: {
    gap: 6,
    paddingTop: 8,
  },
  prefChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
  },
  prefChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  divider: {
    height: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  menuGroup: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    minHeight: 52,
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuItemText: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '600',
  },
  menuItemSub: {
    fontSize: 11,
    marginTop: 2,
  },
  itemDivider: {
    height: 1,
    marginLeft: SPACING.md + 38,
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm + 4,
    borderRadius: RADIUS.lg,
  },
  sitesGrid: {
    gap: 8,
  },
  siteIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 4,
  },
  siteName: {
    fontSize: FONT_SIZE.sm + 1,
  },
  siteTheme: {
    fontSize: 11,
    marginTop: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    minHeight: 52,
    ...SHADOW.sm,
  },
  menuLabel: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    marginTop: SPACING.xs,
    minHeight: 46,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    padding: SPACING.lg,
    maxHeight: '88%',
    ...SHADOW.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 11,
    marginTop: 2,
    maxWidth: 260,
  },
  modalCloseBtn: {
    padding: 6,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPickerRow: {
    gap: 10,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  avatarOption: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarOptionImg: {
    width: '100%',
    height: '100%',
  },
  avatarSelectedBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: FONT_SIZE.sm,
    minHeight: 44,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  modalCancelBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  modalSaveBtn: {
    flex: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    ...SHADOW.sm,
  },
  modalSaveBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  inboxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  inboxPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  permBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  permTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  permSub: {
    fontSize: 10,
    marginTop: 1,
  },
  enableBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    marginLeft: 8,
    minHeight: 32,
    justifyContent: 'center',
  },
  enableBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  notifActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: 4,
  },
  inboxBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    minHeight: 44,
  },
  inboxBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  testDispatchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    minHeight: 44,
  },
  testDispatchBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
