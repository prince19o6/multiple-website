/**
 * components/search/PackagesForm.tsx
 *
 * Holiday Packages search form:
 *   - Multi-select destinations (chips)
 *   - Duration options: 3-4 Days, 5-7 Days, 8-10 Days, 10+ Days
 *   - Meal preference: Any, Veg, Pure Veg/Jain, Non-Veg
 *   - Validation & navigation to /search-results?type=packages
 */

import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import FieldButton from './FieldButton';
import SearchButton from './SearchButton';
import OptionSheet, { SheetOption } from './OptionSheet';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { RADIUS } from '@/constants/theme';

const PACKAGE_DESTINATIONS = [
  'Dubai & Abu Dhabi',
  'Bali, Indonesia',
  'Singapore & Malaysia',
  'Thailand (Bangkok & Phuket)',
  'Kashmir & Ladakh',
  'Kerala God\'s Own Country',
  'Himachal & Manali',
  'Rajasthan Royal Heritage',
  'Goa Beach Holiday',
  'Europe Highlights',
  'Vietnam & Cambodia',
  'Maldives Luxury Island',
];

const DURATION_OPTIONS: SheetOption[] = [
  { label: '3 - 4 Days (Weekend getaway)', value: '3-4' },
  { label: '5 - 7 Days (Popular choice)', value: '5-7', badge: 'Popular' },
  { label: '8 - 10 Days (Extended tour)', value: '8-10' },
  { label: '10+ Days (Grand holiday)', value: '10+' },
];

const MEAL_OPTIONS: SheetOption[] = [
  { label: 'Any Meal Plan', value: 'Any' },
  { label: 'Pure Veg / Jain Friendly', value: 'Pure Veg/Jain', badge: 'Specialty' },
  { label: 'Vegetarian Only', value: 'Veg' },
  { label: 'Non-Vegetarian / Multi-Cuisine', value: 'Non-Veg' },
];

export interface PackagesFormProps {
  initialDestinations?: string[];
  initialDuration?: string;
  initialMeal?: string;
  onStateChange?: (state: {
    destinations: string[];
    duration: string;
    meal: string;
  }) => void;
}

export default function PackagesForm({
  initialDestinations = ['Dubai & Abu Dhabi'],
  initialDuration = '5-7',
  initialMeal = 'Pure Veg/Jain',
  onStateChange,
}: PackagesFormProps) {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDark();

  const [destinations, setDestinations] = useState<string[]>(initialDestinations);
  const [duration, setDuration] = useState<string>(initialDuration);
  const [meal, setMeal] = useState<string>(initialMeal);

  const [destSheetOpen, setDestSheetOpen] = useState(false);
  const [durationSheetOpen, setDurationSheetOpen] = useState(false);
  const [mealSheetOpen, setMealSheetOpen] = useState(false);

  const [destError, setDestError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDestinationsConfirm = (selected: string[]) => {
    setDestinations(selected);
    if (selected.length > 0) setDestError(null);
    if (onStateChange) onStateChange({ destinations: selected, duration, meal });
  };

  const removeDestination = (d: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const next = destinations.filter((item) => item !== d);
    setDestinations(next);
    if (onStateChange) onStateChange({ destinations: next, duration, meal });
  };

  const handleDurationSelect = (val: string) => {
    setDuration(val);
    if (onStateChange) onStateChange({ destinations, duration: val, meal });
  };

  const handleMealSelect = (val: string) => {
    setMeal(val);
    if (onStateChange) onStateChange({ destinations, duration, meal: val });
  };

  const handleSearch = () => {
    if (destinations.length === 0) {
      setDestError('Please choose at least one destination');
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

    const primaryDest = destinations[0].split(',')[0].trim();
    router.push({
      pathname: '/search-results',
      params: {
        type: 'packages',
        service: 'packages',
        destination: primaryDest,
        q: primaryDest,
        destinations: destinations.join(','),
        duration,
        meal,
      },
    } as any);

    setTimeout(() => setLoading(false), 800);
  };

  const durationLabel = DURATION_OPTIONS.find((d) => d.value === duration)?.label || duration;

  return (
    <View style={styles.formContainer}>
      {/* Destinations Button */}
      <FieldButton
        label="DREAM HOLIDAY DESTINATIONS"
        value={
          destinations.length > 0
            ? destinations.join(', ')
            : 'Select destinations'
        }
        placeholder="Choose destinations..."
        icon="briefcase-outline"
        onPress={() => setDestSheetOpen(true)}
        error={destError || false}
      />

      {/* Selected Chips Bar */}
      {destinations.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsBar}>
          {destinations.map((d) => (
            <View
              key={d}
              style={[
                styles.chip,
                { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' },
              ]}
            >
              <Text style={[styles.chipText, { color: colors.primary }]}>{d}</Text>
              <TouchableOpacity onPress={() => removeDestination(d)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Duration and Meal Preference Row */}
      <View style={styles.row}>
        <FieldButton
          label="DURATION"
          value={duration ? `${duration} Days` : 'Duration'}
          placeholder="Select days"
          icon="time-outline"
          onPress={() => setDurationSheetOpen(true)}
          flex={1}
        />

        <FieldButton
          label="MEAL PREFERENCE"
          value={meal}
          placeholder="Select meal"
          icon="restaurant-outline"
          onPress={() => setMealSheetOpen(true)}
          flex={1}
        />
      </View>

      <SearchButton
        title="Search Holiday Packages"
        icon="briefcase"
        onPress={handleSearch}
        loading={loading}
      />

      {/* Sheets */}
      <OptionSheet
        visible={destSheetOpen}
        onClose={() => setDestSheetOpen(false)}
        title="Choose Destinations"
        subtitle="Select all destinations you wish to visit"
        options={PACKAGE_DESTINATIONS}
        selectedValues={destinations}
        isMultiSelect={true}
        searchable={true}
        searchPlaceholder="Filter destinations..."
        onSelectMultiple={handleDestinationsConfirm}
      />

      <OptionSheet
        visible={durationSheetOpen}
        onClose={() => setDurationSheetOpen(false)}
        title="Select Trip Duration"
        options={DURATION_OPTIONS}
        selectedValue={duration}
        onSelect={handleDurationSelect}
      />

      <OptionSheet
        visible={mealSheetOpen}
        onClose={() => setMealSheetOpen(false)}
        title="Meal Plan Preference"
        options={MEAL_OPTIONS}
        selectedValue={meal}
        onSelect={handleMealSelect}
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
  chipsBar: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
