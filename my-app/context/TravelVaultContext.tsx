import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import { VaultDocument, EmergencyDirectoryResponse } from '../types';
import { fetchEmergencyDirectory } from '../services/api';
import { storeGetObject, storeSetObject } from '../src/lib/storage';

interface TravelVaultContextType {
  documents: VaultDocument[];
  emergencyDirectory: EmergencyDirectoryResponse | null;
  isLoading: boolean;
  expiringSoonCount: number;
  addDocument: (doc: Omit<VaultDocument, 'id' | 'createdAt'>) => Promise<void>;
  updateDocument: (id: string, patch: Partial<VaultDocument>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  refreshEmergencyDirectory: () => Promise<void>;
}

const TravelVaultContext = createContext<TravelVaultContextType | undefined>(undefined);

const getStorageKey = (siteId: string) => `@toursapp_vault_docs:${siteId}`;

export const TravelVaultProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [emergencyDirectory, setEmergencyDirectory] = useState<EmergencyDirectoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load documents from AsyncStorage
  useEffect(() => {
    let isMounted = true;
    const storageKey = getStorageKey(siteId);

    storeGetObject<VaultDocument[]>(storageKey)
      .then((stored) => {
        if (!isMounted) return;
        if (stored && stored.length > 0) {
          setDocuments(stored);
        } else {
          // Pre-seed initial sample passport & travel insurance document
          const sampleDocs: VaultDocument[] = [
            {
              id: `doc_sample_1`,
              type: 'passport',
              title: 'Primary International Passport',
              documentNumber: 'Z5892341',
              holderName: 'Traveler Explorer',
              expiryDate: '2030-08-15',
              issuingCountry: siteId.includes('tripgo') ? 'Thailand' : siteId.includes('techno') ? 'United Arab Emirates' : 'India',
              notes: 'Biometric E-Passport with 10-year validity.',
              createdAt: new Date().toISOString(),
            },
            {
              id: `doc_sample_2`,
              type: 'insurance',
              title: 'Global Comprehensive Travel Policy',
              documentNumber: 'POL-99201844-EXP',
              holderName: 'Traveler Explorer',
              expiryDate: '2027-12-31',
              issuingCountry: 'Allianz Global Assistance',
              notes: '$100,000 emergency evacuation & hospital cashless cover.',
              createdAt: new Date().toISOString(),
            },
          ];
          setDocuments(sampleDocs);
          storeSetObject(storageKey, sampleDocs);
        }
      })
      .catch(() => {
        // storage fallback
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [siteId]);

  // Load emergency directory from backend
  const loadEmergencyData = useCallback(async () => {
    try {
      const data = await fetchEmergencyDirectory(siteId);
      if (data) {
        setEmergencyDirectory(data);
      }
    } catch {
      // offline fallback
    }
  }, [siteId]);

  useEffect(() => {
    loadEmergencyData();
  }, [loadEmergencyData]);

  const addDocument = useCallback(
    async (doc: Omit<VaultDocument, 'id' | 'createdAt'>) => {
      const storageKey = getStorageKey(siteId);
      const newDoc: VaultDocument = {
        ...doc,
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
      };

      const updated = [newDoc, ...documents];
      setDocuments(updated);
      await storeSetObject(storageKey, updated);

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics fallback
      }
    },
    [documents, siteId]
  );

  const updateDocument = useCallback(
    async (id: string, patch: Partial<VaultDocument>) => {
      const storageKey = getStorageKey(siteId);
      const updated = documents.map((d) => (d.id === id ? { ...d, ...patch } : d));
      setDocuments(updated);
      await storeSetObject(storageKey, updated);

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics fallback
      }
    },
    [documents, siteId]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      const storageKey = getStorageKey(siteId);
      const updated = documents.filter((d) => d.id !== id);
      setDocuments(updated);
      await storeSetObject(storageKey, updated);

      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        // Haptics fallback
      }
    },
    [documents, siteId]
  );

  // Compute expiring soon count (within 90 days)
  const expiringSoonCount = useMemo(() => {
    const now = new Date();
    const threshold = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    return documents.filter((d) => {
      if (!d.expiryDate) return false;
      const exp = new Date(d.expiryDate);
      return exp > now && exp <= threshold;
    }).length;
  }, [documents]);

  return (
    <TravelVaultContext.Provider
      value={{
        documents,
        emergencyDirectory,
        isLoading,
        expiringSoonCount,
        addDocument,
        updateDocument,
        deleteDocument,
        refreshEmergencyDirectory: loadEmergencyData,
      }}
    >
      {children}
    </TravelVaultContext.Provider>
  );
};

export const useTravelVault = (): TravelVaultContextType => {
  const context = useContext(TravelVaultContext);
  if (!context) {
    throw new Error('useTravelVault must be used within a TravelVaultProvider');
  }
  return context;
};
