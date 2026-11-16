import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useEsim } from '../context/EsimContext';
import { EsimActiveCard } from '../components/EsimActiveCard';
import { EsimPackageCard } from '../components/EsimPackageCard';
import { EsimQrModal } from '../components/EsimQrModal';
import { EsimTopUpModal } from '../components/EsimTopUpModal';
import { AirportWifiModal } from '../components/AirportWifiModal';
import { EsimPackage } from '../types';

export default function EsimRoamingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const {
    activeProfile,
    packages,
    isLoading,
    isRefreshing,
    isQrModalOpen,
    setIsQrModalOpen,
    isTopUpModalOpen,
    setIsTopUpModalOpen,
    isWifiModalOpen,
    setIsWifiModalOpen,
    activate,
    refreshEsim,
  } = useEsim();

  const handleActivatePackage = (packageId: string) => {
    const pkg = packages.find((p) => p.packageId === packageId);
    Alert.alert(
      'Activate Travel eSIM',
      `Would you like to activate ${pkg?.title || 'this package'} ($${pkg?.price.toFixed(2)})? Your installation QR code will be generated immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate Now',
          onPress: async () => {
            const success = await activate(packageId);
            if (!success) {
              Alert.alert('Activation Failed', 'Could not activate eSIM package. Please check network connection.');
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Active eSIM Profile Card (if exists) */}
      {activeProfile ? (
        <View style={styles.activeProfileSection}>
          <Text style={[styles.sectionTitle, { color: colors.heading }]}>
            YOUR ACTIVE CELLULAR LINE
          </Text>
          <EsimActiveCard
            profile={activeProfile}
            onOpenQr={() => setIsQrModalOpen(true)}
            onOpenTopUp={() => setIsTopUpModalOpen(true)}
          />
        </View>
      ) : null}

      {/* Free Airport Wi-Fi Banner */}
      <TouchableOpacity testID="btn-wifi"
        style={[styles.wifiShortcutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setIsWifiModalOpen(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Open Free Airport Wi-Fi Login Guide"
      >
        <View style={[styles.wifiIconBox, { backgroundColor: '#dcfce7' }]}>
          <Ionicons name="wifi" size={20} color="#15803d" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.wifiShortcutTitle, { color: colors.heading }]}>
            Free Airport Wi-Fi Portals
          </Text>
          <Text style={[styles.wifiShortcutSub, { color: colors.mutedText }]}>
            Offline login steps & carrier balance USSD shortcodes
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
      </TouchableOpacity>

      {/* Device Compatibility Notice */}
      <View style={[styles.compatNotice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
        <Text style={[styles.compatNoticeText, { color: colors.mutedText }]}>
          Works with iPhone XS+, Samsung Galaxy S20+, Google Pixel 3+ & carrier-unlocked devices. No physical SIM card swapping required.
        </Text>
      </View>

      {/* Available Plans Heading */}
      <View style={styles.plansHeadingRow}>
        <Text style={[styles.sectionTitle, { color: colors.heading, marginBottom: 0 }]}>
          DESTINATION 5G eSIM BUNDLES
        </Text>
        <Text style={[styles.plansCount, { color: colors.mutedText }]}>
          {packages.length} Plans
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.mutedText, marginTop: 12 }]}>
            Loading eSIM packages & cellular profiles...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cellular-outline" size={50} color={colors.mutedText} />
        <Text style={[styles.emptyTitle, { color: colors.heading, marginTop: 14 }]}>
          No Active eSIM Packages
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
          Browse our tailored 5G roaming bundles above to get connected without paying expensive roaming fees.
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top App Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, 12),
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.topBarRow}>
          <TouchableOpacity testID="btn-navigate"
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={colors.heading} />
          </TouchableOpacity>

          <View style={styles.topBarTitles}>
            <Text style={[styles.topBarHeading, { color: colors.heading }]}>
              eSIM & 5G Roaming Hub
            </Text>
            <Text style={[styles.topBarSubheading, { color: colors.mutedText }]}>
              Instant Destination Cellular Connectivity
            </Text>
          </View>

          <TouchableOpacity testID="btn-sync-outline"
            style={styles.refreshIconBtn}
            onPress={refreshEsim}
            accessibilityLabel="Refresh eSIM profile and balance"
            accessibilityRole="button"
          >
            <Ionicons name="sync-outline" size={20} color={colors.heading} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main List */}
      <FlatList
        data={packages}
        keyExtractor={(item: EsimPackage) => item.packageId}
        renderItem={({ item }: { item: EsimPackage }) => (
          <EsimPackageCard
            packageItem={item}
            onSelect={handleActivatePackage}
            style={styles.packageCardSpacing}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 20 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshEsim}
            tintColor={colors.primary}
          />
        }
      />

      {/* Modals */}
      <EsimQrModal
        visible={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        profile={activeProfile}
      />
      <EsimTopUpModal
        visible={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
      />
      <AirportWifiModal
        visible={isWifiModalOpen}
        onClose={() => setIsWifiModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  topBarTitles: {
    flex: 1,
    marginLeft: 4,
  },
  topBarHeading: {
    fontSize: 18,
    fontWeight: '700',
  },
  topBarSubheading: {
    fontSize: 12,
    fontWeight: '400',
  },
  refreshIconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerContainer: {
    marginBottom: 8,
  },
  activeProfileSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  wifiShortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 12,
  },
  wifiIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wifiShortcutTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  wifiShortcutSub: {
    fontSize: 11,
    marginTop: 2,
  },
  compatNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  compatNoticeText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  plansHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  plansCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  packageCardSpacing: {
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
});
