/**
 * components/home/MobileTechnoheavenB2BSection.tsx
 *
 * Technoheaven B2B Agent Portal Gateway for native mobile app.
 * Matches live stagingb2b.technoheaven.com layout:
 *   - Camel desert sunset backdrop
 *   - Partner Agent authentication form (Agent Code, Email, Password, Remember Me)
 *   - Authenticated Agent Dashboard with net credit limit and active bookings
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { DEFAULT_BLURHASH } from '@/lib/imageUtils';

export function MobileTechnoheavenB2BSection() {
  const colors = useColors();
  const [agentCode, setAgentCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signedInAgent, setSignedInAgent] = useState<{ code: string; name: string } | null>(null);

  const handleSignIn = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSignedInAgent({
        code: agentCode || 'AG-88291',
        name: email.split('@')[0] || 'Authorized B2B Partner',
      });
    }, 500);
  };

  const handleSignOut = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setSignedInAgent(null);
  };

  return (
    <View style={styles.container}>
      {/* Camel Desert Sunset Hero Backdrop */}
      <View style={styles.heroWrapper}>
        <ExpoImage
          source={{ uri: 'https://d21bqxhdty55n7.cloudfront.net/uploads/cemalimage.2_54ymrda8upw.webp' }}
          placeholder={DEFAULT_BLURHASH}
          contentFit="cover"
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay} />

        {/* Hero Brand Title */}
        <View style={styles.heroContent}>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>🛡️ B2B TRAVEL AGENT GATEWAY</Text>
          </View>
          <Text style={styles.heroTitle}>
            Global Travel Inventory &amp; Live Booking Engine
          </Text>
          <Text style={styles.heroSubtitle}>
            Direct wholesale net rates, instant vouchers, and credit management for travel partners.
          </Text>
        </View>
      </View>

      {/* Sign-in Card or Authenticated Dashboard */}
      <View style={styles.cardContainer}>
        {!signedInAgent ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
              SHADOW.lg,
            ]}
          >
            <Text style={[styles.formTitle, { color: colors.heading }]}>
              Partner Agent Sign In
            </Text>
            <Text style={[styles.formSubtitle, { color: colors.mutedText }]}>
              Access net wholesale inventory and management console
            </Text>

            {/* Agent Code */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                AGENT / CORPORATE CODE
              </Text>
              <TextInput
                testID="input-agent-code"
                accessibilityLabel="Enter Agent or Corporate Code"
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="e.g. AG-7489"
                placeholderTextColor={colors.mutedText}
                value={agentCode}
                onChangeText={setAgentCode}
                autoCapitalize="characters"
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                REGISTERED EMAIL
              </Text>
              <TextInput
                testID="input-agent-email"
                accessibilityLabel="Enter registered agent email"
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="agent@agency.com"
                placeholderTextColor={colors.mutedText}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                PASSWORD
              </Text>
              <TextInput
                testID="input-agent-password"
                accessibilityLabel="Enter password"
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="••••••••••••"
                placeholderTextColor={colors.mutedText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Remember Me */}
            <TouchableOpacity
              testID="btn-remember-me"
              accessibilityLabel="Toggle remember me"
              style={styles.checkboxRow}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <Ionicons
                name={rememberMe ? 'checkbox' : 'square-outline'}
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                Remember my credentials
              </Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              testID="btn-agent-sign-in"
              accessibilityLabel="Sign in to B2B portal"
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleSignIn}
              disabled={isSubmitting}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Authenticating...' : 'Sign In to B2B Portal'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
              SHADOW.lg,
            ]}
          >
            <View style={styles.dashHeader}>
              <View>
                <Text style={[styles.dashAgentLabel, { color: colors.mutedText }]}>
                  AUTHORIZED AGENT
                </Text>
                <Text style={[styles.dashAgentName, { color: colors.heading }]}>
                  {signedInAgent.name}
                </Text>
                <Text style={[styles.dashAgentCode, { color: colors.primary }]}>
                  {signedInAgent.code}
                </Text>
              </View>
              <TouchableOpacity
                testID="btn-agent-sign-out"
                accessibilityLabel="Sign out of agent session"
                onPress={handleSignOut}
                style={styles.signOutBtn}
              >
                <Text style={[styles.signOutText, { color: colors.mutedText }]}>Sign Out</Text>
              </TouchableOpacity>
            </View>

            {/* Credit Limit Badge */}
            <View style={[styles.creditBox, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <Text style={[styles.creditLabel, { color: colors.mutedText }]}>
                Available Credit Limit
              </Text>
              <Text style={[styles.creditAmount, { color: colors.heading }]}>
                $50,000.00 USD
              </Text>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Text style={[styles.statNum, { color: colors.heading }]}>14</Text>
                <Text style={[styles.statLabel, { color: colors.mutedText }]}>Active Bookings</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Text style={[styles.statNum, { color: colors.heading }]}>3</Text>
                <Text style={[styles.statLabel, { color: colors.mutedText }]}>Pending Quotes</Text>
              </View>
            </View>

            <TouchableOpacity
              testID="btn-open-agent-console"
              accessibilityLabel="Open wholesale booking console"
              style={[styles.consoleBtn, { backgroundColor: colors.heading }]}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
              }}
            >
              <Text style={[styles.consoleBtnText, { color: colors.background }]}>
                Open Wholesale Booking Console →
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  heroWrapper: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#171717',
    justifyContent: 'flex-end',
    padding: SPACING.lg,
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  heroContent: {
    zIndex: 10,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 170, 207, 0.25)',
    borderColor: '#00aacf',
    borderWidth: 1,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xs,
  },
  badgeText: {
    color: '#00aacf',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: FONT_SIZE.md + 1,
    fontWeight: '900',
    lineHeight: 22,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: FONT_SIZE.xs - 1,
    marginTop: 2,
    lineHeight: 15,
  },
  cardContainer: {
    paddingHorizontal: SPACING.lg,
    marginTop: -SPACING.lg,
    zIndex: 20,
  },
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  formTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  formSubtitle: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.sm,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  textInput: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 4,
    fontSize: FONT_SIZE.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginVertical: SPACING.xs,
  },
  checkboxLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  submitBtn: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md - 2,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  dashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  dashAgentLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dashAgentName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  dashAgentCode: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    marginTop: 2,
  },
  signOutBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs + 2,
  },
  signOutText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  creditBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  creditLabel: {
    fontSize: FONT_SIZE.xs,
  },
  creditAmount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statBox: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  consoleBtn: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md - 2,
    alignItems: 'center',
  },
  consoleBtnText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
  },
});
