import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSite } from '@/store/SiteConfigContext';
import { ExpeditionStamp } from '../types';
import { usePassport } from '../context/PassportContext';

interface StampModalProps {
  stamp: ExpeditionStamp | null;
  visible: boolean;
  onClose: () => void;
}

export const StampModal: React.FC<StampModalProps> = ({ stamp, visible, onClose }) => {
  const colors = useColors();
  const { siteName } = useSite();
  const { unlockStamp } = usePassport();

  if (!stamp) return null;

  const handleShare = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Share.share({
        title: `${stamp.title} • ${siteName} Passport`,
        message: `I unlocked the official "${stamp.title}" expedition stamp in ${stamp.destination} on the ${siteName} travel app! 🌍✈️`,
      });
    } catch {}
  };

  const handleClaim = async () => {
    await unlockStamp(stamp.id);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity testID="btn-dismiss" accessibilityLabel="Dismiss" style={styles.overlay} activeOpacity={1} onPress={onClose} />

        <View style={[styles.dialogCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <Text style={[styles.brandCrest, { color: colors.primary }]}>{siteName.toUpperCase()} EXPEDITION</Text>
              <Text style={[styles.dialogTitle, { color: colors.heading }]}>Destination Seal</Text>
            </View>
            <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          {/* Large Realistic Ink Stamp Crest */}
          <View style={styles.stampCenterContainer}>
            <View
              style={[
                styles.vintageStampRing,
                {
                  borderColor: stamp.unlocked ? stamp.colorHex : colors.border,
                  backgroundColor: stamp.unlocked ? `${stamp.colorHex}10` : `${colors.border}15`,
                  borderRadius: stamp.stampShape === 'circle' ? 90 : stamp.stampShape === 'oval' ? 60 : 30,
                  transform: [{ rotate: stamp.unlocked ? '-4deg' : '0deg' }],
                },
              ]}
            >
              <View
                style={[
                  styles.innerStampDotted,
                  { borderColor: stamp.unlocked ? stamp.colorHex : colors.border },
                ]}
              >
                <Ionicons
                  name={stamp.iconName as keyof typeof Ionicons.glyphMap}
                  size={36}
                  color={stamp.unlocked ? stamp.colorHex : colors.mutedText}
                />
                <Text
                  style={[
                    styles.stampDestinationText,
                    { color: stamp.unlocked ? stamp.colorHex : colors.mutedText },
                  ]}
                  numberOfLines={1}
                >
                  {stamp.destination.toUpperCase()}
                </Text>

                {stamp.unlocked && stamp.unlockedDate && (
                  <View style={[styles.stampedDateBadge, { backgroundColor: stamp.colorHex }]}>
                    <Text style={styles.stampedDateText}>PASSED: {stamp.unlockedDate}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Stamp Information */}
          <View style={styles.infoSection}>
            <Text style={[styles.stampTitle, { color: colors.heading }]}>{stamp.title}</Text>
            <Text style={[styles.stampDestination, { color: colors.mutedText }]}>
              {stamp.destination} {stamp.coordinates ? `• ${stamp.coordinates}` : ''}
            </Text>

            <Text style={[styles.stampDescription, { color: colors.text }]}>{stamp.description}</Text>

            {/* Status & XP Row */}
            <View style={[styles.statusBox, { backgroundColor: stamp.unlocked ? '#10B98112' : `${colors.primary}10` }]}>
              <Ionicons
                name={stamp.unlocked ? 'checkmark-circle' : 'lock-closed'}
                size={18}
                color={stamp.unlocked ? '#10B981' : colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: stamp.unlocked ? '#10B981' : colors.primary, fontWeight: '700' },
                ]}
              >
                {stamp.unlocked
                  ? `OFFICIALLY VERIFIED (+${stamp.xpReward} XP)`
                  : `SEAL LOCKED (+${stamp.xpReward} XP upon completion)`}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            {stamp.unlocked ? (
              <TouchableOpacity testID="btn-share" accessibilityLabel="Share"
                style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
                onPress={handleShare}
              >
                <Ionicons name="share-social" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.primaryActionBtnText}>Share Stamp</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity testID="btn-sparkles" accessibilityLabel="sparkles"
                style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
                onPress={handleClaim}
              >
                <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.primaryActionBtnText}>Stamp My Passport</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitleWrap: {
    flex: 1,
  },
  brandCrest: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  stampCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  vintageStampRing: {
    width: 170,
    height: 170,
    borderWidth: 3,
    borderStyle: 'solid',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  innerStampDotted: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  stampDestinationText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 6,
    textAlign: 'center',
  },
  stampedDateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  stampedDateText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  infoSection: {
    marginTop: 10,
    marginBottom: 18,
  },
  stampTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  stampDestination: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  stampDescription: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 12,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
