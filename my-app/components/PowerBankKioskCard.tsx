import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { PowerBankKiosk } from '../types';

interface PowerBankKioskCardProps {
  kiosk: PowerBankKiosk;
  style?: StyleProp<ViewStyle>;
}

export const PowerBankKioskCard: React.FC<PowerBankKioskCardProps> = ({
  kiosk,
  style,
}) => {
  const colors = useColors();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

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
        <View style={[styles.iconBox, { backgroundColor: '#ecfdf5' }]}>
          <Ionicons name="battery-charging" size={20} color="#059669" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.networkTitle, { color: colors.heading }]}>
            {kiosk.networkName}
          </Text>
          <Text style={[styles.locationText, { color: colors.mutedText }]} numberOfLines={2}>
            {kiosk.locations}
          </Text>
        </View>

        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>{kiosk.pricing}</Text>
        </View>
      </View>

      {/* Built-in Cables */}
      <View style={styles.cablesRow}>
        <Text style={[styles.cablesLabel, { color: colors.mutedText }]}>CABLES INCLUDED:</Text>
        {kiosk.cableTypes.map((cable, idx) => (
          <View
            key={idx}
            style={[styles.cableChip, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <Ionicons name="hardware-chip" size={10} color={colors.primary} />
            <Text style={[styles.cableChipText, { color: colors.heading }]}>{cable}</Text>
          </View>
        ))}
      </View>

      {/* Expand/Collapse How to Use */}
      <TouchableOpacity testID="btn-powerbankkioskcard-73" accessibilityLabel="powerbankkioskcard action"
        style={styles.expandToggle}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          setIsExpanded(!isExpanded);
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.expandText, { color: colors.primary }]}>
          {isExpanded ? 'Hide Rental Steps' : 'How to Rent & Return'}
        </Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.primary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={[styles.expandedContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.howToUseText, { color: colors.heading }]}>
            {kiosk.howToUse}
          </Text>
        </View>
      )}
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
    gap: 10,
    marginBottom: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  locationText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  priceBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  priceBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  cablesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  cablesLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  cableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  cableChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  expandText: {
    fontSize: 12,
    fontWeight: '700',
  },
  expandedContent: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  howToUseText: {
    fontSize: 12,
    lineHeight: 17,
  },
});
