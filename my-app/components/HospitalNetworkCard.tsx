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
import { HospitalDirectoryItem } from '../types';

interface HospitalNetworkCardProps {
  hospital: HospitalDirectoryItem;
  onRequestCashlessAuth: (hospital: HospitalDirectoryItem) => void;
  style?: StyleProp<ViewStyle>;
}

export const HospitalNetworkCard: React.FC<HospitalNetworkCardProps> = ({
  hospital,
  onRequestCashlessAuth,
  style,
}) => {
  const colors = useColors();

  const handleCallEmergency = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    const clean = hospital.emergencyPhone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${clean}`).catch(() => {});
  };

  const handleOpenMap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const query = encodeURIComponent(`${hospital.name}, ${hospital.address}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
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
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.hospitalName, { color: colors.heading }]} numberOfLines={2}>
              {hospital.name}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={14} color="#dc2626" />
            <Text style={[styles.locationText, { color: colors.mutedText }]} numberOfLines={1}>
              {hospital.district ? `${hospital.district}, ` : ''}{hospital.city} &bull; {hospital.distanceFromCenter}
            </Text>
          </View>
        </View>

        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={13} color="#f59e0b" />
          <Text style={styles.ratingText}>{hospital.rating.toFixed(1)}</Text>
        </View>
      </View>

      {/* Feature Badges */}
      <View style={styles.badgeRow}>
        {hospital.isCashlessApproved && (
          <View style={[styles.badgePill, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
            <Ionicons name="shield-checkmark" size={13} color="#059669" />
            <Text style={[styles.badgeText, { color: '#047857' }]}>Direct Cashless Billing</Text>
          </View>
        )}
        {hospital.hasEnglishStaff && (
          <View style={[styles.badgePill, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }]}>
            <Ionicons name="language" size={13} color="#0284c7" />
            <Text style={[styles.badgeText, { color: '#0369a1' }]}>English Medical Team</Text>
          </View>
        )}
        {hospital.hasInterpreter && (
          <View style={[styles.badgePill, { backgroundColor: '#fdf4ff', borderColor: '#f5d0fe' }]}>
            <Ionicons name="people" size={13} color="#a855f7" />
            <Text style={[styles.badgeText, { color: '#7e22ce' }]}>Interpreter Desk</Text>
          </View>
        )}
      </View>

      {/* Specialties */}
      <View style={styles.specialtiesWrap}>
        {hospital.specialties.map((spec, idx) => (
          <View
            key={idx}
            style={[
              styles.specialtyTag,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.specialtyText, { color: colors.mutedText }]}>{spec}</Text>
          </View>
        ))}
      </View>

      {/* Address */}
      <Text style={[styles.addressText, { color: colors.mutedText }]} numberOfLines={2}>
        {hospital.address}
      </Text>

      {/* Action Footer */}
      <View style={styles.actionRow}>
        <TouchableOpacity testID="btn-call" accessibilityLabel="call"
          style={[styles.erCallBtn, { backgroundColor: '#dc2626' }]}
          onPress={handleCallEmergency}
          activeOpacity={0.85}
        >
          <Ionicons name="call" size={16} color="#ffffff" />
          <Text style={styles.erCallText}>Call ER ({hospital.emergencyPhone})</Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-navigate-outline" accessibilityLabel="navigate outline"
          style={[styles.mapBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={handleOpenMap}
          activeOpacity={0.7}
        >
          <Ionicons name="navigate-outline" size={18} color={colors.heading} />
        </TouchableOpacity>

        <TouchableOpacity testID="btn-paper-plane" accessibilityLabel="paper plane"
          style={[styles.authBtn, { backgroundColor: colors.primary }]}
          onPress={() => onRequestCashlessAuth(hospital)}
          activeOpacity={0.85}
        >
          <Ionicons name="paper-plane" size={15} color="#ffffff" />
          <Text style={styles.authBtnText}>Claim Auth</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  specialtiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 10,
  },
  specialtyTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  specialtyText: {
    fontSize: 11,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  erCallBtn: {
    flex: 1.4,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    gap: 6,
  },
  erCallText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  mapBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  authBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 5,
  },
  authBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
