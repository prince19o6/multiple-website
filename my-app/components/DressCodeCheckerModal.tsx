import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useCulture } from '../context/CultureContext';

interface DressCodeCheckerModalProps {
  visible: boolean;
  onClose: () => void;
  siteName?: string;
  siteType?: string;
}

export const DressCodeCheckerModal: React.FC<DressCodeCheckerModalProps> = ({
  visible,
  onClose,
  siteName = 'The Grand Palace & Sacred Temples',
  siteType = 'Grand_Palace',
}) => {
  const colors = useColors();
  const { checkOutfit, lastCheckResult } = useCulture();

  const [shouldersCovered, setShouldersCovered] = useState<boolean>(true);
  const [kneesCovered, setKneesCovered] = useState<boolean>(true);
  const [looseOpaque, setLooseOpaque] = useState<boolean>(true);
  const [footwearRemovable, setFootwearRemovable] = useState<boolean>(true);
  const [headwearRemovable, setHeadwearRemovable] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    await checkOutfit(
      shouldersCovered,
      kneesCovered,
      looseOpaque,
      footwearRemovable,
      headwearRemovable,
      siteType
    );
    setIsVerifying(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.heading }]}>
                Sacred Site Dress Code Checker
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
                {siteName}
              </Text>
            </View>
            <TouchableOpacity testID="btn-close" accessibilityLabel="Close"
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.heading} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Checklist items */}
            <Text style={[styles.sectionHeading, { color: colors.heading }]}>
              Check Your Planned Attire:
            </Text>

            {/* Toggle 1: Shoulders */}
            <TouchableOpacity testID="btn-dresscodecheckermodal-91" accessibilityLabel="dresscodecheckermodal action"
              style={[
                styles.toggleCard,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setShouldersCovered(!shouldersCovered);
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: shouldersCovered ? '#059669' : colors.surface,
                    borderColor: shouldersCovered ? '#059669' : colors.border,
                  },
                ]}
              >
                {shouldersCovered && <Ionicons name="checkmark" size={14} color="#ffffff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: colors.heading }]}>
                  Shoulders Fully Covered
                </Text>
                <Text style={[styles.toggleDesc, { color: colors.mutedText }]}>
                  T-shirt, sleeved blouse, or light cardigan. No tank tops, halter, or sleeveless.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Toggle 2: Knees */}
            <TouchableOpacity testID="btn-dresscodecheckermodal-124" accessibilityLabel="dresscodecheckermodal action"
              style={[
                styles.toggleCard,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setKneesCovered(!kneesCovered);
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: kneesCovered ? '#059669' : colors.surface,
                    borderColor: kneesCovered ? '#059669' : colors.border,
                  },
                ]}
              >
                {kneesCovered && <Ionicons name="checkmark" size={14} color="#ffffff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: colors.heading }]}>
                  Knees Completely Covered
                </Text>
                <Text style={[styles.toggleDesc, { color: colors.mutedText }]}>
                  Full-length trousers, loose linen pants, or maxi skirts extending past knees.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Toggle 3: Loose & Opaque */}
            <TouchableOpacity testID="btn-dresscodecheckermodal-157" accessibilityLabel="dresscodecheckermodal action"
              style={[
                styles.toggleCard,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setLooseOpaque(!looseOpaque);
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: looseOpaque ? '#059669' : colors.surface,
                    borderColor: looseOpaque ? '#059669' : colors.border,
                  },
                ]}
              >
                {looseOpaque && <Ionicons name="checkmark" size={14} color="#ffffff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: colors.heading }]}>
                  Opaque & Non-Tight Fabric
                </Text>
                <Text style={[styles.toggleDesc, { color: colors.mutedText }]}>
                  No transparent, sheer, or mesh materials. Avoid skin-tight spandex gym tights.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Toggle 4: Removable Footwear */}
            <TouchableOpacity testID="btn-dresscodecheckermodal-190" accessibilityLabel="dresscodecheckermodal action"
              style={[
                styles.toggleCard,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setFootwearRemovable(!footwearRemovable);
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: footwearRemovable ? '#059669' : colors.surface,
                    borderColor: footwearRemovable ? '#059669' : colors.border,
                  },
                ]}
              >
                {footwearRemovable && <Ionicons name="checkmark" size={14} color="#ffffff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: colors.heading }]}>
                  Easy-Off Footwear
                </Text>
                <Text style={[styles.toggleDesc, { color: colors.mutedText }]}>
                  Slip-on shoes, loafers, or sandals. Shoes must be removed before entering inner prayer halls.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Toggle 5: Removable Headwear */}
            <TouchableOpacity testID="btn-dresscodecheckermodal-223" accessibilityLabel="dresscodecheckermodal action"
              style={[
                styles.toggleCard,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setHeadwearRemovable(!headwearRemovable);
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: headwearRemovable ? '#059669' : colors.surface,
                    borderColor: headwearRemovable ? '#059669' : colors.border,
                  },
                ]}
              >
                {headwearRemovable && <Ionicons name="checkmark" size={14} color="#ffffff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: colors.heading }]}>
                  Hats & Sunglasses Removable
                </Text>
                <Text style={[styles.toggleDesc, { color: colors.mutedText }]}>
                  Caps, sun hats, and sunglasses must be taken off inside sacred pavilions.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Check Button */}
            <TouchableOpacity testID="btn-shield-checkmark-outline" accessibilityLabel="shield checkmark outline"
              style={[
                styles.verifyBtn,
                { backgroundColor: colors.primary, opacity: isVerifying ? 0.7 : 1 },
              ]}
              onPress={handleVerify}
              disabled={isVerifying}
              activeOpacity={0.85}
            >
              {isVerifying ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#ffffff" />
                  <Text style={styles.verifyBtnText}>Inspect Gate Compliance</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Verdict Result Box */}
            {lastCheckResult && (
              <View
                style={[
                  styles.verdictCard,
                  {
                    backgroundColor:
                      lastCheckResult.status === 'Pass'
                        ? '#ecfdf5'
                        : lastCheckResult.status === 'Needs_Coverup'
                        ? '#fffbeb'
                        : '#fef2f2',
                    borderColor:
                      lastCheckResult.status === 'Pass'
                        ? '#86efac'
                        : lastCheckResult.status === 'Needs_Coverup'
                        ? '#fde68a'
                        : '#fca5a5',
                  },
                ]}
              >
                <View style={styles.verdictHeader}>
                  <Ionicons
                    name={
                      lastCheckResult.status === 'Pass'
                        ? 'checkmark-circle'
                        : lastCheckResult.status === 'Needs_Coverup'
                        ? 'warning'
                        : 'close-circle'
                    }
                    size={26}
                    color={
                      lastCheckResult.status === 'Pass'
                        ? '#16a34a'
                        : lastCheckResult.status === 'Needs_Coverup'
                        ? '#d97706'
                        : '#dc2626'
                    }
                  />
                  <Text
                    style={[
                      styles.verdictTitle,
                      {
                        color:
                          lastCheckResult.status === 'Pass'
                            ? '#15803d'
                            : lastCheckResult.status === 'Needs_Coverup'
                            ? '#b45309'
                            : '#991b1b',
                      },
                    ]}
                  >
                    {lastCheckResult.verdictTitle}
                  </Text>
                </View>

                <Text style={styles.verdictDetails}>{lastCheckResult.verdictDetails}</Text>

                {lastCheckResult.missingItems && lastCheckResult.missingItems.length > 0 && (
                  <View style={styles.missingWrap}>
                    <Text style={styles.missingHeader}>Required Corrections:</Text>
                    {lastCheckResult.missingItems.map((item, idx) => (
                      <View key={idx} style={styles.missingRow}>
                        <Ionicons name="alert-circle" size={14} color="#dc2626" />
                        <Text style={styles.missingItemText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  verifyBtn: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  verdictCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  verdictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  verdictTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  verdictDetails: {
    fontSize: 12,
    lineHeight: 17,
    color: '#334155',
  },
  missingWrap: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 8,
  },
  missingHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b91c1c',
    marginBottom: 4,
  },
  missingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  missingItemText: {
    fontSize: 11,
    color: '#7f1d1d',
    flex: 1,
  },
});
