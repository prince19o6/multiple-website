import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import type { AtmDccTip } from '@/types';

interface AtmDccShieldCardProps {
  tips: AtmDccTip[];
  destinationCurrencyCode: string;
}

export const AtmDccShieldCard: React.FC<AtmDccShieldCardProps> = ({
  tips,
  destinationCurrencyCode,
}) => {
  const colors = useColors();
  const [userChoice, setUserChoice] = useState<'decline' | 'accept' | null>(null);

  const handlePressDecline = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setUserChoice('decline');
  };

  const handlePressAccept = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setUserChoice('accept');
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header Badge */}
      <View style={styles.header}>
        <View style={styles.shieldBadge}>
          <Ionicons name="shield-checkmark" size={20} color="#059669" />
          <Text style={styles.shieldTitle}>ATM DCC SHIELD & FEE DEFENDER</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          Dynamic Currency Conversion (DCC) is a common ATM trap costing travelers 7% to 12% extra.
        </Text>
      </View>

      {/* Simulated ATM Screen */}
      <View style={styles.atmBezel}>
        <View style={styles.atmScreenTop}>
          <Ionicons name="card-outline" size={14} color="#94a3b8" />
          <Text style={styles.atmScreenHeaderText}>INTERNATIONAL ATM SYSTEM</Text>
        </View>

        <Text style={styles.atmPromptQuestion}>
          Choose currency for 10,000 {destinationCurrencyCode} withdrawal:
        </Text>

        {/* Option 1: Trap */}
        <TouchableOpacity testID="btn-close" accessibilityLabel="Close"
          style={[
            styles.atmOptionButton,
            styles.atmOptionTrap,
            userChoice === 'accept' && styles.selectedTrap,
          ]}
          onPress={handlePressAccept}
          activeOpacity={0.8}
        >
          <View style={styles.optionHeaderRow}>
            <Ionicons name="close-circle" size={18} color="#ef4444" />
            <Text style={styles.trapTitle}>WITH CONVERSION (USD / EUR)</Text>
          </View>
          <Text style={styles.trapRate}>Guaranteed Rate: 1 USD = 31.85 {destinationCurrencyCode}</Text>
          <Text style={styles.trapDebit}>You will be billed: $313.97 USD</Text>
          <View style={styles.trapWarningPill}>
            <Text style={styles.trapWarningText}>❌ 9.2% DCC Hidden Markup (~$26 lost)</Text>
          </View>
        </TouchableOpacity>

        {/* Option 2: Golden Choice */}
        <TouchableOpacity testID="btn-checkmark-circle" accessibilityLabel="checkmark circle"
          style={[
            styles.atmOptionButton,
            styles.atmOptionGolden,
            userChoice === 'decline' && styles.selectedGolden,
          ]}
          onPress={handlePressDecline}
          activeOpacity={0.8}
        >
          <View style={styles.optionHeaderRow}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={styles.goldenTitle}>WITHOUT CONVERSION (CHARGE IN {destinationCurrencyCode})</Text>
          </View>
          <Text style={styles.goldenRate}>Visa / Mastercard Interbank Wholesale Rate</Text>
          <Text style={styles.goldenDebit}>Estimated charge: ~$287.35 USD</Text>
          <View style={styles.goldenBadgePill}>
            <Text style={styles.goldenBadgeText}>✅ ALWAYS CHOOSE THIS (Saves ~$26.62)</Text>
          </View>
        </TouchableOpacity>

        {/* Interactive feedback */}
        {userChoice === 'decline' && (
          <View style={styles.feedbackSuccess}>
            <Ionicons name="ribbon-outline" size={18} color="#047857" />
            <Text style={styles.feedbackSuccessText}>
              Brilliant! You rejected DCC. Your home bank handles the FX at true wholesale rate with zero ATM operator gouging!
            </Text>
          </View>
        )}

        {userChoice === 'accept' && (
          <View style={styles.feedbackWarning}>
            <Ionicons name="alert-circle-outline" size={18} color="#b91c1c" />
            <Text style={styles.feedbackWarningText}>
              Watch out! The ATM will apply an inflated retail exchange rate, pocketing ~9% extra profit from your transaction. Always press &ldquo;Without Conversion&rdquo;!
            </Text>
          </View>
        )}
      </View>

      {/* Structured Practical Rules */}
      <View style={styles.tipsContainer}>
        {tips.map((tip) => (
          <View key={tip.tipKey} style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <View
                style={[
                  styles.severityPill,
                  {
                    backgroundColor:
                      tip.severity === 'CRITICAL'
                        ? '#fee2e2'
                        : tip.severity === 'RECOMMENDED'
                        ? '#ecfdf5'
                        : '#eff6ff',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.severityText,
                    {
                      color:
                        tip.severity === 'CRITICAL'
                          ? '#b91c1c'
                          : tip.severity === 'RECOMMENDED'
                          ? '#047857'
                          : '#1d4ed8',
                    },
                  ]}
                >
                  {tip.severity}
                </Text>
              </View>
              <Text style={[styles.tipTitle, { color: colors.heading }]}>{tip.title}</Text>
            </View>

            <View style={styles.actionBox}>
              <Text style={styles.actionText}>{tip.actionPrompt}</Text>
            </View>

            <Text style={[styles.tipExplanation, { color: colors.mutedText }]}>
              {tip.explanation}
            </Text>

            {tip.atmWithdrawalFeeNotice ? (
              <View style={styles.feeNoticeBox}>
                <Ionicons name="pricetag-outline" size={14} color="#b45309" />
                <Text style={styles.feeNoticeText}>{tip.atmWithdrawalFeeNotice}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    marginBottom: 14,
  },
  shieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  shieldTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  atmBezel: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: '#334155',
    marginBottom: 16,
  },
  atmScreenTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#334155',
    paddingBottom: 6,
  },
  atmScreenHeaderText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  atmPromptQuestion: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  atmOptionButton: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  atmOptionTrap: {
    backgroundColor: '#1e1b2e',
    borderColor: '#7f1d1d',
  },
  selectedTrap: {
    borderColor: '#ef4444',
    backgroundColor: '#2d1520',
  },
  atmOptionGolden: {
    backgroundColor: '#0c221c',
    borderColor: '#065f46',
  },
  selectedGolden: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b',
  },
  optionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  trapTitle: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '700',
  },
  trapRate: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
  },
  trapDebit: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  trapWarningPill: {
    backgroundColor: '#450a0a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  trapWarningText: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: '700',
  },
  goldenTitle: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '700',
  },
  goldenRate: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
  },
  goldenDebit: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  goldenBadgePill: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  goldenBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
  },
  feedbackSuccess: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ecfdf5',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
  },
  feedbackSuccessText: {
    flex: 1,
    color: '#065f46',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  feedbackWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
  },
  feedbackWarningText: {
    flex: 1,
    color: '#991b1b',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    gap: 12,
  },
  tipCard: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  severityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  actionBox: {
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7',
    marginBottom: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369a1',
  },
  tipExplanation: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 6,
  },
  feeNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  feeNoticeText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
  },
});
