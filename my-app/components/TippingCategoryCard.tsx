import React from 'react';
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
import { TippingServiceCategory } from '../types';

interface TippingCategoryCardProps {
  category: TippingServiceCategory;
  currencySymbol: string;
  onOpenCalculator: (category: TippingServiceCategory) => void;
  style?: StyleProp<ViewStyle>;
}

export const TippingCategoryCard: React.FC<TippingCategoryCardProps> = ({
  category,
  currencySymbol,
  onOpenCalculator,
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
        <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}>
          <Ionicons name={(category.icon as any) || 'restaurant-outline'} size={20} color="#16a34a" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.heading }]}>
            {category.categoryName}
          </Text>
          <View style={styles.tipBadge}>
            <Ionicons name="cash-outline" size={12} color="#15803d" />
            <Text style={styles.tipBadgeText}>
              {category.recommendedTip}
            </Text>
          </View>
        </View>

        <TouchableOpacity testID="btn-calculator-outline" accessibilityLabel="calculator outline"
          style={[styles.calcBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            onOpenCalculator(category);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="calculator-outline" size={13} color="#ffffff" />
          <Text style={styles.calcBtnText}>CALC</Text>
        </TouchableOpacity>
      </View>

      {/* Customary Rule Body */}
      <Text style={[styles.ruleText, { color: colors.heading }]}>
        {category.customaryRule}
      </Text>

      {/* Service Charge Explanation */}
      {category.serviceChargeExplanation ? (
        <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={13} color={colors.mutedText} />
          <Text style={[styles.infoText, { color: colors.mutedText }]}>
            {category.serviceChargeExplanation}
          </Text>
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
  tipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 3,
    gap: 4,
  },
  tipBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
  },
  calcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  calcBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  ruleText: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 5,
  },
  infoText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
});
