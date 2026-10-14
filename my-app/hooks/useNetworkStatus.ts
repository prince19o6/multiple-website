/**
 * hooks/useNetworkStatus.ts
 *
 * Wraps @react-native-community/netinfo to provide real-time online/offline
 * status. Replaces web's navigator.onLine.
 *
 * When the device reconnects, TanStack Query automatically refetches
 * stale queries (refetchOnReconnect: true in queryClient.ts).
 */

import { useState, useEffect } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean | null;
  connectionType: string | null;
  /** True while the first NetInfo check is in progress. */
  isLoading: boolean;
}

/**
 * Returns the current network connectivity status.
 *
 * @example
 *   const { isOnline } = useNetworkStatus();
 *   if (!isOnline) return <OfflineBanner />;
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,        // optimistic default
    isConnected: null,
    connectionType: null,
    isLoading: true,
  });

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

  return status;
}
