import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { useCulinary } from '../context/CulinaryContext';

interface CulinaryHighlightCardProps {
  destinationId?: string;
}

export const CulinaryHighlightCard: React.FC<CulinaryHighlightCardProps> = ({
  destinationId,
}) => {
  const router = useRouter();
  const colors = useColors();
  const { siteId, siteName } = useSite();
  const config = useSiteConfig();
  const { currentTrail, selectDestination } = useCulinary();

  if (!currentTrail) return null;

  const handleOpenGuide = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (destinationId) {
      selectDestination(destinationId);
    }
    router.push('/culinary-guide');
  };

  const brandHeaderTitle =
    (config as any)?.content?.culinaryHighlightTitle ||
    (config as any)?.culinaryGuide?.title ||
    `${siteName} Culinary Trail`;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Top Banner Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <View style={styles.categoryBadgeRow}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="restaurant" size={13} color={colors.primary} />
              <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>
                {brandHeaderTitle}
              </Text>
            </View>
          </View>
          <Text style={[styles.destinationTitle, { color: colors.heading }]} numberOfLines={1}>
            {currentTrail.destinationName}
          </Text>
          <Text style={[styles.tagline, { color: colors.mutedText }]} numberOfLines={2}>
            {currentTrail.tagline}
          </Text>
        </View>

        <TouchableOpacity testID="btn-navigate"
          style={[styles.arrowCircleBtn, { backgroundColor: colors.primary + '18' }]}
          onPress={handleOpenGuide}
          accessibilityRole="button"
          accessibilityLabel="Open culinary guide"
        >
          <Ionicons name="arrow-forward" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Dishes Horizontal Reel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dishesReel}
      >
        {currentTrail.dishes.slice(0, 3).map((dish) => (
          <TouchableOpacity testID="btn-openguide" accessibilityLabel="Open Guide"
            key={dish.id}
            style={[styles.dishItem, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={handleOpenGuide}
            activeOpacity={0.8}
          >
            <Image source={{ uri: dish.imageUrl }} style={styles.dishThumb} resizeMode="cover" />
            <View style={styles.dishContent}>
              <Text style={[styles.dishName, { color: colors.text }]} numberOfLines={1}>
                {dish.name}
              </Text>
              <Text style={[styles.dishLocalName, { color: colors.mutedText }]} numberOfLines={1}>
                {dish.localName}
              </Text>

              <View style={styles.dishBottomRow}>
                <View style={styles.spiceRow}>
                  {Array.from({ length: dish.spiceLevel }).map((_, idx) => (
                    <Ionicons key={idx} name="flame" size={12} color="#f97316" />
                  ))}
                </View>
                <Text style={[styles.dishPrice, { color: colors.primary }]}>
                  {dish.estimatedPrice.split('/')[0]}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Action Footer */}
      <TouchableOpacity testID="btn-navigate" accessibilityLabel="Navigate"
        style={[styles.footerBar, { borderTopColor: colors.border }]}
        onPress={handleOpenGuide}
        accessibilityRole="button"
      >
        <Text style={[styles.footerText, { color: colors.primary }]}>
          Explore Top Dining Spots, Safety Etiquette & Table Booking
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 10,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  destinationTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  tagline: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  arrowCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishesReel: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  dishItem: {
    width: 170,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dishThumb: {
    width: '100%',
    height: 95,
  },
  dishContent: {
    padding: 10,
  },
  dishName: {
    fontSize: 13,
    fontWeight: '700',
  },
  dishLocalName: {
    fontSize: 11,
    marginTop: 1,
  },
  dishBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  spiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dishPrice: {
    fontSize: 11,
    fontWeight: '700',
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    minHeight: 44,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
