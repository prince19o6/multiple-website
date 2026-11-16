/**
 * app/(auth)/verify-email.tsx
 *
 * Screen for email verification on mobile.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useAuth } from '@/context/AuthContext';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import BrandLogo from '@/components/common/BrandLogo';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const config = useSiteConfig();
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const { verifyEmail, resendVerification, user } = useAuth();
  const headingFontFamily = getHeadingFontFamily(config);

  const [token, setToken] = useState(params.token ? String(params.token) : '');
  const [emailToResend, setEmailToResend] = useState(params.email ? String(params.email) : user?.email || '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [claimedCount, setClaimedCount] = useState<number>(0);

  const handleVerify = async () => {
    if (!token.trim()) {
      Alert.alert('Verification Token Required', 'Please enter or paste your verification token.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyEmail(token.trim());
      if (res.success) {
        setVerified(true);
        setClaimedCount(res.claimedBookings || 0);
      } else {
        Alert.alert('Verification Failed', res.message || 'Token is invalid or expired.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!emailToResend.trim() || !emailToResend.includes('@')) {
      Alert.alert('Valid Email Required', 'Please provide a valid email address to resend link.');
      return;
    }

    setResending(true);
    try {
      const res = await resendVerification(emailToResend.trim());
      if (res.success) {
        Alert.alert('Verification Sent', 'A fresh verification token has been dispatched to your email.');
      } else {
        Alert.alert('Resend Failed', res.message || 'Could not send verification email.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not resend.';
      Alert.alert('Notice', msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 12 : 8),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.heading} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <BrandLogo size="lg" align="center" showTextFallback={true} />
          </View>

          <Text style={[styles.title, { color: colors.heading, fontFamily: headingFontFamily }]}>
            Verify Email
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            Confirm your email address to protect your account and unlock booking history.
          </Text>

          {verified ? (
            <View
              style={{
                backgroundColor: '#10b98114',
                borderColor: '#10b981',
                borderWidth: 1,
                borderRadius: RADIUS.lg,
                padding: SPACING.lg,
                alignItems: 'center',
                marginVertical: SPACING.lg,
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={44} color="#10b981" style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: FONT_SIZE.lg, fontWeight: '800', color: colors.heading, marginBottom: 4 }}>
                Email Verified!
              </Text>
              <Text style={{ fontSize: FONT_SIZE.xs, color: colors.mutedText, textAlign: 'center', lineHeight: 18 }}>
                Your email is confirmed and your account is in good standing.
              </Text>

              {claimedCount > 0 && (
                <View style={{ marginTop: 12, padding: 8, backgroundColor: '#ffffff', borderRadius: 8 }}>
                  <Text style={{ fontSize: FONT_SIZE.xs, fontWeight: '700', color: colors.primary }}>
                    🎉 {claimedCount} past guest booking(s) linked to your account!
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: SPACING.lg, width: '100%' }]}
                onPress={() => router.replace('/(tabs)')}
              >
                <Text style={styles.primaryBtnText}>Continue to Home</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.heading }]}>Verification Code / Token</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="key-outline" size={18} color={colors.mutedText} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.heading }]}
                    placeholder="Paste verification token here"
                    placeholderTextColor={colors.mutedText}
                    value={token}
                    onChangeText={setToken}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={handleVerify}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Confirm Email</Text>
                )}
              </TouchableOpacity>

              {/* Resend Section */}
              <View style={{ marginTop: SPACING.xl, paddingTop: SPACING.lg, borderTopWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: FONT_SIZE.xs, fontWeight: '700', color: colors.mutedText, textTransform: 'uppercase', marginBottom: 8 }}>
                  Didn&apos;t receive an email?
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 8 }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.mutedText} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.heading }]}
                    placeholder="Enter email to resend"
                    placeholderTextColor={colors.mutedText}
                    value={emailToResend}
                    onChangeText={setEmailToResend}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity
                  style={{ paddingVertical: 10, alignItems: 'center' }}
                  onPress={handleResend}
                  disabled={resending}
                >
                  <Text style={{ fontSize: FONT_SIZE.xs, color: colors.primary, fontWeight: '700' }}>
                    {resending ? 'Sending...' : 'Resend Verification Link'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  form: {
    gap: SPACING.md,
  },
  inputGroup: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    paddingVertical: SPACING.sm,
  },
  primaryBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});

