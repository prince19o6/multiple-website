/**
 * components/search/VisasForm.tsx
 *
 * Visa requirements search form:
 *   - Citizen of country picker sheet (searchable)
 *   - Destination country picker sheet (searchable, cannot be equal to citizen)
 *   - Validation & navigation to /search-results?type=visas or /visa-hub
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import FieldButton from './FieldButton';
import SearchButton from './SearchButton';
import OptionSheet from './OptionSheet';

const COUNTRIES = [
  'India',
  'United Arab Emirates (UAE)',
  'Thailand',
  'Singapore',
  'Malaysia',
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'Indonesia (Bali)',
  'Vietnam',
  'Schengen (Europe)',
  'Japan',
  'Saudi Arabia',
  'Qatar',
  'Oman',
  'Egypt',
  'Turkey',
  'Sri Lanka',
  'Georgia',
  'Azerbaijan',
  'Germany',
  'France',
];

export interface VisasFormProps {
  initialCitizen?: string;
  initialDestination?: string;
  onStateChange?: (state: any) => void;
}

export default function VisasForm({
  initialCitizen = 'India',
  initialDestination = 'United Arab Emirates (UAE)',
  onStateChange,
}: VisasFormProps) {
  const router = useRouter();

  const [citizen, setCitizen] = useState(initialCitizen);
  const [destination, setDestination] = useState(initialDestination);

  const [citizenSheetOpen, setCitizenSheetOpen] = useState(false);
  const [destSheetOpen, setDestSheetOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCitizenSelect = (val: string) => {
    setCitizen(val);
    if (val === destination) {
      setError('Citizen country and destination country cannot be identical');
    } else {
      setError(null);
    }
  };

  const handleDestinationSelect = (val: string) => {
    setDestination(val);
    if (val === citizen) {
      setError('Destination country cannot be the same as your citizenship');
    } else {
      setError(null);
    }
  };

  const handleSearch = () => {
    if (citizen === destination) {
      setError('Citizen and destination countries cannot be the same');
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
        type: 'visas',
        service: 'visas',
        nationality: citizen,
        destination,
        q: destination,
      },
    } as any);

    setTimeout(() => setLoading(false), 800);
  };

  return (
    <View style={styles.formContainer}>
      <FieldButton
        label="CITIZEN OF"
        value={citizen}
        placeholder="Select your passport nationality..."
        icon="globe-outline"
        onPress={() => setCitizenSheetOpen(true)}
        error={error || false}
      />

      <FieldButton
        label="DESTINATION COUNTRY"
        value={destination}
        placeholder="Select destination country..."
        icon="card-outline"
        onPress={() => setDestSheetOpen(true)}
        error={error || false}
      />

      <SearchButton
        title="Check Visa Requirements"
        icon="card"
        onPress={handleSearch}
        loading={loading}
      />

      {/* Sheets */}
      <OptionSheet
        visible={citizenSheetOpen}
        onClose={() => setCitizenSheetOpen(false)}
        title="Citizen Of (Passport)"
        options={COUNTRIES}
        selectedValue={citizen}
        searchable={true}
        searchPlaceholder="Type your country..."
        onSelect={handleCitizenSelect}
      />

      <OptionSheet
        visible={destSheetOpen}
        onClose={() => setDestSheetOpen(false)}
        title="Destination Country"
        options={COUNTRIES}
        selectedValue={destination}
        searchable={true}
        searchPlaceholder="Type destination country..."
        onSelect={handleDestinationSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    gap: 4,
  },
});
