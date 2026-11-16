import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useEco } from '../context/EcoContext';

interface EcoHeroCardProps {
  style?: StyleProp<ViewStyle>;
}

export const EcoHeroCard: React.FC<EcoHeroCardProps> = ({ style }) => {
  const router = useRouter();
  const colors = useColors();
  const { emissions, ecoData, setIsCalculatorModalOpen } = useEco();

  const handleOpenHub = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/eco-travel' as any);
  };

  const handleOpenCalc = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsCalculatorModalOpen(true);
  };

  const totalKg = emissions?.totalEmissionsKg || 522.7;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.iconBox, { backgroundColor: '#ecfdf5' }]}>
            <Ionicons name="leaf" size={20} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.heading }]}>
              Eco-Travel & Carbon Offset
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
              {ecoData?.defaultFlightRoute || 'Route Active'} &bull; {ecoData?.ecoExplorerLevel || 'Eco Pioneer'}
            </Text>
          </View>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>GOLD STANDARD</Text>
        </View>
      </View>

      {/* Info Strip */}
      <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.infoCol}>
          <Text style={[styles.infoLabel, { color: colors.mutedText }]}>ESTIMATED FOOTPRINT</Text>
          <Text style={[styles.infoMain, { color: '#059669' }]}>
            {totalKg.toFixed(1)} kg CO2e
          </Text>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoCol}>
          <Text style={[styles.infoLabel, { color: colors.mutedText }]}>OFFSET STATUS</Text>
          <Text style={[styles.infoMain, { color: colors.heading }]}>
            {ecoData && ecoData.myContributions && ecoData.myContributions.length > 0
              ? 'Certified Neutral'
              : 'Offset Pending'}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity testID="btn-sparkles" accessibilityLabel="sparkles"
          style={[styles.mainBtn, { backgroundColor: colors.primary }]}
          onPress={handleOpenHub}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles" size={16} color="#ffffff" />
          <Text style={styles.mainBtnText}>Offset & View Projects</Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-calculator-outline" accessibilityLabel="calculator outline"
          style={[styles.calcBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={handleOpenCalc}
          activeOpacity={0.7}
        >
          <Ionicons name="calculator-outline" size={16} color={colors.heading} />
          <Text style={[styles.calcBtnText, { color: colors.heading }]}>Calculator</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  statusBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 10,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoMain: {
    fontSize: 13,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mainBtn: {
    flex: 1.5,
    minHeight: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mainBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  calcBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  calcBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
