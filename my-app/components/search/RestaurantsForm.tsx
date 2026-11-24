/**
 * components/search/RestaurantsForm.tsx
 *
 * Dining and Restaurant search form:
 *   - City or Cuisine autocomplete sheet
 *   - Diet chips (All, Pure Veg, Jain, Vegetarian, Halal)
 *   - Reservation Date & Time slot sheets
 *   - Table for Guests counter sheet
 *   - Navigation to /search-results?type=restaurants
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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

const DIET_CHIPS = ['All', 'Pure Veg', 'Jain', 'Vegetarian', 'Halal'];

export interface RestaurantsFormProps {
  initialCity?: string;
  initialDiet?: string;
  onStateChange?: (state: any) => void;
}

export default function RestaurantsForm({
  initialCity = 'Dubai, UAE',
  initialDiet = 'Pure Veg',
  onStateChange,
}: RestaurantsFormProps) {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDark();

  const [cityOrCuisine, setCityOrCuisine] = useState(initialCity);
  const [diet, setDiet] = useState(initialDiet);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('07:30 PM');
  const [guests, setGuests] = useState(2);

  const [locSheetOpen, setLocSheetOpen] = useState(false);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [guestsSheetOpen, setGuestsSheetOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLocSelect = (item: SuggestionItem) => {
    setCityOrCuisine(item.name);
    setError(null);
  };

  const handleSearch = () => {
    if (!cityOrCuisine.trim()) {
      setError('Please select a city or cuisine');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      setLocSheetOpen(true);
      return;
    }

    setLoading(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const cityName = cityOrCuisine.split(',')[0].trim();
    router.push({
      pathname: '/search-results',
      params: {
        type: 'restaurants',
        service: 'restaurants',
        city: cityName,
        cuisine: cityOrCuisine,
        diet,
        date: date || '',
        time,
        guests: String(guests),
        q: cityName,
      },
    } as any);

    setTimeout(() => setLoading(false), 800);
  };

  return (
    <View style={styles.formContainer}>
      {/* Diet Filter Chips */}
      <View style={styles.dietRowWrap}>
        <Text style={styles.dietLabel}>Diet:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dietScroll}>
          {DIET_CHIPS.map((chip) => {
            const isSelected = diet === chip;
            return (
              <TouchableOpacity
                key={chip}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  setDiet(chip);
                }}
                activeOpacity={0.7}
                style={[
                  styles.dietChip,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : isDark
                      ? colors.surface
                      : '#f1f5f9',
                    borderColor: isSelected
                      ? colors.primary
                      : isDark
                      ? colors.border
                      : '#e2e8f0',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dietChipText,
                    {
                      color: isSelected ? '#ffffff' : colors.text,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {chip === 'Pure Veg' ? '🌱 Pure Veg' : chip === 'Jain' ? '☸️ Jain' : chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FieldButton
        label="CITY OR CUISINE"
        value={cityOrCuisine}
        placeholder="Enter city or cuisine (e.g. Dubai, Italian)..."
        icon="restaurant-outline"
        onPress={() => setLocSheetOpen(true)}
        error={error || false}
      />

      <View style={styles.row}>
        <FieldButton
          label="DATE"
          value={date || 'Select date'}
          icon="calendar-outline"
          rightIcon="calendar"
          onPress={() => setDateSheetOpen(true)}
          flex={1}
        />

        <FieldButton
          label="TIME SLOT"
          value={time}
          icon="time-outline"
          onPress={() => setTimeSheetOpen(true)}
          flex={1}
        />
      </View>

      <FieldButton
        label="TABLE FOR"
        value={`${guests} Guest${guests > 1 ? 's' : ''}`}
        icon="people-outline"
        onPress={() => setGuestsSheetOpen(true)}
      />

      <SearchButton
        title="Find Dining Tables"
        icon="restaurant"
        onPress={handleSearch}
        loading={loading}
      />

      {/* Sheets */}
      <AutocompleteSheet
        visible={locSheetOpen}
        onClose={() => setLocSheetOpen(false)}
        title="Select City or Cuisine"
        type="city"
        placeholder="Search dining city..."
        onSelect={handleLocSelect}
      />

      <DatePickerSheet
        visible={dateSheetOpen}
        onClose={() => setDateSheetOpen(false)}
        title="Select Reservation Date"
        startDate={date}
        onSelectDate={setDate}
      />

      <TimePickerSheet
        visible={timeSheetOpen}
        onClose={() => setTimeSheetOpen(false)}
        title="Select Dining Slot"
        selectedTime={time}
        mode="slots"
        onSelectTime={setTime}
      />

      <TravelersSheet
        visible={guestsSheetOpen}
        onClose={() => setGuestsSheetOpen(false)}
        title="Table Guests"
        adults={guests}
        onConfirm={(a) => setGuests(a)}
        maxTotal={20}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    gap: 4,
  },
  dietRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dietLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginRight: 6,
  },
  dietScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  dietChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  dietChipText: {
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
});
