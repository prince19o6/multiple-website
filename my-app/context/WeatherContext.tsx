import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import { DestinationWeather, TemperatureUnit } from '../types';
import { fetchBrandDestinationsWeather } from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

interface WeatherContextType {
  currentWeather: DestinationWeather | null;
  allDestinations: DestinationWeather[];
  selectedDestinationId: string;
  tempUnit: TemperatureUnit;
  isLoading: boolean;
  isRefreshing: boolean;
  selectDestination: (destinationId: string) => void;
  toggleUnit: () => void;
  refreshWeather: () => Promise<void>;
  formatTemp: (tempC: number, tempF: number) => string;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

const getUnitStorageKey = (siteId: string) => `@toursapp_temp_unit:${siteId}`;

export const WeatherProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [allDestinations, setAllDestinations] = useState<DestinationWeather[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');
  const [tempUnit, setTempUnit] = useState<TemperatureUnit>('C');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Load weather and unit preference
  const loadWeatherData = useCallback(async () => {
    try {
      const [destinations, savedUnit] = await Promise.all([
        fetchBrandDestinationsWeather(siteId).catch(() => []),
        storeGet(getUnitStorageKey(siteId)).catch(() => null),
      ]);

      if (savedUnit === 'C' || savedUnit === 'F') {
        setTempUnit(savedUnit);
      }

      if (destinations && destinations.length > 0) {
        setAllDestinations(destinations);
        setSelectedDestinationId((prev) =>
          prev && destinations.find((d) => d.destinationId === prev)
            ? prev
            : destinations[0].destinationId
        );
      }
    } catch {
      // offline fallback
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [siteId]);

  useEffect(() => {
    loadWeatherData();
  }, [loadWeatherData]);

  const selectDestination = useCallback((destId: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setSelectedDestinationId(destId);
  }, []);

  const toggleUnit = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const newUnit: TemperatureUnit = tempUnit === 'C' ? 'F' : 'C';
    setTempUnit(newUnit);
    await storeSet(getUnitStorageKey(siteId), newUnit);
  }, [tempUnit, siteId]);

  const refreshWeather = useCallback(async () => {
    setIsRefreshing(true);
    await loadWeatherData();
  }, [loadWeatherData]);

  const currentWeather =
    allDestinations.find((d) => d.destinationId === selectedDestinationId) ||
    allDestinations[0] ||
    null;

  const formatTemp = useCallback(
    (tempC: number, tempF: number): string => {
      return tempUnit === 'C' ? `${tempC}°C` : `${tempF}°F`;
    },
    [tempUnit]
  );

  return (
    <WeatherContext.Provider
      value={{
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
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = (): WeatherContextType => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};
