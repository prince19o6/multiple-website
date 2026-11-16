import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { VerifiedClimateProject } from '../types';

interface OffsetProjectCardProps {
  project: VerifiedClimateProject;
  offsetAmountKg: number;
  onOffset: (project: VerifiedClimateProject) => void;
  isOffsetting?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const OffsetProjectCard: React.FC<OffsetProjectCardProps> = ({
  project,
  offsetAmountKg,
  onOffset,
  isOffsetting = false,
  style,
}) => {
  const colors = useColors();

  const tonnes = offsetAmountKg / 1000.0;
  const estimatedPrice = Math.max(1, Math.round(tonnes * project.pricePerTonneUsd * 100) / 100);

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
        <View style={styles.iconBox}>
          <Ionicons
            name={(project.iconName as any) || 'leaf'}
            size={20}
            color="#059669"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.projectName, { color: colors.heading }]} numberOfLines={2}>
            {project.name}
          </Text>
          <Text style={[styles.projectLocation, { color: colors.mutedText }]}>
            {project.location}
          </Text>
        </View>

        <View style={styles.standardBadge}>
          <Text style={styles.standardBadgeText}>{project.standard}</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={[styles.descText, { color: colors.mutedText }]} numberOfLines={3}>
        {project.description}
      </Text>

      {/* Impact Metric Strip */}
      <View style={[styles.impactBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
        <Ionicons name="sparkles" size={15} color="#16a34a" />
        <Text style={styles.impactText}>{project.impactMetric}</Text>
      </View>

      {/* Footer Strip */}
      <View style={styles.footerRow}>
        <View style={styles.priceInfoCol}>
          <Text style={[styles.priceLabel, { color: colors.mutedText }]}>
            OFF-SETTING {offsetAmountKg.toFixed(0)} KG
          </Text>
          <Text style={[styles.priceAmount, { color: '#059669' }]}>
            ${estimatedPrice.toFixed(2)} USD
          </Text>
        </View>

        <TouchableOpacity testID="btn-shield-checkmark" accessibilityLabel="shield checkmark"
          style={[
            styles.offsetBtn,
            { backgroundColor: colors.primary, opacity: isOffsetting ? 0.7 : 1 },
          ]}
          onPress={() => onOffset(project)}
          disabled={isOffsetting}
          activeOpacity={0.85}
        >
          {isOffsetting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={16} color="#ffffff" />
              <Text style={styles.offsetBtnText}>Retire & Certify</Text>
            </>
          )}
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
    gap: 10,
    marginBottom: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  projectLocation: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  standardBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  standardBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  descText: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  impactBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginBottom: 14,
  },
  impactText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    color: '#15803d',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInfoCol: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  priceAmount: {
    fontSize: 17,
    fontWeight: '800',
  },
  offsetBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  offsetBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
