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
import { TravelMedicine } from '../types';

interface MedicineCardProps {
  medicine: TravelMedicine;
  onShowPharmacist: (medicine: TravelMedicine) => void;
  style?: StyleProp<ViewStyle>;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine,
  onShowPharmacist,
  style,
}) => {
  const colors = useColors();

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Stomach_Digestion':
        return 'water-outline';
      case 'Motion_Sickness':
        return 'boat-outline';
      case 'Allergy_Bites':
        return 'bandage-outline';
      case 'First_Aid':
        return 'medkit-outline';
      default:
        return 'thermometer-outline';
    }
  };

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
        <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
          <Ionicons name={getCategoryIcon(medicine.category) as any} size={20} color="#1d4ed8" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.genericName, { color: colors.heading }]}>
            {medicine.genericName}
          </Text>
          <Text style={[styles.homeNames, { color: colors.mutedText }]} numberOfLines={1}>
            Home: {medicine.commonHomeNames.join(', ')}
          </Text>
        </View>

        <TouchableOpacity testID="btn-chatbubble-ellipses" accessibilityLabel="chatbubble ellipses"
          style={styles.showBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            onShowPharmacist(medicine);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses" size={13} color="#ffffff" />
          <Text style={styles.showBtnText}>SHOW</Text>
        </TouchableOpacity>
      </View>

      {/* Local Brands Row */}
      <View style={[styles.localBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={[styles.localLabel, { color: colors.mutedText }]}>LOCAL BRANDS:</Text>
        <Text style={[styles.localText, { color: colors.heading }]} numberOfLines={1}>
          {medicine.localBrandNames.join(' &bull; ')}
        </Text>
      </View>

      {/* Thai / Arabic Script Preview */}
      <View style={styles.scriptPreviewRow}>
        <Text style={[styles.nativeScript, { color: colors.primary }]} numberOfLines={1}>
          {medicine.nativeText}
        </Text>
      </View>

      {/* Symptoms Pills */}
      <View style={styles.symptomsRow}>
        {medicine.symptoms.slice(0, 3).map((sym, idx) => (
          <View key={idx} style={[styles.symptomPill, { backgroundColor: '#f1f5f9' }]}>
            <Text style={styles.symptomText}>{sym}</Text>
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
    marginBottom: 8,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genericName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  homeNames: {
    fontSize: 11,
    marginTop: 1,
  },
  showBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  showBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  localBox: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  localLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  localText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  scriptPreviewRow: {
    marginBottom: 8,
  },
  nativeScript: {
    fontSize: 13,
    fontWeight: '700',
  },
  symptomsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  symptomPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  symptomText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
});
