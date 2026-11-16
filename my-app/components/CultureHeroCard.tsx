import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useCulture } from '../context/CultureContext';

interface CultureHeroCardProps {
  style?: StyleProp<ViewStyle>;
}

export const CultureHeroCard: React.FC<CultureHeroCardProps> = ({ style }) => {
  const router = useRouter();
  const colors = useColors();
  const { cultureData, setIsDressCheckerOpen } = useCulture();

  const handleOpenHub = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/culture-etiquette' as any);
  };

  const handleOpenChecker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsDressCheckerOpen(true);
  };

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
          <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="sparkles" size={20} color="#b45309" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.heading }]}>
              Cultural Decorum & Dress Codes
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
              {cultureData?.destinationCountry || 'Destination'} &bull; Sacred Temple Gate Compliance
            </Text>
          </View>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>GATE ENFORCED</Text>
        </View>
      </View>

      {/* Info Strip */}
      <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.infoCol}>
          <Text style={[styles.infoLabel, { color: colors.mutedText }]}>MODESTY STANDARD</Text>
          <Text style={[styles.infoMain, { color: '#b45309' }]}>
            Shoulders & Knees Covered
          </Text>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoCol}>
          <Text style={[styles.infoLabel, { color: colors.mutedText }]}>LEGAL WARNINGS</Text>
          <Text style={[styles.infoMain, { color: colors.heading }]} numberOfLines={1}>
            Vaping Banned &bull; Monks Taboo
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity testID="btn-book-outline" accessibilityLabel="book outline"
          style={[styles.mainBtn, { backgroundColor: colors.primary }]}
          onPress={handleOpenHub}
          activeOpacity={0.85}
        >
          <Ionicons name="book-outline" size={16} color="#ffffff" />
          <Text style={styles.mainBtnText}>View Etiquette & Laws</Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-shirt-outline" accessibilityLabel="shirt outline"
          style={[styles.checkBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={handleOpenChecker}
          activeOpacity={0.7}
        >
          <Ionicons name="shirt-outline" size={16} color={colors.heading} />
          <Text style={[styles.checkBtnText, { color: colors.heading }]}>Can I Wear This?</Text>
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
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
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
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mainBtn: {
    flex: 1.4,
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
  checkBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  checkBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
