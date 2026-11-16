import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { usePharmacy } from '../context/PharmacyContext';

interface PharmacyHeroCardProps {
  style?: StyleProp<ViewStyle>;
}

export const PharmacyHeroCard: React.FC<PharmacyHeroCardProps> = ({ style }) => {
  const router = useRouter();
  const colors = useColors();
  const {
    pharmacyData,
  } = usePharmacy();

  const handleOpenHub = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/pharmacy-guide' as any);
  };

  const handleCallAmbulance = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    if (pharmacyData?.emergencyAmbulanceNumber) {
      Linking.openURL(`tel:${pharmacyData.emergencyAmbulanceNumber}`).catch(() => {});
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.iconBox, { backgroundColor: '#fef2f2' }]}>
            <Ionicons name="medkit-outline" size={20} color="#dc2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.heading }]}>
              Travel Pharmacy & Medicine Translator
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
              {pharmacyData?.city || 'Bangkok'} &bull; OTC Equivalents & 24/7 Pharmacies
            </Text>
          </View>
        </View>

        <TouchableOpacity testID="btn-call" accessibilityLabel="call"
          style={styles.sosBadge}
          onPress={handleCallAmbulance}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="call" size={12} color="#dc2626" />
          <Text style={styles.sosBadgeText}>
            SOS {pharmacyData?.emergencyAmbulanceNumber || '1669'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info Strip */}
      <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.infoCol}>
          <Text style={[styles.infoLabel, { color: colors.mutedText }]}>COMMON TRANSLATIONS</Text>
          <Text style={[styles.infoMain, { color: colors.heading }]}>
            Crocin/Dolo &rarr; Sara (ซาร่า)
          </Text>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoCol}>
          <Text style={[styles.infoLabel, { color: colors.mutedText }]}>VERIFIED PHARMACIES</Text>
          <Text style={[styles.infoMain, { color: '#059669' }]}>
            {pharmacyData?.pharmacies?.length ?? 4} Boots & 24/7 Stores
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity testID="btn-language-outline" accessibilityLabel="language outline"
          style={[styles.mainBtn, { backgroundColor: colors.primary }]}
          onPress={handleOpenHub}
          activeOpacity={0.85}
        >
          <Ionicons name="language-outline" size={16} color="#ffffff" />
          <Text style={styles.mainBtnText}>Translate Medicines & Prescriptions</Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-location-outline" accessibilityLabel="location outline"
          style={[styles.checkBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={handleOpenHub}
          activeOpacity={0.7}
        >
          <Ionicons name="location-outline" size={16} color={colors.heading} />
          <Text style={[styles.checkBtnText, { color: colors.heading }]}>24/7 Boots</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  sosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 4,
  },
  sosBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 10,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoMain: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mainBtn: {
    flex: 1.5,
    minHeight: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mainBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  checkBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  checkBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
