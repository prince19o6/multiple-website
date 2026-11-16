import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { PhraseItem } from '../types';

interface ShowToLocalModalProps {
  phrase: PhraseItem | null;
  onClose: () => void;
}

export const ShowToLocalModal: React.FC<ShowToLocalModalProps> = ({
  phrase,
  onClose,
}) => {
  const colors = useColors();

  if (!phrase) return null;

  return (
    <Modal
      visible={!!phrase}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Close button */}
          <TouchableOpacity testID="btn-close"
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityLabel="Close Flashcard"
            accessibilityRole="button"
          >
            <Ionicons name="close-circle" size={34} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.cardBoard}>
            {/* Top Indicator */}
            <View style={styles.topBanner}>
              <Ionicons name="eye-outline" size={16} color="#d97706" />
              <Text style={styles.topBannerText}>SHOW THIS SCREEN TO LOCAL</Text>
            </View>

            {phrase.isDietarySafe && (
              <View style={styles.dietaryNotice}>
                <Ionicons name="leaf" size={14} color="#15803d" />
                <Text style={styles.dietaryNoticeText}>
                  DIETARY REQUIREMENT / STRICT SAFETY
                </Text>
              </View>
            )}

            {/* Huge Native Script for Easy Reading */}
            <View style={styles.hugeTextContainer}>
              <Text style={styles.hugeNativeScript}>
                {phrase.targetScriptText}
              </Text>
            </View>

            {/* Phonetic Pronunciation Guide */}
            <View style={styles.phoneticContainer}>
              <Text style={styles.phoneticLabel}>HOW TO SAY IT:</Text>
              <Text style={styles.phoneticValue}>
                "{phrase.phoneticText}"
              </Text>
            </View>

            {/* English Meaning */}
            <View style={styles.englishContainer}>
              <Text style={styles.englishLabel}>ENGLISH MEANING:</Text>
              <Text style={styles.englishValue}>
                {phrase.englishText}
              </Text>
            </View>

            {/* Cultural Tip */}
            {phrase.culturalContextNote ? (
              <View style={styles.tipRow}>
                <Ionicons name="bulb-outline" size={14} color="#64748b" />
                <Text style={styles.tipText}>
                  {phrase.culturalContextNote}
                </Text>
              </View>
            ) : null}

            {/* Done / Dismiss Button */}
            <TouchableOpacity testID="btn-dismiss-flashcard"
              style={[styles.dismissBtn, { backgroundColor: colors.primary }]}
              onPress={onClose}
              accessibilityLabel="Dismiss flashcard"
              accessibilityRole="button"
            >
              <Text style={styles.dismissBtnText}>Dismiss Flashcard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: -46,
    right: 0,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBoard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 24,
    borderWidth: 3,
    borderColor: '#d97706',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  topBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 10,
  },
  topBannerText: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dietaryNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 14,
  },
  dietaryNoticeText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  hugeTextContainer: {
    backgroundColor: '#f8fafc',
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 120,
  },
  hugeNativeScript: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 38,
  },
  phoneticContainer: {
    width: '100%',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 12,
  },
  phoneticLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400e',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  phoneticValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78350f',
    fontStyle: 'italic',
  },
  englishContainer: {
    width: '100%',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  englishLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  englishValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  tipText: {
    fontSize: 11,
    color: '#64748b',
    flex: 1,
    lineHeight: 15,
  },
  dismissBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  dismissBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
