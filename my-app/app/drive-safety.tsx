import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useDriveSafety } from '../context/DriveSafetyContext';
import { DriveRuleCard } from '../components/DriveRuleCard';
import { RentalScamChecklistCard } from '../components/RentalScamChecklistCard';
import { PreRideInspectionModal } from '../components/PreRideInspectionModal';

export default function DriveSafetyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const {
    hubData,
    activeTab,
    setActiveTab,
    isLoading,
    isRefreshing,
    refreshHub,
    completedSteps,
    dialEmergencyRoadside,
    isInspectionModalOpen,
    setIsInspectionModalOpen,
  } = useDriveSafety();

  const completedCount =
    hubData?.preRideChecklist?.filter((s) => !!completedSteps[s.stepId])?.length || 0;
  const totalSteps = hubData?.preRideChecklist?.length || 0;

  const handleTabChange = (tab: 'rules' | 'scams' | 'checklist') => {
    Haptics.selectionAsync().catch(() => {});
    setActiveTab(tab);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16),
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.heading} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.heading }]}>
            Road Rules & Rental Safety
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            {hubData?.country || 'Destination'} &bull; IDP & Scam Prevention Hub
          </Text>
        </View>

        <TouchableOpacity
          style={styles.sosBtn}
          onPress={dialEmergencyRoadside}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="call" size={14} color="#ffffff" />
          <Text style={styles.sosBtnText}>SOS</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'rules' && [styles.tabItemActive, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => handleTabChange('rules')}
        >
          <Ionicons
            name="navigate-outline"
            size={16}
            color={activeTab === 'rules' ? colors.primary : colors.mutedText}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'rules' ? colors.primary : colors.mutedText },
            ]}
          >
            Road Rules
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'scams' && [styles.tabItemActive, { borderBottomColor: '#dc2626' }],
          ]}
          onPress={() => handleTabChange('scams')}
        >
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color={activeTab === 'scams' ? '#dc2626' : colors.mutedText}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'scams' ? '#dc2626' : colors.mutedText },
            ]}
          >
            Scam Shield
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'checklist' && [styles.tabItemActive, { borderBottomColor: '#16a34a' }],
          ]}
          onPress={() => handleTabChange('checklist')}
        >
          <Ionicons
            name="checkbox-outline"
            size={16}
            color={activeTab === 'checklist' ? '#16a34a' : colors.mutedText}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'checklist' ? '#16a34a' : colors.mutedText },
            ]}
          >
            Pre-Ride ({completedCount}/{totalSteps})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Loading destination road safety intelligence...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 24, 40) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshHub}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* IDP Requirement Highlight Banner */}
          <View style={styles.idpBanner}>
            <View style={styles.idpHeader}>
              <Ionicons name="id-card" size={18} color="#0284c7" />
              <Text style={styles.idpTitle}>INTERNATIONAL DRIVING PERMIT (IDP)</Text>
            </View>
            <Text style={styles.idpText}>{hubData?.idpRequirementSummary}</Text>
          </View>

          {/* TAB 1: ROAD RULES */}
          {activeTab === 'rules' && (
            <View>
              {/* Quick Spec Metrics Grid */}
              <View style={styles.metricsGrid}>
                <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.metricLabel, { color: colors.mutedText }]}>DRIVING SIDE</Text>
                  <Text style={[styles.metricValue, { color: colors.primary }]}>
                    {hubData?.drivingSide.includes('LEFT') ? 'LEFT' : 'RIGHT'}
                  </Text>
                  <Text style={[styles.metricSub, { color: colors.mutedText }]}>
                    {hubData?.drivingSide.includes('LEFT') ? 'Same as UK/India' : 'American/EU'}
                  </Text>
                </View>

                <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.metricLabel, { color: colors.mutedText }]}>ALCOHOL LIMIT</Text>
                  <Text style={[styles.metricValue, { color: '#dc2626' }]}>
                    {hubData?.bloodAlcoholLimit.includes('0.00%') ? '0.00%' : '0.05%'}
                  </Text>
                  <Text style={[styles.metricSub, { color: colors.mutedText }]}>
                    Strict Enforcement
                  </Text>
                </View>
              </View>

              {/* Helmet Mandate Callout */}
              <View style={[styles.helmetBox, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
                <Ionicons name="shield-outline" size={18} color="#d97706" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.helmetTitle}>HELMET MANDATE</Text>
                  <Text style={styles.helmetText}>{hubData?.helmetLaw}</Text>
                </View>
              </View>

              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Key Traffic Laws & Checkpoint Rules
              </Text>

              {hubData?.roadRules?.map((rule) => (
                <DriveRuleCard key={rule.ruleKey} rule={rule} />
              ))}
            </View>
          )}

          {/* TAB 2: SCAM SHIELD */}
          {activeTab === 'scams' && (
            <View>
              {/* Critical Red Banner */}
              <View style={styles.criticalWarningBanner}>
                <Ionicons name="warning" size={24} color="#ffffff" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.criticalBannerTitle}>
                    RULE #1: NEVER SURRENDER YOUR ORIGINAL PASSPORT
                  </Text>
                  <Text style={styles.criticalBannerText}>
                    Leaving your physical passport as collateral is the primary method dishonest
                    rental shops use to extort travelers for existing damage!
                  </Text>
                </View>
              </View>

              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Known Tourist Rental Scams & Countermeasures
              </Text>

              {hubData?.scamWarnings?.map((scam) => (
                <RentalScamChecklistCard key={scam.tipKey} scam={scam} />
              ))}
            </View>
          )}

          {/* TAB 3: PRE-RIDE CHECKLIST */}
          {activeTab === 'checklist' && (
            <View>
              <View style={[styles.checklistPromptCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.promptHeader}>
                  <Ionicons name="videocam" size={20} color="#0284c7" />
                  <Text style={[styles.promptTitle, { color: colors.heading }]}>
                    Pre-Ride Photo & Video Checklist
                  </Text>
                </View>
                <Text style={[styles.promptDesc, { color: colors.mutedText }]}>
                  Complete this 5-point verification in front of the rental agent before driving
                  away to establish timestamped proof of vehicle condition.
                </Text>

                <TouchableOpacity
                  style={[styles.launchWizardBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setIsInspectionModalOpen(true)}
                >
                  <Ionicons name="camera-outline" size={18} color="#ffffff" />
                  <Text style={styles.launchWizardBtnText}>
                    Launch Interactive Inspection Wizard ({completedCount}/{totalSteps})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Steps overview */}
              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Inspection Checklist Items
              </Text>

              {hubData?.preRideChecklist?.map((step, idx) => {
                const isChecked = !!completedSteps[step.stepId];
                return (
                  <View
                    key={step.stepId}
                    style={[
                      styles.stepOverviewItem,
                      {
                        backgroundColor: isChecked ? '#f0fdf4' : colors.surface,
                        borderColor: isChecked ? '#86efac' : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isChecked ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={isChecked ? '#16a34a' : colors.mutedText}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.stepOverviewTitle,
                          {
                            color: isChecked ? '#166534' : colors.heading,
                            textDecorationLine: isChecked ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {idx + 1}. {step.title}
                      </Text>
                      <Text style={[styles.stepOverviewDetail, { color: colors.mutedText }]}>
                        {step.detail}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Pre-Ride Modal */}
      <PreRideInspectionModal
        visible={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  sosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  sosBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {},
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  idpBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  idpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  idpTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  idpText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#e2e8f0',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 10,
  },
  helmetBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  helmetTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 2,
  },
  helmetText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#78350f',
  },
  criticalWarningBanner: {
    backgroundColor: '#b91c1c',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  criticalBannerTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  criticalBannerText: {
    color: '#fee2e2',
    fontSize: 11,
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  checklistPromptCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  promptTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  promptDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  launchWizardBtn: {
    minHeight: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  launchWizardBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  stepOverviewItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  stepOverviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  stepOverviewDetail: {
    fontSize: 11,
    lineHeight: 15,
  },
});
