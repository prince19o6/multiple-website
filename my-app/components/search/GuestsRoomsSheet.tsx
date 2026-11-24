/**
 * components/search/GuestsRoomsSheet.tsx
 *
 * Bottom sheet for Hotel Rooms & Guests selection.
 * Supports:
 *   - Rooms, Adults, Children steppers
 *   - Age pickers for each child
 *   - Pure Veg & Jain friendly dining options toggle
 *   - Live summary display
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import SelectionSheet from './SelectionSheet';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { RADIUS, FONT_SIZE } from '@/constants/theme';

export interface OccupancyState {
  rooms: number;
  adults: number;
  children: number;
  childAges: number[];
  pureVeg?: boolean;
}

export interface GuestsRoomsSheetProps {
  visible: boolean;
  onClose: () => void;
  initialOccupancy: OccupancyState;
  onConfirm: (occupancy: OccupancyState) => void;
}

export default function GuestsRoomsSheet({
  visible,
  onClose,
  initialOccupancy,
  onConfirm,
}: GuestsRoomsSheetProps) {
  const colors = useColors();
  const isDark = useIsDark();

  const [state, setState] = useState<OccupancyState>({
    rooms: initialOccupancy.rooms || 1,
    adults: initialOccupancy.adults || 2,
    children: initialOccupancy.children || 0,
    childAges: initialOccupancy.childAges || [],
    pureVeg: Boolean(initialOccupancy.pureVeg),
  });

  const totalGuests = state.adults + state.children;

  const handleStep = (field: 'rooms' | 'adults' | 'children', delta: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    setState((prev) => {
      if (field === 'rooms') {
        const nextRooms = Math.max(1, Math.min(8, prev.rooms + delta));
        const nextAdults = Math.max(nextRooms, prev.adults);
        return { ...prev, rooms: nextRooms, adults: nextAdults };
      }
      if (field === 'adults') {
        const nextAdults = Math.max(prev.rooms, Math.min(20, prev.adults + delta));
        return { ...prev, adults: nextAdults };
      }
      if (field === 'children') {
        const nextChildren = Math.max(0, Math.min(10, prev.children + delta));
        const nextAges = [...prev.childAges];
        if (nextChildren > prev.childAges.length) {
          for (let i = prev.childAges.length; i < nextChildren; i++) {
            nextAges.push(7);
          }
        } else {
          nextAges.splice(nextChildren);
        }
        return { ...prev, children: nextChildren, childAges: nextAges };
      }
      return prev;
    });
  };

  const handleChildAgeChange = (childIndex: number, delta: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setState((prev) => {
      const nextAges = [...prev.childAges];
      const cur = nextAges[childIndex] ?? 7;
      nextAges[childIndex] = Math.max(0, Math.min(17, cur + delta));
      return { ...prev, childAges: nextAges };
    });
  };

  const handleDone = () => {
    onConfirm(state);
    onClose();
  };

  const renderStepper = (
    label: string,
    subtitle: string,
    value: number,
    field: 'rooms' | 'adults' | 'children',
    min: number,
    max: number
  ) => {
    const canDec = value > min;
    const canInc = value < max;

    return (
      <View style={styles.stepperRow}>
        <View style={styles.stepperLabels}>
          <Text style={[styles.stepperTitle, { color: colors.heading }]}>{label}</Text>
          <Text style={styles.stepperSubtitle}>{subtitle}</Text>
        </View>

        <View style={styles.stepperControls}>
          <TouchableOpacity
            onPress={() => canDec && handleStep(field, -1)}
            disabled={!canDec}
            style={[
              styles.stepBtn,
              {
                borderColor: canDec ? colors.border : '#cbd5e1',
                backgroundColor: canDec ? (isDark ? colors.surface : '#ffffff') : '#f1f5f9',
              },
            ]}
          >
            <Text
              style={[
                styles.stepBtnText,
                { color: canDec ? colors.heading : '#94a3b8' },
              ]}
            >
              -
            </Text>
          </TouchableOpacity>

          <Text style={[styles.stepValue, { color: colors.heading }]}>{value}</Text>

          <TouchableOpacity
            onPress={() => canInc && handleStep(field, 1)}
            disabled={!canInc}
            style={[
              styles.stepBtn,
              {
                borderColor: canInc ? colors.border : '#cbd5e1',
                backgroundColor: canInc ? (isDark ? colors.surface : '#ffffff') : '#f1f5f9',
              },
            ]}
          >
            <Text
              style={[
                styles.stepBtnText,
                { color: canInc ? colors.heading : '#94a3b8' },
              ]}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SelectionSheet
      visible={visible}
      onClose={onClose}
      title="Guests & Rooms"
      subtitle={`${state.rooms} Room${state.rooms > 1 ? 's' : ''}, ${totalGuests} Guest${totalGuests > 1 ? 's' : ''}${state.pureVeg ? ' (Pure Veg)' : ''}`}
      onDone={handleDone}
      onReset={() =>
        setState({
          rooms: 1,
          adults: 2,
          children: 0,
          childAges: [],
          pureVeg: false,
        })
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderStepper('Rooms', 'Minimum 1 room', state.rooms, 'rooms', 1, 8)}
        {renderStepper('Adults', 'Ages 12+ years', state.adults, 'adults', state.rooms, 20)}
        {renderStepper('Children', 'Ages 0 to 11 years', state.children, 'children', 0, 10)}

        {/* Child Ages Section */}
        {state.children > 0 && (
          <View style={styles.childAgesContainer}>
            <Text style={[styles.sectionHeader, { color: colors.heading }]}>
              Age of children at check-out
            </Text>
            <View style={styles.childAgesGrid}>
              {state.childAges.map((age, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.childAgeCard,
                    {
                      backgroundColor: isDark ? colors.surface : '#f8f9fa',
                      borderColor: isDark ? colors.border : '#e2e8f0',
                    },
                  ]}
                >
                  <Text style={styles.childAgeLabel}>Child {idx + 1}</Text>
                  <View style={styles.childAgeSteppers}>
                    <TouchableOpacity
                      onPress={() => handleChildAgeChange(idx, -1)}
                      disabled={age <= 0}
                      style={styles.ageMiniBtn}
                    >
                      <Text style={[styles.ageMiniBtnText, { color: colors.text }]}>-</Text>
                    </TouchableOpacity>
                    <Text style={[styles.ageValueText, { color: colors.heading }]}>
                      {age === 0 ? '< 1 yr' : `${age} yrs`}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleChildAgeChange(idx, 1)}
                      disabled={age >= 17}
                      style={styles.ageMiniBtn}
                    >
                      <Text style={[styles.ageMiniBtnText, { color: colors.text }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Pure Veg Options Toggle */}
        <View
          style={[
            styles.vegToggleRow,
            {
              backgroundColor: isDark ? colors.surface : '#f0fdf4',
              borderColor: '#86efac',
            },
          ]}
        >
          <View style={styles.vegTextColumn}>
            <View style={styles.vegTitleRow}>
              <View style={styles.vegIndicatorDot} />
              <Text style={styles.vegTitle}>Pure Veg & Jain Options</Text>
            </View>
            <Text style={styles.vegSubtitle}>
              Filter stays offering strictly vegetarian & Jain friendly dining
            </Text>
          </View>

          <Switch
            value={state.pureVeg}
            onValueChange={(val) => {
              try {
                Haptics.selectionAsync();
              } catch {}
              setState((prev) => ({ ...prev, pureVeg: val }));
            }}
            trackColor={{ false: '#cbd5e1', true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>
      </ScrollView>
    </SelectionSheet>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: 10,
    gap: 16,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  stepperLabels: {
    flex: 1,
  },
  stepperTitle: {
    fontSize: FONT_SIZE.md || 15,
    fontWeight: '700',
  },
  stepperSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  stepValue: {
    fontSize: 16,
    fontWeight: '800',
    width: 28,
    textAlign: 'center',
  },
  childAgesContainer: {
    marginTop: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  childAgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  childAgeCard: {
    width: '48%',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  childAgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
  },
  childAgeSteppers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ageMiniBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageMiniBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  ageValueText: {
    fontSize: 13,
    fontWeight: '700',
  },
  vegToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginTop: 10,
  },
  vegTextColumn: {
    flex: 1,
    marginRight: 12,
  },
  vegTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  vegIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  vegTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803d',
  },
  vegSubtitle: {
    fontSize: 11,
    color: '#64748b',
  },
});
