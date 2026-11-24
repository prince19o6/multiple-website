/**
 * components/search/TimePickerSheet.tsx
 *
 * Bottom sheet for picking arrival/pickup/dining time.
 * Supports standard hourly/half-hourly slots or Lunch / Dinner meal times.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import SelectionSheet from './SelectionSheet';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { RADIUS, FONT_SIZE } from '@/constants/theme';

export interface TimePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  selectedTime?: string;
  onSelectTime: (time: string) => void;
  mode?: 'slots' | 'time';
}

const DEFAULT_HOURLY_SLOTS = [
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM',
];

const DINING_SLOTS = [
  { group: 'Lunch Slots', times: ['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM'] },
  { group: 'Dinner Slots', times: ['07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM'] },
];

export default function TimePickerSheet({
  visible,
  onClose,
  title = 'Select Time',
  selectedTime = '10:00 AM',
  onSelectTime,
  mode = 'time',
}: TimePickerSheetProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const [current, setCurrent] = useState(selectedTime);

  const handleChoose = (t: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setCurrent(t);
    onSelectTime(t);
    onClose();
  };

  return (
    <SelectionSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={`Selected Time: ${current}`}
      onDone={() => {
        onSelectTime(current);
        onClose();
      }}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {mode === 'slots' ? (
          DINING_SLOTS.map((grp) => (
            <View key={grp.group} style={styles.groupContainer}>
              <Text style={styles.groupTitle}>{grp.group}</Text>
              <View style={styles.chipsWrap}>
                {grp.times.map((t) => {
                  const isSelected = current === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => handleChoose(t)}
                      activeOpacity={0.7}
                      style={[
                        styles.timeChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : isDark
                            ? colors.surface
                            : '#f8f9fa',
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
                          styles.timeText,
                          {
                            color: isSelected ? '#ffffff' : colors.heading,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.chipsWrap}>
            {DEFAULT_HOURLY_SLOTS.map((t) => {
              const isSelected = current === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => handleChoose(t)}
                  activeOpacity={0.7}
                  style={[
                    styles.timeChip,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : isDark
                        ? colors.surface
                        : '#f8f9fa',
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
                      styles.timeText,
                      {
                        color: isSelected ? '#ffffff' : colors.heading,
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SelectionSheet>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: 10,
    gap: 16,
  },
  groupContainer: {
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#94a3b8',
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    minWidth: '29%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 13,
  },
});
