import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useTravelVault } from '../context/TravelVaultContext';
import { VaultDocument } from '../types';
import { VaultAddDocumentModal } from '../components/VaultAddDocumentModal';
import { EmergencySosModal } from '../components/EmergencySosModal';

export default function TravelVaultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { siteName } = useSite();
  const colors = useColors();
  const { documents, deleteDocument, expiringSoonCount } = useTravelVault();

  const [activeTab, setActiveTab] = useState<'documents' | 'emergency'>('documents');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [revealedDocIds, setRevealedDocIds] = useState<Record<string, boolean>>({});

  const toggleReveal = (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics fallback
    }
    setRevealedDocIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShareDocument = (doc: VaultDocument) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Share.share({
        title: doc.title,
        message: `${doc.title} (${doc.issuingCountry})\nNumber: ${doc.documentNumber}\nHolder: ${doc.holderName}\nExpires: ${doc.expiryDate}`,
      });
    } catch {
      // Share cancelled
    }
  };

  const handleDelete = (doc: VaultDocument) => {
    Alert.alert(
      'Remove Document',
      `Are you sure you want to remove "${doc.title}" from your secure Travel Vault?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDocument(doc.id),
        },
      ]
    );
  };

  const getDocTypeMeta = (type: string) => {
    switch (type) {
      case 'passport':
        return { label: 'Passport', icon: 'book' as const, color: '#2563EB' };
      case 'visa':
        return { label: 'Visa / Permit', icon: 'shield-checkmark' as const, color: '#059669' };
      case 'boarding_pass':
        return { label: 'Boarding Pass', icon: 'airplane' as const, color: '#D97706' };
      case 'insurance':
        return { label: 'Travel Insurance', icon: 'medical' as const, color: '#7C3AED' };
      default:
        return { label: 'ID Card', icon: 'card' as const, color: '#4B5563' };
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 12),
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity testID="btn-navigate"
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/bookings');
              }
            }}
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.heading} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.heading }]}>Travel Vault & Safety</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
              {documents.length} Secured Documents • {siteName}
            </Text>
          </View>

          <TouchableOpacity testID="btn-warning"
            style={styles.sosHeaderTrigger}
            onPress={() => {
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              } catch {
                // Haptics fallback
              }
              setSosModalVisible(true);
            }}
            accessibilityLabel="Emergency SOS"
          >
            <Ionicons name="warning" size={16} color="#FFFFFF" />
            <Text style={styles.sosHeaderTriggerText}>SOS</Text>
          </TouchableOpacity>
        </View>

        {/* Segmented Tab Bar */}
        <View style={[styles.segmentedBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TouchableOpacity testID="btn-close" accessibilityLabel="Close"
            style={[
              styles.segmentTab,
              activeTab === 'documents' && [styles.segmentTabActive, { backgroundColor: colors.surface }],
            ]}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {
                // Haptics fallback
              }
              setActiveTab('documents');
            }}
          >
            <Ionicons
              name="lock-closed"
              size={14}
              color={activeTab === 'documents' ? colors.primary : colors.mutedText}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentTabText,
                { color: activeTab === 'documents' ? colors.heading : colors.mutedText, fontWeight: activeTab === 'documents' ? '700' : '500' },
              ]}
            >
              Document Wallet ({documents.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity testID="btn-shield-checkmark" accessibilityLabel="shield checkmark"
            style={[
              styles.segmentTab,
              activeTab === 'emergency' && [styles.segmentTabActive, { backgroundColor: colors.surface }],
            ]}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {
                // Haptics fallback
              }
              setActiveTab('emergency');
            }}
          >
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={activeTab === 'emergency' ? '#EF4444' : colors.mutedText}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentTabText,
                { color: activeTab === 'emergency' ? colors.heading : colors.mutedText, fontWeight: activeTab === 'emergency' ? '700' : '500' },
              ]}
            >
              Emergency SOS
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Area */}
      {activeTab === 'documents' ? (
        <ScrollView
          contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 24) + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary / Stats Card */}
          <View style={[styles.statsBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statsLeft}>
              <View style={[styles.vaultIconWrap, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.statsTitle, { color: colors.heading }]}>Encrypted Traveler Vault</Text>
                <Text style={[styles.statsSub, { color: colors.mutedText }]}>
                  Offline credentials, boarding passes & travel policies
                </Text>
              </View>
            </View>

            {expiringSoonCount > 0 && (
              <View style={styles.expiringWarningBadge}>
                <Ionicons name="alert-circle" size={14} color="#D97706" style={{ marginRight: 4 }} />
                <Text style={styles.expiringWarningText}>{expiringSoonCount} document expiring soon</Text>
              </View>
            )}
          </View>

          {/* Add Document Action Bar */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>YOUR SECURED CREDENTIALS</Text>
            <TouchableOpacity testID="btn-add" accessibilityLabel="add"
              style={[styles.addNewBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // Haptics fallback
                }
                setAddModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.addNewBtnText}>Add Document</Text>
            </TouchableOpacity>
          </View>

          {/* Documents Cards List */}
          {documents.map((doc) => {
            const meta = getDocTypeMeta(doc.type);
            const isRevealed = revealedDocIds[doc.id];
            const displayNum = isRevealed
              ? doc.documentNumber
              : doc.documentNumber.length > 4
              ? `•••• •••• ${doc.documentNumber.slice(-4)}`
              : '•••• ••••';

            return (
              <View
                key={doc.id}
                style={[styles.documentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                {/* Card Header */}
                <View style={styles.docCardHeader}>
                  <View style={styles.docTypeRow}>
                    <View style={[styles.docTypeBadge, { backgroundColor: `${meta.color}15` }]}>
                      <Ionicons name={meta.icon} size={16} color={meta.color} style={{ marginRight: 6 }} />
                      <Text style={[styles.docTypeBadgeText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                    <Text style={[styles.issuingText, { color: colors.mutedText }]} numberOfLines={1}>
                      {doc.issuingCountry}
                    </Text>
                  </View>

                  <View style={styles.cardHeaderActions}>
                    <TouchableOpacity testID="btn-share" accessibilityLabel="Share" onPress={() => handleShareDocument(doc)} style={styles.iconBtn}>
                      <Ionicons name="share-outline" size={16} color={colors.mutedText} />
                    </TouchableOpacity>
                    <TouchableOpacity testID="btn-trash-outline" accessibilityLabel="trash outline" onPress={() => handleDelete(doc)} style={styles.iconBtn}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Document Title */}
                <Text style={[styles.docTitle, { color: colors.heading }]}>{doc.title}</Text>

                {/* Number with Reveal Toggle */}
                <View style={[styles.docNumberBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.docNumberText, { color: colors.heading }]}>{displayNum}</Text>
                  <TouchableOpacity testID="btn-travel-vault-296" accessibilityLabel="travel-vault action" onPress={() => toggleReveal(doc.id)} style={styles.revealBtn}>
                    <Ionicons
                      name={isRevealed ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Meta Row: Holder & Expiry */}
                <View style={styles.docMetaRow}>
                  <View style={styles.docMetaCol}>
                    <Text style={[styles.docMetaLabel, { color: colors.mutedText }]}>HOLDER</Text>
                    <Text style={[styles.docMetaValue, { color: colors.text }]} numberOfLines={1}>
                      {doc.holderName}
                    </Text>
                  </View>

                  <View style={styles.docMetaCol}>
                    <Text style={[styles.docMetaLabel, { color: colors.mutedText }]}>EXPIRES</Text>
                    <Text style={[styles.docMetaValue, { color: colors.text }]}>{doc.expiryDate}</Text>
                  </View>
                </View>

                {doc.notes ? (
                  <Text style={[styles.docNotes, { color: colors.mutedText }]}>Note: {doc.notes}</Text>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 24) + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Emergency SOS Embedded View */}
          <TouchableOpacity testID="btn-warning" accessibilityLabel="warning"
            style={styles.sosBannerBtn}
            onPress={() => setSosModalVisible(true)}
            activeOpacity={0.85}
          >
            <View style={styles.sosBannerLeft}>
              <Ionicons name="warning" size={28} color="#FFFFFF" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.sosBannerTitle}>Launch Emergency Safety Hub</Text>
                <Text style={styles.sosBannerSub}>
                  One-touch dispatch, accredited hospitals & phrasebook
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={[styles.safetyGuideCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.safetyGuideHeader}>
              <Ionicons name="medical" size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={[styles.safetyGuideTitle, { color: colors.heading }]}>
                In-Trip Medical & Travel Tips
              </Text>
            </View>
            <Text style={[styles.safetyGuideText, { color: colors.text }]}>
              • Keep digital and physical copies of your passport photo page and visa in separate bags.
            </Text>
            <Text style={[styles.safetyGuideText, { color: colors.text }]}>
              • Save your travel insurance policy number and international 24/7 emergency toll-free number on your lockscreen.
            </Text>
            <Text style={[styles.safetyGuideText, { color: colors.text }]}>
              • In case of lost documents abroad, contact the nearest consulate or your designated Tour Marshall immediately.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Modals */}
      <VaultAddDocumentModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
      />

      <EmergencySosModal
        visible={sosModalVisible}
        onClose={() => setSosModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  sosHeaderTrigger: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  sosHeaderTriggerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  segmentedBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  segmentTabActive: {
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentTabText: {
    fontSize: 12,
  },
  contentContainer: {
    padding: 16,
  },
  statsBanner: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vaultIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsSub: {
    fontSize: 11,
    marginTop: 2,
  },
  expiringWarningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 10,
  },
  expiringWarningText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addNewBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  documentCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  docCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  docTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  docTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  docTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  issuingText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 4,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  docNumberBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  docNumberText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  revealBtn: {
    padding: 2,
  },
  docMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  docMetaCol: {
    flex: 1,
  },
  docMetaLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  docMetaValue: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  docNotes: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 15,
  },
  sosBannerBtn: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  sosBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  sosBannerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  sosBannerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 2,
  },
  safetyGuideCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  safetyGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  safetyGuideTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  safetyGuideText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
});
