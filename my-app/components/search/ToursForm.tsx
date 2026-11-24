/**
 * components/search/ToursForm.tsx
 *
 * Tours & Sightseeing module search form with:
 *   - Destination / Attraction autocomplete sheet
 *   - Tour single date calendar picker sheet
 *   - Travelers count sheet (Adults & Children)
 *   - Validation & navigation to /search-results?type=tours
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import FieldButton from './FieldButton';
import SearchButton from './SearchButton';
import AutocompleteSheet, { SuggestionItem } from './AutocompleteSheet';
import DatePickerSheet from './DatePickerSheet';
import TravelersSheet from './TravelersSheet';

export interface ToursFormProps {
  initialDestination?: string;
  initialDate?: string;
  initialAdults?: number;
  initialChildren?: number;
  onStateChange?: (state: {
    destination: string;
    date: string;
    adults: number;
    children: number;
  }) => void;
}

export default function ToursForm({
  initialDestination = 'Dubai, Desert Safari, Burj Khalifa',
  initialDate = '',
  initialAdults = 2,
  initialChildren = 0,
  onStateChange,
}: ToursFormProps) {
  const router = useRouter();

  const [destination, setDestination] = useState(initialDestination);
  const [date, setDate] = useState(initialDate);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);

  const [destSheetOpen, setDestSheetOpen] = useState(false);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [travelersSheetOpen, setTravelersSheetOpen] = useState(false);

  const [destError, setDestError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const total = adults + children;

  const handleDestinationSelect = (item: SuggestionItem) => {
    setDestination(item.name);
    setDestError(null);
    notifyChange(item.name, date, adults, children);
  };

  const handleDateSelect = (selected: string) => {
    setDate(selected);
    notifyChange(destination, selected, adults, children);
  };

  const handleTravelersConfirm = (a: number, c: number) => {
    setAdults(a);
    setChildren(c);
    notifyChange(destination, date, a, c);
  };

  const notifyChange = (dest: string, d: string, a: number, c: number) => {
    if (onStateChange) {
      onStateChange({ destination: dest, date: d, adults: a, children: c });
    }
  };

  const handleSearch = () => {
    if (!destination.trim()) {
      setDestError('Please select a destination or activity');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      setDestSheetOpen(true);
      return;
    }

    setLoading(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const targetQuery = destination.split(',')[0].trim();
    router.push({
      pathname: '/search-results',
      params: {
        type: 'tours',
        service: 'tours',
        destination: targetQuery,
        q: targetQuery,
        date: date || '',
        travelers: String(total),
        adults: String(adults),
        children: String(children),
      },
    } as any);

    setTimeout(() => setLoading(false), 800);
  };

  return (
    <View style={styles.formContainer}>
      <FieldButton
        label="DESTINATION OR SIGHTSEEING"
        value={destination}
        placeholder="City, landmark, or attraction name"
        icon="compass-outline"
        onPress={() => setDestSheetOpen(true)}
        error={destError || false}
      />

      <View style={styles.row}>
        <FieldButton
          label="TOUR DATE"
          value={date || 'Select date'}
          placeholder="Select date"
          icon="calendar-outline"
          rightIcon="calendar"
          onPress={() => setDateSheetOpen(true)}
          flex={1}
        />

        <FieldButton
          label="TRAVELERS"
          value={`${total} Traveler${total > 1 ? 's' : ''}`}
          icon="people-outline"
          onPress={() => setTravelersSheetOpen(true)}
          flex={1}
        />
      </View>

      <SearchButton
        title="Search Handcrafted Tours"
        icon="compass"
        onPress={handleSearch}
        loading={loading}
      />

      {/* Sheets */}
      <AutocompleteSheet
        visible={destSheetOpen}
        onClose={() => setDestSheetOpen(false)}
        title="Select Destination or Sightseeing"
        type="tour"
        onSelect={handleDestinationSelect}
      />

      <DatePickerSheet
        visible={dateSheetOpen}
        onClose={() => setDateSheetOpen(false)}
        title="Select Tour Date"
        isRange={false}
        startDate={date}
        onSelectDate={handleDateSelect}
      />

      <TravelersSheet
        visible={travelersSheetOpen}
        onClose={() => setTravelersSheetOpen(false)}
        title="Tour Travelers"
        adults={adults}
        childrenCount={children}
        onConfirm={handleTravelersConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
});
