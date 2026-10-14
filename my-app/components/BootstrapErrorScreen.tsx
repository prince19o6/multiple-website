/**
 * components/BootstrapErrorScreen.tsx
 *
 * Full-screen error screen displayed when the initial site configuration
 * fails to load on startup (with no cached offline config available).
 * Features a Retry button and displays the real error message in dev mode.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
interface BootstrapErrorScreenProps {
  hostname: string;
  apiUrl: string;
  errorMessage?: string;
  onRetry: () => void;
}

export default function BootstrapErrorScreen({
  hostname,
  apiUrl,
  errorMessage,
  onRetry,
}: BootstrapErrorScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.brandBadge}>
          <Ionicons name="airplane-outline" size={24} color="#2563eb" />
          <Text style={styles.brandTitle}>ToursApp Platform</Text>
        </View>

        <View style={styles.iconContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color="#ef4444" />
        </View>

        <Text style={styles.title}>Unable to Load Website</Text>
        <Text style={styles.subtitle}>
          We couldn't connect to the backend server to load the site configuration and theme.
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Configured Hostname:</Text>
            <Text style={styles.infoValue}>{hostname}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Backend API URL:</Text>
            <Text style={styles.infoValue}>{apiUrl}</Text>
          </View>
        </View>

        {__DEV__ && errorMessage && (
          <View style={styles.devCard}>
            <Text style={styles.devHeader}>[DEV] Diagnostics Details:</Text>
            <Text style={styles.devErrorText}>{errorMessage}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
          <Ionicons name="reload" size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.retryText}>Retry Connection</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 340,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  devCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  devHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f87171',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  devErrorText: {
    fontSize: 12,
    color: '#e2e8f0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  retryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    backgroundColor: '#eff6ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1d4ed8',
    letterSpacing: -0.2,
  },
});
