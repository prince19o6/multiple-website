/**
 * components/search/TravelersSheet.tsx
 *
 * Lightweight steppers sheet for general travelers count (Tours, Transfers, Restaurants).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import SelectionSheet from './SelectionSheet';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { FONT_SIZE } from '@/constants/theme';

export interface TravelersSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  adults: number;
  childrenCount?: number;
  onConfirm: (adults: number, children: number) => void;
  maxTotal?: number;
}

export default function TravelersSheet({
  visible,
  onClose,
  title = 'Travelers',
  adults: initialAdults,
  childrenCount: initialChildren = 0,
  onConfirm,
  maxTotal = 20,
}: TravelersSheetProps) {
  const colors = useColors();
  const isDark = useIsDark();

  const [adults, setAdults] = useState(initialAdults || 1);
  const [children, setChildren] = useState(initialChildren || 0);

  const total = adults + children;

  const handleStep = (field: 'adults' | 'children', delta: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (field === 'adults') {
      const next = Math.max(1, Math.min(maxTotal - children, adults + delta));
      setAdults(next);
    } else {
      const next = Math.max(0, Math.min(maxTotal - adults, children + delta));
      setChildren(next);
    }
  };

  const handleDone = () => {
    onConfirm(adults, children);
    onClose();
  };

  return (
    <SelectionSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={`${total} Guest${total > 1 ? 's' : ''} Selected`}
      onDone={handleDone}
      onReset={() => {
        setAdults(2);
        setChildren(0);
      }}
    >
      <View style={styles.container}>
        {/* Adults Row */}
        <View style={styles.row}>
          <View>
            <Text style={[styles.title, { color: colors.heading }]}>Adults</Text>
            <Text style={styles.subtitle}>Age 12+ years</Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              onPress={() => adults > 1 && handleStep('adults', -1)}
              disabled={adults <= 1}
              style={[
                styles.stepBtn,
                {
                  borderColor: adults > 1 ? colors.border : '#cbd5e1',
                  backgroundColor: adults > 1 ? (isDark ? colors.surface : '#ffffff') : '#f1f5f9',
                },
              ]}
            >
              <Text style={[styles.stepBtnText, { color: adults > 1 ? colors.heading : '#94a3b8' }]}>
                -
              </Text>
            </TouchableOpacity>

            <Text style={[styles.value, { color: colors.heading }]}>{adults}</Text>

            <TouchableOpacity
              onPress={() => total < maxTotal && handleStep('adults', 1)}
              disabled={total >= maxTotal}
              style={[
                styles.stepBtn,
                {
                  borderColor: total < maxTotal ? colors.border : '#cbd5e1',
                  backgroundColor: total < maxTotal ? (isDark ? colors.surface : '#ffffff') : '#f1f5f9',
                },
              ]}
            >
              <Text style={[styles.stepBtnText, { color: total < maxTotal ? colors.heading : '#94a3b8' }]}>
                +
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Children Row */}
        <View style={styles.row}>
          <View>
            <Text style={[styles.title, { color: colors.heading }]}>Children</Text>
            <Text style={styles.subtitle}>Age 0-11 years</Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              onPress={() => children > 0 && handleStep('children', -1)}
              disabled={children <= 0}
              style={[
                styles.stepBtn,
                {
                  borderColor: children > 0 ? colors.border : '#cbd5e1',
                  backgroundColor: children > 0 ? (isDark ? colors.surface : '#ffffff') : '#f1f5f9',
                },
              ]}
            >
              <Text style={[styles.stepBtnText, { color: children > 0 ? colors.heading : '#94a3b8' }]}>
                -
              </Text>
            </TouchableOpacity>

            <Text style={[styles.value, { color: colors.heading }]}>{children}</Text>

            <TouchableOpacity
              onPress={() => total < maxTotal && handleStep('children', 1)}
              disabled={total >= maxTotal}
              style={[
                styles.stepBtn,
                {
                  borderColor: total < maxTotal ? colors.border : '#cbd5e1',
                  backgroundColor: total < maxTotal ? (isDark ? colors.surface : '#ffffff') : '#f1f5f9',
                },
              ]}
            >
              <Text style={[styles.stepBtnText, { color: total < maxTotal ? colors.heading : '#94a3b8' }]}>
                +
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SelectionSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
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
