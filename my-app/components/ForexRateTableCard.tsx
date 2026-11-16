import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import type { ForexCounterRate } from '@/types';

interface ForexRateTableCardProps {
  baseRates: ForexCounterRate[];
  destinationCurrencySymbol: string;
  passportNotice?: string;
  onSelectCurrencyForCalc?: (currencyCode: string) => void;
}

export const ForexRateTableCard: React.FC<ForexRateTableCardProps> = ({
  baseRates,
  destinationCurrencySymbol,
  passportNotice,
  onSelectCurrencyForCalc,
}) => {
  const colors = useColors();
  const [expandedCode, setExpandedCode] = useState<string | null>(baseRates[0]?.currencyCode || null);

  const toggleExpand = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setExpandedCode((prev) => (prev === code ? null : code));
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Passport Notice Banner */}
      {passportNotice ? (
        <View style={styles.noticeBanner}>
          <Ionicons name="document-text-outline" size={16} color="#d97706" style={{ marginTop: 2 }} />
          <Text style={styles.noticeText}>{passportNotice}</Text>
        </View>
      ) : null}

      {/* Table Header */}
      <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerCol, { color: colors.mutedText, flex: 1.4 }]}>CURRENCY</Text>
        <Text style={[styles.headerCol, { color: '#059669', flex: 1.3, textAlign: 'right' }]}>
          CITY BEST BUY
        </Text>
        <Text style={[styles.headerCol, { color: '#dc2626', flex: 1.3, textAlign: 'right' }]}>
          AIRPORT BANK
        </Text>
      </View>

      {/* Rates Rows */}
      {baseRates.map((rate) => {
        const isExpanded = expandedCode === rate.currencyCode;

        return (
          <View
            key={rate.currencyCode}
            style={[styles.rateRowWrapper, { borderBottomColor: colors.border }]}
          >
            <TouchableOpacity testID="btn-forexratetablecard-59"
              style={styles.rateRow}
              onPress={() => toggleExpand(rate.currencyCode)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`View rates for ${rate.currencyCode}`}
            >
              {/* Currency identity */}
              <View style={[styles.currIdentity, { flex: 1.4 }]}>
                <Text style={styles.flagEmoji}>{rate.flagEmoji}</Text>
                <View>
                  <Text style={[styles.currCode, { color: colors.heading }]}>
                    {rate.currencyCode}
                  </Text>
                  <Text style={[styles.currName, { color: colors.mutedText }]} numberOfLines={1}>
                    {rate.currencyName}
                  </Text>
                </View>
              </View>

              {/* City Best Buy Rate */}
              <View style={[styles.rateValueCol, { flex: 1.3, alignItems: 'flex-end' }]}>
                <View style={styles.bestPill}>
                  <Text style={styles.bestRateText}>
                    {destinationCurrencySymbol} {rate.cityCounterBuyRate.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.spreadSubText}>Spread: {rate.spreadPercent}</Text>
              </View>

              {/* Airport Bank Buy Rate */}
              <View style={[styles.rateValueCol, { flex: 1.3, alignItems: 'flex-end' }]}>
                <Text style={styles.airportRateText}>
                  {destinationCurrencySymbol} {rate.bankAirportBuyRate.toFixed(2)}
                </Text>
                <Text style={styles.lossBadge}>{rate.airportLossPercent}</Text>
              </View>

              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.mutedText}
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>

            {/* Expanded Condition Advice & Action */}
            {isExpanded && (
              <View style={[styles.expandedContent, { backgroundColor: colors.background }]}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: colors.mutedText }]}>Counter Sell:</Text>
                    <Text style={[styles.detailVal, { color: colors.heading }]}>
                      {destinationCurrencySymbol} {rate.cityCounterSellRate.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: colors.mutedText }]}>Spread Type:</Text>
                    <Text style={[styles.detailVal, { color: '#059669' }]}>SuperRich Tier</Text>
                  </View>
                </View>

                {/* Note condition tips */}
                <View style={styles.tipsBox}>
                  <Ionicons name="information-circle-outline" size={16} color="#0284c7" />
                  <Text style={styles.tipsText}>
                    <Text style={{ fontWeight: '700' }}>Inspection Advice: </Text>
                    {rate.noteConditionTips}
                  </Text>
                </View>

                {onSelectCurrencyForCalc && (
                  <TouchableOpacity testID="btn-calculator-outline" accessibilityLabel="calculator outline"
                    style={[styles.calcButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                      onSelectCurrencyForCalc(rate.currencyCode);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="calculator-outline" size={16} color="#fff" />
                    <Text style={styles.calcButtonText}>
                      Compare Savings on {rate.currencyCode} Cash
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#92400e',
    fontWeight: '500',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerCol: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rateRowWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
  },
  currIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flagEmoji: {
    fontSize: 22,
  },
  currCode: {
    fontSize: 14,
    fontWeight: '700',
  },
  currName: {
    fontSize: 11,
    maxWidth: 90,
  },
  rateValueCol: {},
  bestPill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  bestRateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047857',
  },
  spreadSubText: {
    fontSize: 10,
    color: '#10b981',
    marginTop: 2,
  },
  airportRateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  lossBadge: {
    fontSize: 9,
    fontWeight: '600',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  expandedContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  tipsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  tipsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#0369a1',
  },
  calcButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
    marginTop: 4,
  },
  calcButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
