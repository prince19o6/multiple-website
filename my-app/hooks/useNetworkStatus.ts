/**
 * hooks/useNetworkStatus.ts
 *
 * Wraps @react-native-community/netinfo to provide real-time online/offline
 * status. Replaces web's navigator.onLine.
 *
 * Provides reactive connectivity monitoring and manual checkStatus helper.
 * When the device reconnects, TanStack Query automatically refetches
 * stale queries (refetchOnReconnect: true in queryClient.ts).
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean | null;
  connectionType: string | null;
  /** True while the first NetInfo check is in progress. */
  isLoading: boolean;
  /** Manually refresh network connectivity state. */
  checkStatus: () => Promise<boolean>;
}

/**
 * Returns the current network connectivity status.
 *
 * @example
 *   const { isOnline, checkStatus } = useNetworkStatus();
 *   if (!isOnline) return <OfflineBanner />;
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<Omit<NetworkStatus, 'checkStatus'>>({
    isOnline: true, // optimistic default
    isConnected: null,
    connectionType: null,
    isLoading: true,
  });

  const checkStatus = useCallback(async (): Promise<boolean> => {
    try {
      const state = await NetInfo.fetch();
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setStatus({
        isOnline: online,
        isConnected: state.isConnected,
        connectionType: state.type,
        isLoading: false,
      });
      return online;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    // Fetch current state immediately
    NetInfo.fetch()
      .then((state: NetInfoState) => {
        setStatus({
          isOnline: state.isConnected === true && state.isInternetReachable !== false,
          isConnected: state.isConnected,
          connectionType: state.type,
          isLoading: false,
        });
      })
      .catch(() => {
        setStatus({
          isOnline: true,
          isConnected: true,
          connectionType: 'unknown',
          isLoading: false,
        });
      });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isOnline: state.isConnected === true && state.isInternetReachable !== false,
        isConnected: state.isConnected,
        connectionType: state.type,
        isLoading: false,
      });
    });

    return unsubscribe;
  }, []);

  return {
    ...status,
    checkStatus,
  };
}
