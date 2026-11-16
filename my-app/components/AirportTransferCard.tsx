import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useFlightTransfer } from '@/context/FlightTransferContext';

export const AirportTransferCard: React.FC<{ style?: object }> = ({ style }) => {
  const router = useRouter();
  const colors = useColors();
  const { transfer, openPlacardModal, shareTransferDetails } = useFlightTransfer();

  if (!transfer) return null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {/* Top Banner Row */}
      <View style={styles.topRow}>
        <View style={styles.tagWrap}>
          <Ionicons name="airplane" size={13} color={colors.primary} />
          <Text style={[styles.tagText, { color: colors.primary }]}>
            FLIGHT & CHAUFFEUR TRANSFER
          </Text>
        </View>

        <TouchableOpacity testID="btn-share"
          style={[styles.shareBtn, { backgroundColor: `${colors.primary}15` }]}
          onPress={shareTransferDetails}
          accessibilityLabel="Share transfer details"
          accessibilityRole="button"
        >
          <Ionicons name="share-social-outline" size={15} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Flight Route Header */}
      <View style={styles.flightRow}>
        <Text style={[styles.flightTitle, { color: colors.heading }]}>
          {transfer.flight.airline} {transfer.flight.flightNumber}
        </Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>
            {transfer.flight.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={[styles.routeText, { color: colors.mutedText }]}>
        ✈️ {transfer.flight.originCity} ({transfer.flight.originAirportCode}) ➔{' '}
        {transfer.flight.destCity} ({transfer.flight.destAirportCode})
      </Text>

      {/* Chauffeur Meet & Greet Box */}
      <View
        style={[
          styles.chauffeurBox,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <View style={styles.chauffeurInfo}>
          <Ionicons name="car-outline" size={18} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.driverName, { color: colors.heading }]}>
              {transfer.chauffeurName} ({transfer.vehicleModel.split('(')[0].trim()})
            </Text>
            <Text style={[styles.driverSub, { color: colors.mutedText }]} numberOfLines={1}>
              Plate: {transfer.vehiclePlateNumber} • {transfer.waitingBay}
            </Text>
          </View>
        </View>

        <TouchableOpacity testID="btn-tablet-landscape-outline"
          style={[styles.placardMiniBtn, { borderColor: colors.primary }]}
          onPress={openPlacardModal}
          accessibilityLabel="Show airport paging sign"
          accessibilityRole="button"
        >
          <Ionicons name="tablet-landscape-outline" size={13} color={colors.primary} />
          <Text style={[styles.placardMiniText, { color: colors.primary }]}>
            Paging Sign
          </Text>
        </TouchableOpacity>
      </View>

      {/* Open Full Screen Button */}
      <TouchableOpacity testID="btn-navigate"
        style={[styles.openBtn, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/airport-transfer')}
        activeOpacity={0.85}
        accessibilityLabel="Open Flight and Transfer Hub"
        accessibilityRole="button"
      >
        <Text style={styles.openBtnText}>Open Flight & Chauffeur Hub</Text>
        <Ionicons name="arrow-forward" size={16} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  shareBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  flightTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  statusPill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusPillText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  routeText: {
    fontSize: 12,
    marginBottom: 12,
  },
  chauffeurBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  chauffeurInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverName: {
    fontSize: 13,
    fontWeight: '700',
  },
  driverSub: {
    fontSize: 11,
    marginTop: 1,
  },
  placardMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  placardMiniText: {
    fontSize: 10,
    fontWeight: '700',
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
  },
  openBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
