import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { RentalScamTip } from '../types';

interface RentalScamChecklistCardProps {
  scam: RentalScamTip;
  style?: StyleProp<ViewStyle>;
}

export const RentalScamChecklistCard: React.FC<RentalScamChecklistCardProps> = ({
  scam,
  style,
}) => {
  const colors = useColors();
  const isCritical = scam.severity === 'CRITICAL';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isCritical ? '#fca5a5' : '#fcd34d',
        },
        style,
      ]}
    >
      {/* Header */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: isCritical ? '#fee2e2' : '#fef3c7' },
          ]}
        >
          <Ionicons
            name={(scam.icon as any) || 'alert-circle-outline'}
            size={20}
            color={isCritical ? '#dc2626' : '#d97706'}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.heading }]}>{scam.title}</Text>
          <View
            style={[
              styles.severityBadge,
              { backgroundColor: isCritical ? '#dc2626' : '#d97706' },
            ]}
          >
            <Text style={styles.severityText}>{scam.severity}</Text>
          </View>
        </View>
      </View>

      {/* Action Required Box */}
      <View style={[styles.actionBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
        <View style={styles.actionHeader}>
          <Ionicons name="shield-checkmark" size={14} color="#15803d" />
          <Text style={styles.actionLabel}>HOW TO PROTECT YOURSELF</Text>
        </View>
        <Text style={styles.actionText}>{scam.actionRequired}</Text>
      </View>

      {/* Scam Explanation */}
      <View style={styles.scamBox}>
        <Ionicons name="information-circle-outline" size={14} color={colors.mutedText} />
        <Text style={[styles.scamText, { color: colors.mutedText }]}>
          {scam.scamExplanation}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  severityText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  actionBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.4,
  },
  actionText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#166534',
    fontWeight: '600',
  },
  scamBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 2,
  },
  scamText: {
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
});
