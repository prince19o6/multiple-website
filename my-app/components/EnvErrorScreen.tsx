/**
 * components/EnvErrorScreen.tsx
 *
 * Full-screen native error view rendered when environment configuration is invalid:
 * - Missing required environment variables (EXPO_PUBLIC_SITE_ID, EXPO_PUBLIC_SITE_HOSTNAME)
 * - Conflict / mismatch between site ID, hostname, and API URLs
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import type { ConflictingVariable } from '@/src/config/env';

interface EnvErrorScreenProps {
  missingVariables?: string[];
  mismatchError?: string | null;
  conflictingVariables?: ConflictingVariable[];
  onRetry?: () => void;
}

export default function EnvErrorScreen({
  missingVariables = [],
  mismatchError = null,
  conflictingVariables = [],
  onRetry,
}: EnvErrorScreenProps) {
  const isMismatch = conflictingVariables.length > 0 || !!mismatchError;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.iconContainer}>
          <Ionicons name="warning-outline" size={48} color="#ef4444" />
        </View>

        <Text style={styles.title}>
          {isMismatch ? 'Site Configuration Mismatch' : 'Configuration Error'}
        </Text>
        <Text style={styles.subtitle}>
          {isMismatch
            ? 'The configured environment variables point to conflicting websites. All site variables must match the same website tenant.'
            : 'The application cannot start because one or more required environment variables are missing.'}
        </Text>

        {/* Conflicting Variables Card */}
        {conflictingVariables.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Conflicting Variables Detected:</Text>
            {conflictingVariables.map((c) => (
              <View key={c.key} style={styles.conflictItem}>
                <View style={styles.variableRow}>
                  <Ionicons name="close-circle" size={18} color="#ef4444" />
                  <Text style={styles.variableText}>{c.key}</Text>
                </View>
                <View style={styles.conflictDetails}>
                  <Text style={styles.conflictRow}>
                    <Text style={styles.conflictLabel}>Configured Value: </Text>
                    <Text style={styles.conflictValueWrong}>{c.value || '(empty)'}</Text>
                  </Text>
                  <Text style={styles.conflictRow}>
                    <Text style={styles.conflictLabel}>Expected Value: </Text>
                    <Text style={styles.conflictValueExpected}>{c.expected}</Text>
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Missing Variables Card */}
        {missingVariables.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Missing Required Variable(s):</Text>
            {missingVariables.map((v) => (
              <View key={v} style={styles.variableRow}>
                <Ionicons name="close-circle" size={18} color="#ef4444" />
                <Text style={styles.variableText}>{v}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>How to resolve this:</Text>
          <Text style={styles.instructionStep}>
            1. Use the unified launcher CLI flag to choose the website (wins over all files):
          </Text>
          <View style={styles.codeSnippet}>
            <Text style={styles.codeLine}>npm start -- --site=gujjutours</Text>
            <Text style={styles.codeComment}># or: npm start -- --site=tripgoasia</Text>
            <Text style={styles.codeComment}># or: npm start -- --site=technoheaven</Text>
          </View>

          <Text style={styles.instructionStep}>
            2. Or ensure matching variables in <Text style={styles.codeText}>my-app/.env</Text>:
          </Text>
          <View style={styles.codeSnippet}>
            <Text style={styles.codeComment}># Gujju Tours (.env)</Text>
            <Text style={styles.codeLine}>EXPO_PUBLIC_SITE_ID=gujjutours</Text>
            <Text style={styles.codeLine}>EXPO_PUBLIC_SITE_HOSTNAME=www.gujjutours.com</Text>
            <Text style={styles.codeLine}>EXPO_PUBLIC_CONFIG_API_URL=https://stagingapi.gujjutours.com</Text>
            <Text style={styles.codeLine}>EXPO_PUBLIC_API_URL=https://stagingapi.gujjutours.com</Text>
          </View>
        </View>

        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
            <Ionicons name="reload" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.retryText}>Retry Loading Configuration</Text>
          </TouchableOpacity>
        )}
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
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991b1b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  conflictItem: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#fef2f2',
  },
  variableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  variableText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    fontWeight: '700',
    color: '#b91c1c',
  },
  conflictDetails: {
    marginLeft: 26,
    gap: 2,
  },
  conflictRow: {
    fontSize: 12,
  },
  conflictLabel: {
    color: '#64748b',
    fontWeight: '600',
  },
  conflictValueWrong: {
    color: '#dc2626',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  conflictValueExpected: {
    color: '#16a34a',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  instructionsBox: {
    width: '100%',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 10,
  },
  instructionStep: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 6,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    color: '#0f172a',
  },
  codeSnippet: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  codeLine: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#38bdf8',
    lineHeight: 18,
  },
  codeComment: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
    fontStyle: 'italic',
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
});
