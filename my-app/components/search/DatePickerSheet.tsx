/**
 * components/search/DatePickerSheet.tsx
 *
 * Custom interactive calendar bottom sheet for Expo Mobile.
 * Supports:
 *   - Single Mode (Departure date, Tour date, Transfer date, Restaurant date)
 *   - Range Mode (Hotel check-in/out, Flight round-trip, Car rental pickup/return)
 *   - Past dates disabled
 *   - Today highlight
 *   - Month left/right swipe and navigation
 *   - Range duration nights banner
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import SelectionSheet from './SelectionSheet';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { RADIUS, FONT_SIZE } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export interface DatePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  isRange?: boolean;
  startDate?: string; // e.g. "2026-11-24" or readable
  endDate?: string;
  onSelectDate?: (date: string) => void;
  onSelectRange?: (start: string, end: string) => void;
}

function parseDate(str?: string): Date | null {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d;
}

function toISOString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatReadable(iso: string): string {
  const d = parseDate(iso);
  if (!d) return iso;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function DatePickerSheet({
  visible,
  onClose,
  title = 'Select Date',
  isRange = false,
  startDate,
  endDate,
  onSelectDate,
  onSelectRange,
}: DatePickerSheetProps) {
  const colors = useColors();
  const isDark = useIsDark();

  const today = new Date();
  const todayISO = toISOString(today);

  // Internal selection state
  const [tempStart, setTempStart] = useState<string>(startDate || todayISO);
  const [tempEnd, setTempEnd] = useState<string>(endDate || '');

  // Active view month & year
  const initialDate = parseDate(startDate) || today;
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Selection handler
  const handleDayPress = (day: number) => {
    const selected = new Date(viewYear, viewMonth, day);
    const selectedISO = toISOString(selected);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (!isRange) {
      setTempStart(selectedISO);
      if (onSelectDate) {
        onSelectDate(selectedISO);
      }
      return;
    }

    // Range mode
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(selectedISO);
      setTempEnd('');
    } else {
      if (selectedISO < tempStart) {
        setTempStart(selectedISO);
        setTempEnd('');
      } else {
        setTempEnd(selectedISO);
      }
    }
  };

  const handleDone = () => {
    if (isRange) {
      let finalEnd = tempEnd;
      if (!finalEnd && tempStart) {
        const s = parseDate(tempStart) || new Date();
        const nextDay = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 1);
        finalEnd = toISOString(nextDay);
      }
      if (onSelectRange) {
        onSelectRange(tempStart, finalEnd);
      }
    } else {
      if (onSelectDate) {
        onSelectDate(tempStart);
      }
    }
    onClose();
  };

  const nightsCount = useMemo(() => {
    if (!tempStart || !tempEnd) return 0;
    const s = parseDate(tempStart);
    const e = parseDate(tempEnd);
    if (!s || !e) return 0;
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [tempStart, tempEnd]);

  return (
    <SelectionSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={
        isRange
          ? nightsCount > 0
            ? `${nightsCount} Night${nightsCount > 1 ? 's' : ''}: ${formatReadable(tempStart)} - ${formatReadable(tempEnd)}`
            : tempStart
            ? `Check-in: ${formatReadable(tempStart)} (Select check-out)`
            : 'Select Check-in & Check-out'
          : `Selected: ${formatReadable(tempStart)}`
      }
      onDone={handleDone}
      onReset={() => {
        setTempStart(todayISO);
        setTempEnd('');
      }}
    >
      <View style={styles.calendarContainer}>
        {/* Month Navigation Row */}
        <View style={styles.monthHeaderRow}>
          <TouchableOpacity
            onPress={handlePrevMonth}
            style={styles.navButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={20} color={colors.heading} />
          </TouchableOpacity>

          <Text style={[styles.monthYearTitle, { color: colors.heading }]}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>

          <TouchableOpacity
            onPress={handleNextMonth}
            style={styles.navButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.heading} />
          </TouchableOpacity>
        </View>

        {/* Days of Week Header */}
        <View style={styles.daysOfWeekRow}>
          {DAYS_OF_WEEK.map((d) => (
            <View key={d} style={styles.dayOfWeekCell}>
              <Text style={styles.dayOfWeekText}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Days Grid */}
        <View style={styles.daysGrid}>
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const currentD = new Date(viewYear, viewMonth, day);
            const currentISO = toISOString(currentD);
            const isPast = currentISO < todayISO;
            const isToday = currentISO === todayISO;

            const isStart = tempStart === currentISO;
            const isEnd = tempEnd === currentISO;
            const inRange = Boolean(
              isRange &&
                tempStart &&
                tempEnd &&
                currentISO > tempStart &&
                currentISO < tempEnd
            );

            return (
              <TouchableOpacity
                key={`day-${day}`}
                onPress={() => handleDayPress(day)}
                disabled={isPast}
                activeOpacity={0.7}
                style={[
                  styles.dayCell,
                  inRange && { backgroundColor: colors.primary + '18', borderRadius: 0 },
                  (isStart || isEnd) && [
                    styles.selectedDayCell,
                    { backgroundColor: colors.primary },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: colors.text },
                    isPast && styles.pastDayText,
                    isToday && !isStart && !isEnd && { color: colors.primary, fontWeight: '800' },
                    (isStart || isEnd) && styles.selectedDayText,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SelectionSheet>
  );
}

const CELL_SIZE = Math.floor((SCREEN_WIDTH - 48) / 7);

const styles = StyleSheet.create({
  calendarContainer: {
    paddingVertical: 6,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  navButton: {
    padding: 8,
  },
  monthYearTitle: {
    fontSize: FONT_SIZE.md || 16,
    fontWeight: '800',
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayOfWeekCell: {
    width: CELL_SIZE,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayOfWeekText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE - 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    marginVertical: 1,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pastDayText: {
    color: '#cbd5e1',
  },
  selectedDayCell: {
    borderRadius: RADIUS.md,
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
