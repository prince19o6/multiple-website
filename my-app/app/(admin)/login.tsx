/**
 * app/(admin)/login.tsx
 *
 * Admin login screen.
 * Authenticates against backend /api/auth/login and requires Admin or SuperAdmin role.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAdminAuth } from './_layout';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { login } from '@/lib/api';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { getSiteEntry } from '@/constants/siteRegistry';

export default function AdminLoginScreen() {
  const router = useRouter();
  const { loginAdmin } = useAdminAuth();
  const { siteId } = useSelectedSite();
  const currentSite = getSiteEntry(siteId);

  const defaultEmail =
    siteId === 'website2'
      ? 'admin@tripgoasia.com'
      : siteId === 'website3'
      ? 'admin@technoheaven.com'
      : 'admin@gujjutours.com';

  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('Admin@12345');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your admin email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await login({ email: email.trim(), password });
      const token = res?.data?.token || res?.token;
      const user = res?.data?.user || res?.user;

      if (token && user) {
        const roleLower = (user?.role || '').toLowerCase();
        if (roleLower !== 'admin' && roleLower !== 'superadmin') {
          Alert.alert(
            'Access Denied (403)',
            'This account does not have administrator privileges for this website tenant.'
          );
          return;
        }

        await loginAdmin(token, user);
        router.replace('/(admin)');
        return;
      }

      const rawError = res?.error || 'Invalid admin credentials.';
      if (rawError.toLowerCase().includes('locked')) {
        Alert.alert('Account Locked', rawError);
      } else if (rawError.toLowerCase().includes('too many') || rawError.toLowerCase().includes('rate limit')) {
        Alert.alert('Rate Limit Exceeded', 'Too many attempts. Please wait a minute and try again.');
      } else {
        Alert.alert('Authentication Failed', rawError);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check network and credentials.';
      Alert.alert('Connection / Login Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={36} color="#2563eb" />
          </View>

          <Text style={styles.title}>Admin Portal</Text>
          <Text style={styles.subtitle}>
            Sign in to manage {currentSite?.label || 'Tours'} catalog, bookings, and analytics.
          </Text>

          <View style={styles.tenantBadge}>
            <Ionicons name="globe-outline" size={14} color="#1d4ed8" />
            <Text style={styles.tenantText}>
              Website Tenant: {currentSite?.label} ({siteId})
            </Text>
          </View>

          <Text style={styles.label}>Admin Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="admin@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Admin Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={16} color="#3b82f6" />
            <Text style={styles.hintText}>
              Credentials: {email} / Admin@12345
            </Text>
          </View>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginBtnText}>Access Admin Panel</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOW.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONT_SIZE.xs + 1,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  tenantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
    alignSelf: 'center',
  },
  tenantText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  label: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONT_SIZE.sm,
    color: '#0f172a',
    marginBottom: SPACING.md,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONT_SIZE.sm,
    color: '#0f172a',
  },
  eyeBtn: {
    paddingHorizontal: SPACING.md,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hintText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
