import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VisaEntryStatus } from '../types';

interface VisaStatusBadgeProps {
  status: VisaEntryStatus;
  badgeText: string;
}

export const VisaStatusBadge: React.FC<VisaStatusBadgeProps> = ({ status, badgeText }) => {
  let bgColor = '#ecfdf5';
  let borderColor = '#a7f3d0';
  let textColor = '#047857';
  let iconName: 'shield-checkmark' | 'document-text' | 'time' | 'alert-circle' = 'shield-checkmark';

  if (status === 'Visa_Free') {
    bgColor = '#ecfdf5';
    borderColor = '#a7f3d0';
    textColor = '#047857';
    iconName = 'shield-checkmark';
  } else if (status === 'Visa_On_Arrival') {
    bgColor = '#eff6ff';
    borderColor = '#bfdbfe';
    textColor = '#1d4ed8';
    iconName = 'time';
  } else if (status === 'eVisa') {
    bgColor = '#f5f3ff';
    borderColor = '#ddd6fe';
    textColor = '#6d28d9';
    iconName = 'document-text';
  } else {
    bgColor = '#fff7ed';
    borderColor = '#fed7aa';
    textColor = '#c2410c';
    iconName = 'alert-circle';
  }

  return (
    <View style={[styles.badgeContainer, { backgroundColor: bgColor, borderColor }]}>
      <Ionicons name={iconName} size={14} color={textColor} />
      <Text style={[styles.badgeText, { color: textColor }]}>{badgeText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    gap: 5,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
