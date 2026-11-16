import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSite } from '@/store/SiteConfigContext';
import { useDayOfDispatch } from '../context/DayOfDispatchContext';
import { DigitalBoardingPassModal } from '../components/DigitalBoardingPassModal';
import { ExpeditionStopProgress } from '../types';

export default function DayCockpitScreen() {
  const router = useRouter();
  const colors = useColors();
  const { siteId } = useSite();

  const {
    dispatch,
    currentStop,
    completedStopIds,
    isLoading,
    isRefreshing,
    isBoardingPassModalVisible,
    refreshDispatch,
    markStopCompleted,
    openBoardingPassModal,
    closeBoardingPassModal,
  } = useDayOfDispatch();

  const [expandedStopId, setExpandedStopId] = useState<string | null>(null);

  const handleBack = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/bookings');
    }
  };

  if (!dispatch) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={[styles.navHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity testID="btn-navigate" style={styles.backBtn} onPress={handleBack} accessibilityLabel="Go back" accessibilityRole="button">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.heading }]}>Expedition Cockpit</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="compass-outline" size={56} color={colors.mutedText} />
          <Text style={[styles.emptyTitle, { color: colors.heading }]}>No Active Mission Today</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
            Your upcoming expeditions will activate here on the day of departure.
          </Text>
          <TouchableOpacity testID="btn-check-dispatch-server" accessibilityLabel="Check Dispatch Server"
            style={[styles.refreshRetryBtn, { backgroundColor: colors.primary }]}
            onPress={refreshDispatch}
          >
            <Text style={styles.refreshRetryText}>Check Dispatch Server</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="btn-return-to-reservation" accessibilityLabel="Return to Reservation"
            style={[styles.refreshRetryBtn, { backgroundColor: `${colors.primary}18`, marginTop: 10 }]}
            onPress={handleBack}
          >
            <Text style={[styles.refreshRetryText, { color: colors.primary }]}>Return to Reservation</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleOpenMaps = (stop: ExpeditionStopProgress) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(stop.meetingPointName)}@${stop.latitude},${stop.longitude}`,
      android: `geo:0,0?q=${stop.latitude},${stop.longitude}(${encodeURIComponent(stop.meetingPointName)})`,
      default: `https://maps.google.com/?q=${stop.latitude},${stop.longitude}`,
    });
    Linking.openURL(url || `https://maps.google.com/?q=${stop.latitude},${stop.longitude}`);
  };

  const handleCall = (phoneNumber: string) => {
    if (!phoneNumber) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const clean = phoneNumber.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${clean}`);
  };

  const handleWhatsApp = (phoneNumber: string, name: string) => {
    if (!phoneNumber) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const clean = phoneNumber.replace(/[^\d]/g, '');
    const text = encodeURIComponent(
      `Hello ${name}! I am on today's expedition (${dispatch.tourName}). My reference is ${dispatch.bookingReference}.`
    );
    Linking.openURL(`https://wa.me/${clean}?text=${text}`);
  };

  const toggleExpandStop = (stopId: string) => {
    Haptics.selectionAsync();
    setExpandedStopId((prev) => (prev === stopId ? null : stopId));
  };

  const brandAccent = colors.accent || colors.primary || '#ea580c';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Top Navigation Bar */}
      <View style={[styles.navHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity testID="btn-navigate"
          style={styles.backBtn}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <View style={styles.liveBadgeRow}>
            <View style={[styles.pulsingDot, { backgroundColor: brandAccent }]} />
            <Text style={[styles.liveBadgeText, { color: brandAccent }]}>
              LIVE MISSION COCKPIT
            </Text>
          </View>
          <Text style={[styles.headerTourTitle, { color: colors.heading }]} numberOfLines={1}>
            {dispatch.tourName}
          </Text>
        </View>

        <TouchableOpacity testID="btn-qr-code"
          style={[styles.boardingPassBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={openBoardingPassModal}
          accessibilityRole="button"
          accessibilityLabel="Open boarding pass"
        >
          <Ionicons name="qr-code" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshDispatch} tintColor={colors.primary} />
        }
      >
        {/* Mission Progress Overview Card */}
        <View style={[styles.missionOverviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.missionHeaderRow}>
            <View>
              <Text style={[styles.missionDestination, { color: colors.mutedText }]}>
                {dispatch.destination.toUpperCase()}
              </Text>
              <Text style={[styles.missionDate, { color: colors.heading }]}>
                {dispatch.date}
              </Text>
            </View>
            <View style={[styles.progressCircleBadge, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[styles.progressPercentText, { color: colors.primary }]}>
                {dispatch.overallProgressPercent}%
              </Text>
              <Text style={[styles.progressLabelText, { color: colors.primary }]}>
                COMPLETED
              </Text>
            </View>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${dispatch.overallProgressPercent}%` },
              ]}
            />
          </View>

          <Text style={[styles.summaryStatusText, { color: colors.text }]}>
            {dispatch.currentStatusSummary}
          </Text>
        </View>

        {/* Chauffeur & Tour Guide Dispatch Card */}
        <View style={[styles.crewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, { color: colors.mutedText }]}>
            ASSIGNED EXPEDITION CHAUFFEUR & LEAD
          </Text>

          {/* Guide Row */}
          <View style={styles.personRow}>
            <Image
              source={{ uri: dispatch.assignedCrew.guideAvatar }}
              style={styles.personAvatar}
              resizeMode="cover"
            />
            <View style={styles.personDetails}>
              <Text style={[styles.personName, { color: colors.heading }]}>
                {dispatch.assignedCrew.leadGuideName}
              </Text>
              <Text style={[styles.personRole, { color: colors.primary }]}>
                Lead Tour Historian • ★ {dispatch.assignedCrew.guideRating}
              </Text>
            </View>

            <View style={styles.contactButtonsRow}>
              <TouchableOpacity testID="btn-call"
                style={[styles.iconActionBtn, { backgroundColor: colors.primary + '15' }]}
                onPress={() => handleCall(dispatch.assignedCrew.guidePhone)}
                accessibilityRole="button"
                accessibilityLabel="Call Tour Guide"
              >
                <Ionicons name="call" size={18} color={colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity testID="btn-logo-whatsapp"
                style={[styles.iconActionBtn, { backgroundColor: '#25D36620' }]}
                onPress={() =>
                  handleWhatsApp(dispatch.assignedCrew.guidePhone, dispatch.assignedCrew.leadGuideName)
                }
                accessibilityRole="button"
                accessibilityLabel="WhatsApp Tour Guide"
              >
                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Vehicle & Chauffeur Box */}
          <View style={[styles.vehicleBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.vehicleHeader}>
              <View style={styles.vehicleIconCircle}>
                <Ionicons name="car" size={18} color={colors.primary} />
              </View>
              <View style={styles.vehicleTextGroup}>
                <Text style={[styles.vehicleModelText, { color: colors.heading }]}>
                  {dispatch.assignedCrew.vehicleModel}
                </Text>
                <Text style={[styles.driverNameText, { color: colors.mutedText }]}>
                  Chauffeur: {dispatch.assignedCrew.driverName}
                </Text>
              </View>
              <View style={[styles.plateNumberBadge, { backgroundColor: '#0f172a' }]}>
                <Text style={styles.plateNumberText}>
                  {dispatch.assignedCrew.vehiclePlateNumber}
                </Text>
              </View>
            </View>

            <View style={styles.vehicleSubRow}>
              <View style={styles.subItem}>
                <Ionicons name="time-outline" size={14} color={colors.mutedText} />
                <Text style={[styles.subText, { color: colors.mutedText }]}>
                  Pickup: {dispatch.assignedCrew.pickupTime}
                </Text>
              </View>
              <View style={styles.subItem}>
                <Ionicons name="radio" size={14} color="#10b981" />
                <Text style={[styles.subText, { color: '#10b981', fontWeight: '700' }]}>
                  {dispatch.assignedCrew.driverStatus}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Current Active Stop Spotlight Card */}
        {currentStop ? (
          <View style={[styles.currentStopCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <View style={styles.spotlightHeader}>
              <View style={[styles.currentStopBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="radio" size={12} color="#ffffff" />
                <Text style={styles.currentStopBadgeText}>CURRENT STOP • IN PROGRESS</Text>
              </View>
              <Text style={[styles.stopScheduledTime, { color: colors.primary }]}>
                {currentStop.scheduledTime}
              </Text>
            </View>

            <Text style={[styles.currentStopTitle, { color: colors.heading }]}>
              {currentStop.stopName}
            </Text>

            <Text style={[styles.currentStopDesc, { color: colors.text }]}>
              {currentStop.description}
            </Text>

            {/* Meeting Point Box */}
            <View style={[styles.meetingPointBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="location" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.meetingPointTitle, { color: colors.heading }]}>
                  Meeting Point: {currentStop.meetingPointName}
                </Text>
                <Text style={[styles.meetingPointNotes, { color: colors.mutedText }]}>
                  {currentStop.meetingPointNotes}
                </Text>
              </View>
              <TouchableOpacity testID="btn-navigate"
                style={[styles.mapDirectionsBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleOpenMaps(currentStop)}
                accessibilityRole="button"
                accessibilityLabel="Open directions in Maps"
              >
                <Ionicons name="navigate" size={14} color="#ffffff" />
                <Text style={styles.mapDirectionsBtnText}>Directions</Text>
              </TouchableOpacity>
            </View>

            {/* In-Situ Quick Action Triggers */}
            <View style={styles.inSituRow}>
              {currentStop.audioStoryTitle ? (
                <TouchableOpacity testID="btn-headset" accessibilityLabel="headset"
                  style={[styles.inSituActionBtn, { backgroundColor: '#8b5cf615', borderColor: '#8b5cf640' }]}
                  onPress={() => router.push('/audio-guide')}
                  accessibilityRole="button"
                >
                  <Ionicons name="headset" size={16} color="#8b5cf6" />
                  <Text style={[styles.inSituActionText, { color: '#8b5cf6' }]} numberOfLines={1}>
                    Audio Story
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity testID="btn-restaurant" accessibilityLabel="restaurant"
                style={[styles.inSituActionBtn, { backgroundColor: '#f9731615', borderColor: '#f9731640' }]}
                onPress={() => router.push('/culinary-guide')}
                accessibilityRole="button"
              >
                <Ionicons name="restaurant" size={16} color="#f97316" />
                <Text style={[styles.inSituActionText, { color: '#f97316' }]} numberOfLines={1}>
                  Food Tip
                </Text>
              </TouchableOpacity>

              <TouchableOpacity testID="btn-day-cockpit-351" accessibilityLabel="day-cockpit action"
                style={[
                  styles.inSituActionBtn,
                  {
                    backgroundColor: completedStopIds.includes(currentStop.stopId)
                      ? '#10b98120'
                      : colors.border + '30',
                    borderColor: completedStopIds.includes(currentStop.stopId)
                      ? '#10b981'
                      : colors.border,
                  },
                ]}
                onPress={() => markStopCompleted(currentStop.stopId)}
                accessibilityRole="button"
              >
                <Ionicons
                  name={
                    completedStopIds.includes(currentStop.stopId)
                      ? 'checkmark-circle'
                      : 'ellipse-outline'
                  }
                  size={16}
                  color={completedStopIds.includes(currentStop.stopId) ? '#10b981' : colors.text}
                />
                <Text
                  style={[
                    styles.inSituActionText,
                    {
                      color: completedStopIds.includes(currentStop.stopId)
                        ? '#10b981'
                        : colors.text,
                    },
                  ]}
                >
                  {completedStopIds.includes(currentStop.stopId) ? 'Done' : 'Mark Done'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity testID="btn-camera"
                style={[styles.inSituActionBtn, { backgroundColor: '#ec489918' }]}
                onPress={() => router.push('/travel-journal')}
                accessibilityRole="button"
                accessibilityLabel="Log Photo Memory"
              >
                <Ionicons name="camera" size={16} color="#ec4899" />
                <Text style={[styles.inSituActionText, { color: '#ec4899' }]}>
                  Journal
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Step-by-Step Today's Stops Timeline */}
        <View style={[styles.timelineSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, { color: colors.mutedText }]}>
            TODAY'S STEP-BY-STEP SCHEDULE ({dispatch.stops.length} STOPS)
          </Text>

          <View style={styles.stopsTimelineContainer}>
            {dispatch.stops.map((stop, index) => {
              const isCompleted = completedStopIds.includes(stop.stopId);
              const isCurrent = currentStop?.stopId === stop.stopId;
              const isExpanded = expandedStopId === stop.stopId;

              return (
                <View key={stop.stopId} style={styles.timelineItem}>
                  {/* Left Column: Number Badge & Line */}
                  <View style={styles.timelineLeftCol}>
                    <TouchableOpacity testID="btn-checkmark" accessibilityLabel="checkmark"
                      style={[
                        styles.orderBadge,
                        {
                          backgroundColor: isCompleted
                            ? '#10b981'
                            : isCurrent
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                      onPress={() => markStopCompleted(stop.stopId)}
                      accessibilityRole="button"
                    >
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                      ) : (
                        <Text style={styles.orderBadgeText}>{index + 1}</Text>
                      )}
                    </TouchableOpacity>

                    {index < dispatch.stops.length - 1 ? (
                      <View
                        style={[
                          styles.timelineConnector,
                          {
                            backgroundColor: isCompleted ? '#10b981' : colors.border,
                          },
                        ]}
                      />
                    ) : null}
                  </View>

                  {/* Right Column: Stop Content Card */}
                  <TouchableOpacity testID="btn-day-cockpit-454" accessibilityLabel="day-cockpit action"
                    style={[
                      styles.stopContentCard,
                      {
                        backgroundColor: colors.background,
                        borderColor: isCurrent ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => toggleExpandStop(stop.stopId)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.stopContentHeader}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.stopNameText, { color: colors.heading }]}>
                          {stop.stopName}
                        </Text>
                        <Text style={[styles.stopTimeRange, { color: colors.mutedText }]}>
                          {stop.scheduledTime} • Duration: {stop.estimatedDuration}
                        </Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.mutedText}
                      />
                    </View>

                    {isExpanded ? (
                      <View style={styles.expandedDetailsBox}>
                        <Text style={[styles.expandedDesc, { color: colors.text }]}>
                          {stop.description}
                        </Text>

                        <View style={styles.detailRow}>
                          <Ionicons name="location-outline" size={14} color={colors.primary} />
                          <Text style={[styles.detailText, { color: colors.text }]}>
                            Meeting: {stop.meetingPointName}
                          </Text>
                        </View>

                        {stop.dressCodeReminder ? (
                          <View style={styles.detailRow}>
                            <Ionicons name="shirt-outline" size={14} color={colors.mutedText} />
                            <Text style={[styles.detailText, { color: colors.mutedText }]}>
                              {stop.dressCodeReminder}
                            </Text>
                          </View>
                        ) : null}

                        <View style={styles.expandedActionsRow}>
                          <TouchableOpacity testID="btn-navigate-outline" accessibilityLabel="navigate outline"
                            style={[styles.smallActionBtn, { borderColor: colors.primary }]}
                            onPress={() => handleOpenMaps(stop)}
                            accessibilityRole="button"
                          >
                            <Ionicons name="navigate-outline" size={14} color={colors.primary} />
                            <Text style={[styles.smallActionText, { color: colors.primary }]}>
                              Open Map
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity testID="btn-day-cockpit-515" accessibilityLabel="day-cockpit action"
                            style={[
                              styles.smallActionBtn,
                              {
                                borderColor: isCompleted ? '#10b981' : colors.border,
                                backgroundColor: isCompleted ? '#10b98115' : 'transparent',
                              },
                            ]}
                            onPress={() => markStopCompleted(stop.stopId)}
                            accessibilityRole="button"
                          >
                            <Ionicons
                              name={isCompleted ? 'checkmark-circle' : 'checkmark-outline'}
                              size={14}
                              color={isCompleted ? '#10b981' : colors.text}
                            />
                            <Text
                              style={[
                                styles.smallActionText,
                                { color: isCompleted ? '#10b981' : colors.text },
                              ]}
                            >
                              {isCompleted ? 'Completed' : 'Mark Done'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Live Guide Broadcasts / Group Announcements */}
        {dispatch.announcements.length > 0 ? (
          <View style={[styles.announcementsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.announcementHeader}>
              <View style={styles.announcementTitleGroup}>
                <Ionicons name="megaphone" size={18} color={brandAccent} />
                <Text style={[styles.sectionHeading, { color: colors.mutedText, marginBottom: 0 }]}>
                  GUIDE BROADCASTS & NOTICES
                </Text>
              </View>
            </View>

            {dispatch.announcements.map((ann) => (
              <View
                key={ann.id}
                style={[
                  styles.announcementCard,
                  {
                    backgroundColor: colors.background,
                    borderColor: ann.priority === 'Urgent' ? '#ef4444' : colors.border,
                  },
                ]}
              >
                <View style={styles.annTopRow}>
                  <Text style={[styles.annTitle, { color: colors.heading }]}>{ann.title}</Text>
                  <Text style={[styles.annTime, { color: colors.mutedText }]}>{ann.timestamp}</Text>
                </View>
                <Text style={[styles.annMessage, { color: colors.text }]}>{ann.message}</Text>
                <Text style={[styles.annSender, { color: colors.primary }]}>— {ann.sentBy}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Quick In-Destination Local Phrases Banner */}
        <TouchableOpacity testID="btn-chatbubbles"
          style={[styles.phrasebookBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.push('/phrasebook');
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open local phrasebook and translator"
        >
          <View style={styles.phrasebookLeft}>
            <View style={[styles.phrasebookIconBox, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="chatbubbles" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.phrasebookTitleRow}>
                <Text style={[styles.phrasebookTitle, { color: colors.heading }]}>
                  Local Dialects & Flashcards
                </Text>
                <View style={styles.phrasebookOfflineBadge}>
                  <Ionicons name="cloud-offline" size={10} color="#15803d" />
                  <Text style={styles.phrasebookOfflineText}>Offline</Text>
                </View>
              </View>
              <Text style={[styles.phrasebookDesc, { color: colors.mutedText }]}>
                Need to ask for food or bargain with shopkeepers? Show large translation cards to locals.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </TouchableOpacity>

        {/* Quick Tax-Free Shopping & Customs Refund Pass Banner */}
        <TouchableOpacity testID="btn-receipt"
          style={[styles.phrasebookBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.push('/tax-refund');
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open tax-free shopping and refund pass"
        >
          <View style={styles.phrasebookLeft}>
            <View style={[styles.phrasebookIconBox, { backgroundColor: '#f59e0b15' }]}>
              <Ionicons name="receipt" size={22} color="#f59e0b" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.phrasebookTitleRow}>
                <Text style={[styles.phrasebookTitle, { color: colors.heading }]}>
                  Tax-Free Shopping Pass
                </Text>
                <View style={[styles.phrasebookOfflineBadge, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="cash-outline" size={10} color="#b45309" />
                  <Text style={[styles.phrasebookOfflineText, { color: '#b45309' }]}>VAT/GST</Text>
                </View>
              </View>
              <Text style={[styles.phrasebookDesc, { color: colors.mutedText }]}>
                Track department store receipts and see airport customs inspection & refund desk instructions.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </TouchableOpacity>

        {/* Quick Travel eSIM & Cellular Data Pass Banner */}
        <TouchableOpacity testID="btn-cellular"
          style={[styles.phrasebookBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.push('/esim-roaming');
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open travel eSIM and data roaming hub"
        >
          <View style={styles.phrasebookLeft}>
            <View style={[styles.phrasebookIconBox, { backgroundColor: '#0284c715' }]}>
              <Ionicons name="cellular" size={22} color="#0284c7" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.phrasebookTitleRow}>
                <Text style={[styles.phrasebookTitle, { color: colors.heading }]}>
                  Travel eSIM & 5G Roaming
                </Text>
                <View style={[styles.phrasebookOfflineBadge, { backgroundColor: '#e0f2fe' }]}>
                  <Ionicons name="wifi" size={10} color="#0284c7" />
                  <Text style={[styles.phrasebookOfflineText, { color: '#0284c7' }]}>5G DATA</Text>
                </View>
              </View>
              <Text style={[styles.phrasebookDesc, { color: colors.mutedText }]}>
                Check active data balance, copy installation code, or view free airport Wi-Fi login guides.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </TouchableOpacity>

        {/* Quick Medical Care & Cashless Hospitals Banner */}
        <TouchableOpacity testID="btn-shield-checkmark"
          style={[styles.phrasebookBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.push('/insurance' as never);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open Medical Care and Cashless Hospitals"
        >
          <View style={styles.phrasebookLeft}>
            <View style={[styles.phrasebookIconBox, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="shield-checkmark" size={22} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.phrasebookTitleRow}>
                <Text style={[styles.phrasebookTitle, { color: colors.heading }]}>
                  Medical Care & Cashless Hospitals
                </Text>
                <View style={[styles.phrasebookOfflineBadge, { backgroundColor: '#dcfce7', borderColor: '#86efac' }]}>
                  <Ionicons name="medkit" size={10} color="#15803d" />
                  <Text style={[styles.phrasebookOfflineText, { color: '#15803d' }]}>$500k Active</Text>
                </View>
              </View>
              <Text style={[styles.phrasebookDesc, { color: colors.mutedText }]}>
                Pre-approved cashless ER network, direct guarantee of payment & 24/7 emergency doctor hotline.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </TouchableOpacity>

        {/* Quick International Visa & Digital Arrival Pass Reminder */}
        <TouchableOpacity testID="btn-airplane"
          style={[styles.phrasebookBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.push('/visa-hub' as never);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open Visa Requirements and Digital Arrival Pass"
        >
          <View style={styles.phrasebookLeft}>
            <View style={[styles.phrasebookIconBox, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="airplane" size={22} color="#15803d" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.phrasebookTitleRow}>
                <Text style={[styles.phrasebookTitle, { color: colors.heading }]}>
                  Visa & Border Arrival Pass
                </Text>
                <View style={[styles.phrasebookOfflineBadge, { backgroundColor: '#dcfce7', borderColor: '#86efac' }]}>
                  <Ionicons name="qr-code" size={10} color="#15803d" />
                  <Text style={[styles.phrasebookOfflineText, { color: '#15803d' }]}>ENTRY PASS</Text>
                </View>
              </View>
              <Text style={[styles.phrasebookDesc, { color: colors.mutedText }]}>
                Digital arrival cards (TM6 / MDAC), passport 6-month validity compliance & embassies.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </TouchableOpacity>

        {/* Quick Sustainable Eco-Travel & Green Expedition Banner */}
        <TouchableOpacity testID="btn-leaf"
          style={[styles.phrasebookBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.push('/eco-travel' as never);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open Sustainable Eco-Travel and Carbon Offset Hub"
        >
          <View style={styles.phrasebookLeft}>
            <View style={[styles.phrasebookIconBox, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="leaf" size={22} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.phrasebookTitleRow}>
                <Text style={[styles.phrasebookTitle, { color: colors.heading }]}>
                  Green Expedition & Carbon Offset
                </Text>
                <View style={[styles.phrasebookOfflineBadge, { backgroundColor: '#dcfce7', borderColor: '#86efac' }]}>
                  <Ionicons name="sparkles" size={10} color="#15803d" />
                  <Text style={[styles.phrasebookOfflineText, { color: '#15803d' }]}>Gold Standard</Text>
                </View>
              </View>
              <Text style={[styles.phrasebookDesc, { color: colors.mutedText }]}>
                Retire flight carbon emissions, protect local marine reefs & earn your certified green badge.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </TouchableOpacity>

        {/* Quick Cultural Decorum & Temple Attire Reminder */}
        <TouchableOpacity testID="btn-sparkles"
          style={[styles.phrasebookBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.push('/culture-etiquette' as never);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open Cultural Decorum and Temple Dress Codes Hub"
        >
          <View style={styles.phrasebookLeft}>
            <View style={[styles.phrasebookIconBox, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="sparkles" size={22} color="#b45309" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.phrasebookTitleRow}>
                <Text style={[styles.phrasebookTitle, { color: colors.heading }]}>
                  Temple Attire & Cultural Manners
                </Text>
                <View style={[styles.phrasebookOfflineBadge, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
                  <Ionicons name="shirt" size={10} color="#b45309" />
                  <Text style={[styles.phrasebookOfflineText, { color: '#b45309' }]}>MODESTY TEST</Text>
                </View>
              </View>
              <Text style={[styles.phrasebookDesc, { color: colors.mutedText }]}>
                Inspect shoulders/knees compliance for Grand Palace & Wat Arun, plus monk etiquette & vaping laws.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </TouchableOpacity>

        {/* Quick Power Sockets, Voltage & Battery Kiosks */}
        <TouchableOpacity testID="btn-hardware-chip-outline"
          style={[styles.phrasebookBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.push('/power-guide' as never);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open Power Sockets, Voltage and Battery Rentals Hub"
        >
          <View style={styles.phrasebookLeft}>
            <View style={[styles.phrasebookIconBox, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="hardware-chip-outline" size={22} color="#1d4ed8" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.phrasebookTitleRow}>
                <Text style={[styles.phrasebookTitle, { color: colors.heading }]}>
                  Power Sockets & Battery Kiosks
                </Text>
                <View style={[styles.phrasebookOfflineBadge, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                  <Ionicons name="flash" size={10} color="#1d4ed8" />
                  <Text style={[styles.phrasebookOfflineText, { color: '#1d4ed8' }]}>220V 50Hz</Text>
                </View>
              </View>
              <Text style={[styles.phrasebookDesc, { color: colors.mutedText }]}>
                Check 2-pin socket compatibility, verify appliance voltage & locate BTS/7-Eleven battery rental kiosks.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </TouchableOpacity>

        {/* Quick Airline Baggage & Carry-On Sizer */}
        <TouchableOpacity testID="btn-airplane-outline"
          style={[styles.phrasebookBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.push('/baggage-calculator' as never);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open Airline Baggage Allowance and Sizer Hub"
        >
          <View style={styles.phrasebookLeft}>
            <View style={[styles.phrasebookIconBox, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="airplane-outline" size={22} color="#16a34a" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.phrasebookTitleRow}>
                <Text style={[styles.phrasebookTitle, { color: colors.heading }]}>
                  Flight Baggage & Carry-On Sizer
                </Text>
                <View style={[styles.phrasebookOfflineBadge, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                  <Ionicons name="scale" size={10} color="#16a34a" />
                  <Text style={[styles.phrasebookOfflineText, { color: '#16a34a' }]}>WEIGHT CHECK</Text>
                </View>
              </View>
              <Text style={[styles.phrasebookDesc, { color: colors.mutedText }]}>
                Verify 7kg cabin & 20kg checked suitcase limits before airport departure to avoid heavy excess fees.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </TouchableOpacity>

        {/* Rapid Transit Navigator & Taxi Scam Shield */}
        <TouchableOpacity testID="btn-train-outline"
          style={[styles.phrasebookBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.push('/transit-guide' as never);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open Rapid Transit Navigator and Taxi Meter Scam Shield Hub"
        >
          <View style={styles.phrasebookLeft}>
            <View style={[styles.phrasebookIconBox, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="train-outline" size={22} color="#1d4ed8" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.phrasebookTitleRow}>
                <Text style={[styles.phrasebookTitle, { color: colors.heading }]}>
                  Metro & Taxi Fair Meter Shield
                </Text>
                <View style={[styles.phrasebookOfflineBadge, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                  <Ionicons name="shield-checkmark" size={10} color="#1d4ed8" />
                  <Text style={[styles.phrasebookOfflineText, { color: '#1d4ed8' }]}>FAIR FARE</Text>
                </View>
              </View>
              <Text style={[styles.phrasebookDesc, { color: colors.mutedText }]}>
                Check BTS & MRT subway routes, calculate station fares and verify regulated taxi meter pricing.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </TouchableOpacity>

        {/* Travel Pharmacy & Prescription Medicine Translator */}
        <TouchableOpacity testID="btn-medkit-outline"
          style={[styles.phrasebookBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.push('/pharmacy-guide' as never);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open Travel Pharmacy and Prescription Medicine Translator Hub"
        >
          <View style={styles.phrasebookLeft}>
            <View style={[styles.phrasebookIconBox, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="medkit-outline" size={22} color="#dc2626" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.phrasebookTitleRow}>
                <Text style={[styles.phrasebookTitle, { color: colors.heading }]}>
                  Travel Pharmacy & Meds
                </Text>
                <View style={[styles.phrasebookOfflineBadge, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                  <Ionicons name="language" size={10} color="#dc2626" />
                  <Text style={[styles.phrasebookOfflineText, { color: '#dc2626' }]}>OTC TRANSLATE</Text>
                </View>
              </View>
              <Text style={[styles.phrasebookDesc, { color: colors.mutedText }]}>
                Translate Crocin, Dolo & ORS into local Thai/Arabic brand flashcards with 24/7 Boots directory.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </TouchableOpacity>

        {/* Tipping & Gratuity Etiquette Calculator */}
        <TouchableOpacity testID="btn-cash-outline"
          style={[styles.phrasebookBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.push('/tipping-guide' as never);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open Tipping and Gratuity Etiquette Calculator Hub"
        >
          <View style={styles.phrasebookLeft}>
            <View style={[styles.phrasebookIconBox, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="cash-outline" size={22} color="#16a34a" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.phrasebookTitleRow}>
                <Text style={[styles.phrasebookTitle, { color: colors.heading }]}>
                  Tipping & Gratuity Calculator
                </Text>
                <View style={[styles.phrasebookOfflineBadge, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                  <Ionicons name="calculator" size={10} color="#16a34a" />
                  <Text style={[styles.phrasebookOfflineText, { color: '#16a34a' }]}>BILL SPLIT</Text>
                </View>
              </View>
              <Text style={[styles.phrasebookDesc, { color: colors.mutedText }]}>
                Thai massage (50-100฿), driver tips & restaurant bill splitter with service charge detector.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </TouchableOpacity>










        {/* Driving & Motorbike Safety Navigator */}
        <TouchableOpacity testID="btn-car-sport-outline"
          style={[styles.phrasebookBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.push('/drive-safety' as never);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open Driving, Motorbike Safety and Rental Scam Shield Hub"
        >
          <View style={styles.phrasebookLeft}>
            <View style={[styles.phrasebookIconBox, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="car-sport-outline" size={22} color="#2563eb" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.phrasebookTitleRow}>
                <Text style={[styles.phrasebookTitle, { color: colors.heading }]}>
                  Motorbike & Road Safety
                </Text>
                <View style={[styles.phrasebookOfflineBadge, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
                  <Ionicons name="alert-circle" size={10} color="#dc2626" />
                  <Text style={[styles.phrasebookOfflineText, { color: '#dc2626' }]}>IDP LAWS</Text>
                </View>
              </View>
              <Text style={[styles.phrasebookDesc, { color: colors.mutedText }]}>
                Check traffic rules, avoid scooter passport extortion & complete pre-ride vehicle inspection.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </TouchableOpacity>

        {/* Currency Exchange & ATM DCC Shield Hub */}
        <TouchableOpacity testID="btn-cash-outline"
          style={[styles.phrasebookBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.push('/forex-radar' as never);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open Currency Exchange Radar and ATM DCC Shield Hub"
        >
          <View style={styles.phrasebookLeft}>
            <View style={[styles.phrasebookIconBox, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="cash-outline" size={22} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.phrasebookTitleRow}>
                <Text style={[styles.phrasebookTitle, { color: colors.heading }]}>
                  Forex Radar & ATM Shield
                </Text>
                <View style={[styles.phrasebookOfflineBadge, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
                  <Ionicons name="shield-checkmark" size={10} color="#059669" />
                  <Text style={[styles.phrasebookOfflineText, { color: '#059669' }]}>DCC DEFENSE</Text>
                </View>
              </View>
              <Text style={[styles.phrasebookDesc, { color: colors.mutedText }]}>
                Compare SuperRich vs airport counter rates & decline ATM conversion to save 8-11%.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </TouchableOpacity>

        {/* Market Bargain & Negotiation Assistant Hub */}
        <TouchableOpacity testID="btn-pricetag-outline"
          style={[styles.phrasebookBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.push('/bargain-assistant' as never);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open Market Bargain and Fair Price Assistant"
        >
          <View style={styles.phrasebookLeft}>
            <View style={[styles.phrasebookIconBox, { backgroundColor: '#fffbeb' }]}>
              <Ionicons name="pricetag-outline" size={22} color="#d97706" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.phrasebookTitleRow}>
                <Text style={[styles.phrasebookTitle, { color: colors.heading }]}>
                  Bargain & Fair Price Radar
                </Text>
                <View style={[styles.phrasebookOfflineBadge, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
                  <Ionicons name="chatbubbles-outline" size={10} color="#d97706" />
                  <Text style={[styles.phrasebookOfflineText, { color: '#d97706' }]}>CULTURE GUIDE</Text>
                </View>
              </View>
              <Text style={[styles.phrasebookDesc, { color: colors.mutedText }]}>
                Night market price benchmarks, polite counter-offer calculator & vendor audio flashcards.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </TouchableOpacity>

        {/* 24/7 Operations Emergency Hotline */}
        <View style={[styles.emergencyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.emergencyLeft}>
            <Ionicons name="shield-checkmark" size={24} color="#10b981" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.emergencyTitle, { color: colors.heading }]}>
                24/7 Destination Assistance
              </Text>
              <Text style={[styles.emergencyDesc, { color: colors.mutedText }]}>
                Emergency Hotline: {dispatch.emergencyHotline}
              </Text>
            </View>
          </View>

          <TouchableOpacity testID="btn-call"
            style={[styles.callHotlineBtn, { backgroundColor: '#10b981' }]}
            onPress={() => handleCall(dispatch.emergencyHotline)}
            accessibilityRole="button"
            accessibilityLabel="Call 24/7 hotline"
          >
            <Ionicons name="call" size={16} color="#ffffff" />
            <Text style={styles.callHotlineText}>Call Desk</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Digital Boarding Pass Modal */}
      <DigitalBoardingPassModal
        visible={isBoardingPassModalVisible}
        onClose={closeBoardingPassModal}
        dispatch={dispatch}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleGroup: {
    flex: 1,
    marginHorizontal: 8,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTourTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  boardingPassBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  refreshRetryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshRetryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  missionOverviewCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  missionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  missionDestination: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  missionDate: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  progressCircleBadge: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressPercentText: {
    fontSize: 16,
    fontWeight: '900',
  },
  progressLabelText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  summaryStatusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  crewCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  personDetails: {
    flex: 1,
  },
  personName: {
    fontSize: 15,
    fontWeight: '800',
  },
  personRole: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f618',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  vehicleTextGroup: {
    flex: 1,
  },
  vehicleModelText: {
    fontSize: 14,
    fontWeight: '800',
  },
  driverNameText: {
    fontSize: 12,
    marginTop: 1,
  },
  plateNumberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  plateNumberText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vehicleSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f030',
    paddingTop: 8,
  },
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subText: {
    fontSize: 12,
  },
  currentStopCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  spotlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentStopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  currentStopBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stopScheduledTime: {
    fontSize: 13,
    fontWeight: '800',
  },
  currentStopTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 6,
  },
  currentStopDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  meetingPointBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  meetingPointTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  meetingPointNotes: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  mapDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  mapDirectionsBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  inSituRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inSituActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
    minHeight: 40,
  },
  inSituActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timelineSection: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  stopsTimelineContainer: {
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineLeftCol: {
    width: 36,
    alignItems: 'center',
  },
  orderBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  stopContentCard: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  stopContentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopNameText: {
    fontSize: 14,
    fontWeight: '800',
  },
  stopTimeRange: {
    fontSize: 11,
    marginTop: 2,
  },
  expandedDetailsBox: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f030',
    marginTop: 10,
    paddingTop: 10,
    gap: 8,
  },
  expandedDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    flex: 1,
  },
  expandedActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    minHeight: 36,
  },
  smallActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  announcementsSection: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  announcementTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  announcementCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  annTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  annTitle: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  annTime: {
    fontSize: 11,
  },
  annMessage: {
    fontSize: 12,
    lineHeight: 17,
  },
  annSender: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  phrasebookBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  phrasebookLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  phrasebookIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phrasebookTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  phrasebookTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  phrasebookOfflineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  phrasebookOfflineText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
  },
  phrasebookDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  emergencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  emergencyDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  callHotlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    minHeight: 44,
  },
  callHotlineText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
