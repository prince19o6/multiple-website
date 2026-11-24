/**
 * components/search/PassengersSheet.tsx
 *
 * Flight passengers selection sheet:
 *   - Adults (1 to 9)
 *   - Children (0 to 8)
 *   - Infants (0 to adults, infants cannot exceed adults)
 *   - Total passengers capped at 9
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import SelectionSheet from './SelectionSheet';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { FONT_SIZE } from '@/constants/theme';

export interface PassengersSheetProps {
  visible: boolean;
  onClose: () => void;
  adults: number;
  childrenCount: number;
  infants: number;
  cabinClass?: string;
  onConfirm: (adults: number, children: number, infants: number) => void;
}

export default function PassengersSheet({
  visible,
  onClose,
  adults: initialAdults,
  childrenCount: initialChildren,
  infants: initialInfants,
  cabinClass = 'Economy',
  onConfirm,
}: PassengersSheetProps) {
  const colors = useColors();
  const isDark = useIsDark();

  const [adults, setAdults] = useState(initialAdults || 1);
  const [children, setChildren] = useState(initialChildren || 0);
  const [infants, setInfants] = useState(initialInfants || 0);

  const total = adults + children + infants;
  const maxAllowed = 9;

  const handleStep = (field: 'adults' | 'children' | 'infants', delta: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (field === 'adults') {
      const next = Math.max(1, Math.min(maxAllowed - children - infants, adults + delta));
      setAdults(next);
      // Ensure infants <= next adults
      if (infants > next) {
        setInfants(next);
      }
    } else if (field === 'children') {
      const next = Math.max(0, Math.min(maxAllowed - adults - infants, children + delta));
      setChildren(next);
    } else if (field === 'infants') {
      // Infants cannot exceed adults
      const next = Math.max(0, Math.min(adults, Math.min(maxAllowed - adults - children, infants + delta)));
      setInfants(next);
    }
  };

  const handleDone = () => {
    onConfirm(adults, children, infants);
    onClose();
  };

  const renderRow = (
    title: string,
    subtitle: string,
    value: number,
    field: 'adults' | 'children' | 'infants',
    min: number,
    max: number
  ) => {
    const canDec = value > min;
    const canInc = value < max && total < maxAllowed;

    return (
      <View style={styles.row}>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.heading }]}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.controls}>
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
            <Text style={[styles.stepBtnText, { color: canDec ? colors.heading : '#94a3b8' }]}>
              -
            </Text>
          </TouchableOpacity>

          <Text style={[styles.value, { color: colors.heading }]}>{value}</Text>

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
            <Text style={[styles.stepBtnText, { color: canInc ? colors.heading : '#94a3b8' }]}>
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
      title="Flight Passengers"
      subtitle={`${total} Passenger${total > 1 ? 's' : ''} • ${cabinClass} (Max 9)`}
      onDone={handleDone}
      onReset={() => {
        setAdults(1);
        setChildren(0);
        setInfants(0);
      }}
    >
      <View style={styles.container}>
        {renderRow('Adults', '12+ years (at time of travel)', adults, 'adults', 1, 9)}
        {renderRow('Children', '2 to 11 years (with seat)', children, 'children', 0, 8)}
        {renderRow('Infants', 'Under 2 years (on lap, max 1 per adult)', infants, 'infants', 0, adults)}
      </View>
    </SelectionSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.md || 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  controls: {
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
  value: {
    fontSize: 16,
    fontWeight: '800',
    width: 28,
    textAlign: 'center',
  },
});
