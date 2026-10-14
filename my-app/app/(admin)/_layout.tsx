/**
 * app/(admin)/_layout.tsx
 *
 * Layout for the (admin) route group.
 * Provides a clean admin navigation bar with back/exit to user app and logout action.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { storeGet, storeSet, storeRemove, secureGet, secureSet, secureDelete } from '@/src/lib/storage';
import { Ionicons } from '@expo/vector-icons';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { getSiteEntry } from '@/constants/siteRegistry';
import type { User } from '@/types';
import BrandLogo from '@/components/common/BrandLogo';

interface AdminAuthContextType {
  isAdminLoggedIn: boolean;
  loginAdmin: (token: string, user: User | null) => Promise<void>;
  logoutAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAdminLoggedIn: false,
  loginAdmin: async () => {},
  logoutAdmin: async () => {},
});

export const useAdminAuth = () => useContext(AdminAuthContext);

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { siteId } = useSelectedSite();
  const currentSite = getSiteEntry(siteId);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const tenantSiteId =
    siteId === 'website2'
      ? 'tripgoasia'
      : siteId === 'website3'
      ? 'technoheaven'
      : siteId === 'website1'
      ? 'gujjutours'
      : siteId || 'gujjutours';

  useEffect(() => {
    (async () => {
      try {
        const secureToken = await secureGet('admin.token', tenantSiteId);
        const asyncToken = await storeGet('admin.token', tenantSiteId);
        const activeToken = secureToken || asyncToken || null;
        const isValid = !!activeToken && activeToken !== 'demo-admin-token-12345';
        setIsAdminLoggedIn(isValid);
      } catch {
        setIsAdminLoggedIn(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [tenantSiteId]);

  const loginAdmin = async (token: string, user: User | null) => {
    await secureSet('admin.token', token, tenantSiteId);
    await storeSet('admin.token', token, tenantSiteId);
    if (user) {
      await storeSet('admin.user', JSON.stringify(user), tenantSiteId);
    }
    setIsAdminLoggedIn(true);
  };

  const logoutAdmin = async () => {
    await secureDelete('admin.token', tenantSiteId);
    await storeRemove('admin.token', tenantSiteId);
    await storeRemove('admin.user', tenantSiteId);
    setIsAdminLoggedIn(false);
    router.replace('/(admin)/login');
  };

  return (
    <AdminAuthContext.Provider value={{ isAdminLoggedIn, loginAdmin, logoutAdmin }}>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '700' },
          headerLeft: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 10 }}>
              <TouchableOpacity
                onPress={() => router.replace('/(tabs)')}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Ionicons name="arrow-back" size={20} color="#94a3b8" />
                <Text style={{ color: '#94a3b8', fontSize: 13, marginLeft: 4, fontWeight: '600' }}>
                  Exit
                </Text>
              </TouchableOpacity>
              <BrandLogo size="xs" width={90} forceDark={true} />
            </View>
          ),
          headerRight: () =>
            isAdminLoggedIn && pathname !== '/(admin)/login' ? (
              <TouchableOpacity
                onPress={logoutAdmin}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontSize: 12, marginLeft: 4, fontWeight: '700' }}>
                  Logout
                </Text>
              </TouchableOpacity>
            ) : null,
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Admin Overview' }} />
        <Stack.Screen
          name="login"
          options={{
            title: 'Admin Authentication',
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.replace('/(app)')}
                style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}
              >
                <Ionicons name="arrow-back" size={20} color="#94a3b8" />
                <Text style={{ color: '#94a3b8', fontSize: 13, marginLeft: 4, fontWeight: '600' }}>
                  Back to App
                </Text>
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen name="tours" options={{ title: 'Tour Catalog Management' }} />
        <Stack.Screen name="bookings" options={{ title: 'Booking Reservations' }} />
        <Stack.Screen name="users" options={{ title: 'User Management' }} />
        <Stack.Screen name="analytics" options={{ title: 'Performance Analytics' }} />
      </Stack>
    </AdminAuthContext.Provider>
  );
}
