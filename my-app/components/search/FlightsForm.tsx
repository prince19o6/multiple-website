/**
 * components/search/FlightsForm.tsx
 *
 * Flights search form:
 *   - One-Way / Round Trip / Multi City segmented control
 *   - Cabin Class sheet & Direct-only switch
 *   - From & To Airport with animated swap (cannot be the same!)
 *   - Depart and Return calendar date sheets (return >= depart)
 *   - Passengers sheet (Adults, Children, Infants)
 *   - Multi-city legs (add/remove up to 5 legs)
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import FieldButton from './FieldButton';
import SearchButton from './SearchButton';
import AutocompleteSheet, { SuggestionItem } from './AutocompleteSheet';
import DatePickerSheet from './DatePickerSheet';
import PassengersSheet from './PassengersSheet';
import OptionSheet, { SheetOption } from './OptionSheet';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { RADIUS, FONT_SIZE, SHADOW } from '@/constants/theme';

export type TripType = 'oneWay' | 'roundTrip' | 'multiCity';

export interface MultiCityLeg {
  id: string;
  from: string;
  to: string;
  date: string;
}

const CABIN_OPTIONS: SheetOption[] = [
  { label: 'Economy', value: 'Economy' },
  { label: 'Premium Economy', value: 'Premium Economy' },
  { label: 'Business Class', value: 'Business' },
  { label: 'First Class', value: 'First Class' },
];

export interface FlightsFormProps {
  initialTripType?: TripType;
  initialFrom?: string;
  initialTo?: string;
  onStateChange?: (state: any) => void;
}

export default function FlightsForm({
  initialTripType = 'oneWay',
  initialFrom = 'Surat (STV)',
  initialTo = 'Dubai (DXB)',
  onStateChange,
}: FlightsFormProps) {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDark();

  const [tripType, setTripType] = useState<TripType>(initialTripType);
  const [cabinClass, setCabinClass] = useState('Economy');
  const [directOnly, setDirectOnly] = useState(false);

  const [fromAirport, setFromAirport] = useState(initialFrom);
  const [toAirport, setToAirport] = useState(initialTo);

  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  // Multi-City Legs
  const [legs, setLegs] = useState<MultiCityLeg[]>([
    { id: '1', from: initialFrom, to: initialTo, date: '' },
    { id: '2', from: initialTo, to: 'Singapore (SIN)', date: '' },
  ]);

  // Sheets visibility
  const [activeAirportMode, setActiveAirportMode] = useState<'from' | 'to' | { legIndex: number; field: 'from' | 'to' } | null>(null);
  const [cabinSheetOpen, setCabinSheetOpen] = useState(false);
  const [passengersSheetOpen, setPassengersSheetOpen] = useState(false);
  const [departDateSheetOpen, setDepartDateSheetOpen] = useState(false);
  const [returnDateSheetOpen, setReturnDateSheetOpen] = useState(false);
  const [activeLegDateIndex, setActiveLegDateIndex] = useState<number | null>(null);

  // Errors & Loading
  const [airportError, setAirportError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Swap animation
  const swapRotateAnim = useRef(new Animated.Value(0)).current;

  const handleSwapAirports = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    Animated.sequence([
      Animated.timing(swapRotateAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(swapRotateAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start();

    const temp = fromAirport;
    setFromAirport(toAirport);
    setToAirport(temp);
    setAirportError(null);
  };

  const handleAirportSelect = (item: SuggestionItem) => {
    const codeCity = item.code ? `${item.city || item.name} (${item.code})` : item.name;

    if (activeAirportMode === 'from') {
      if (codeCity === toAirport) {
        setAirportError('Departure and arrival airports cannot be the same');
      } else {
        setAirportError(null);
      }
      setFromAirport(codeCity);
    } else if (activeAirportMode === 'to') {
      if (codeCity === fromAirport) {
        setAirportError('Departure and arrival airports cannot be the same');
      } else {
        setAirportError(null);
      }
      setToAirport(codeCity);
    } else if (activeAirportMode && typeof activeAirportMode === 'object') {
      const { legIndex, field } = activeAirportMode;
      setLegs((prev) => {
        const next = [...prev];
        next[legIndex] = { ...next[legIndex], [field]: codeCity };
        return next;
      });
    }
  };

  const addLeg = () => {
    if (legs.length >= 5) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const last = legs[legs.length - 1];
    setLegs([
      ...legs,
      {
        id: String(Date.now()),
        from: last.to || 'Dubai (DXB)',
        to: 'London (LHR)',
        date: '',
      },
    ]);
  };

  const removeLeg = (index: number) => {
    if (legs.length <= 2) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setLegs(legs.filter((_, i) => i !== index));
  };

  const totalPassengers = adults + children + infants;

  const handleSearch = () => {
    if (tripType !== 'multiCity' && fromAirport === toAirport) {
      setAirportError('Departure and destination cannot be identical');
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
        type: 'flights',
        service: 'flights',
        from: fromAirport,
        to: toAirport,
        tripType,
        cabin: cabinClass,
        direct: String(directOnly),
        departure: departureDate || '',
        returnDate: tripType === 'roundTrip' ? returnDate : '',
        passengers: String(totalPassengers),
        adults: String(adults),
        children: String(children),
        infants: String(infants),
        q: `${fromAirport} to ${toAirport}`,
      },
    } as any);

    setTimeout(() => setLoading(false), 800);
  };

  const spin = swapRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.formContainer}>
      {/* Segmented Control */}
      <View
        style={[
          styles.segmentedControl,
          {
            backgroundColor: isDark ? colors.surface : '#f1f5f9',
            borderColor: isDark ? colors.border : '#e2e8f0',
          },
        ]}
      >
        {(['oneWay', 'roundTrip', 'multiCity'] as TripType[]).map((t) => {
          const isSelected = tripType === t;
          const label =
            t === 'oneWay' ? 'One-Way' : t === 'roundTrip' ? 'Round Trip' : 'Multi City';
          return (
            <TouchableOpacity
              key={t}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                setTripType(t);
              }}
              activeOpacity={0.8}
              style={[
                styles.segmentItem,
                isSelected && [
                  styles.segmentItemActive,
                  { backgroundColor: isDark ? '#334155' : '#ffffff' },
                  SHADOW.sm,
                ],
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: isSelected ? colors.primary : colors.text },
                  isSelected && { fontWeight: '800' },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Cabin Class and Direct Flights Row */}
      <View style={styles.cabinDirectRow}>
        <TouchableOpacity
          onPress={() => setCabinSheetOpen(true)}
          style={[
            styles.cabinButton,
            {
              backgroundColor: isDark ? colors.surface : '#f8f9fa',
              borderColor: isDark ? colors.border : '#e2e8f0',
            },
          ]}
        >
          <Text style={[styles.cabinText, { color: colors.heading }]}>{cabinClass}</Text>
          <Ionicons name="chevron-down" size={14} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.directSwitchRow}>
          <Text style={[styles.directLabel, { color: colors.text }]}>Direct Flights</Text>
          <Switch
            value={directOnly}
            onValueChange={(val) => {
              try {
                Haptics.selectionAsync();
              } catch {}
              setDirectOnly(val);
            }}
            trackColor={{ false: '#cbd5e1', true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Standard One-Way / Round Trip Airports */}
      {tripType !== 'multiCity' ? (
        <View style={styles.airportsWrap}>
          <FieldButton
            label="WHERE FROM?"
            value={fromAirport}
            icon="airplane-outline"
            onPress={() => setActiveAirportMode('from')}
            error={airportError || false}
          />

          {/* Swap Button */}
          <View style={styles.swapWrap}>
            <TouchableOpacity
              onPress={handleSwapAirports}
              activeOpacity={0.8}
              style={[
                styles.swapButton,
                {
                  backgroundColor: isDark ? colors.surface : '#ffffff',
                  borderColor: isDark ? colors.border : '#cbd5e1',
                },
                SHADOW.sm,
              ]}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="swap-vertical" size={18} color={colors.primary} />
              </Animated.View>
            </TouchableOpacity>
          </View>

          <FieldButton
            label="WHERE TO?"
            value={toAirport}
            icon="airplane"
            onPress={() => setActiveAirportMode('to')}
            style={{ marginTop: -8 }}
            error={airportError || false}
          />
        </View>
      ) : (
        /* Multi-City Legs List */
        <View style={styles.multiCityWrap}>
          {legs.map((leg, index) => (
            <View
              key={leg.id}
              style={[
                styles.legCard,
                {
                  backgroundColor: isDark ? colors.surface : '#f8f9fa',
                  borderColor: isDark ? colors.border : '#e2e8f0',
                },
              ]}
            >
              <View style={styles.legHeader}>
                <Text style={styles.legBadge}>Flight {index + 1}</Text>
                {legs.length > 2 && (
                  <TouchableOpacity onPress={() => removeLeg(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.row}>
                <FieldButton
                  label="FROM"
                  value={leg.from}
                  icon="airplane-outline"
                  onPress={() => setActiveAirportMode({ legIndex: index, field: 'from' })}
                  flex={1}
                />
                <FieldButton
                  label="TO"
                  value={leg.to}
                  icon="airplane"
                  onPress={() => setActiveAirportMode({ legIndex: index, field: 'to' })}
                  flex={1}
                />
              </View>

              <FieldButton
                label="DATE"
                value={leg.date || 'Select date'}
                icon="calendar-outline"
                onPress={() => setActiveLegDateIndex(index)}
              />
            </View>
          ))}

          {legs.length < 5 && (
            <TouchableOpacity
              onPress={addLeg}
              style={[styles.addLegBtn, { borderColor: colors.primary }]}
            >
              <Ionicons name="add-circle-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.addLegText, { color: colors.primary }]}>+ Add Flight Leg (Max 5)</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Dates and Passengers Row (for non multi-city) */}
      {tripType !== 'multiCity' && (
        <View style={styles.row}>
          <FieldButton
            label={tripType === 'roundTrip' ? 'DEPARTURE' : 'DATE'}
            value={departureDate || 'Select'}
            placeholder="Select date"
            icon="calendar-outline"
            rightIcon="calendar"
            onPress={() => setDepartDateSheetOpen(true)}
            flex={1}
          />

          {tripType === 'roundTrip' && (
            <FieldButton
              label="RETURN"
              value={returnDate || 'Select'}
              placeholder="Select date"
              icon="calendar-outline"
              rightIcon="calendar"
              onPress={() => setReturnDateSheetOpen(true)}
              flex={1}
            />
          )}

          <FieldButton
            label="PASSENGERS"
            value={`${totalPassengers} Traveler${totalPassengers > 1 ? 's' : ''}`}
            icon="people-outline"
            onPress={() => setPassengersSheetOpen(true)}
            flex={1}
          />
        </View>
      )}

      {tripType === 'multiCity' && (
        <FieldButton
          label="PASSENGERS"
          value={`${totalPassengers} Traveler${totalPassengers > 1 ? 's' : ''}`}
          icon="people-outline"
          onPress={() => setPassengersSheetOpen(true)}
        />
      )}

      <SearchButton
        title="Search Flights"
        icon="airplane"
        onPress={handleSearch}
        loading={loading}
      />

      {/* Sheets */}
      <AutocompleteSheet
        visible={activeAirportMode !== null}
        onClose={() => setActiveAirportMode(null)}
        title="Select Airport"
        type="airport"
        placeholder="Type airport code, city or name..."
        onSelect={handleAirportSelect}
      />

      <OptionSheet
        visible={cabinSheetOpen}
        onClose={() => setCabinSheetOpen(false)}
        title="Select Cabin Class"
        options={CABIN_OPTIONS}
        selectedValue={cabinClass}
        onSelect={setCabinClass}
      />

      <PassengersSheet
        visible={passengersSheetOpen}
        onClose={() => setPassengersSheetOpen(false)}
        adults={adults}
        childrenCount={children}
        infants={infants}
        cabinClass={cabinClass}
        onConfirm={(a, c, i) => {
          setAdults(a);
          setChildren(c);
          setInfants(i);
        }}
      />

      <DatePickerSheet
        visible={departDateSheetOpen}
        onClose={() => setDepartDateSheetOpen(false)}
        title="Select Departure Date"
        startDate={departureDate}
        onSelectDate={(d) => {
          setDepartureDate(d);
          if (returnDate && returnDate < d) {
            setReturnDate('');
          }
        }}
      />

      <DatePickerSheet
        visible={returnDateSheetOpen}
        onClose={() => setReturnDateSheetOpen(false)}
        title="Select Return Date"
        startDate={returnDate || departureDate}
        onSelectDate={setReturnDate}
      />

      <DatePickerSheet
        visible={activeLegDateIndex !== null}
        onClose={() => setActiveLegDateIndex(null)}
        title={`Select Date for Flight ${(activeLegDateIndex ?? 0) + 1}`}
        onSelectDate={(d) => {
          if (activeLegDateIndex !== null) {
            setLegs((prev) => {
              const next = [...prev];
              next[activeLegDateIndex] = { ...next[activeLegDateIndex], date: d };
              return next;
            });
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    gap: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    padding: 3,
    borderWidth: 1,
    marginBottom: 6,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  segmentItemActive: {},
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cabinDirectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cabinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  cabinText: {
    fontSize: 12,
    fontWeight: '700',
  },
  directSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  directLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  airportsWrap: {
    position: 'relative',
  },
  swapWrap: {
    position: 'absolute',
    right: 18,
    top: 50,
    zIndex: 10,
  },
  swapButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  multiCityWrap: {
    gap: 8,
    marginBottom: 6,
  },
  legCard: {
    padding: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 4,
  },
  legHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  legBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  addLegBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1.2,
    borderStyle: 'dashed',
  },
  addLegText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
