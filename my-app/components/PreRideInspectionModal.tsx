import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useDriveSafety } from '../context/DriveSafetyContext';

interface PreRideInspectionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PreRideInspectionModal: React.FC<PreRideInspectionModalProps> = ({
  visible,
  onClose,
}) => {
  const colors = useColors();
  const { hubData, completedSteps, toggleStepCompleted, resetChecklist } = useDriveSafety();

  const steps = hubData?.preRideChecklist || [];
  const totalCount = steps.length;
  const completedCount = steps.filter((s) => !!completedSteps[s.stepId]).length;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  const handleToggle = (stepId: string) => {
    toggleStepCompleted(stepId);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerTitleRow}>
                <Ionicons name="checkbox-outline" size={18} color="#0284c7" />
                <Text style={[styles.title, { color: colors.heading }]}>
                  Pre-Ride Inspection Wizard
                </Text>
              </View>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                Protect your deposit before leaving the rental shop
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.heading} />
            </TouchableOpacity>
          </View>

          {/* Progress Banner */}
          <View style={[styles.progressBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.heading }]}>
                Inspection Progress: {completedCount} of {totalCount} verified
              </Text>
              <Text style={[styles.progressPct, { color: colors.primary }]}>
                {totalCount ? Math.round((completedCount / totalCount) * 100) : 0}%
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: isAllDone ? '#10b981' : colors.primary,
                    width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Steps List */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {steps.map((step, idx) => {
              const isChecked = !!completedSteps[step.stepId];
              return (
                <TouchableOpacity
                  key={step.stepId}
                  style={[
                    styles.stepCard,
                    {
                      backgroundColor: isChecked ? '#f0fdf4' : colors.background,
                      borderColor: isChecked ? '#86efac' : colors.border,
                    },
                  ]}
                  onPress={() => handleToggle(step.stepId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.stepCheckboxWrap}>
                    <Ionicons
                      name={isChecked ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={isChecked ? '#16a34a' : colors.mutedText}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.stepTitleRow}>
                      <Text style={[styles.stepNum, { color: colors.mutedText }]}>
                        STEP {idx + 1}
                      </Text>
                      {step.requiresPhoto && (
                        <View style={styles.photoPill}>
                          <Ionicons name="camera-outline" size={10} color="#0284c7" />
                          <Text style={styles.photoPillText}>PHOTO REQUIRED</Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.stepTitle,
                        {
                          color: isChecked ? '#166534' : colors.heading,
                          textDecorationLine: isChecked ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {step.title}
                    </Text>
                    <Text style={[styles.stepDetail, { color: colors.mutedText }]}>
                      {step.detail}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Bottom Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.resetBtn, { borderColor: colors.border }]}
                onPress={resetChecklist}
              >
                <Ionicons name="refresh-outline" size={16} color={colors.mutedText} />
                <Text style={[styles.resetBtnText, { color: colors.mutedText }]}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.doneBtn,
                  { backgroundColor: isAllDone ? '#16a34a' : colors.primary },
                ]}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                  onClose();
                }}
              >
                <Ionicons
                  name={isAllDone ? 'checkmark-done' : 'checkmark'}
                  size={18}
                  color="#ffffff"
                />
                <Text style={styles.doneBtnText}>
                  {isAllDone ? 'Inspection Verified & Complete' : 'Save & Close'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  progressBox: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  stepCheckboxWrap: {
    paddingTop: 2,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  stepNum: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  photoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    gap: 3,
  },
  photoPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0369a1',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  stepDetail: {
    fontSize: 11,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  resetBtn: {
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  doneBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
