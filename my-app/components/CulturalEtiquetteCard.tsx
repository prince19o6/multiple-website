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
import { CulturalEtiquetteItem } from '../types';

interface CulturalEtiquetteCardProps {
  item: CulturalEtiquetteItem;
  style?: StyleProp<ViewStyle>;
}

export const CulturalEtiquetteCard: React.FC<CulturalEtiquetteCardProps> = ({
  item,
  style,
}) => {
  const colors = useColors();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  let badgeBg = '#ecfdf5';
  let badgeBorder = '#a7f3d0';
  let badgeText = '#047857';

  if (item.importanceLevel === 'Critical_Law') {
    badgeBg = '#fee2e2';
    badgeBorder = '#fca5a5';
    badgeText = '#dc2626';
  } else if (item.importanceLevel === 'High_Sacred') {
    badgeBg = '#fffbeb';
    badgeBorder = '#fde68a';
    badgeText = '#b45309';
  }

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
            name={(item.iconName as any) || 'information-circle'}
            size={18}
            color={badgeText}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.heading }]}>
            {item.title}
          </Text>
          <Text style={[styles.categoryText, { color: colors.mutedText }]}>
            {item.category.replace('_', ' ')}
          </Text>
        </View>

        <View style={[styles.badge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
          <Text style={[styles.badgeText, { color: badgeText }]}>
            {item.importanceLevel.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Short Summary */}
      <Text style={[styles.summaryText, { color: colors.mutedText }]}>
        {item.shortSummary}
      </Text>

      {/* Prohibited & Recommended Actions Strip */}
      <View style={[styles.actionsStrip, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {/* Prohibited Action */}
        <View style={styles.actionItem}>
          <View style={[styles.actionIconBox, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="close" size={13} color="#dc2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionLabel, { color: '#dc2626' }]}>PROHIBITED / OFFENSIVE</Text>
            <Text style={[styles.actionContent, { color: colors.heading }]}>
              {item.prohibitedAction}
            </Text>
          </View>
        </View>

        <View style={styles.actionDivider} />

        {/* Recommended Action */}
        <View style={styles.actionItem}>
          <View style={[styles.actionIconBox, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="checkmark" size={13} color="#15803d" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionLabel, { color: '#15803d' }]}>RESPECTFUL CUSTOM</Text>
            <Text style={[styles.actionContent, { color: colors.heading }]}>
              {item.recommendedAction}
            </Text>
          </View>
        </View>
      </View>

      {/* Expand/Collapse Detailed Guidance */}
      <TouchableOpacity testID="btn-culturaletiquettecard-115" accessibilityLabel="culturaletiquettecard action"
        style={styles.expandToggle}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          setIsExpanded(!isExpanded);
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.expandText, { color: colors.primary }]}>
          {isExpanded ? 'Hide Cultural Guidance' : 'Read Full Cultural Context'}
        </Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.primary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={[styles.expandedContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.guidanceText, { color: colors.heading }]}>
            {item.fullGuidance}
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
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  summaryText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  actionsStrip: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  actionIconBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  actionLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  actionContent: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  actionDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
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
  guidanceText: {
    fontSize: 12,
    lineHeight: 17,
  },
});
