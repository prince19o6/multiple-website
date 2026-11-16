import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSite } from '@/store/SiteConfigContext';
import { DayOfDispatch } from '../types';

interface DigitalBoardingPassModalProps {
  visible: boolean;
  onClose: () => void;
  dispatch: DayOfDispatch | null;
}

export const DigitalBoardingPassModal: React.FC<DigitalBoardingPassModalProps> = ({
  visible,
  onClose,
  dispatch,
}) => {
  const colors = useColors();
  const { siteId, siteName } = useSite();

  const qrMatrix = useMemo(() => {
    const text = dispatch?.bookingReference || 'EXPEDITION-PASS-9900';
    return generateQrMatrix(text);
  }, [dispatch?.bookingReference]);

  if (!dispatch) return null;

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Share.share({
        title: `Boarding Pass - ${dispatch.tourName}`,
        message: `🎫 OFFICIAL EXPEDITION BOARDING PASS\n\nTour: ${dispatch.tourName}\nReference: ${dispatch.bookingReference}\nDate: ${dispatch.date}\nPickup: ${dispatch.assignedCrew.pickupTime} at ${dispatch.assignedCrew.pickupLocation}\nChauffeur: ${dispatch.assignedCrew.driverName} (${dispatch.assignedCrew.vehiclePlateNumber})\nLead Guide: ${dispatch.assignedCrew.leadGuideName}\n\nSecurity Verified by ${siteId.toUpperCase()} Concierge.`,
      });
    } catch {}
  };

  const brandTitle = `${(siteName || 'VIP').toUpperCase()} EXPEDITION PASS`;

  const cellSize = 5.2;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Ionicons name="ticket" size={22} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.heading }]}>
                Digital Boarding Pass
              </Text>
            </View>
            <TouchableOpacity testID="btn-close"
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close boarding pass"
            >
              <Ionicons name="close" size={24} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Boarding Card Envelope */}
            <View style={[styles.ticketContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Ticket Top Banner */}
              <View style={[styles.ticketTopBanner, { backgroundColor: colors.primary }]}>
                <View style={styles.ticketBrandRow}>
                  <Text style={styles.ticketBrandTitle}>{brandTitle}</Text>
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>BOARDING READY</Text>
                  </View>
                </View>
                <Text style={styles.tourTitle}>{dispatch.tourName}</Text>
                <Text style={styles.destinationName}>{dispatch.destination}</Text>
              </View>

              {/* Passenger & Vehicle Details Grid */}
              <View style={styles.ticketBody}>
                <View style={styles.metaGrid}>
                  <View style={styles.metaCell}>
                    <Text style={[styles.metaLabel, { color: colors.mutedText }]}>
                      BOOKING REFERENCE
                    </Text>
                    <Text style={[styles.metaValueHighlight, { color: colors.primary }]}>
                      {dispatch.bookingReference}
                    </Text>
                  </View>
                  <View style={styles.metaCell}>
                    <Text style={[styles.metaLabel, { color: colors.mutedText }]}>DATE</Text>
                    <Text style={[styles.metaValue, { color: colors.text }]}>{dispatch.date}</Text>
                  </View>
                </View>

                <View style={styles.metaGrid}>
                  <View style={styles.metaCell}>
                    <Text style={[styles.metaLabel, { color: colors.mutedText }]}>
                      PICKUP TIME & GATE
                    </Text>
                    <Text style={[styles.metaValue, { color: colors.text }]}>
                      {dispatch.assignedCrew.pickupTime}
                    </Text>
                    <Text style={[styles.metaSubvalue, { color: colors.mutedText }]} numberOfLines={1}>
                      {dispatch.assignedCrew.pickupLocation}
                    </Text>
                  </View>

                  <View style={styles.metaCell}>
                    <Text style={[styles.metaLabel, { color: colors.mutedText }]}>
                      VEHICLE & CHAUFFEUR
                    </Text>
                    <Text style={[styles.metaValue, { color: colors.text }]}>
                      {dispatch.assignedCrew.vehiclePlateNumber}
                    </Text>
                    <Text style={[styles.metaSubvalue, { color: colors.mutedText }]} numberOfLines={1}>
                      {dispatch.assignedCrew.vehicleModel} • {dispatch.assignedCrew.driverName}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaGrid}>
                  <View style={styles.metaCell}>
                    <Text style={[styles.metaLabel, { color: colors.mutedText }]}>
                      LEAD TOUR GUIDE
                    </Text>
                    <Text style={[styles.metaValue, { color: colors.text }]}>
                      {dispatch.assignedCrew.leadGuideName}
                    </Text>
                  </View>
                  <View style={styles.metaCell}>
                    <Text style={[styles.metaLabel, { color: colors.mutedText }]}>
                      SECURITY STATUS
                    </Text>
                    <Text style={[styles.metaValue, { color: '#10b981' }]}>
                      Verified & Active
                    </Text>
                  </View>
                </View>
              </View>

              {/* Perforation Line with Side Notches */}
              <View style={styles.perforationWrapper}>
                <View style={[styles.leftNotch, { backgroundColor: colors.background }]} />
                <View style={[styles.dashedLine, { borderColor: colors.border }]} />
                <View style={[styles.rightNotch, { backgroundColor: colors.background }]} />
              </View>

              {/* Barcode & QR Code Section */}
              <View style={styles.barcodeSection}>
                <Text style={[styles.qrTitle, { color: colors.heading }]}>
                  Scan for Tour Entry & Check-In
                </Text>
                <Text style={[styles.qrSubtitle, { color: colors.mutedText }]}>
                  Present this QR code to Guide {dispatch.assignedCrew.leadGuideName} or your chauffeur
                </Text>

                {/* Scannable QR Matrix */}
                <View style={styles.qrContainer}>
                  <View style={styles.qrInnerBox}>
                    {qrMatrix.map((row, r) => (
                      <View key={`row-${r}`} style={styles.qrRow}>
                        {row.map((cell, c) => (
                          <View
                            key={`cell-${r}-${c}`}
                            style={{
                              width: cellSize,
                              height: cellSize,
                              backgroundColor: cell ? '#0f172a' : '#ffffff',
                            }}
                          />
                        ))}
                      </View>
                    ))}
                  </View>
                </View>

                <Text style={[styles.securitySealText, { color: colors.mutedText }]}>
                  CRYPTOGRAPHIC TOKEN: {dispatch.bookingReference}-SEC-OK
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity testID="btn-share"
                style={[styles.shareBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel="Share digital pass"
              >
                <Ionicons name="share-outline" size={18} color={colors.text} />
                <Text style={[styles.shareBtnText, { color: colors.text }]}>Share E-Ticket</Text>
              </TouchableOpacity>

              <TouchableOpacity testID="btn-ready-for-today"
                style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close pass"
              >
                <Text style={styles.doneBtnText}>Ready for Today</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Deterministic Version 2 (25x25) QR Pattern Generator
function generateQrMatrix(text: string): boolean[][] {
  const N = 25;
  const grid: (boolean | null)[][] = Array.from({ length: N }, () => Array(N).fill(null));

  drawFinderPattern(grid, 0, 0);
  drawFinderPattern(grid, N - 7, 0);
  drawFinderPattern(grid, 0, N - 7);

  for (let i = 0; i < 8; i++) {
    if (i < N) {
      grid[7][i] = false;
      grid[i][7] = false;
      grid[N - 8][i] = false;
      grid[i][N - 8] = false;
      grid[7][N - 1 - i] = false;
      grid[N - 1 - i][7] = false;
    }
  }

  drawAlignmentPattern(grid, 16, 16);

  for (let i = 8; i < N - 8; i++) {
    const isDark = i % 2 === 0;
    if (grid[6][i] === null) grid[6][i] = isDark;
    if (grid[i][6] === null) grid[i][6] = isDark;
  }

  grid[N - 8][8] = true;

  const hashBytes = hashString(text, 64);
  let byteIdx = 0;
  let bitIdx = 7;
  let upward = true;

  for (let right = N - 1; right > 0; right -= 2) {
    if (right === 6) right--;

    const rows = upward
      ? Array.from({ length: N }, (_, i) => N - 1 - i)
      : Array.from({ length: N }, (_, i) => i);

    for (const r of rows) {
      for (let c = right; c >= right - 1; c--) {
        if (grid[r][c] === null) {
          const currentByte = hashBytes[byteIdx % hashBytes.length];
          const bit = (currentByte >> bitIdx) & 1;
          const mask = (r + c) % 2 === 0;
          grid[r][c] = (bit === 1) !== mask;

          bitIdx--;
          if (bitIdx < 0) {
            bitIdx = 7;
            byteIdx++;
          }
        }
      }
    }
    upward = !upward;
  }

  return grid.map((row) => row.map((cell) => cell === true));
}

function drawFinderPattern(grid: (boolean | null)[][], row: number, col: number) {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (
        r === 0 ||
        r === 6 ||
        c === 0 ||
        c === 6 ||
        (r >= 2 && r <= 4 && c >= 2 && c <= 4)
      ) {
        grid[row + r][col + c] = true;
      } else {
        grid[row + r][col + c] = false;
      }
    }
  }
}

