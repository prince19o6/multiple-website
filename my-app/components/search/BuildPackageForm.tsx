/**
 * components/search/BuildPackageForm.tsx
 *
 * Custom Itinerary Builder module:
 *   - Explanatory banner
 *   - Starting city & destination fields
 *   - Duration picker
 *   - Direct start button routing into the itinerary builder flow
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import FieldButton from './FieldButton';
import SearchButton from './SearchButton';
import AutocompleteSheet, { SuggestionItem } from './AutocompleteSheet';
import OptionSheet, { SheetOption } from './OptionSheet';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { RADIUS } from '@/constants/theme';

const DURATION_OPTIONS: SheetOption[] = [
  { label: '3 - 5 Days', value: '3-5' },
  { label: '5 - 7 Days', value: '5-7' },
  { label: '7 - 10 Days', value: '7-10' },
  { label: '10 - 14 Days', value: '10-14' },
];

export interface BuildPackageFormProps {
  onOpenEnquiry?: (service: string) => void;
}

export default function BuildPackageForm({ onOpenEnquiry }: BuildPackageFormProps) {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDark();

  const [fromCity, setFromCity] = useState('Mumbai');
  const [destination, setDestination] = useState('Dubai');
  const [duration, setDuration] = useState('5-7');

  const [activeLocField, setActiveLocField] = useState<'from' | 'dest' | null>(null);
  const [durationSheetOpen, setDurationSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStartBuilder = () => {
    setLoading(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    if (onOpenEnquiry) {
      onOpenEnquiry(`Custom Tour Builder: ${fromCity} to ${destination} (${duration} Days)`);
    } else {
      router.push({
        pathname: '/search-results',
        params: {
          type: 'packages',
          service: 'packages',
          destination,
          from: fromCity,
          duration,
          custom: 'true',
          q: `${destination} Custom Holiday`,
        },
      } as any);
    }

    setTimeout(() => setLoading(false), 600);
  };

  return (
    <View style={styles.formContainer}>
      {/* Informative Banner */}
      <View
        style={[
          styles.infoBanner,
          {
            backgroundColor: isDark ? colors.surface : '#eff6ff',
            borderColor: isDark ? colors.border : '#bfdbfe',
          },
        ]}
      >
        <Text style={[styles.infoTitle, { color: colors.primary }]}>
          Custom Tour Itinerary Builder
        </Text>
        <Text style={styles.infoText}>
          Design your multi-city package with custom flights, handpicked luxury stays, and guided activities.
        </Text>
      </View>

      <View style={styles.row}>
        <FieldButton
          label="STARTING CITY"
          value={fromCity}
          icon="location-outline"
          onPress={() => setActiveLocField('from')}
          flex={1}
        />

        <FieldButton
          label="DESTINATION"
          value={destination}
          icon="airplane-outline"
          onPress={() => setActiveLocField('dest')}
          flex={1}
        />
      </View>

      <FieldButton
        label="ESTIMATED DURATION"
        value={`${duration} Days`}
        icon="time-outline"
        onPress={() => setDurationSheetOpen(true)}
      />

      <SearchButton
        title="Start Custom Package Builder"
        icon="construct-outline"
        onPress={handleStartBuilder}
        loading={loading}
      />

      {/* Sheets */}
      <AutocompleteSheet
        visible={activeLocField !== null}
        onClose={() => setActiveLocField(null)}
        title={activeLocField === 'from' ? 'Select Starting City' : 'Select Primary Destination'}
        type="city"
        onSelect={(item: SuggestionItem) => {
          if (activeLocField === 'from') setFromCity(item.name);
          else setDestination(item.name);
        }}
      />

      <OptionSheet
        visible={durationSheetOpen}
        onClose={() => setDurationSheetOpen(false)}
        title="Estimated Trip Duration"
        options={DURATION_OPTIONS}
        selectedValue={duration}
        onSelect={setDuration}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    gap: 4,
  },
  infoBanner: {
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
});
