import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { FlightDetails } from '../types';

interface FlightStatusCardProps {
  flight: FlightDetails;
  style?: object;
}

export const FlightStatusCard: React.FC<FlightStatusCardProps> = ({
  flight,
  style,
}) => {
  const colors = useColors();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Time':
        return '#10b981';
      case 'Boarding':
        return '#f59e0b';
      case 'In Flight':
        return '#0284c7';
      case 'Landed':
        return '#059669';
      case 'Delayed':
        return '#ef4444';
      default:
        return colors.primary;
    }
  };

  const statusColor = getStatusColor(flight.status);

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
      {/* Top Header: Airline & Status Badge */}
      <View style={styles.topRow}>
        <View style={styles.airlinerWrap}>
          <Ionicons name="airplane" size={16} color={colors.primary} />
          <Text style={[styles.airlineText, { color: colors.heading }]}>
            {flight.airline} • {flight.flightNumber}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${statusColor}18`, borderColor: statusColor },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {flight.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Origin -> Route Graphic -> Destination */}
      <View style={styles.routeRow}>
        {/* Origin */}
        <View style={styles.cityBlock}>
          <Text style={[styles.airportCode, { color: colors.heading }]}>
            {flight.originAirportCode}
          </Text>
          <Text
            style={[styles.cityName, { color: colors.mutedText }]}
            numberOfLines={1}
          >
            {flight.originCity}
          </Text>
          <Text style={[styles.timeText, { color: colors.primary }]}>
            {flight.scheduledDeparture}
          </Text>
        </View>

        {/* Route Line Graphic */}
        <View style={styles.graphicBlock}>
          <Text style={[styles.durationText, { color: colors.mutedText }]}>
            {flight.duration}
          </Text>
          <View style={styles.lineWrap}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <View style={[styles.planeCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="airplane" size={12} color="#ffffff" />
            </View>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
          </View>
          <Text style={[styles.directFlightText, { color: colors.mutedText }]}>
            Non-stop
          </Text>
        </View>

        {/* Destination */}
        <View style={[styles.cityBlock, { alignItems: 'flex-end' }]}>
          <Text style={[styles.airportCode, { color: colors.heading }]}>
            {flight.destAirportCode}
          </Text>
          <Text
            style={[styles.cityName, { color: colors.mutedText }]}
            numberOfLines={1}
          >
            {flight.destCity}
          </Text>
          <Text style={[styles.timeText, { color: colors.primary }]}>
            {flight.scheduledArrival}
          </Text>
        </View>
      </View>

      {/* Arrival Details Bar (Terminal, Gate, Baggage Carousel) */}
      <View
        style={[
          styles.detailsBar,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.mutedText }]}>
            TERMINAL
          </Text>
          <Text style={[styles.detailValue, { color: colors.heading }]}>
            {flight.terminal}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.mutedText }]}>
            GATE
          </Text>
          <Text style={[styles.detailValue, { color: colors.heading }]}>
            {flight.gate}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.mutedText }]}>
            BAGGAGE
          </Text>
          <Text style={[styles.detailValue, { color: colors.primary }]}>
            {flight.baggageCarousel}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  airlinerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  airlineText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cityBlock: {
    flex: 1,
  },
  airportCode: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cityName: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  graphicBlock: {
    flex: 1.2,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  durationText: {
    fontSize: 11,
    marginBottom: 4,
  },
  lineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1.5,
  },
  planeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directFlightText: {
    fontSize: 10,
    marginTop: 4,
  },
  detailsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    height: 24,
  },
});