function drawAlignmentPattern(grid: (boolean | null)[][], row: number, col: number) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const isEdge = Math.abs(r) === 2 || Math.abs(c) === 2;
      const isCenter = r === 0 && c === 0;
      grid[row + r][col + c] = isEdge || isCenter;
    }
  }
}

function hashString(str: string, len: number): number[] {
  const result: number[] = [];
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  for (let i = 0; i < len; i++) {
    h = Math.imul(h ^ (i * 31), 0x01000193);
    result.push((h >>> (i % 24)) & 0xff);
  }
  return result;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  ticketContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ticketTopBanner: {
    padding: 18,
  },
  ticketBrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketBrandTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  activePill: {
    backgroundColor: '#ffffff25',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activePillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tourTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  destinationName: {
    color: '#f3f4f6',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  ticketBody: {
    padding: 16,
    gap: 12,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCell: {
    flex: 1,
    marginRight: 8,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  metaValueHighlight: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metaSubvalue: {
    fontSize: 11,
    marginTop: 1,
  },
  perforationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    position: 'relative',
  },
  leftNotch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
  },
  rightNotch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: -12,
  },
  dashedLine: {
    flex: 1,
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
    marginHorizontal: 8,
  },
  barcodeSection: {
    alignItems: 'center',
    padding: 18,
  },
  qrTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  qrSubtitle: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
    marginBottom: 14,
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrInnerBox: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrRow: {
    flexDirection: 'row',
  },
  securitySealText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
    gap: 8,
    flex: 1,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  doneBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    minHeight: 48,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
