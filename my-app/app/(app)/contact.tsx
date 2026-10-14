/**
 * app/(app)/contact.tsx
 *
 * Contact & Concierge inquiry screen.
 * Displays contact info cards from site config and an interactive inquiry form.
 * The top navbar is rendered by the root (app)/_layout.tsx.
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import Footer from '@/components/Footer';

export default function ContactScreen() {
  const config = useSiteConfig();
  const colors = useColors();
  const headingFontFamily = getHeadingFontFamily(config);
  const contact = config?.contact || {};

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Required Fields', 'Please complete your name, email, and message.');
      return;
    }

    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
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
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: colors.heading, fontFamily: headingFontFamily },
            ]}
          >
            Get In Touch
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            Have questions about a tour or need a custom travel itinerary? Our concierge team is here to assist.
          </Text>
        </View>

        {/* Contact Info Cards */}
        <View style={styles.cardsRow}>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="mail-outline" size={24} color={colors.primary} />
            <Text style={[styles.infoLabel, { color: colors.mutedText }]}>Email Us</Text>
            <Text style={[styles.infoValue, { color: colors.heading }]}>
              {contact.email || 'concierge@toursapp.com'}
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="call-outline" size={24} color={colors.primary} />
            <Text style={[styles.infoLabel, { color: colors.mutedText }]}>Direct Line</Text>
            <Text style={[styles.infoValue, { color: colors.heading }]}>
              {contact.phone || '+1 (800) 555-TOUR'}
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="location-outline" size={24} color={colors.primary} />
            <Text style={[styles.infoLabel, { color: colors.mutedText }]}>Headquarters</Text>
            <Text style={[styles.infoValue, { color: colors.heading }]}>
              {contact.address || 'Global Tour Operations Hub'}
            </Text>
          </View>
        </View>

        {/* Inquiry Form */}
        <View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.heading }]}>Send Us A Message</Text>

          <Text style={[styles.inputLabel, { color: colors.heading }]}>Your Name</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="John Doe"
            placeholderTextColor={colors.mutedText}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.inputLabel, { color: colors.heading }]}>Email Address</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="john@example.com"
            placeholderTextColor={colors.mutedText}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.inputLabel, { color: colors.heading }]}>Subject</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="e.g. Custom Private Group Tour"
            placeholderTextColor={colors.mutedText}
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={[styles.inputLabel, { color: colors.heading }]}>Message</Text>
          <TextInput
            style={[styles.textArea, { borderColor: colors.border, color: colors.text }]}
            placeholder="Tell us what you have in mind..."
            placeholderTextColor={colors.mutedText}
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={sending}
            activeOpacity={0.88}
          >
            {sending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Inquiry</Text>
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
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
  },
  cardsRow: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  infoCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOW.sm,
  },
  infoLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  infoValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginTop: 2,
  },
  formContainer: {
    marginHorizontal: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.xl,
    ...SHADOW.md,
  },
  formTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    fontSize: FONT_SIZE.sm,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
    fontSize: FONT_SIZE.sm,
    minHeight: 90,
  },
  submitBtn: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});
