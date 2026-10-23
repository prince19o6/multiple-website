import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { RoadRuleItem } from '../types';

interface DriveRuleCardProps {
  rule: RoadRuleItem;
  style?: StyleProp<ViewStyle>;
}

export const DriveRuleCard: React.FC<DriveRuleCardProps> = ({ rule, style }) => {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: rule.isHighRisk ? '#fca5a5' : colors.border,
        },
        style,
      ]}
    >
      {/* Top Header */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: rule.isHighRisk ? '#fee2e2' : '#e0f2fe' },
          ]}
        >
          <Ionicons
            name={(rule.icon as any) || 'car-outline'}
            size={20}
            color={rule.isHighRisk ? '#dc2626' : '#0284c7'}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.heading }]}>{rule.title}</Text>
          <View
            style={[
              styles.valBadge,
              { backgroundColor: rule.isHighRisk ? '#fef2f2' : colors.background },
            ]}
          >
            <Text
              style={[
                styles.valBadgeText,
                { color: rule.isHighRisk ? '#b91c1c' : colors.primary },
              ]}
            >
              {rule.value}
            </Text>
          </View>
        </View>

        {rule.isHighRisk && (
          <View style={styles.highRiskPill}>
            <Ionicons name="alert-circle" size={11} color="#ffffff" />
            <Text style={styles.highRiskPillText}>HIGH RISK</Text>
          </View>
        )}
      </View>

      {/* Description */}
      <Text style={[styles.descText, { color: colors.heading }]}>{rule.description}</Text>

      {/* Penalty Callout */}
      {rule.penaltyWarning ? (
        <View style={styles.penaltyBox}>
          <Ionicons name="warning-outline" size={13} color="#991b1b" />
          <Text style={styles.penaltyText}>{rule.penaltyWarning}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
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
  valBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  valBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  highRiskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  highRiskPillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  descText: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  penaltyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  penaltyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991b1b',
    flex: 1,
    lineHeight: 15,
  },
});
