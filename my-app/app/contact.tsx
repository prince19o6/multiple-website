/**
 * app/contact.tsx
 *
 * Contact & Concierge inquiry screen.
 * Displays contact info cards from site config and an interactive inquiry form.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useConcierge } from '@/context/ConciergeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import AppHeader from '@/components/common/AppHeader';
import Footer from '@/components/Footer';

export default function ContactScreen() {
  const router = useRouter();
  const config = useSiteConfig();
  const colors = useColors();
  const { openConcierge, specialist } = useConcierge();
  const headingFontFamily = getHeadingFontFamily(config);
  const contact = config?.contact || {};

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Required Fields', 'Please complete your name, email, and message.');
      return;
    }

    setSending(true);
    setTimeout(() => {
      setSending(false);
      Alert.alert(
        'Inquiry Received',
        `Thank you ${name}! Our travel specialists will review your message and reply via ${email} within 24 hours.`
      );
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 800);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Contact & Concierge"
        showBackButton
        onBackPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)');
          }
        }}
      />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Contact Info Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.heading, fontFamily: headingFontFamily }]}>
            How Can We Assist You?
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            Our travel concierges are available 24/7 to assist with bookings, custom itineraries, and reservations.
          </Text>
        </View>

        {/* ─── Live Concierge Specialist Showcase ─── */}
        <View style={[styles.specialistCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.specialistCardLeft}>
            <View style={styles.specialistAvatarBox}>
              <Image source={{ uri: specialist.avatarUrl }} style={styles.specialistAvatar} />
              <View style={[styles.specialistOnlineDot, { borderColor: colors.surface }]} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.specialistNameText, { color: colors.heading }]}>
                  {specialist.specialistName}
                </Text>
                <View style={styles.onlineBadge}>
                  <Text style={styles.onlineBadgeText}>ONLINE NOW</Text>
                </View>
              </View>
              <Text style={[styles.specialistRoleText, { color: colors.mutedText }]} numberOfLines={1}>
                {specialist.role}
              </Text>
            </View>
          </View>

          <TouchableOpacity testID="btn-chatbubbles"
            style={[styles.specialistChatBtn, { backgroundColor: colors.primary }]}
            onPress={() => openConcierge()}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Start live chat with ${specialist.specialistName}`}
          >
            <Ionicons name="chatbubbles" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.specialistChatBtnText}>Start Live Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Cards */}
        <View style={styles.cardsRow}>
          {Boolean(contact.phone) && (
            <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.cardIconBox, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="call-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.cardLabel, { color: colors.mutedText }]}>Call Us</Text>
              <Text style={[styles.cardVal, { color: colors.heading }]}>{contact.phone}</Text>
            </View>
          )}

          {Boolean(contact.email) && (
            <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.cardIconBox, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="mail-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.cardLabel, { color: colors.mutedText }]}>Email Us</Text>
              <Text style={[styles.cardVal, { color: colors.heading }]}>{contact.email}</Text>
            </View>
          )}

          {Boolean(contact.address) && (
            <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.cardIconBox, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="location-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.cardLabel, { color: colors.mutedText }]}>Headquarters</Text>
              <Text style={[styles.cardVal, { color: colors.heading }]}>{contact.address}</Text>
            </View>
          )}
        </View>

        {/* Inquiry Form */}
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.formHeading, { color: colors.heading, fontFamily: headingFontFamily }]}>
            Send Concierge Message
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Full Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. Eleanor Vance"
              placeholderTextColor={colors.mutedText}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Email Address *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. eleanor@example.com"
              placeholderTextColor={colors.mutedText}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Subject</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. Custom Expedition Planning"
              placeholderTextColor={colors.mutedText}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Message *</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
              ]}
              placeholder="How can our guides assist your travel aspirations?"
              placeholderTextColor={colors.mutedText}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity testID="btn-submit-message" accessibilityLabel="Submit Message"
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Message</Text>
            )}
          </TouchableOpacity>
        </View>

        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  cardsRow: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  contactCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    ...SHADOW.sm,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  cardVal: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    flexShrink: 1,
  },
  formCard: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    ...SHADOW.md,
  },
  formHeading: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: FONT_SIZE.sm,
  },
  textArea: {
    minHeight: 100,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    ...SHADOW.sm,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  specialistCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOW.sm,
  },
  specialistCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  specialistAvatarBox: {
    position: 'relative',
  },
  specialistAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  specialistOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#10b981',
    borderWidth: 2,
  },
  specialistNameText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  specialistRoleText: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  onlineBadge: {
    backgroundColor: '#10b98120',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  onlineBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
  },
  specialistChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  specialistChatBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});
