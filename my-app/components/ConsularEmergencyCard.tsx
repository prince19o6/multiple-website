import React, { useState } from 'react';
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
import { EmbassyConsulate } from '../types';

interface ConsularEmergencyCardProps {
  embassy: EmbassyConsulate;
  style?: StyleProp<ViewStyle>;
}

export const ConsularEmergencyCard: React.FC<ConsularEmergencyCardProps> = ({
  embassy,
  style,
}) => {
  const colors = useColors();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    const clean = embassy.emergencyPhone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${clean}`).catch(() => {});
  };

  const handleEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const subject = encodeURIComponent(`Emergency Consular Assistance - ${embassy.homeCountry} Citizen`);
    Linking.openURL(`mailto:${embassy.consularEmail}?subject=${subject}`).catch(() => {});
  };

  const handleOpenMap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const query = encodeURIComponent(`${embassy.missionName}, ${embassy.address}`);
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
      {/* Header */}
      <View style={styles.topRow}>
        <View style={styles.missionIconBox}>
          <Ionicons name="business" size={18} color="#0284c7" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.missionName, { color: colors.heading }]}>
            {embassy.missionName}
          </Text>
          <Text style={[styles.cityBadge, { color: colors.mutedText }]}>
            {embassy.city}, {embassy.destinationCountry} &bull; {embassy.workingHours}
          </Text>
        </View>
      </View>

      {/* Address */}
      <Text style={[styles.addressText, { color: colors.mutedText }]} numberOfLines={2}>
        {embassy.address}
      </Text>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity testID="btn-call" accessibilityLabel="call"
          style={[styles.callBtn, { backgroundColor: '#dc2626' }]}
          onPress={handleCall}
          activeOpacity={0.85}
        >
          <Ionicons name="call" size={15} color="#ffffff" />
          <Text style={styles.callBtnText}>24/7 Hotline ({embassy.emergencyPhone})</Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-mail-outline" accessibilityLabel="mail outline"
          style={[styles.smallBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={handleEmail}
          activeOpacity={0.7}
        >
          <Ionicons name="mail-outline" size={16} color={colors.heading} />
        </TouchableOpacity>

        <TouchableOpacity testID="btn-navigate-outline" accessibilityLabel="navigate outline"
          style={[styles.smallBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={handleOpenMap}
          activeOpacity={0.7}
        >
          <Ionicons name="navigate-outline" size={16} color={colors.heading} />
        </TouchableOpacity>
      </View>

      {/* Lost Passport Instructions Toggle */}
      {embassy.lostPassportInstructions ? (
        <View style={styles.lostPassportSection}>
          <TouchableOpacity testID="btn-alert-circle-outline" accessibilityLabel="alert circle outline"
            style={styles.toggleRow}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setIsExpanded(!isExpanded);
            }}
          >
            <Ionicons name="alert-circle-outline" size={14} color="#d97706" />
            <Text style={[styles.toggleText, { color: '#b45309' }]}>
              {isExpanded ? 'Hide Lost Passport Protocol' : 'Lost or Stolen Passport Protocol'}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#d97706"
            />
          </TouchableOpacity>

          {isExpanded && (
            <View style={[styles.instructionsBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.instructionsText, { color: colors.heading }]}>
                {embassy.lostPassportInstructions}
              </Text>
            </View>
          )}
        </View>
      ) : null}
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
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  missionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cityBadge: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  addressText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  callBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  callBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  smallBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lostPassportSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  instructionsBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  instructionsText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
