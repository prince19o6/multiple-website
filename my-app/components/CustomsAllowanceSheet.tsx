import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useTaxRefund } from '../context/TaxRefundContext';

interface CustomsAllowanceSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const CustomsAllowanceSheet: React.FC<CustomsAllowanceSheetProps> = ({
  visible,
  onClose,
}) => {
  const colors = useColors();
  const { allowances } = useTaxRefund();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.heading }]}>
                Customs Duty-Free Allowances
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                {allowances?.destinationOrHomeCountry || 'Baggage Import Regulations'}
              </Text>
            </View>
            <TouchableOpacity testID="btn-close"
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close customs allowances sheet"
            >
              <Ionicons name="close" size={24} color={colors.heading} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* General Goods Allowance */}
            <View style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="bag-check-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.itemBody}>
                <Text style={[styles.itemHeading, { color: colors.heading }]}>
                  General Duty-Free Goods
                </Text>
                <Text style={[styles.itemValue, { color: colors.primary }]}>
                  {allowances?.dutyFreeGeneralAllowance || 'Check active country rules'}
                </Text>
              </View>
            </View>

            {/* Alcohol & Spirits */}
            <View style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: '#8b5cf615' }]}>
                <Ionicons name="wine-outline" size={20} color="#8b5cf6" />
              </View>
              <View style={styles.itemBody}>
                <Text style={[styles.itemHeading, { color: colors.heading }]}>
                  Alcohol & Spirits Limit
                </Text>
                <Text style={[styles.itemValue, { color: '#8b5cf6' }]}>
                  {allowances?.alcoholAllowance || '2 Litres max'}
                </Text>
              </View>
            </View>

            {/* Tobacco Limit */}
            <View style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: '#ea580c15' }]}>
                <Ionicons name="flame-outline" size={20} color="#ea580c" />
              </View>
              <View style={styles.itemBody}>
                <Text style={[styles.itemHeading, { color: colors.heading }]}>
                  Tobacco & Cigarettes
                </Text>
                <Text style={[styles.itemValue, { color: '#ea580c' }]}>
                  {allowances?.tobaccoAllowance || 'Up to 100 cigarettes'}
                </Text>
              </View>
            </View>

            {/* Gold Jewellery Allowance */}
            <View style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: '#f59e0b15' }]}>
                <Ionicons name="diamond-outline" size={20} color="#f59e0b" />
              </View>
              <View style={styles.itemBody}>
                <Text style={[styles.itemHeading, { color: colors.heading }]}>
                  Gold Jewellery (Men & Women)
                </Text>
                <Text style={[styles.itemSubValue, { color: colors.mutedText }]}>
                  Male: {allowances?.goldJewelleryAllowanceMale}
                </Text>
                <Text style={[styles.itemSubValue, { color: colors.mutedText }]}>
                  Female: {allowances?.goldJewelleryAllowanceFemale}
                </Text>
              </View>
            </View>

            {/* Currency Declaration */}
            <View style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: '#10b98115' }]}>
                <Ionicons name="cash-outline" size={20} color="#10b981" />
              </View>
              <View style={styles.itemBody}>
                <Text style={[styles.itemHeading, { color: colors.heading }]}>
                  Currency Declaration Limit
                </Text>
                <Text style={[styles.itemValue, { color: '#10b981' }]}>
                  {allowances?.currencyDeclarationLimit}
                </Text>
              </View>
            </View>

            {/* Strictly Prohibited Items */}
            {allowances?.prohibitedItems && allowances.prohibitedItems.length > 0 && (
              <View style={styles.prohibitedSection}>
                <View style={styles.prohibitedTitleRow}>
                  <Ionicons name="ban" size={18} color="#ef4444" />
                  <Text style={styles.prohibitedTitle}>STRICTLY PROHIBITED ARTICLES</Text>
                </View>

                {allowances.prohibitedItems.map((item, idx) => (
                  <View key={idx} style={styles.prohibitedRow}>
                    <Ionicons name="close-circle" size={14} color="#ef4444" style={{ marginTop: 2 }} />
                    <Text style={[styles.prohibitedText, { color: colors.mutedText }]}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity testID="btn-dismiss"
              style={[styles.dismissBtn, { backgroundColor: colors.primary }]}
              onPress={onClose}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Dismiss customs allowances sheet"
            >
              <Text style={styles.dismissBtnText}>Close Customs Allowance Guide</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
  },
  itemHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  itemSubValue: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  prohibitedSection: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
    gap: 8,
  },
  prohibitedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  prohibitedTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b91c1c',
    letterSpacing: 0.5,
  },
  prohibitedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  prohibitedText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  dismissBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  dismissBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
