import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Linking,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useTravelVault } from '../context/TravelVaultContext';

interface EmergencySosModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EmergencySosModal: React.FC<EmergencySosModalProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { emergencyDirectory } = useTravelVault();

  const handleDial = (number: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Haptics fallback
    }
    const cleanNumber = number.replace(/[\s-]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {});
  };

  const handleSharePhrase = (phrase: string, translation: string, phonetic: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Share.share({
        message: `EMERGENCY ASSISTANCE NEEDED:\n"${phrase}"\nLocal: ${translation}\nPronounced: (${phonetic})`,
      });
    } catch {
      // Share cancelled
    }
  };

  if (!emergencyDirectory) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Urgent Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.sosPulseBadge}>
              <Ionicons name="warning" size={18} color="#EF4444" />
            </View>
            <View>
              <Text style={styles.sosHeaderTitle}>24/7 Travel Safety & SOS</Text>
              <Text style={styles.sosHeaderSub} numberOfLines={1}>
                {emergencyDirectory.destinationRegion}
              </Text>
            </View>
          </View>
          <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close-circle" size={26} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 30 }]}
        >
          {/* Priority Brand Operations Marshall Card */}
          <TouchableOpacity testID="btn-shield-checkmark" accessibilityLabel="shield checkmark"
            style={styles.brandMarshallCard}
            onPress={() => handleDial(emergencyDirectory.brandHotline)}
            activeOpacity={0.85}
          >
            <View style={styles.marshallIconBox}>
              <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.marshallSub}>PRIORITY TOUR OPERATOR HOTLINE</Text>
              <Text style={styles.marshallTitle} numberOfLines={1}>
                {emergencyDirectory.brandHotlineLabel}
              </Text>
              <Text style={styles.marshallNumber}>{emergencyDirectory.brandHotline}</Text>
            </View>
            <View style={styles.callBadge}>
              <Ionicons name="call" size={16} color="#FFFFFF" />
              <Text style={styles.callBadgeText}>CALL</Text>
            </View>
          </TouchableOpacity>

          {/* Quick Emergency Dispatch List */}
          <Text style={[styles.sectionTitle, { color: colors.heading }]}>
            NATIONAL EMERGENCY DISPATCH
          </Text>

          <View style={styles.hotlinesGrid}>
            {emergencyDirectory.emergencyHotlines.map((item, idx) => (
              <TouchableOpacity testID="btn-emergencysosmodal-113" accessibilityLabel="emergencysosmodal action"
                key={`hotline_${idx}`}
                style={[styles.hotlineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleDial(item.number)}
                activeOpacity={0.7}
              >
                <View style={styles.hotlineTop}>
                  <View style={[styles.categoryIconWrap, { backgroundColor: item.category === 'medical' ? '#10B98115' : item.category === 'marine' ? '#0284C715' : '#EF444415' }]}>
                    <Ionicons
                      name={
                        item.category === 'medical'
                          ? 'medical'
                          : item.category === 'marine'
                          ? 'boat'
                          : item.category === 'helpline'
                          ? 'information-circle'
                          : 'shield'
                      }
                      size={18}
                      color={item.category === 'medical' ? '#10B981' : item.category === 'marine' ? '#0284C7' : '#EF4444'}
                    />
                  </View>
                  <View style={styles.hotlineDialBtn}>
                    <Ionicons name="call" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text style={styles.hotlineDialText}>{item.number}</Text>
                  </View>
                </View>

                <Text style={[styles.hotlineTitle, { color: colors.heading }]}>{item.title}</Text>
                <Text style={[styles.hotlineDesc, { color: colors.mutedText }]}>{item.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Accredited Trauma Hospitals */}
          {emergencyDirectory.hospitals.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.heading, marginTop: 20 }]}>
                ACCREDITED 24/7 HOSPITALS & CLINICS
              </Text>

              {emergencyDirectory.hospitals.map((h, idx) => (
                <View
                  key={`hosp_${idx}`}
                  style={[styles.hospitalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.hospitalTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.hospitalName, { color: colors.heading }]}>{h.name}</Text>
                      <Text style={[styles.hospitalCity, { color: colors.primary }]}>{h.city}</Text>
                    </View>
                    <TouchableOpacity testID="btn-call" accessibilityLabel="call"
                      style={[styles.hospitalCallBtn, { backgroundColor: `${colors.primary}15` }]}
                      onPress={() => handleDial(h.phone)}
                    >
                      <Ionicons name="call" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.hospitalCallBtnText, { color: colors.primary }]}>Call Center</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.hospitalAddress, { color: colors.mutedText }]}>{h.address}</Text>

                  <View style={styles.hospitalHoursRow}>
                    <Ionicons name="checkmark-circle" size={13} color="#10B981" style={{ marginRight: 4 }} />
                    <Text style={styles.hospitalHoursText}>{h.emergencyHours}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Local Emergency Phrases */}
          {emergencyDirectory.safetyPhrases.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.heading, marginTop: 20 }]}>
                EMERGENCY LOCAL PHRASEBOOK
              </Text>

              {emergencyDirectory.safetyPhrases.map((phrase, idx) => (
                <View
                  key={`phrase_${idx}`}
                  style={[styles.phraseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.phraseTop}>
                    <Text style={[styles.phraseEnglish, { color: colors.heading }]}>
                      "{phrase.english}"
                    </Text>
                    <TouchableOpacity testID="btn-share" accessibilityLabel="Share"
                      onPress={() => handleSharePhrase(phrase.english, phrase.localScript, phrase.phonetic)}
                      style={styles.phraseShareBtn}
                    >
                      <Ionicons name="share-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.phraseLocal, { color: colors.primary }]}>
                    {phrase.localScript}
                  </Text>
                  <Text style={[styles.phrasePhonetic, { color: colors.mutedText }]}>
                    Pronounce: {phrase.phonetic}
                  </Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#991B1B',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sosPulseBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sosHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  sosHeaderSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 2,
  },
  scrollContent: {
    padding: 16,
  },
  brandMarshallCard: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
    elevation: 4,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  marshallIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marshallSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  marshallTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  marshallNumber: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  callBadge: {
    backgroundColor: '#991B1B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  callBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  hotlinesGrid: {
    gap: 10,
  },
  hotlineCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  hotlineTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotlineDialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF444410',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  hotlineDialText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },
  hotlineTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  hotlineDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  hospitalCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  hospitalTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  hospitalName: {
    fontSize: 14,
    fontWeight: '700',
  },
  hospitalCity: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  hospitalCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  hospitalCallBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  hospitalAddress: {
    fontSize: 11,
    lineHeight: 15,
  },
  hospitalHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  hospitalHoursText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  phraseCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  phraseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phraseEnglish: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  phraseShareBtn: {
    padding: 4,
  },
  phraseLocal: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  phrasePhonetic: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
