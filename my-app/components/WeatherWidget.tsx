import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useWeather } from '../context/WeatherContext';

interface WeatherWidgetProps {
  style?: object;
  compact?: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ style, compact = false }) => {
  const router = useRouter();
  const colors = useColors();
  const { currentWeather, formatTemp, tempUnit, toggleUnit } = useWeather();

  if (!currentWeather) return null;

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    router.push('/weather-forecast' as never);
  };

  const getWeatherIconName = (icon: string): keyof typeof Ionicons.glyphMap => {
    switch (icon) {
      case 'sunny':
        return 'sunny';
      case 'partly-sunny':
        return 'partly-sunny';
      case 'rainy':
        return 'rainy';
      case 'cloudy':
        return 'cloudy';
      case 'moon':
        return 'moon';
      default:
        return 'sunny';
    }
  };

  if (compact) {
    return (
      <TouchableOpacity testID="btn-press"
        style={[styles.compactPill, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}30` }, style]}
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Weather in ${currentWeather.destinationName}: ${formatTemp(currentWeather.tempC, currentWeather.tempF)}, ${currentWeather.condition}`}
      >
        <Ionicons name={getWeatherIconName(currentWeather.conditionIcon)} size={15} color="#F59E0B" style={{ marginRight: 5 }} />
        <Text style={[styles.compactTemp, { color: colors.heading }]}>
          {formatTemp(currentWeather.tempC, currentWeather.tempF)}
        </Text>
        <Text style={[styles.compactCity, { color: colors.mutedText }]} numberOfLines={1}>
          • {currentWeather.destinationName.split('&')[0].trim()}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
    >
      <TouchableOpacity testID="btn-press"
        style={styles.mainTouchable}
        onPress={handlePress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`View full weather forecast for ${currentWeather.destinationName}`}
      >
        <View style={styles.leftRow}>
          <View style={[styles.iconCircle, { backgroundColor: '#F59E0B18' }]}>
            <Ionicons name={getWeatherIconName(currentWeather.conditionIcon)} size={22} color="#F59E0B" />
          </View>

          <View style={styles.infoCol}>
            <View style={styles.topMeta}>
              <Text style={[styles.destName, { color: colors.heading }]} numberOfLines={1}>
                {currentWeather.destinationName}
              </Text>
            </View>
            <Text style={[styles.conditionText, { color: colors.mutedText }]}>
              {currentWeather.condition} • Feels {formatTemp(currentWeather.feelsLikeC, currentWeather.feelsLikeF)}
            </Text>
          </View>
        </View>

        <Text style={[styles.tempNumber, { color: colors.heading }]}>
          {formatTemp(currentWeather.tempC, currentWeather.tempF)}
        </Text>
      </TouchableOpacity>

      <View style={styles.rightRow}>
        <TouchableOpacity testID="btn-weatherwidget-99"
          onPress={() => toggleUnit()}
          style={styles.unitBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Toggle Celsius or Fahrenheit"
        >
          <Text style={[styles.unitText, { color: colors.primary }]}>
            {tempUnit === 'C' ? '°F' : '°C'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity testID="btn-navigate"
          onPress={handlePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Open forecast details"
        >
          <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  mainTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 10,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoCol: {
    flex: 1,
  },
  topMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  destName: {
    fontSize: 13,
    fontWeight: '700',
  },
  conditionText: {
    fontSize: 11,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tempBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tempNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  unitBtn: {
    marginLeft: 4,
    padding: 2,
  },
  unitText: {
    fontSize: 11,
    fontWeight: '700',
  },
  compactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  compactTemp: {
    fontSize: 12,
    fontWeight: '700',
  },
  compactCity: {
    fontSize: 11,
  },
});
