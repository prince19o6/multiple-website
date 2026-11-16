/**
 * app/(auth)/forgot-password.tsx
 *
 * Screen allowing users to request a password reset email on mobile.
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useAuth } from '@/context/AuthContext';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import BrandLogo from '@/components/common/BrandLogo';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const config = useSiteConfig();
  const { forgotPassword } = useAuth();
  const headingFontFamily = getHeadingFontFamily(config);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      setSubmitted(true);
      Alert.alert(
        'Instructions Sent',
        res.message || 'If an account matches this email, reset instructions have been sent.'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not process password reset request.';
      Alert.alert('Reset Notice', msg);
    } finally {
      setLoading(false);
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
            Forgot Password
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            Enter your registered email and we&apos;ll dispatch a secure reset link to your inbox.
          </Text>

          {submitted ? (
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
              <Ionicons name="mail-unread-outline" size={36} color="#10b981" style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '700', color: colors.heading, marginBottom: 4 }}>
                Check Your Email
              </Text>
              <Text style={{ fontSize: FONT_SIZE.xs, color: colors.mutedText, textAlign: 'center', lineHeight: 18 }}>
                We sent instructions to {email}. If you don&apos;t see it, check your spam folder.
              </Text>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: SPACING.lg, width: '100%' }]}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={styles.primaryBtnText}>Return to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.heading }]}>Email Address</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.mutedText} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.heading }]}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.mutedText}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Send Reset Instructions</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{ alignItems: 'center', marginTop: SPACING.lg }}
                onPress={() => router.back()}
              >
                <Text style={{ fontSize: FONT_SIZE.sm, color: colors.primary, fontWeight: '600' }}>
                  Remember your password? Sign in
                </Text>
              </TouchableOpacity>
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

