/**
 * components/home/MobileBestCitiesWeatherSection.tsx
 *
 * "Best Cities to Visit" Card Slider with Live Weather Forecasts.
 * Loads live forecasts from GET /api/weather/destinations with zero static fallbacks.
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/store/ThemeContext';
import { useSite } from '@/store/SiteConfigContext';
import { SkeletonItem } from '@/components/SkeletonLoader';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { DEFAULT_BLURHASH, resolveImageUrl, PLACEHOLDER_IMAGE } from '@/lib/imageUtils';

export interface MobileCityWeatherItem {
  id: number | string;
  name: string;
  countryName: string;
  image: string;
  weather?: {
    minTemp: number;
    maxTemp: number;
    weatherCode?: string;
    condition?: string;
  };
}

interface MobileBestCitiesWeatherSectionProps {
  title?: string;
}

export function MobileBestCitiesWeatherSection({
  title = 'Best Cities to Visit',
}: MobileBestCitiesWeatherSectionProps) {
  const router = useRouter();
  const colors = useColors();
  const { siteId, hostname } = useSite();

  const [selectedCountry, setSelectedCountry] = useState('All');

  // Query live weather destinations from backend
  const { data, isLoading, isError, error, refetch } = useQuery<MobileCityWeatherItem[]>({
    queryKey: ['weatherDestinations', siteId],
    queryFn: async () => {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/weather/destinations?site=${encodeURIComponent(siteId)}`, {
        headers: {
          'Accept': 'application/json',
          'X-Website-Hostname': hostname,
          'X-Website-Id': siteId,
        },
      });

      if (!res.ok) {
        throw new Error(`Weather destinations API failed with HTTP ${res.status}`);
      }

      const json = await res.json();
      return Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
    },
    staleTime: 1000 * 60 * 15, // 15 min cache
  });

  const cities = data || [];

  const countries = useMemo(() => {
    const list = Array.from(new Set(cities.map((c) => c.countryName).filter(Boolean)));
    return ['All', ...list];
  }, [cities]);

  const filteredCities = useMemo(() => {
    if (selectedCountry === 'All') return cities;
    return cities.filter(
      (c) => c.countryName?.toLowerCase() === selectedCountry.toLowerCase()
    );
  }, [cities, selectedCountry]);

  // Loading skeleton
  if (isLoading && cities.length === 0) {
    return (
      <View style={styles.container}>
        <SkeletonItem width="50%" height={20} style={{ marginBottom: 12, marginLeft: SPACING.md }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.md, gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonItem key={i} width={150} height={190} borderRadius={RADIUS.md} />
          ))}
        </ScrollView>
      </View>
    );
  }

  // Error state
  if (isError && cities.length === 0) {
    return (
      <View style={[styles.errorBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.errorText, { color: '#ef4444' }]}>
          Unable to load weather destinations: {error instanceof Error ? error.message : 'Connection error'}
        </Text>
        <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cities.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.heading }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          Live forecasts &amp; verified top city getaways
        </Text>
      </View>

      {/* Country filter tabs */}
      {countries.length > 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.countryScroll}
        >
          {countries.map((c) => {
            const isSelected = c === selectedCountry;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setSelectedCountry(c)}
                style={[
                  styles.countryChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countryChipText,
                    { color: isSelected ? '#ffffff' : colors.text },
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Horizontal Slider of Weather Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardScroll}
      >
        {filteredCities.map((city, idx) => {
          const imgUrl = resolveImageUrl(city.image) || PLACEHOLDER_IMAGE;

          return (
            <TouchableOpacity
              key={city.id || idx}
              activeOpacity={0.88}
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/explore',
                  params: { destination: city.name },
                } as any);
              }}
              style={[
                styles.cityCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                SHADOW.sm,
              ]}
            >
              <ExpoImage
                source={{ uri: imgUrl }}
                style={styles.cardImage}
                contentFit="cover"
                placeholder={{ blurhash: DEFAULT_BLURHASH }}
                transition={250}
              />
              <View style={styles.overlay} />

              {/* Weather Pill */}
              <View style={styles.weatherPillWrapper}>
                {city.weather ? (
                  <View style={styles.weatherPill}>
                    <Text style={styles.weatherPillText}>
                      🌡️ {Math.round(city.weather.minTemp)}° - {Math.round(city.weather.maxTemp)}°C
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.cityInfo}>
                <Text style={styles.cityName}>{city.name}</Text>
                <Text style={styles.countryName}>{city.countryName}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.md,
  },
  header: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  countryScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
    paddingVertical: SPACING.xs,
  },
  countryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  countryChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  cardScroll: {
    paddingHorizontal: SPACING.md,
    gap: 12,
    paddingTop: SPACING.xs,
  },
  cityCard: {
    width: 150,
    height: 190,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    padding: 10,
  },
  cardImage: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  weatherPillWrapper: {
    alignSelf: 'flex-end',
  },
  weatherPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  weatherPillText: {
    color: '#fef08a',
    fontSize: 10,
    fontWeight: '700',
  },
  cityInfo: {},
  cityName: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '800',
  },
  countryName: {
    color: '#e2e8f0',
    fontSize: 10,
    fontWeight: '500',
  },
  errorBox: {
    marginHorizontal: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    flex: 1,
    marginRight: 8,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
