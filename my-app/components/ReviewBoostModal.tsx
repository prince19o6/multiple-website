import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useIsDark } from '@/store/ThemeContext';

interface ReviewBoostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (tourId: string, rating: number, reviewText: string, favoriteMoment: string) => Promise<void>;
}

export function ReviewBoostModal({ visible, onClose, onSubmit }: ReviewBoostModalProps) {
  const colors = useColors();
  const isDark = useIsDark();

  const [rating, setRating] = useState<number>(5);
  const [favoriteMoment, setFavoriteMoment] = useState<string>('');
  const [reviewText, setReviewText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!visible) return null;

  const handleSubmit = async () => {
    if (!reviewText.trim()) {
      Alert.alert('Review Required', 'Please share a brief sentence about your expedition experience.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit('expedition-primary-tour', rating, reviewText, favoriteMoment || 'Unforgettable memories');
      Alert.alert(
        'Points Credited!',
        '🌟 Thank you for your reflection! 250 VIP Loyalty Points have been credited to your account.'
      );
      setReviewText('');
      setFavoriteMoment('');
      onClose();
    } catch (e: any) {
      Alert.alert('Submission Error', e?.message || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView
          style={[
            styles.modalContent,
            { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.boosterBadge}>
                <Ionicons name="sparkles" size={14} color="#D97706" />
                <Text style={styles.boosterText}>+250 PTS BOOSTER</Text>
              </View>
              <Text style={[styles.headerTitle, { color: colors.heading }]}>
                Post-Trip Expedition Review
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          {/* Star Rating Selector */}
          <View style={styles.body}>
            <Text style={[styles.label, { color: colors.mutedText }]}>YOUR OVERALL EXPEDITION RATING</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starTouchable}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={36}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Favorite Moment Input */}
            <Text style={[styles.label, { color: colors.mutedText }]}>FAVORITE MOMENT / HIGHLIGHT</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  color: colors.text,
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
              placeholder="e.g. Sunset snorkeling at Maya Bay or bargaining in Chatuchak"
              placeholderTextColor="#94A3B8"
              value={favoriteMoment}
              onChangeText={setFavoriteMoment}
            />

            {/* Detailed Reflection */}
            <Text style={[styles.label, { color: colors.mutedText }]}>EXPEDITION REFLECTION & FEEDBACK</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  color: colors.text,
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
              placeholder="Share what made this journey unique, tour guide service, vehicle comfort, or hidden gem recommendations..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="rocket-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Submit & Unlock +250 Points</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  boosterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  boosterText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  body: {
    gap: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 8,
  },
  starTouchable: {
    padding: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    height: 90,
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
