import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { PharmacyDirectoryItem } from '../types';

interface PharmacyDirectoryCardProps {
  pharmacy: PharmacyDirectoryItem;
  style?: StyleProp<ViewStyle>;
}

export const PharmacyDirectoryCard: React.FC<PharmacyDirectoryCardProps> = ({
  pharmacy,
  style,
}) => {
  const colors = useColors();

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (pharmacy.phone) {
      const cleanPhone = pharmacy.phone.replace(/[^0-9+]/g, '');
      Linking.openURL(`tel:${cleanPhone}`).catch(() => {});
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={styles.leftCol}>
          <View style={styles.chainRow}>
            <Text style={[styles.name, { color: colors.heading }]}>
              {pharmacy.pharmacyName}
            </Text>
          </View>
          <Text style={[styles.address, { color: colors.mutedText }]} numberOfLines={2}>
            {pharmacy.address}
          </Text>
        </View>

        {pharmacy.isOpen24Hours && (
          <View style={[styles.pill24, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
            <Ionicons name="time" size={11} color="#059669" />
            <Text style={styles.pill24Text}>24/7 OPEN</Text>
          </View>
        )}
      </View>

      {/* Badges Strip & Call Button */}
      <View style={styles.bottomRow}>
        <View style={styles.badgeWrap}>
          {pharmacy.hasEnglishSpeakingPharmacist && (
            <View style={[styles.engBadge, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
              <Ionicons name="chatbubbles-outline" size={11} color="#1d4ed8" />
              <Text style={styles.engBadgeText}>English Speaking</Text>
            </View>
          )}
          <Text style={[styles.hoursText, { color: colors.mutedText }]}>
            {pharmacy.operatingHours}
          </Text>
        </View>

        {pharmacy.phone ? (
          <TouchableOpacity testID="btn-call" accessibilityLabel="call"
            style={[styles.callBtn, { backgroundColor: colors.primary }]}
            onPress={handleCall}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={13} color="#ffffff" />
            <Text style={styles.callBtnText}>Call</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  leftCol: {
    flex: 1,
    marginRight: 8,
  },
  chainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  address: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  pill24: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    gap: 3,
  },
  pill24Text: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  engBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    gap: 3,
  },
  engBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  hoursText: {
    fontSize: 10,
    fontWeight: '600',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  callBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
