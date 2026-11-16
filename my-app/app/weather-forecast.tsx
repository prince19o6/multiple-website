import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useWeather } from '../context/WeatherContext';

export default function WeatherForecastScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { siteName } = useSite();
  const colors = useColors();

  const {
    currentWeather,
    allDestinations,
    selectedDestinationId,
    tempUnit,
    isLoading,
    isRefreshing,
    selectDestination,
    toggleUnit,
    refreshWeather,
    formatTemp,
  } = useWeather();

  const getWeatherIcon = (icon: string): keyof typeof Ionicons.glyphMap => {
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
      case 'cloudy-night':
        return 'cloudy-night';
      default:
        return 'sunny';
    }
  };

  const handleShareWeather = () => {
    if (!currentWeather) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const msg = `*${currentWeather.destinationName} Weather & Climate Report* • _${siteName}_\n\n` +
        `🌡️ *Temperature:* ${formatTemp(currentWeather.tempC, currentWeather.tempF)} (Feels like ${formatTemp(currentWeather.feelsLikeC, currentWeather.feelsLikeF)})\n` +
        `🌤️ *Condition:* ${currentWeather.condition}\n` +
        `💨 *Wind:* ${currentWeather.windKmh} km/h | 💧 *Humidity:* ${currentWeather.humidityPercent}%\n` +
        `☀️ *UV Index:* ${currentWeather.uvIndex} (${currentWeather.uvLevel}) | 🍃 *AQI:* ${currentWeather.airQualityIndex} (${currentWeather.airQualityStatus})\n` +
        `🌊 *Marine / Tide:* ${currentWeather.tideStatus}\n\n` +
        `🧭 *Expedition Advisory:* ${currentWeather.advisoryMessage}\n\n` +
        `_Track live destination weather on the ${siteName} companion app! ✈️_`;

      Share.share({
        title: `${currentWeather.destinationName} Weather Forecast`,
        message: msg,
      });
    } catch {}
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 12),
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity testID="btn-navigate"
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() => router.back()}
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.heading} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.heading }]}>Climate & Tide Radar</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
              {currentWeather?.destinationName || siteName}
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity testID="btn-unit"
              style={[styles.unitToggleBtn, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}30` }]}
              onPress={toggleUnit}
              accessibilityLabel={`Switch to ${tempUnit === 'C' ? 'Fahrenheit' : 'Celsius'}`}
            >
              <Text style={[styles.unitToggleText, { color: colors.primary }]}>
                °{tempUnit}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity testID="btn-share"
              style={[styles.iconActionBtn, { borderColor: colors.border }]}
              onPress={handleShareWeather}
              accessibilityLabel="Share Weather Report"
            >
              <Ionicons name="share-outline" size={18} color={colors.heading} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Multi-Destination Selector Horizontal Scroll */}
        {allDestinations.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destScroll}>
            {allDestinations.map((dest) => {
              const isSelected = dest.destinationId === (currentWeather?.destinationId || selectedDestinationId);
              return (
                <TouchableOpacity testID="btn-weather-forecast-134" accessibilityLabel="weather-forecast action"
                  key={dest.destinationId}
                  style={[
                    styles.destPill,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.background,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => selectDestination(dest.destinationId)}
                >
                  <Ionicons
                    name={getWeatherIcon(dest.conditionIcon)}
                    size={14}
                    color={isSelected ? '#FFFFFF' : '#F59E0B'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.destPillText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                    {dest.destinationName.split('&')[0].trim()} ({formatTemp(dest.tempC, dest.tempF)})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={[styles.mainScroll, { paddingBottom: Math.max(insets.bottom, 24) + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedText }]}>Gathering atmospheric radar data...</Text>
          </View>
        ) : currentWeather ? (
          <>
            {/* ─── Hero Atmospheric Forecast Card ─── */}
            <View style={[styles.heroCard, { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroLocationWrap}>
                  <View style={styles.locationPinRow}>
                    <Ionicons name="location" size={14} color="#38BDF8" style={{ marginRight: 4 }} />
                    <Text style={styles.regionText}>{currentWeather.region}, {currentWeather.country}</Text>
                  </View>
                  <Text style={styles.cityNameText}>{currentWeather.destinationName}</Text>
                </View>

                <View style={styles.heroConditionIconBox}>
                  <Ionicons name={getWeatherIcon(currentWeather.conditionIcon)} size={48} color="#F59E0B" />
                </View>
              </View>

              <View style={styles.tempLargeRow}>
                <Text style={styles.largeTempText}>
                  {formatTemp(currentWeather.tempC, currentWeather.tempF)}
                </Text>
                <View style={styles.feelsLikeBox}>
                  <Text style={styles.conditionHeadline}>{currentWeather.condition}</Text>
                  <Text style={styles.feelsLikeText}>
                    Feels like {formatTemp(currentWeather.feelsLikeC, currentWeather.feelsLikeF)}
                  </Text>
                </View>
              </View>

              {/* 4-Metric Atmospheric Grid */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Ionicons name="water-outline" size={18} color="#38BDF8" />
                  <Text style={styles.metricLabel}>Humidity</Text>
                  <Text style={styles.metricVal}>{currentWeather.humidityPercent}%</Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricItem}>
                  <Ionicons name="speedometer-outline" size={18} color="#A855F7" />
                  <Text style={styles.metricLabel}>Wind</Text>
                  <Text style={styles.metricVal}>{currentWeather.windKmh} km/h</Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricItem}>
                  <Ionicons name="sunny-outline" size={18} color="#F59E0B" />
                  <Text style={styles.metricLabel}>UV Index</Text>
                  <Text style={styles.metricVal}>{currentWeather.uvIndex} ({currentWeather.uvLevel})</Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricItem}>
                  <Ionicons name="leaf-outline" size={18} color="#10B981" />
                  <Text style={styles.metricLabel}>Air Quality</Text>
                  <Text style={styles.metricVal}>{currentWeather.airQualityIndex} ({currentWeather.airQualityStatus})</Text>
                </View>
              </View>
            </View>

            {/* ─── Practical Expedition Advisory ─── */}
            <View style={[styles.advisoryCard, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}25` }]}>
              <View style={styles.advisoryHeader}>
                <Ionicons name="compass" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.advisoryTitle, { color: colors.primary }]}>Expedition Climate Advisory</Text>
              </View>
              <Text style={[styles.advisoryBody, { color: colors.text }]}>
                {currentWeather.advisoryMessage}
              </Text>
            </View>

            {/* ─── Hourly Microclimate Timeline ─── */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: colors.heading }]}>Hourly Timeline Forecast</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyScroll}>
                {currentWeather.hourly.map((hour, idx) => (
                  <View key={idx} style={[styles.hourBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.hourTime, { color: colors.mutedText }]}>{hour.time}</Text>
                    <Ionicons name={getWeatherIcon(hour.icon)} size={22} color="#F59E0B" style={{ marginVertical: 6 }} />
                    <Text style={[styles.hourTemp, { color: colors.heading }]}>
                      {formatTemp(hour.tempC, hour.tempF)}
                    </Text>
                    {hour.rainProbabilityPercent > 0 && (
                      <View style={styles.rainBadge}>
                        <Ionicons name="water" size={10} color="#38BDF8" style={{ marginRight: 2 }} />
                        <Text style={styles.rainPercent}>{hour.rainProbabilityPercent}%</Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* ─── 7-Day Microclimate Outlook ─── */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: colors.heading }]}>7-Day Microclimate Outlook</Text>
              </View>

              <View style={styles.dailyList}>
                {currentWeather.daily.map((day, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dailyRow,
                      idx < currentWeather.daily.length - 1 && { borderBottomColor: `${colors.border}40`, borderBottomWidth: StyleSheet.hairlineWidth },
                    ]}
                  >
                    <View style={styles.dailyDayCol}>
                      <Text style={[styles.dailyDayName, { color: colors.heading }]}>{day.dayName}</Text>
                      <Text style={[styles.dailyDate, { color: colors.mutedText }]}>{day.date}</Text>
                    </View>

                    <View style={styles.dailyConditionCol}>
                      <Ionicons name={getWeatherIcon(day.icon)} size={20} color="#F59E0B" style={{ marginRight: 6 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dailyConditionText, { color: colors.heading }]} numberOfLines={1}>
                          {day.condition}
                        </Text>
                        <Text style={[styles.dailyFeasibility, { color: colors.primary }]} numberOfLines={1}>
                          {day.activityFeasibility}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.dailyTempCol}>
                      <Text style={[styles.dailyTempMax, { color: colors.heading }]}>
                        {formatTemp(day.tempMaxC, day.tempMaxF)}
                      </Text>
                      <Text style={[styles.dailyTempMin, { color: colors.mutedText }]}>
                        {formatTemp(day.tempMinC, day.tempMinF)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* ─── Sun & Marine Tide Almanac ─── */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="boat-outline" size={18} color="#0284C7" style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: colors.heading }]}>Sun & Coastal Marine Tide Almanac</Text>
              </View>

              {/* Tide Status Box */}
              <View style={[styles.tideStatusBox, { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' }]}>
                <Ionicons name="water" size={20} color="#0284C7" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tideTitle}>Coastal Waters & Marine Swell</Text>
                  <Text style={styles.tideValue}>{currentWeather.tideStatus}</Text>
                </View>
              </View>

              <View style={styles.almanacRow}>
                <View style={[styles.almanacBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="sunny-outline" size={24} color="#F59E0B" style={{ marginBottom: 4 }} />
                  <Text style={[styles.almanacLabel, { color: colors.mutedText }]}>Sunrise / Dawn</Text>
                  <Text style={[styles.almanacTime, { color: colors.heading }]}>{currentWeather.sunrise}</Text>
                  <Text style={[styles.almanacSub, { color: colors.primary }]}>Golden Dawn Light</Text>
                </View>

                <View style={[styles.almanacBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="moon-outline" size={24} color="#6366F1" style={{ marginBottom: 4 }} />
                  <Text style={[styles.almanacLabel, { color: colors.mutedText }]}>Sunset / Dusk</Text>
                  <Text style={[styles.almanacTime, { color: colors.heading }]}>{currentWeather.sunset}</Text>
                  <Text style={[styles.almanacSub, { color: '#6366F1' }]}>Evening Twilight</Text>
                </View>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  unitToggleText: {
    fontSize: 13,
    fontWeight: '800',
  },
  iconActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  destPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  destPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mainScroll: {
    padding: 16,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  heroLocationWrap: {
    flex: 1,
  },
  locationPinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  regionText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  cityNameText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  heroConditionIconBox: {
    padding: 4,
  },
  tempLargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  largeTempText: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '900',
    marginRight: 14,
  },
  feelsLikeBox: {
    justifyContent: 'center',
  },
  conditionHeadline: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  feelsLikeText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#334155',
    paddingTop: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    marginBottom: 1,
  },
  metricVal: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '700',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  advisoryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  advisoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  advisoryTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  advisoryBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  hourlyScroll: {
    flexDirection: 'row',
    gap: 10,
  },
  hourBox: {
    width: 68,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  hourTime: {
    fontSize: 11,
    fontWeight: '600',
  },
  hourTemp: {
    fontSize: 13,
    fontWeight: '700',
  },
  rainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rainPercent: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '700',
  },
  dailyList: {
    flexDirection: 'column',
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dailyDayCol: {
    width: 80,
  },
  dailyDayName: {
    fontSize: 13,
    fontWeight: '700',
  },
  dailyDate: {
    fontSize: 10,
    marginTop: 1,
  },
  dailyConditionCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  dailyConditionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dailyFeasibility: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  dailyTempCol: {
    alignItems: 'flex-end',
    width: 60,
  },
  dailyTempMax: {
    fontSize: 13,
    fontWeight: '700',
  },
  dailyTempMin: {
    fontSize: 11,
    marginTop: 1,
  },
  tideStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  tideTitle: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '800',
  },
  tideValue: {
    color: '#0C4A6E',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  almanacRow: {
    flexDirection: 'row',
    gap: 12,
  },
  almanacBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  almanacLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  almanacTime: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  almanacSub: {
    fontSize: 10,
    fontWeight: '700',
  },
});
