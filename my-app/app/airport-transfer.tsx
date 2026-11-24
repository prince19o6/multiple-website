import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSite } from '@/store/SiteConfigContext';
import { useFlightTransfer } from '../context/FlightTransferContext';
import { FlightStatusCard } from '../components/FlightStatusCard';
import { ChauffeurPlacardModal } from '../components/ChauffeurPlacardModal';
import { TerminalAmenity } from '../types';
import { FeatureGuard } from '@/components/common/FeatureGuard';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';

function AirportTransferContent() {
  const router = useRouter();
  const params = useLocalSearchParams<{ pickup?: string; dropoff?: string; time?: string; passengers?: string }>();
  const colors = useColors();
  const { siteId } = useSite();
  const { user } = useAuth();
  const { addBooking } = useBooking();
  const [isReserving, setIsReserving] = useState(false);
  const {
    transfer,
    isLoading,
    isRefreshing,
    isPlacardModalVisible,
    openPlacardModal,
    closePlacardModal,
    refreshTransfer,
    updateStatus,
    shareTransferDetails,
    callChauffeur,
    whatsappChauffeur,
  } = useFlightTransfer();

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

  const transferSteps = [
    'Assigned',
    'Chauffeur Waiting at Gate',
    'Boarded & En Route',
    'Completed',
  ];

  if (isLoading && !transfer) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity testID="btn-navigate" style={styles.backBtn} onPress={handleBack} accessibilityLabel="Back" accessibilityRole="button">
            <Ionicons name="chevron-back" size={24} color={colors.heading} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.heading }]} numberOfLines={1}>
              Flight & Airport Transfer
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]} numberOfLines={1}>
              Connecting...
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Connecting to airport dispatch & flight monitor...
          </Text>
        </View>
      </View>
    );
  }

  if (!transfer) {
    if (params.pickup) {
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity testID="btn-navigate" style={styles.backBtn} onPress={handleBack} accessibilityLabel="Back" accessibilityRole="button">
              <Ionicons name="chevron-back" size={24} color={colors.heading} />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={[styles.headerTitle, { color: colors.heading }]} numberOfLines={1}>
                Private Airport Transfer
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.mutedText }]} numberOfLines={1}>
                Instant Reservation
              </Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={[styles.chauffeurCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="car-sport" size={24} color={colors.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={[styles.driverName, { color: colors.heading }]}>Direct Private Chauffeur</Text>
                  <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>Meet & Greet at Arrival Gate</Text>
                </View>
              </View>

              <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="airplane" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.heading }}>
                    Pickup: {params.pickup}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="business" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.heading }}>
                    Drop-off: {params.dropoff || 'City Hotel'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="time" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 12, color: colors.mutedText }}>
                    Scheduled Time: {params.time || '10:00 AM'} • {params.passengers || '2'} Travelers
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 16, backgroundColor: `${colors.primary}12`, padding: 12, borderRadius: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary, marginBottom: 4 }}>
                  ✓ Inclusions Guaranteed
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText }}>
                  • 60 minutes free waiting time after flight landing
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText }}>
                  • Real-time automated flight delay tracking
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedText }}>
                  • Air-conditioned vehicle with generous baggage allowance
                </Text>
              </View>

              <TouchableOpacity
                testID="btn-confirm-transfer-booking"
                accessibilityLabel="Confirm Airport Transfer Booking"
                style={[styles.retryBtn, { backgroundColor: colors.primary, marginTop: 20 }, isReserving && { opacity: 0.7 }]}
                disabled={isReserving}
                onPress={async () => {
                  if (!user) {
                    Alert.alert(
                      'Login Required',
                      'Please log in to your account to confirm your airport transfer booking.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Log In',
                          onPress: () => router.push('/(tabs)/profile'),
                        },
                      ]
                    );
                    return;
                  }

                  try {
                    setIsReserving(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                    const created = await addBooking({
                      website: siteId || 'gujjutours',
                      websiteId: siteId || 'gujjutours',
                      tourId: `transfer-${Date.now()}`,
                      tourSlug: `transfer-${(params.pickup || 'airport').toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                      tourName: `Private Airport Chauffeur: ${params.pickup} to ${params.dropoff || 'City Hotel'}`,
                      destination: params.dropoff || params.pickup || 'City Hotel',
                      service: 'transfers',
                      serviceType: 'transfers',
                      email: user.email,
                      phone: user.phone || '+91 98765 43210',
                      guestName: user.name || 'Traveler',
                      travelers: parseInt(params.passengers || '2', 10) || 2,
                      adults: parseInt(params.passengers || '2', 10) || 2,
                      travelDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                      startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                      totalPrice: 2400,
                      amountPaid: 2400,
                      currency: 'INR',
                      specialRequest: `Airport Transfer: ${params.pickup} -> ${params.dropoff || 'Hotel'} at ${params.time || '10:00 AM'}`,
                      userId: user.id,
                    });

                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                    Alert.alert(
                      'Transfer Reserved!',
                      `Your private chauffeur transfer from ${params.pickup} to ${params.dropoff || 'Destination'} is confirmed (Ref: ${created.reference || created.id}). Chauffeur details and live vehicle tracker will be active 2 hours prior to arrival.`,
                      [
                        {
                          text: 'View in My Bookings',
                          onPress: () => router.push('/(tabs)/bookings'),
                        },
                      ]
                    );
                  } catch (err: any) {
                    Alert.alert('Booking Error', err?.message || 'Failed to confirm transfer booking.');
                  } finally {
                    setIsReserving(false);
                  }
                }}
              >
                {isReserving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.retryBtnText}>Confirm Transfer Booking</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity testID="btn-navigate" style={styles.backBtn} onPress={handleBack} accessibilityLabel="Back" accessibilityRole="button">
            <Ionicons name="chevron-back" size={24} color={colors.heading} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.heading }]} numberOfLines={1}>
              Flight & Airport Transfer
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]} numberOfLines={1}>
              Chauffeur Dispatch
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <Ionicons name="airplane-outline" size={54} color={colors.mutedText} />
          <Text style={[styles.emptyTitle, { color: colors.heading }]}>
            No Airport Transfer Assigned
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedText }]}>
            Airport chauffeur dispatch details will appear once flight details are confirmed.
          </Text>
          <TouchableOpacity testID="btn-retry-connection" accessibilityLabel="Retry Connection"
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={refreshTransfer}
          >
            <Text style={styles.retryBtnText}>Retry Connection</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="btn-return-to-reservation" accessibilityLabel="Return to Reservation"
            style={[styles.retryBtn, { backgroundColor: `${colors.primary}18`, marginTop: 10 }]}
            onPress={handleBack}
          >
            <Text style={[styles.retryBtnText, { color: colors.primary }]}>Return to Reservation</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentStepIndex = Math.max(
    0,
    transferSteps.findIndex((s) => s.toLowerCase() === transfer.transferStatus.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header Bar */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity testID="btn-navigate"
          style={styles.backBtn}
          onPress={handleBack}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={colors.heading} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.heading }]} numberOfLines={1}>
            Flight & Airport Transfer
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            {transfer.arrivalAirportName}
          </Text>
        </View>

        <TouchableOpacity testID="btn-share"
          style={[styles.shareHeaderBtn, { backgroundColor: colors.primary }]}
          onPress={shareTransferDetails}
          accessibilityLabel="Share transfer details"
          accessibilityRole="button"
        >
          <Ionicons name="share-social-outline" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshTransfer}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Status Progression Tracker */}
        <View
          style={[
            styles.progressionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.progressionHeader}>
            <Text style={[styles.cardSectionLabel, { color: colors.mutedText }]}>
              TRANSFER STATUS PROGRESSION
            </Text>
            <View style={styles.livePulse}>
              <View style={styles.livePulseDot} />
              <Text style={[styles.livePulseText, { color: colors.primary }]}>
                {transfer.transferStatus}
              </Text>
            </View>
          </View>

          {/* Stepper Bar */}
          <View style={styles.stepperRow}>
            {transferSteps.map((step, idx) => {
              const isPastOrCurrent = idx <= (currentStepIndex === -1 ? 1 : currentStepIndex);
              const isCurrent = idx === currentStepIndex;

              return (
                <View key={step} style={styles.stepItem}>
                  <View style={styles.stepIndicatorRow}>
                    {idx > 0 && (
                      <View
                        style={[
                          styles.stepLine,
                          {
                            backgroundColor: isPastOrCurrent
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                      />
                    )}
                    <View
                      style={[
                        styles.stepDot,
                        {
                          backgroundColor: isPastOrCurrent
                            ? colors.primary
                            : colors.surface,
                          borderColor: isPastOrCurrent
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    >
                      {isPastOrCurrent ? (
                        <Ionicons name="checkmark" size={10} color="#ffffff" />
                      ) : (
                        <View style={styles.inactiveDot} />
                      )}
                    </View>
                    {idx < transferSteps.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          {
                            backgroundColor: idx < currentStepIndex
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                      />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color: isCurrent ? colors.primary : colors.mutedText,
                        fontWeight: isCurrent ? '700' : '500',
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {step}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Quick Status Update Toggle */}
          <View style={styles.quickStatusRow}>
            <TouchableOpacity testID="btn-car" accessibilityLabel="car"
              style={[
                styles.quickStatusBtn,
                {
                  borderColor:
                    transfer.transferStatus === 'Boarded & En Route'
                      ? colors.primary
                      : colors.border,
                  backgroundColor:
                    transfer.transferStatus === 'Boarded & En Route'
                      ? `${colors.primary}15`
                      : colors.background,
                },
              ]}
              onPress={() => updateStatus('Boarded & En Route')}
            >
              <Ionicons name="car" size={14} color={colors.primary} />
              <Text style={[styles.quickStatusBtnText, { color: colors.heading }]}>
                I Have Boarded Vehicle
              </Text>
            </TouchableOpacity>

            <TouchableOpacity testID="btn-checkmark-done" accessibilityLabel="checkmark done"
              style={[
                styles.quickStatusBtn,
                {
                  borderColor:
                    transfer.transferStatus === 'Completed'
                      ? '#10b981'
                      : colors.border,
                  backgroundColor:
                    transfer.transferStatus === 'Completed'
                      ? '#dcfce7'
                      : colors.background,
                },
              ]}
              onPress={() => updateStatus('Completed')}
            >
              <Ionicons name="checkmark-done" size={14} color="#10b981" />
              <Text style={[styles.quickStatusBtnText, { color: colors.heading }]}>
                Reached Hotel / Villa
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Flight Monitor Card */}
        <FlightStatusCard flight={transfer.flight} />

        {/* Chauffeur Meet & Greet Card */}
        <View
          style={[
            styles.chauffeurCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardSectionLabel, { color: colors.mutedText }]}>
              ASSIGNED CHAUFFEUR & VEHICLE
            </Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.ratingText}>{transfer.chauffeurRating} Rating</Text>
            </View>
          </View>

          <View style={styles.driverProfileRow}>
            {transfer.chauffeurAvatar ? (
              <ExpoImage
                source={{ uri: transfer.chauffeurAvatar }}
                style={styles.driverAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.driverAvatarFallback, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={24} color="#ffffff" />
              </View>
            )}

            <View style={styles.driverDetails}>
              <Text style={[styles.driverName, { color: colors.heading }]}>
                {transfer.chauffeurName}
              </Text>
              <Text style={[styles.vehicleType, { color: colors.primary }]}>
                {transfer.vehicleType}
              </Text>
              <Text style={[styles.vehicleModel, { color: colors.mutedText }]}>
                {transfer.vehicleModel}
              </Text>
            </View>
          </View>

          {/* Vehicle License Plate & Bay */}
          <View
            style={[
              styles.vehicleInfoBar,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <View style={styles.plateContainer}>
              <Text style={styles.plateLabel}>LICENSE PLATE</Text>
              <View style={styles.plateBadge}>
                <Text style={styles.plateText}>{transfer.vehiclePlateNumber}</Text>
              </View>
            </View>

            <View style={[styles.vDivider, { backgroundColor: colors.border }]} />

            <View style={styles.bayContainer}>
              <Text style={styles.plateLabel}>WAITING BAY</Text>
              <Text style={[styles.bayText, { color: colors.heading }]}>
                {transfer.waitingBay}
              </Text>
            </View>
          </View>

          {/* Meeting Point Description */}
          <View
            style={[
              styles.meetingPointBox,
              { backgroundColor: `${colors.primary}0C`, borderColor: `${colors.primary}25` },
            ]}
          >
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.meetingPointLabel, { color: colors.primary }]}>
                Designated Meeting Point:
              </Text>
              <Text style={[styles.meetingPointText, { color: colors.heading }]}>
                {transfer.pickupMeetingPoint}
              </Text>
            </View>
          </View>

          {/* Action Buttons: Show Placard, Call, WhatsApp */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity testID="btn-tablet-landscape"
              style={[styles.placardLaunchBtn, { backgroundColor: colors.primary }]}
              onPress={openPlacardModal}
              accessibilityLabel="Show Digital Paging Placard"
              accessibilityRole="button"
            >
              <Ionicons name="tablet-landscape" size={16} color="#ffffff" />
              <Text style={styles.placardLaunchBtnText}>Show Paging Sign</Text>
            </TouchableOpacity>

            <TouchableOpacity testID="btn-call"
              style={[styles.driverContactBtn, { backgroundColor: `${colors.primary}15` }]}
              onPress={callChauffeur}
              accessibilityLabel="Call Chauffeur"
              accessibilityRole="button"
            >
              <Ionicons name="call" size={18} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity testID="btn-logo-whatsapp"
              style={[styles.driverContactBtn, { backgroundColor: '#25D36618' }]}
              onPress={whatsappChauffeur}
              accessibilityLabel="WhatsApp Chauffeur"
              accessibilityRole="button"
            >
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Airport Terminal Guide & Amenities */}
        <View
          style={[
            styles.amenitiesCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardSectionLabel, { color: colors.mutedText, marginBottom: 12 }]}>
            AIRPORT ARRIVAL TERMINAL AMENITIES
          </Text>

          {transfer.amenities.map((item: TerminalAmenity, index: number) => (
            <View
              key={index}
              style={[
                styles.amenityRow,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth:
                    index === transfer.amenities.length - 1 ? 0 : StyleSheet.hairlineWidth,
                },
              ]}
            >
              <View style={[styles.amenityIconCircle, { backgroundColor: `${colors.primary}12` }]}>
                <Ionicons
                  name={
                    item.name.toLowerCase().includes('sim')
                      ? 'cellular'
                      : item.name.toLowerCase().includes('exchange') ||
                        item.name.toLowerCase().includes('currency')
                      ? 'cash'
                      : item.name.toLowerCase().includes('lounge')
                      ? 'cafe'
                      : 'information-circle'
                  }
                  size={16}
                  color={colors.primary}
                />
              </View>

              <View style={styles.amenityInfo}>
                <Text style={[styles.amenityName, { color: colors.heading }]}>
                  {item.name}
                </Text>
                <Text style={[styles.amenityLocation, { color: colors.mutedText }]}>
                  {item.location}
                </Text>
              </View>

              <View style={styles.amenityBadge}>
                <Text style={styles.amenityBadgeText}>{item.badge}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 24/7 Airport Support Helpline */}
        <View
          style={[
            styles.helpCard,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Ionicons name="headset-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.helpTitle, { color: colors.heading }]}>
              24/7 Airport Dispatch Desk
            </Text>
            <Text style={[styles.helpSub, { color: colors.mutedText }]}>
              Need assistance locating your chauffeur? Call: {transfer.emergencyTransferHotline}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Full-Screen Placard Modal */}
      <ChauffeurPlacardModal
        visible={isPlacardModalVisible}
        transfer={transfer}
        onClose={closePlacardModal}
      />
    </View>
  );
}

export default function AirportTransferScreen() {
  return (
    <FeatureGuard featureId="transfers">
      <AirportTransferContent />
    </FeatureGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  shareHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  progressionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  progressionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  livePulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  livePulseText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepLine: {
    flex: 1,
    height: 2,
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94a3b8',
  },
  stepLabel: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
  quickStatusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickStatusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 40,
  },
  quickStatusBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chauffeurCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    color: '#92400e',
    fontSize: 11,
    fontWeight: '700',
  },
  driverProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  driverAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  vehicleType: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  vehicleModel: {
    fontSize: 12,
  },
  vehicleInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  plateContainer: {
    alignItems: 'center',
  },
  plateLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  plateBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  plateText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  vDivider: {
    width: 1,
    height: 28,
  },
  bayContainer: {
    alignItems: 'center',
  },
  bayText: {
    fontSize: 14,
    fontWeight: '800',
  },
  meetingPointBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  meetingPointLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  meetingPointText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  placardLaunchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
  },
  placardLaunchBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  driverContactBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenitiesCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  amenityIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  amenityInfo: {
    flex: 1,
  },
  amenityName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  amenityLocation: {
    fontSize: 11,
  },
  amenityBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  amenityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  helpTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  helpSub: {
    fontSize: 12,
  },
});
