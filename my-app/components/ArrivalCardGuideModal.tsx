import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { DigitalArrivalCard } from '../types';

interface ArrivalCardGuideModalProps {
  card: DigitalArrivalCard | null;
  visible: boolean;
  onClose: () => void;
}

export const ArrivalCardGuideModal: React.FC<ArrivalCardGuideModalProps> = ({
  card,
  visible,
  onClose,
}) => {
  const colors = useColors();

  if (!card) return null;

  const handleOpenPortal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (card.officialSubmissionUrl) {
      Linking.openURL(card.officialSubmissionUrl).catch(() => {});
    }
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
          {/* Top Bar */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.heading }]}>
                Digital Border Arrival Card Pass
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                {card.destinationCountry} Customs & Immigration
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
            {/* Card Title Box */}
            <View style={[styles.titleCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.iconCircle}>
                <Ionicons name="qr-code" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardName, { color: colors.heading }]}>
                  {card.cardName}
                </Text>
                <View style={styles.badgeRow}>
                  {card.isMandatory && (
                    <View style={styles.mandatoryBadge}>
                      <Text style={styles.mandatoryText}>MANDATORY ENTRY PASS</Text>
                    </View>
                  )}
                  <View style={styles.windowBadge}>
                    <Text style={styles.windowText}>{card.submissionWindow}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Step-by-Step Instructions */}
            <Text style={[styles.sectionHeading, { color: colors.heading }]}>
              Required Information Checklist
            </Text>
            <Text style={[styles.sectionDesc, { color: colors.mutedText }]}>
              Have these documents ready before starting the online immigration form:
            </Text>

            {card.requiredDetails.map((detail, index) => (
              <View
                key={index}
                style={[
                  styles.checkItem,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <View style={[styles.checkNumBox, { backgroundColor: `${colors.primary}18` }]}>
                  <Text style={[styles.checkNum, { color: colors.primary }]}>{index + 1}</Text>
                </View>
                <Text style={[styles.checkText, { color: colors.heading }]}>{detail}</Text>
              </View>
            ))}

            {/* Customs & Banned Goods Rules */}
            {card.customsDutyRules ? (
              <View style={[styles.customsBox, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
                <View style={styles.customsHeader}>
                  <Ionicons name="warning" size={18} color="#d97706" />
                  <Text style={[styles.customsTitle, { color: '#b45309' }]}>
                    Customs Duty Limits & Strict Prohibitions
                  </Text>
                </View>
                <Text style={[styles.customsText, { color: '#92400e' }]}>
                  {card.customsDutyRules}
                </Text>
              </View>
            ) : null}

            {/* Launch Official Portal Button */}
            <TouchableOpacity testID="btn-open-outline" accessibilityLabel="open outline"
              style={[styles.portalBtn, { backgroundColor: colors.primary }]}
              onPress={handleOpenPortal}
              activeOpacity={0.85}
            >
              <Ionicons name="open-outline" size={18} color="#ffffff" />
              <Text style={styles.portalBtnText}>Open Official Government Submission Portal</Text>
            </TouchableOpacity>

            <Text style={[styles.disclaimerText, { color: colors.mutedText }]}>
              Official government website link opens securely in your browser. Be wary of unauthorized third-party copycat sites that charge unauthorized service fees.
            </Text>
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
    paddingTop: 16,
  },
  titleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  mandatoryBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mandatoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: 0.4,
  },
  windowBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  windowText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563eb',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    marginBottom: 8,
  },
  checkNumBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkNum: {
    fontSize: 12,
    fontWeight: '700',
  },
  checkText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  customsBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 16,
  },
  customsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  customsTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  customsText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  portalBtn: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  portalBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
});
