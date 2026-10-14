/**
 * components/SiteSwitcherModal.tsx
 *
 * Dedicated modal UI allowing users and testers to switch between the 3 registered brands:
 * 1. Gujju Tours (b2b.gujjutours.com)
 * 2. TripGo Asia (www.tripgoasia.com)
 * 3. Technoheaven (stagingb2b.technoheaven.com)
 *
 * Switching automatically:
 * - Purges old tenant's React Query cache
 * - Saves active site to AsyncStorage (@multisite:active_site_id)
 * - Fetches new site's live config, theme, and logo
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SITES, type SiteId } from '@/src/config/sites';
import { useSite } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';

interface SiteSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SiteSwitcherModal({ visible, onClose }: SiteSwitcherModalProps) {
  const { siteId, switchSite, isLoading } = useSite();
  const colors = useColors();

  const handleSelectSite = async (newSiteId: SiteId) => {
    if (newSiteId === siteId) {
      onClose();
      return;
    }
    await switchSite(newSiteId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.modalCard, { backgroundColor: colors.surface }]}
        >
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.heading }]}>Switch Brand</Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                Select an active travel website
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedText }]}>
                Loading site data...
              </Text>
            </View>
          )}

          <View style={styles.siteList}>
            {SITES.map((site) => {
              const isSelected = site.id === siteId;
              return (
                <TouchableOpacity
                  key={site.id}
                  style={[
                    styles.siteOption,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? `${colors.primary}10` : colors.background,
                    },
                  ]}
                  onPress={() => handleSelectSite(site.id)}
                  disabled={isLoading}
                >
                  <View style={styles.siteInfo}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.siteName, { color: colors.heading }]}>
                        {site.name}
                      </Text>
                      {isSelected && (
                        <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.activeBadgeText}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.siteHost, { color: colors.mutedText }]}>
                      {site.hostname}
                    </Text>
                    <Text style={[styles.siteApi, { color: colors.mutedText }]}>
                      {site.currencyDefault.code} ({site.currencyDefault.symbol}) • {site.apiBaseUrl}
                    </Text>
                  </View>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'radio-button-off'}
                    size={24}
                    color={isSelected ? colors.primary : colors.border}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  loadingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  loadingText: {
    fontSize: FONT_SIZE.xs,
  },
  siteList: {
    gap: SPACING.sm,
  },
  siteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
  },
  siteInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  siteName: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
  },
  activeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  activeBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  siteHost: {
    fontSize: FONT_SIZE.xs,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  siteApi: {
    fontSize: 10,
    marginTop: 2,
  },
});
