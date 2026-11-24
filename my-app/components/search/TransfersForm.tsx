/**
 * components/search/TransfersForm.tsx
 *
 * Airport & Hotel Transfers search form:
 *   - Pickup & Dropoff autocomplete sheets
 *   - Transfer Date & Time sheets
 *   - Passengers counter sheet
 *   - Round-trip toggle with return date & return time
 *   - Navigation to /search-results?type=transfers
 */

import React, { useState } from 'react';
import { View, StyleSheet, Text, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import FieldButton from './FieldButton';
import SearchButton from './SearchButton';
import AutocompleteSheet, { SuggestionItem } from './AutocompleteSheet';
import DatePickerSheet from './DatePickerSheet';
import TimePickerSheet from './TimePickerSheet';
import TravelersSheet from './TravelersSheet';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { RADIUS } from '@/constants/theme';

export interface TransfersFormProps {
  initialPickup?: string;
  initialDropoff?: string;
  onStateChange?: (state: any) => void;
}

export default function TransfersForm({
  initialPickup = 'Dubai International Airport (DXB)',
  initialDropoff = 'Downtown Dubai Hotel / Resort',
  onStateChange,
}: TransfersFormProps) {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDark();

  const [pickup, setPickup] = useState(initialPickup);
  const [dropoff, setDropoff] = useState(initialDropoff);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00 AM');
  const [passengers, setPassengers] = useState(2);
  const [roundTrip, setRoundTrip] = useState(false);
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('06:00 PM');

  // Sheets
  const [activeLocMode, setActiveLocMode] = useState<'pickup' | 'dropoff' | null>(null);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [returnDateSheetOpen, setReturnDateSheetOpen] = useState(false);
  const [returnTimeSheetOpen, setReturnTimeSheetOpen] = useState(false);
  const [passengersSheetOpen, setPassengersSheetOpen] = useState(false);

  const [pickupError, setPickupError] = useState<string | null>(null);
  const [dropoffError, setDropoffError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLocSelect = (item: SuggestionItem) => {
    if (activeLocMode === 'pickup') {
      setPickup(item.name);
      setPickupError(null);
    } else if (activeLocMode === 'dropoff') {
      setDropoff(item.name);
      setDropoffError(null);
    }
  };

  const handleSearch = () => {
    let hasErr = false;
    if (!pickup.trim()) {
      setPickupError('Please select pickup location');
      hasErr = true;
    }
    if (!dropoff.trim()) {
      setDropoffError('Please select dropoff destination');
      hasErr = true;
    }

    if (hasErr) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      return;
    }

    setLoading(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    router.push({
      pathname: '/search-results',
      params: {
        type: 'transfers',
        service: 'transfers',
        pickup,
        dropoff,
        date: date || '',
        time,
        passengers: String(passengers),
        roundTrip: String(roundTrip),
        returnDate: roundTrip ? returnDate : '',
        returnTime: roundTrip ? returnTime : '',
        q: `${pickup} to ${dropoff}`,
      },
    } as any);

    setTimeout(() => setLoading(false), 800);
  };

  return (
    <View style={styles.formContainer}>
      <FieldButton
        label="PICK-UP AIRPORT OR HOTEL"
        value={pickup}
        placeholder="Enter pickup location..."
        icon="car-outline"
        onPress={() => setActiveLocMode('pickup')}
        error={pickupError || false}
      />

      <FieldButton
        label="DROP-OFF DESTINATION"
        value={dropoff}
        placeholder="Enter destination..."
        icon="navigate-outline"
        onPress={() => setActiveLocMode('dropoff')}
        error={dropoffError || false}
      />

      <View style={styles.row}>
        <FieldButton
          label="TRANSFER DATE"
          value={date || 'Select date'}
          icon="calendar-outline"
          rightIcon="calendar"
          onPress={() => setDateSheetOpen(true)}
          flex={1}
        />

        <FieldButton
          label="TIME"
          value={time}
          icon="time-outline"
          onPress={() => setTimeSheetOpen(true)}
          flex={1}
        />
      </View>

      <FieldButton
        label="PASSENGERS"
        value={`${passengers} Passenger${passengers > 1 ? 's' : ''}`}
        icon="people-outline"
        onPress={() => setPassengersSheetOpen(true)}
      />

      {/* Round Trip Toggle */}
      <View
        style={[
          styles.roundTripRow,
          {
            backgroundColor: isDark ? colors.surface : '#f8f9fa',
            borderColor: isDark ? colors.border : '#e2e8f0',
          },
        ]}
      >
        <Text style={[styles.roundTripLabel, { color: colors.heading }]}>
          Book Return Transfer (Round-Trip)
        </Text>
        <Switch
          value={roundTrip}
          onValueChange={(val) => {
            try {
              Haptics.selectionAsync();
            } catch {}
            setRoundTrip(val);
          }}
          trackColor={{ false: '#cbd5e1', true: colors.primary }}
          thumbColor="#ffffff"
        />
      </View>

      {/* Return Date & Time */}
      {roundTrip && (
        <View style={styles.row}>
          <FieldButton
            label="RETURN DATE"
            value={returnDate || 'Select return date'}
            icon="calendar-outline"
            rightIcon="calendar"
            onPress={() => setReturnDateSheetOpen(true)}
            flex={1}
          />

          <FieldButton
            label="RETURN TIME"
            value={returnTime}
            icon="time-outline"
            onPress={() => setReturnTimeSheetOpen(true)}
            flex={1}
          />
        </View>
      )}

      <SearchButton
        title="Search Airport Transfers"
        icon="car"
        onPress={handleSearch}
        loading={loading}
      />

      {/* Sheets */}
      <AutocompleteSheet
        visible={activeLocMode !== null}
        onClose={() => setActiveLocMode(null)}
        title={activeLocMode === 'pickup' ? 'Select Pick-up Location' : 'Select Drop-off Destination'}
        type="all"
        placeholder="Search airport, hotel, or station..."
        onSelect={handleLocSelect}
      />

      <DatePickerSheet
        visible={dateSheetOpen}
        onClose={() => setDateSheetOpen(false)}
        title="Select Transfer Date"
        startDate={date}
        onSelectDate={setDate}
      />

      <DatePickerSheet
        visible={returnDateSheetOpen}
        onClose={() => setReturnDateSheetOpen(false)}
        title="Select Return Date"
        startDate={returnDate}
        onSelectDate={setReturnDate}
      />

      <TimePickerSheet
        visible={timeSheetOpen}
        onClose={() => setTimeSheetOpen(false)}
        title="Select Pick-up Time"
        selectedTime={time}
        onSelectTime={setTime}
      />

      <TimePickerSheet
        visible={returnTimeSheetOpen}
        onClose={() => setReturnTimeSheetOpen(false)}
        title="Select Return Time"
        selectedTime={returnTime}
        onSelectTime={setReturnTime}
      />

      <TravelersSheet
        visible={passengersSheetOpen}
        onClose={() => setPassengersSheetOpen(false)}
        title="Transfer Passengers"
        adults={passengers}
        onConfirm={(a) => setPassengers(a)}
        maxTotal={15}
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
  roundTripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginVertical: 4,
  },
  roundTripLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
});
