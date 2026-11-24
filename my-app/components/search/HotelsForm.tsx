/**
 * components/search/HotelsForm.tsx
 *
 * Hotels module search form with:
 *   - Destination / Hotel autocomplete sheet
 *   - Check-in & Check-out calendar date range sheet
 *   - Rooms, Guests & Pure Veg toggle sheet
 *   - Validation & navigation to /search-results?type=hotels
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import FieldButton from './FieldButton';
import SearchButton from './SearchButton';
import AutocompleteSheet, { SuggestionItem } from './AutocompleteSheet';
import DatePickerSheet from './DatePickerSheet';
import GuestsRoomsSheet, { OccupancyState } from './GuestsRoomsSheet';

export interface HotelsFormProps {
  initialDestination?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialOccupancy?: OccupancyState;
  onStateChange?: (state: {
    destination: string;
    checkIn: string;
    checkOut: string;
    occupancy: OccupancyState;
  }) => void;
}

export default function HotelsForm({
  initialDestination = 'Dubai, United Arab Emirates',
  initialCheckIn = '',
  initialCheckOut = '',
  initialOccupancy = {
    rooms: 1,
    adults: 2,
    children: 0,
    childAges: [],
    pureVeg: false,
  },
  onStateChange,
}: HotelsFormProps) {
  const router = useRouter();

  const [destination, setDestination] = useState(initialDestination);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [occupancy, setOccupancy] = useState<OccupancyState>(initialOccupancy);

  // Sheets visibility
  const [destSheetOpen, setDestSheetOpen] = useState(false);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [guestsSheetOpen, setGuestsSheetOpen] = useState(false);

  // Validation errors
  const [destError, setDestError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalGuests = occupancy.adults + occupancy.children;
  const occupancySummary = `${occupancy.rooms} Room${occupancy.rooms > 1 ? 's' : ''}, ${totalGuests} Guest${totalGuests > 1 ? 's' : ''}${occupancy.pureVeg ? ' (Pure Veg)' : ''}`;

  const handleDestinationSelect = (item: SuggestionItem) => {
    setDestination(item.name);
    setDestError(null);
    notifyChange(item.name, checkIn, checkOut, occupancy);
  };

  const handleDateRangeSelect = (start: string, end: string) => {
    setCheckIn(start);
    setCheckOut(end);
    notifyChange(destination, start, end, occupancy);
  };

  const handleOccupancyConfirm = (occ: OccupancyState) => {
    setOccupancy(occ);
    notifyChange(destination, checkIn, checkOut, occ);
  };

  const notifyChange = (dest: string, cin: string, cout: string, occ: OccupancyState) => {
    if (onStateChange) {
      onStateChange({ destination: dest, checkIn: cin, checkOut: cout, occupancy: occ });
    }
  };

  const handleSearch = () => {
    if (!destination.trim()) {
      setDestError('Please select a destination or hotel');
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

    const cityName = destination.split(',')[0].trim();
    router.push({
      pathname: '/search-results',
      params: {
        type: 'hotels',
        service: 'hotels',
        destination: cityName,
        q: cityName,
        checkIn: checkIn || '',
        checkOut: checkOut || '',
        rooms: String(occupancy.rooms),
        adults: String(occupancy.adults),
        children: String(occupancy.children),
        veg: occupancy.pureVeg ? 'true' : 'false',
      },
    } as any);

    setTimeout(() => setLoading(false), 800);
  };

  return (
    <View style={styles.formContainer}>
      {/* Destination Field */}
      <FieldButton
        label="DESTINATION / HOTEL NAME"
        value={destination}
        placeholder="Where are you staying?"
        icon="location-outline"
        onPress={() => setDestSheetOpen(true)}
        error={destError || false}
      />

      {/* Dates Grid */}
      <View style={styles.row}>
        <FieldButton
          label="CHECK-IN & CHECK-OUT"
          value={
            checkIn && checkOut
              ? `${checkIn} — ${checkOut}`
              : checkIn
              ? `From ${checkIn}`
              : 'Select dates'
          }
          placeholder="Select dates"
          icon="calendar-outline"
          rightIcon="calendar"
          onPress={() => setDateSheetOpen(true)}
          flex={1}
        />
      </View>

      {/* Rooms & Guests */}
      <FieldButton
        label="ROOMS & GUESTS"
        value={occupancySummary}
        icon="bed-outline"
        badge={occupancy.pureVeg ? 'Pure Veg' : undefined}
        onPress={() => setGuestsSheetOpen(true)}
      />

      {/* Submit Button */}
      <SearchButton
        title="Search Hotels"
        icon="bed"
        onPress={handleSearch}
        loading={loading}
      />

      {/* Sheets */}
      <AutocompleteSheet
        visible={destSheetOpen}
        onClose={() => setDestSheetOpen(false)}
        title="Select Destination or Hotel"
        type="hotel"
        onSelect={handleDestinationSelect}
      />

      <DatePickerSheet
        visible={dateSheetOpen}
        onClose={() => setDateSheetOpen(false)}
        title="Select Hotel Dates"
        isRange={true}
        startDate={checkIn}
        endDate={checkOut}
        onSelectRange={handleDateRangeSelect}
      />

      <GuestsRoomsSheet
        visible={guestsSheetOpen}
        onClose={() => setGuestsSheetOpen(false)}
        initialOccupancy={occupancy}
        onConfirm={handleOccupancyConfirm}
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
