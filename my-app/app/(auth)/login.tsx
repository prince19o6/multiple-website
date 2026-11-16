/**
 * app/(auth)/login.tsx
 *
 * Native mobile login screen.
 * Supports email/password input, demo quick-fill, and transition to tabs.
 */

import React, { useState, useEffect } from 'react';
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

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const config = useSiteConfig();
  const { login, forgotPassword, isLoading } = useAuth();
  const headingFontFamily = getHeadingFontFamily(config);
  const params = useLocalSearchParams<{ email?: string; registered?: string }>();

  const [email, setEmail] = useState(params.email ? String(params.email) : '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(params.registered === 'true');

  useEffect(() => {
    if (params.email) {
      setEmail(String(params.email));
    }
    if (params.registered === 'true') {
      setRegisteredSuccess(true);
    }
  }, [params.email, params.registered]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter your email and password.');
      return;
    }

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      Alert.alert('Authentication Notice', msg);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Forgot Password', 'Please enter your email address in the field above.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await forgotPassword(email.trim());
      Alert.alert('Reset Email Dispatched', res.message || 'If an account exists, password reset instructions have been sent.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not process request.';
      Alert.alert('Password Reset Notice', msg);
    } finally {
      setIsResetting(false);
    }
  };

  const handleDemoFill = (role: 'user' | 'admin') => {
    if (role === 'admin') {
      setEmail('admin@toursapp.com');
      setPassword('Admin@123');
    } else {
      setEmail('traveler@example.com');
      setPassword('Traveler@123');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ─── Top Bar with Back Button ─── */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 12 : 8),
          },
        ]}
      >
        <TouchableOpacity testID="btn-navigate" accessibilityLabel="Navigate"
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
          Welcome Back
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          Sign in to access your itinerary, saved wishlist, and travel bookings.
        </Text>

        {/* Registration Success Banner */}
        {registeredSuccess && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#10b98114',
              borderColor: '#10b981',
              borderWidth: 1,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              marginBottom: SPACING.lg,
            }}
          >
            <Ionicons name="checkmark-circle" size={20} color="#10b981" style={{ marginRight: 8 }} />
            <Text style={{ flex: 1, color: '#10b981', fontSize: 13, fontWeight: '600', lineHeight: 18 }}>
              Account created successfully! Please enter your password to sign in.
            </Text>
          </View>
        )}

        {/* Email Input */}
        <Text style={[styles.inputLabel, { color: colors.heading }]}>Email Address</Text>
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="mail-outline" size={18} color={colors.mutedText} style={styles.inputIcon} />
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedText}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password Input */}
        <Text style={[styles.inputLabel, { color: colors.heading }]}>Password</Text>
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.mutedText} style={styles.inputIcon} />
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="Enter password"
            placeholderTextColor={colors.mutedText}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity testID="btn-login-176" accessibilityLabel="login action" onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.mutedText} />
          </TouchableOpacity>
        </View>

        {/* Forgot Password Link */}
        <View style={{ alignItems: 'flex-end', marginTop: 6, marginBottom: 14 }}>
          <TouchableOpacity testID="btn-forgotpassword" accessibilityLabel="Forgot Password" onPress={handleForgotPassword} disabled={isResetting}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
              {isResetting ? 'Requesting...' : 'Forgot password?'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Demo Fill Pills */}
        <View style={styles.demoRow}>
          <Text style={[styles.demoLabel, { color: colors.mutedText }]}>Quick fill:</Text>
          <TouchableOpacity testID="btn-traveler" accessibilityLabel="Traveler"
            style={[styles.demoPill, { backgroundColor: `${colors.primary}18` }]}
            onPress={() => handleDemoFill('user')}
          >
            <Text style={[styles.demoPillText, { color: colors.primary }]}>Traveler</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="btn-admin" accessibilityLabel="Admin"
            style={[styles.demoPill, { backgroundColor: `${colors.primary}18` }]}
            onPress={() => handleDemoFill('admin')}
          >
            <Text style={[styles.demoPillText, { color: colors.primary }]}>Admin</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity testID="btn-sign-in" accessibilityLabel="Sign In"
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Switch to Register */}
        <View style={styles.footerRow}>
          <Text style={{ color: colors.mutedText }}>{"Don't have an account? "}</Text>
          <TouchableOpacity testID="btn-register" accessibilityLabel="Register" onPress={() => router.push('/(auth)/register')}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Register</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: SPACING.md,
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    marginBottom: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    paddingVertical: 0,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    gap: 8,
  },
  demoLabel: {
    fontSize: 12,
  },
  demoPill: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  submitBtn: {
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.base,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
