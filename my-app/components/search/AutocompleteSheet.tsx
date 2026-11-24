/**
 * components/search/AutocompleteSheet.tsx
 *
 * Debounced search selection bottom sheet for destinations, hotels, sightseeing,
 * and airports. Integrates with the backend suggestion endpoint with AsyncStorage
 * recent searches and offline fallback.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import SelectionSheet from './SelectionSheet';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { useSite } from '@/store/SiteConfigContext';
import { ENV } from '@/src/config/env';
import { RADIUS, FONT_SIZE } from '@/constants/theme';

export interface SuggestionItem {
  id: string;
  name: string;
  type?: string;
  subtitle?: string;
  code?: string;
  city?: string;
  country?: string;
  count?: number;
}

const DEFAULT_POPULAR_LISTS: Record<string, SuggestionItem[]> = {
  airport: [
    { id: 'STV', code: 'STV', name: 'Surat (STV)', subtitle: 'Surat Gujarat Airport, India', city: 'Surat', country: 'India', type: 'airport' },
    { id: 'BOM', code: 'BOM', name: 'Mumbai (BOM)', subtitle: 'Chhatrapati Shivaji Maharaj Intl, India', city: 'Mumbai', country: 'India', type: 'airport' },
    { id: 'DEL', code: 'DEL', name: 'Delhi (DEL)', subtitle: 'Indira Gandhi International, India', city: 'Delhi', country: 'India', type: 'airport' },
    { id: 'AMD', code: 'AMD', name: 'Ahmedabad (AMD)', subtitle: 'Sardar Vallabhbhai Patel Intl, India', city: 'Ahmedabad', country: 'India', type: 'airport' },
    { id: 'DXB', code: 'DXB', name: 'Dubai (DXB)', subtitle: 'Dubai International Airport, UAE', city: 'Dubai', country: 'UAE', type: 'airport' },
    { id: 'BLR', code: 'BLR', name: 'Bengaluru (BLR)', subtitle: 'Kempegowda International, India', city: 'Bengaluru', country: 'India', type: 'airport' },
    { id: 'SIN', code: 'SIN', name: 'Singapore (SIN)', subtitle: 'Changi Airport, Singapore', city: 'Singapore', country: 'Singapore', type: 'airport' },
    { id: 'BKK', code: 'BKK', name: 'Bangkok (BKK)', subtitle: 'Suvarnabhumi Airport, Thailand', city: 'Bangkok', country: 'Thailand', type: 'airport' },
  ],
  hotel: [
    { id: 'h1', name: 'Dubai', subtitle: 'United Arab Emirates', city: 'Dubai', country: 'UAE', type: 'hotel', count: 4684 },
    { id: 'h2', name: 'Jaipur', subtitle: 'Rajasthan, India', city: 'Jaipur', country: 'India', type: 'hotel', count: 1117 },
    { id: 'h3', name: 'Goa', subtitle: 'India', city: 'Goa', country: 'India', type: 'hotel', count: 2750 },
    { id: 'h4', name: 'Bangkok', subtitle: 'Thailand', city: 'Bangkok', country: 'Thailand', type: 'hotel', count: 2663 },
    { id: 'h5', name: 'Singapore', subtitle: 'Singapore', city: 'Singapore', country: 'Singapore', type: 'hotel', count: 709 },
  ],
  tour: [
    { id: 't1', name: 'Dubai Desert Safari & BBQ Dinner', subtitle: 'Dubai, UAE', city: 'Dubai', country: 'UAE', type: 'tour' },
    { id: 't2', name: 'Burj Khalifa At The Top 124th Floor', subtitle: 'Dubai, UAE', city: 'Dubai', country: 'UAE', type: 'tour' },
    { id: 't3', name: 'Marina Dhow Cruise with Dinner', subtitle: 'Dubai, UAE', city: 'Dubai', country: 'UAE', type: 'tour' },
    { id: 't4', name: 'Bali Nusa Penida Island Speedboat Tour', subtitle: 'Bali, Indonesia', city: 'Bali', country: 'Indonesia', type: 'tour' },
    { id: 't5', name: 'Singapore Gardens by the Bay & Marina Bay Sands', subtitle: 'Singapore', city: 'Singapore', country: 'Singapore', type: 'tour' },
  ],
  city: [
    { id: 'c1', name: 'Dubai, United Arab Emirates', subtitle: 'Middle East', city: 'Dubai', country: 'UAE', type: 'city' },
    { id: 'c2', name: 'Bali, Indonesia', subtitle: 'Tropical Paradise', city: 'Bali', country: 'Indonesia', type: 'city' },
    { id: 'c3', name: 'Singapore', subtitle: 'City in Nature', city: 'Singapore', country: 'Singapore', type: 'city' },
    { id: 'c4', name: 'Goa, India', subtitle: 'Beaches & Sunshine', city: 'Goa', country: 'India', type: 'city' },
    { id: 'c5', name: 'Bangkok, Thailand', subtitle: 'Temples & Street Food', city: 'Bangkok', country: 'Thailand', type: 'city' },
  ],
};

export interface AutocompleteSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  type?: 'airport' | 'hotel' | 'tour' | 'city' | 'all';
  placeholder?: string;
  onSelect: (item: SuggestionItem) => void;
}

export default function AutocompleteSheet({
  visible,
  onClose,
  title,
  type = 'city',
  placeholder = 'Type city, landmark, or airport...',
  onSelect,
}: AutocompleteSheetProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const { siteId, hostname } = useSite();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const storageKey = `@recent_search_${type}`;

  // Load recent searches
  useEffect(() => {
    if (visible) {
      AsyncStorage.getItem(storageKey)
        .then((raw) => {
          if (raw) setRecentSearches(JSON.parse(raw));
        })
        .catch(() => {});
      fetchSuggestions('');
    }
  }, [visible, type]);

  const fetchSuggestions = async (q: string) => {
    setLoading(true);
    try {
      const targetUrl = `${ENV.apiUrl}/api/core/v1/search/suggest?type=${type}&q=${encodeURIComponent(q)}&site=${siteId}&limit=10`;
      const res = await fetch(targetUrl, {
        headers: {
          'X-Website-Hostname': hostname || 'www.gujjutours.com',
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.data) && json.data.length > 0) {
          setSuggestions(json.data);
          setLoading(false);
          return;
        }
      }
    } catch {
      // offline fallback
    }

    // Local fallback
    const list = DEFAULT_POPULAR_LISTS[type] || DEFAULT_POPULAR_LISTS.city;
    const clean = q.trim().toLowerCase();
    if (!clean) {
      setSuggestions(list);
    } else {
      const filtered = list.filter(
        (i) =>
          i.name.toLowerCase().includes(clean) ||
          i.code?.toLowerCase().includes(clean) ||
          i.subtitle?.toLowerCase().includes(clean)
      );
      setSuggestions(filtered.length > 0 ? filtered : list);
    }
    setLoading(false);
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
  };

  const handleSelect = (item: SuggestionItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    // Save recent
    const updated = [item.name, ...recentSearches.filter((s) => s !== item.name)].slice(0, 5);
    setRecentSearches(updated);
    AsyncStorage.setItem(storageKey, JSON.stringify(updated)).catch(() => {});

    onSelect(item);
    onClose();
  };

  const clearRecent = () => {
    setRecentSearches([]);
    AsyncStorage.removeItem(storageKey).catch(() => {});
  };

  return (
    <SelectionSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={query ? `Searching for "${query}"` : 'Select or type to search'}
    >
      <View style={styles.container}>
        {/* Search Input Bar */}
        <View
          style={[
            styles.inputWrap,
            {
              backgroundColor: isDark ? colors.surface : '#f1f5f9',
              borderColor: isDark ? colors.border : '#e2e8f0',
            },
          ]}
        >
          <Ionicons name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            value={query}
            onChangeText={handleQueryChange}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            style={[styles.input, { color: colors.heading }]}
            autoCapitalize="none"
            clearButtonMode="while-editing"
            autoFocus
          />
          {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />}
          {query.length > 0 && !loading && (
            <TouchableOpacity onPress={() => handleQueryChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <View style={styles.recentWrap}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={clearRecent}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.recentChipsRow}>
                {recentSearches.map((r, i) => (
                  <TouchableOpacity
                    key={`rec-${i}`}
                    onPress={() =>
                      handleSelect({
                        id: `rec-${i}`,
                        name: r,
                        type,
                      })
                    }
                    style={[
                      styles.recentChip,
                      {
                        backgroundColor: isDark ? colors.surface : '#f8f9fa',
                        borderColor: isDark ? colors.border : '#e2e8f0',
                      },
                    ]}
                  >
                    <Ionicons name="time-outline" size={13} color="#64748b" style={{ marginRight: 4 }} />
                    <Text style={[styles.recentChipText, { color: colors.text }]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Suggestions List */}
          <Text style={styles.sectionTitle}>
            {query ? 'Matching Results' : 'Popular Destinations & Airports'}
          </Text>

          {suggestions.map((item, idx) => (
            <TouchableOpacity
              key={`${item.id}-${idx}`}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
              style={[
                styles.itemRow,
                {
                  backgroundColor: isDark ? colors.surface : '#ffffff',
                  borderColor: isDark ? colors.border : '#f1f5f9',
                },
              ]}
            >
              {item.code ? (
                <View style={[styles.codeBadge, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.codeText, { color: colors.primary }]}>{item.code}</Text>
                </View>
              ) : (
                <View style={[styles.iconWrap, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
                  <Ionicons
                    name={
                      type === 'hotel'
                        ? 'bed-outline'
                        : type === 'tour'
                        ? 'compass-outline'
                        : 'location-outline'
                    }
                    size={16}
                    color={colors.primary}
                  />
                </View>
              )}

              <View style={styles.itemTextColumn}>
                <Text style={[styles.itemName, { color: colors.heading }]} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.subtitle && (
                  <Text style={styles.itemSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                )}
              </View>

              {item.count && (
                <Text style={styles.countBadge}>
                  {item.count} {type === 'hotel' ? '★' : 'tours'}
                </Text>
              )}
            </TouchableOpacity>
          ))}

          {suggestions.length === 0 && !loading && (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No results found for &quot;{query}&quot;</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SelectionSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0,
  },
  scrollContent: {
    paddingBottom: 20,
    gap: 6,
  },
  recentWrap: {
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#94a3b8',
    marginBottom: 6,
  },
  clearText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ef4444',
  },
  recentChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  recentChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  codeBadge: {
    width: 44,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemTextColumn: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  countBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginLeft: 6,
  },
  emptyWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
  },
});
