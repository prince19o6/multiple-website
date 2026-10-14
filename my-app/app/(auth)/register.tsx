/**
 * app/(auth)/register.tsx
 *
 * Native mobile registration screen aligned with backend validation contract.
 * Features:
 * - Strict client-side validation (Name 2+ chars, valid email regex, password >= 8 chars, matching confirm password, terms agreement).
 * - Password rule hints and visibility toggles.
 * - Server field-level error mapping (displays server 400/409 validation and duplicate email errors directly under corresponding inputs).
 * - General error alerts/banners for server or network errors.
 * - Double-submit prevention and loading states.
 * - Secure session establishment and seamless back navigation.
 */

import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/api';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import BrandLogo from '@/components/common/BrandLogo';
import type { RegisterFormData } from '@/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/;

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const config = useSiteConfig();
  const { register } = useAuth();
  const headingFontFamily = getHeadingFontFamily(config);

  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Field-level error messages
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
    general?: string;
  }>({});

  const updateField = useCallback(<K extends keyof RegisterFormData>(field: K, value: RegisterFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field as keyof typeof prev] && !prev.general) return prev;
      const next = { ...prev };
      delete next[field as keyof typeof prev];
      delete next.general;
      return next;
    });
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: typeof fieldErrors = {};

    // 1. Name validation (2 to 100 characters per backend contract)
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      errors.name = 'Full name is required';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    } else if (trimmedName.length > 100) {
      errors.name = 'Name cannot exceed 100 characters';
    }

    // 2. Email validation (RFC format)
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      errors.email = 'Email address is required';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    // 3. Optional Phone validation
    const trimmedPhone = formData.phone?.trim();
    if (trimmedPhone && trimmedPhone.length > 0 && !PHONE_REGEX.test(trimmedPhone)) {
      errors.phone = 'Please enter a valid phone number (e.g. +1 555-0199)';
    }

    // 4. Password validation (Min 8 characters per backend contract)
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    // 5. Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // 6. Terms agreement
    if (!formData.acceptTerms) {
      errors.terms = 'Please accept the Terms of Service & Privacy Policy';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleRegister = async () => {
    if (submitting) return;

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

    try {
      const regResult = await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone?.trim() || undefined,
      });

      if (regResult && regResult.tokenSaved === false) {
        Alert.alert(
          'Account Created',
          'Your account has been created successfully, but your session token could not be persisted. Please sign in with your email and password.',
          [
            {
              text: 'Sign In',
              onPress: () => {
                router.replace('/(auth)/login');
              },
            },
          ]
        );
        return;
      }

      // Success! Show confirmation and return to previous screen or main tabs
      Alert.alert(
        'Registration Successful',
        'Your account has been created and you are now signed in.',
        [
          {
            text: 'Continue',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            },
          },
        ]
      );
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const nextErrors: typeof fieldErrors = {};

        // Map backend validation errors dictionary (e.g. { email: ["..."], password: ["..."] })
        if (err.fieldErrors) {
          if (err.fieldErrors.name) nextErrors.name = err.fieldErrors.name;
          if (err.fieldErrors.email) nextErrors.email = err.fieldErrors.email;
          if (err.fieldErrors.password) nextErrors.password = err.fieldErrors.password;
          if (err.fieldErrors.phone) nextErrors.phone = err.fieldErrors.phone;
        }

        // Status 409 Conflict: Duplicate account on this tenant
        if (err.status === 409) {
          nextErrors.email = err.message || 'An account with this email already exists on this website';
        } else if (Object.keys(nextErrors).length === 0) {
          nextErrors.general = err.message || 'Registration failed. Please check your information.';
        }

        setFieldErrors(nextErrors);

        if (nextErrors.general) {
          Alert.alert('Registration Notice', nextErrors.general);
        }
      } else {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setFieldErrors({ general: message });
        Alert.alert('Registration Error', message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Bar with Back Button */}
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
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={20} color={colors.heading} />
        </TouchableOpacity>
      </View>

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
          Create Account
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          Join {config?.name || 'Tours App'} to start booking customized adventures and saving your bucket list.
        </Text>

        {/* General Error Banner */}
        {fieldErrors.general && (
          <View style={[styles.generalErrorBanner, { backgroundColor: '#ef444415', borderColor: '#ef444440' }]}>
            <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
            <Text style={styles.generalErrorText}>{fieldErrors.general}</Text>
          </View>
        )}

        {/* 1. Full Name Field */}
        <Text style={[styles.inputLabel, { color: colors.heading }]}>Full Name *</Text>
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.surface, borderColor: fieldErrors.name ? '#ef4444' : colors.border },
          ]}
        >
          <Ionicons name="person-outline" size={18} color={fieldErrors.name ? '#ef4444' : colors.mutedText} style={styles.inputIcon} />
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="John Doe"
            placeholderTextColor={colors.mutedText}
            value={formData.name}
            onChangeText={(val) => updateField('name', val)}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>
        {fieldErrors.name && <Text style={styles.fieldErrorText}>{fieldErrors.name}</Text>}

        {/* 2. Email Address Field */}
        <Text style={[styles.inputLabel, { color: colors.heading }]}>Email Address *</Text>
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.surface, borderColor: fieldErrors.email ? '#ef4444' : colors.border },
          ]}
        >
          <Ionicons name="mail-outline" size={18} color={fieldErrors.email ? '#ef4444' : colors.mutedText} style={styles.inputIcon} />
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedText}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={formData.email}
            onChangeText={(val) => updateField('email', val)}
            returnKeyType="next"
          />
        </View>
        {fieldErrors.email && <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>}

        {/* 3. Phone Number Field (Optional) */}
        <Text style={[styles.inputLabel, { color: colors.heading }]}>Phone Number (Optional)</Text>
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.surface, borderColor: fieldErrors.phone ? '#ef4444' : colors.border },
          ]}
        >
          <Ionicons name="call-outline" size={18} color={fieldErrors.phone ? '#ef4444' : colors.mutedText} style={styles.inputIcon} />
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="+1 555-0199"
            placeholderTextColor={colors.mutedText}
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(val) => updateField('phone', val)}
            returnKeyType="next"
          />
        </View>
        {fieldErrors.phone && <Text style={styles.fieldErrorText}>{fieldErrors.phone}</Text>}

        {/* 4. Password Field */}
        <Text style={[styles.inputLabel, { color: colors.heading }]}>Password *</Text>
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.surface, borderColor: fieldErrors.password ? '#ef4444' : colors.border },
          ]}
        >
          <Ionicons name="lock-closed-outline" size={18} color={fieldErrors.password ? '#ef4444' : colors.mutedText} style={styles.inputIcon} />
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="Create password"
            placeholderTextColor={colors.mutedText}
            secureTextEntry={!showPassword}
            value={formData.password}
            onChangeText={(val) => updateField('password', val)}
            returnKeyType="next"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.mutedText} />
          </TouchableOpacity>
        </View>
        {/* Password Rule Hint */}
        <View style={styles.hintRow}>
          <Ionicons
            name={formData.password.length >= 8 ? 'checkmark-circle' : 'information-circle-outline'}
            size={14}
            color={formData.password.length >= 8 ? '#22c55e' : colors.mutedText}
          />
          <Text style={[styles.hintText, { color: formData.password.length >= 8 ? '#22c55e' : colors.mutedText }]}>
            Password must be at least 8 characters long
          </Text>
        </View>
        {fieldErrors.password && <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text>}

        {/* 5. Confirm Password Field */}
        <Text style={[styles.inputLabel, { color: colors.heading }]}>Confirm Password *</Text>
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.surface, borderColor: fieldErrors.confirmPassword ? '#ef4444' : colors.border },
          ]}
        >
          <Ionicons name="lock-closed-outline" size={18} color={fieldErrors.confirmPassword ? '#ef4444' : colors.mutedText} style={styles.inputIcon} />
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="Re-enter password"
            placeholderTextColor={colors.mutedText}
            secureTextEntry={!showConfirmPassword}
            value={formData.confirmPassword}
            onChangeText={(val) => updateField('confirmPassword', val)}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.mutedText} />
          </TouchableOpacity>
        </View>
        {fieldErrors.confirmPassword && <Text style={styles.fieldErrorText}>{fieldErrors.confirmPassword}</Text>}

        {/* 6. Terms and Conditions Checkbox */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => updateField('acceptTerms', !formData.acceptTerms)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: fieldErrors.terms ? '#ef4444' : formData.acceptTerms ? colors.primary : colors.border,
                backgroundColor: formData.acceptTerms ? colors.primary : colors.surface,
              },
            ]}
          >
            {formData.acceptTerms && <Ionicons name="checkmark" size={14} color="#ffffff" />}
          </View>
          <Text style={[styles.termsText, { color: colors.text }]}>
            I agree to the <Text style={{ color: colors.primary, fontWeight: '700' }}>Terms of Service</Text> and{' '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>
        {fieldErrors.terms && <Text style={[styles.fieldErrorText, { marginBottom: 12 }]}>{fieldErrors.terms}</Text>}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: colors.primary },
            submitting && { opacity: 0.7 },
          ]}
          onPress={handleRegister}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Switch to Login */}
        <View style={styles.footerRow}>
          <Text style={{ color: colors.mutedText }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: SPACING.xxl + 20,
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
  generalErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  generalErrorText: {
    color: '#ef4444',
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '600',
    flex: 1,
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
    marginBottom: SPACING.xs,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    paddingVertical: 0,
  },
  fieldErrorText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: SPACING.sm + 2,
    marginLeft: 4,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  hintText: {
    fontSize: 11,
    fontWeight: '500',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  submitBtn: {
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    marginTop: SPACING.md,
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
