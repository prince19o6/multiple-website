import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { PlugType } from '../types';

interface PowerSocketVisualizerCardProps {
  plug: PlugType;
  style?: StyleProp<ViewStyle>;
}

export const PowerSocketVisualizerCard: React.FC<PowerSocketVisualizerCardProps> = ({
  plug,
  style,
}) => {
  const colors = useColors();

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
        <View style={styles.iconCircle}>
          <Ionicons
            name="hardware-chip-outline"
            size={20}
            color={plug.needsAdapterForHome ? '#d97706' : '#16a34a'}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.plugTitle, { color: colors.heading }]}>
            {plug.name}
          </Text>
          <Text style={[styles.pinMeta, { color: colors.mutedText }]}>
            {plug.pinCount}-Pin &bull; {plug.isGrounded ? 'Grounded Earthing' : 'Ungrounded'}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: plug.needsAdapterForHome ? '#fff7ed' : '#ecfdf5',
              borderColor: plug.needsAdapterForHome ? '#fdba74' : '#86efac',
            },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              { color: plug.needsAdapterForHome ? '#c2410c' : '#15803d' },
            ]}
          >
            {plug.needsAdapterForHome ? 'ADAPTER NEEDED' : 'DIRECT FIT'}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={[styles.descText, { color: colors.mutedText }]}>
        {plug.description}
      </Text>

      {/* Compatible Plugs Chips */}
      {plug.compatibleWithHomePlugs && plug.compatibleWithHomePlugs.length > 0 && (
        <View style={styles.compatWrap}>
          <Text style={[styles.compatLabel, { color: colors.mutedText }]}>
            COMPATIBLE WITH:
          </Text>
          <View style={styles.chipsRow}>
            {plug.compatibleWithHomePlugs.map((comp, idx) => (
              <View
                key={idx}
                style={[
                  styles.compatChip,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <Ionicons
                  name={plug.needsAdapterForHome ? 'alert-circle' : 'checkmark-circle'}
                  size={12}
                  color={plug.needsAdapterForHome ? '#d97706' : '#16a34a'}
                />
                <Text style={[styles.compatChipText, { color: colors.heading }]}>
                  {comp}
                </Text>
              </View>
            ))}
          </View>
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
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plugTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  pinMeta: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  descText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  compatWrap: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 8,
  },
  compatLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  compatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  compatChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
