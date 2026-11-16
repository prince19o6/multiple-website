import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import type { ForexKioskItem } from '@/types';

interface ForexKioskCardProps {
  kiosk: ForexKioskItem;
}

export const ForexKioskCard: React.FC<ForexKioskCardProps> = ({ kiosk }) => {
  const colors = useColors();

  const handleOpenMaps = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      kiosk.googleMapsQuery || `${kiosk.brandName} ${kiosk.branchName} ${kiosk.city}`
    )}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Map Error', 'Cannot open maps navigation link.');
      }
    } catch {
      Alert.alert('Map Error', 'Unable to open maps application.');
    }
  };

  const isOrange = kiosk.brandName.toLowerCase().includes('orange');
  const isGreen = kiosk.brandName.toLowerCase().includes('green');

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Brand Header */}
      <View style={styles.topRow}>
        <View style={styles.brandTitleRow}>
          <View
            style={[
              styles.brandDot,
              {
                backgroundColor: isOrange ? '#f97316' : isGreen ? '#10b981' : '#2563eb',
              },
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.brandName, { color: colors.heading }]}>{kiosk.brandName}</Text>
            <Text style={[styles.branchName, { color: colors.mutedText }]}>{kiosk.branchName}</Text>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#eab308" />
          <Text style={styles.ratingText}>{kiosk.rating.toFixed(1)}</Text>
        </View>
      </View>

      {/* Highlight badge if present */}
      {kiosk.highlightBadge ? (
        <View
          style={[
            styles.highlightPill,
            kiosk.isAirportBasementKiosk ? styles.airportPill : styles.regularPill,
          ]}
        >
          <Ionicons
            name={kiosk.isAirportBasementKiosk ? 'airplane' : 'sparkles'}
            size={12}
            color={kiosk.isAirportBasementKiosk ? '#b45309' : '#047857'}
          />
          <Text
            style={[
              styles.highlightText,
              { color: kiosk.isAirportBasementKiosk ? '#92400e' : '#047857' },
            ]}
          >
            {kiosk.highlightBadge}
          </Text>
        </View>
      ) : null}

      {/* Address */}
      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={14} color={colors.mutedText} style={{ marginTop: 2 }} />
        <Text style={[styles.addressText, { color: colors.mutedText }]} numberOfLines={2}>
          {kiosk.address}
        </Text>
      </View>

      {/* Operating Hours */}
      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={14} color={colors.mutedText} />
        <Text style={[styles.hoursText, { color: colors.mutedText }]}>{kiosk.operatingHours}</Text>
      </View>

      {/* Action: Open in Maps */}
      <TouchableOpacity testID="btn-navigate-outline"
        style={[styles.mapButton, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={handleOpenMaps}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Get directions to ${kiosk.brandName} ${kiosk.branchName}`}
      >
        <Ionicons name="navigate-outline" size={14} color={colors.primary} />
        <Text style={[styles.mapButtonText, { color: colors.primary }]}>
          Directions in Google Maps
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '700',
  },
  branchName: {
    fontSize: 12,
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fefce8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fef08a',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854d0e',
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 5,
    marginBottom: 8,
  },
  airportPill: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  regularPill: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  highlightText: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  addressText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  hoursText: {
    fontSize: 12,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginTop: 6,
    minHeight: 44,
  },
  mapButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
