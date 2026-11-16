import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { EsimPackage } from '../types';

interface EsimPackageCardProps {
  packageItem: EsimPackage;
  onSelect: (packageId: string) => void;
  style?: object;
}

export const EsimPackageCard: React.FC<EsimPackageCardProps> = ({
  packageItem,
  onSelect,
  style,
}) => {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: packageItem.isPopular ? colors.primary : colors.border,
          borderWidth: packageItem.isPopular ? 2 : 1,
        },
        style,
      ]}
    >
      {/* Popular Ribbon */}
      {packageItem.isPopular && (
        <View style={[styles.popularRibbon, { backgroundColor: colors.primary }]}>
          <Ionicons name="star" size={10} color="#ffffff" />
          <Text style={styles.popularRibbonText}>RECOMMENDED TRAVEL PACK</Text>
        </View>
      )}

      {/* Title & Price Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.title, { color: colors.heading }]}>
            {packageItem.title}
          </Text>
          <Text style={[styles.destination, { color: colors.mutedText }]}>
            {packageItem.destinationName} · {packageItem.networkType}
          </Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={[styles.priceAmount, { color: colors.primary }]}>
            ${packageItem.price.toFixed(2)}
          </Text>
          <Text style={[styles.priceValidity, { color: colors.mutedText }]}>
            {packageItem.validityDays} Days
          </Text>
        </View>
      </View>

      {/* Feature Bullet Points */}
      <View style={[styles.featuresBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.featureItem}>
          <Ionicons name="wifi" size={14} color="#15803d" />
          <Text style={[styles.featureText, { color: colors.heading }]}>
            {packageItem.dataAllowanceGb} GB High-Speed 5G Data
          </Text>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="git-network-outline" size={14} color="#0284c7" />
          <Text style={[styles.featureText, { color: colors.mutedText }]}>
            Carriers: {packageItem.carrierPartners.join(', ')}
          </Text>
        </View>

        {packageItem.supportsHotspot && (
          <View style={styles.featureItem}>
            <Ionicons name="share-social-outline" size={14} color="#8b5cf6" />
            <Text style={[styles.featureText, { color: colors.mutedText }]}>
              Personal Hotspot & Tethering Enabled
            </Text>
          </View>
        )}

        {packageItem.includesLocalCalls && (
          <View style={styles.featureItem}>
            <Ionicons name="call-outline" size={14} color="#ea580c" />
            <Text style={[styles.featureText, { color: colors.mutedText }]}>
              {packageItem.callMinutes} Minutes Local Destination Calls
            </Text>
          </View>
        )}
      </View>

      {/* Activation Action Button */}
      <TouchableOpacity testID="btn-flash-outline"
        style={[styles.activateBtn, { backgroundColor: colors.primary }]}
        onPress={() => onSelect(packageItem.packageId)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Activate ${packageItem.title} for $${packageItem.price}`}
      >
        <Ionicons name="flash-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
        <Text style={styles.activateBtnText}>Activate This eSIM Package</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    position: 'relative',
  },
  popularRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  popularRibbonText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  destination: {
    fontSize: 12,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '800',
  },
  priceValidity: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  featuresBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    lineHeight: 16,
  },
  activateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
  },
  activateBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
