import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { TransitRouteQuery } from '../types';

interface TransitRouteCardProps {
  route: TransitRouteQuery;
  onPressRoute?: (route: TransitRouteQuery) => void;
  style?: StyleProp<ViewStyle>;
}

export const TransitRouteCard: React.FC<TransitRouteCardProps> = ({
  route,
  onPressRoute,
  style,
}) => {
  const colors = useColors();

  return (
    <TouchableOpacity testID="btn-transitroutecard-22" accessibilityLabel="transitroutecard action"
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
      onPress={() => {
        if (onPressRoute) {
          Haptics.selectionAsync().catch(() => {});
          onPressRoute(route);
        }
      }}
      activeOpacity={0.75}
    >
      <View style={styles.topRow}>
        <View style={styles.endpoints}>
          <View style={styles.dotRow}>
            <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
            <Text style={[styles.stationName, { color: colors.heading }]} numberOfLines={1}>
              {route.originStation}
            </Text>
          </View>
          <View style={styles.pathLine} />
          <View style={styles.dotRow}>
            <View style={[styles.dot, { backgroundColor: '#dc2626' }]} />
            <Text style={[styles.stationName, { color: colors.heading }]} numberOfLines={1}>
              {route.destinationStation}
            </Text>
          </View>
        </View>

        <View style={styles.fareBadge}>
          <Text style={styles.fareText}>{route.estimatedFare}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={11} color="#059669" />
            <Text style={styles.timeText}>{route.travelTimeMins} mins</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.summaryText, { color: colors.mutedText }]} numberOfLines={2}>
        {route.routeSummary}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  endpoints: {
    flex: 1,
    marginRight: 10,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  stationName: {
    fontSize: 12,
    fontWeight: '700',
  },
  pathLine: {
    width: 1.5,
    height: 10,
    backgroundColor: '#cbd5e1',
    marginLeft: 2.5,
    marginVertical: 1,
  },
  fareBadge: {
    alignItems: 'flex-end',
  },
  fareText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  summaryText: {
    fontSize: 11,
    lineHeight: 15,
  },
});
