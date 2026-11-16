import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ScreenTorchModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ScreenTorchModal: React.FC<ScreenTorchModalProps> = ({
  visible,
  onClose,
}) => {
  const [isSosMode, setIsSosMode] = useState<boolean>(false);
  const [isTorchWhite, setIsTorchWhite] = useState<boolean>(true);
  const strobeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      if (strobeTimerRef.current) clearInterval(strobeTimerRef.current);
      setIsSosMode(false);
      setIsTorchWhite(true);
      return;
    }

    if (isSosMode) {
      // Toggle flashing on/off every 250ms
      strobeTimerRef.current = setInterval(() => {
        setIsTorchWhite((prev) => !prev);
      }, 250);
    } else {
      if (strobeTimerRef.current) clearInterval(strobeTimerRef.current);
      setIsTorchWhite(true);
    }

    return () => {
      if (strobeTimerRef.current) clearInterval(strobeTimerRef.current);
    };
  }, [visible, isSosMode]);

  const toggleSos = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setIsSosMode(!isSosMode);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View
        style={[
          styles.fullScreen,
          { backgroundColor: isTorchWhite ? '#ffffff' : '#000000' },
        ]}
      >
        {/* Floating Controls at Bottom */}
        <View style={styles.floatingControls}>
          <TouchableOpacity testID="btn-sos" accessibilityLabel="Sos"
            style={[
              styles.controlBtn,
              { backgroundColor: isSosMode ? '#dc2626' : 'rgba(0,0,0,0.7)' },
            ]}
            onPress={toggleSos}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isSosMode ? 'warning' : 'flash-outline'}
              size={20}
              color="#ffffff"
            />
            <Text style={styles.controlBtnText}>
              {isSosMode ? 'SOS STROBE ON' : 'SOS Emergency Strobe'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity testID="btn-close" accessibilityLabel="Close"
            style={[styles.closeBtn, { backgroundColor: 'rgba(0,0,0,0.7)' }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Info Text in Center if Screen is Black */}
        {!isTorchWhite && (
          <View style={styles.centerAlert}>
            <Text style={styles.centerAlertText}>EMERGENCY SOS FLASHING</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  floatingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  controlBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  centerAlert: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
  },
  centerAlertText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
