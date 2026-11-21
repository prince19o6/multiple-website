import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Share, Alert, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import { AirportTransfer } from '../types';
import { fetchActiveTransfer, updateTransferStatus } from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

interface FlightTransferContextType {
  transfer: AirportTransfer | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isPlacardModalVisible: boolean;
  openPlacardModal: () => void;
  closePlacardModal: () => void;
  refreshTransfer: () => Promise<void>;
  updateStatus: (status: string) => Promise<void>;
  shareTransferDetails: () => Promise<void>;
  callChauffeur: () => void;
  whatsappChauffeur: () => void;
}

const FlightTransferContext = createContext<FlightTransferContextType | undefined>(undefined);

const getTransferStatusKey = (siteId: string) => `@toursapp_transfer_status:${siteId}`;

export const FlightTransferProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [transfer, setTransfer] = useState<AirportTransfer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isPlacardModalVisible, setIsPlacardModalVisible] = useState<boolean>(false);

  const loadTransferData = useCallback(async () => {
    try {
      const [fetchedTransfer, cachedStatus] = await Promise.all([
        fetchActiveTransfer(undefined, siteId).catch(() => null),
        storeGet(getTransferStatusKey(siteId)).catch(() => null),
      ]);

      if (fetchedTransfer) {
        if (cachedStatus) {
          fetchedTransfer.transferStatus = cachedStatus;
        }
        setTransfer(fetchedTransfer);
      }
    } catch (err) {
      console.error('[FlightTransferContext] Error loading airport transfer:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [siteId]);

  useEffect(() => {
    setIsLoading(true);
    loadTransferData();
  }, [loadTransferData]);

  const refreshTransfer = useCallback(async () => {
    setIsRefreshing(true);
    await loadTransferData();
  }, [loadTransferData]);

  const openPlacardModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsPlacardModalVisible(true);
  }, []);

  const closePlacardModal = useCallback(() => {
    setIsPlacardModalVisible(false);
  }, []);

  const updateStatus = useCallback(
    async (status: string) => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setTransfer((prev) => (prev ? { ...prev, transferStatus: status } : prev));
        // Immediately persist locally for instantaneous UX
        await storeSet(getTransferStatusKey(siteId), status);
        updateTransferStatus(
          {
            transferId: transfer?.transferId,
            status,
          },
          siteId
        ).catch((err) => {
          if (__DEV__) {
            console.log('[FlightTransferContext] Status saved locally; backend sync note:', err?.message || err);
          }
        });
      } catch (err) {
        console.error('[FlightTransferContext] Error updating status:', err);
      }
    },
    [siteId, transfer?.transferId]
  );

  const shareTransferDetails = useCallback(async () => {
    if (!transfer) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const message =
        `✈️ FLIGHT & AIRPORT CHAUFFEUR MEET & GREET\n` +
        `-----------------------------------------\n` +
        `Flight: ${transfer.flight.airline} ${transfer.flight.flightNumber} (${transfer.flight.status})\n` +
        `Route: ${transfer.flight.originCity} (${transfer.flight.originAirportCode}) ➔ ${transfer.flight.destCity} (${transfer.flight.destAirportCode})\n` +
        `Arrival Terminal: ${transfer.flight.terminal} • Gate: ${transfer.flight.gate} • Baggage: ${transfer.flight.baggageCarousel}\n\n` +
        `🚗 Private Chauffeur: ${transfer.chauffeurName} (${transfer.chauffeurPhone})\n` +
        `Vehicle: ${transfer.vehicleModel} (${transfer.vehiclePlateNumber})\n` +
        `Meeting Point: ${transfer.pickupMeetingPoint}\n` +
        `Waiting Bay: ${transfer.waitingBay}\n` +
        `Digital Signboard: "${transfer.digitalPagingBoardText}"\n` +
        `24/7 Airport Hotline: ${transfer.emergencyTransferHotline}`;

      await Share.share({
        title: `Airport Transfer Details - ${transfer.guestName}`,
        message,
      });
    } catch (err) {
      console.error('[FlightTransferContext] Error sharing transfer details:', err);
    }
  }, [transfer]);

  const callChauffeur = useCallback(() => {
    if (!transfer?.chauffeurPhone) {
      Alert.alert('Contact', 'No chauffeur phone number available.');
      return;
    }
    Linking.openURL(`tel:${transfer.chauffeurPhone}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate phone call.');
    });
  }, [transfer?.chauffeurPhone]);

  const whatsappChauffeur = useCallback(() => {
    if (!transfer?.chauffeurPhone) {
      Alert.alert('Contact', 'No chauffeur phone number available.');
      return;
    }
    const cleanPhone = transfer.chauffeurPhone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${transfer.chauffeurName}, I have arrived for booking #${transfer.bookingReference} (${transfer.guestName}). I am at ${transfer.pickupMeetingPoint}.`
    );
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${text}`).catch(() => {
      Alert.alert('Error', 'Unable to open WhatsApp.');
    });
  }, [transfer]);

  const value = useMemo(
    () => ({
      transfer,
      isLoading,
      isRefreshing,
      isPlacardModalVisible,
      openPlacardModal,
      closePlacardModal,
      refreshTransfer,
      updateStatus,
      shareTransferDetails,
      callChauffeur,
      whatsappChauffeur,
    }),
    [
      transfer,
      isLoading,
      isRefreshing,
      isPlacardModalVisible,
      openPlacardModal,
      closePlacardModal,
      refreshTransfer,
      updateStatus,
      shareTransferDetails,
      callChauffeur,
      whatsappChauffeur,
    ]
  );

  return (
    <FlightTransferContext.Provider value={value}>
      {children}
    </FlightTransferContext.Provider>
  );
};

export const useFlightTransfer = (): FlightTransferContextType => {
  const context = useContext(FlightTransferContext);
  if (!context) {
    throw new Error('useFlightTransfer must be used within a FlightTransferProvider');
  }
  return context;
};
