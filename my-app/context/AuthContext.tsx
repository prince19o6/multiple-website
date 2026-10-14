/**
 * context/AuthContext.tsx
 *
 * Authentication context for native mobile companion.
 * Manages user session state, persists tokens securely via the central storage module,
 * and routes authentication operations through the unified API client.
 * Tokens and user profiles are strictly isolated per website tenant.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, AuthState, RegisterRequest } from '@/types';
import { login as apiLogin, register as apiRegister, forgotPassword as apiForgotPassword } from '@/services/api';
import { ENV } from '@/src/config/env';
import {
  secureGet,
  secureSet,
  secureDelete,
  storeGetObject,
  storeSetObject,
  storeRemove,
  migrateLegacyStorage,
} from '@/src/lib/storage';

export interface RegisterResult {
  tokenSaved: boolean;
  user?: User;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (
    dataOrName: RegisterRequest | string,
    email?: string,
    password?: string,
    phone?: string
  ) => Promise<RegisterResult>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateProfile: (updated: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => ({ tokenSaved: false }),
  forgotPassword: async () => ({ success: false, message: '' }),
  logout: async () => {},
  updateProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount (strictly tenant-scoped)
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        // Run migration for existing sessions stored under old key names
        await migrateLegacyStorage(ENV.siteId);

        const storedToken = await secureGet('auth.token');
        const storedUser = await storeGetObject<User>('auth.user');

        if (!cancelled && storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          console.log(`[DEBUG] [AuthContext] Restored active session for site: ${ENV.siteId} (${storedUser.email})`);
        }
      } catch (err: unknown) {
        console.warn('[DEBUG] [AuthContext] Failed to restore auth session:', err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiLogin({ email, password });

      if (response.token) {
        await secureSet('auth.token', response.token);
      }
      if (response.user && Object.keys(response.user).length > 0) {
        await storeSetObject('auth.user', response.user);
      }

      setToken(response.token || null);
      setUser(response.user || null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (
      dataOrName: RegisterRequest | string,
      email?: string,
      password?: string,
      phone?: string
    ): Promise<RegisterResult> => {
      setIsLoading(true);
      try {
        const payload: RegisterRequest =
          typeof dataOrName === 'string'
            ? { name: dataOrName, email: email || '', password: password || '', phone }
            : dataOrName;

        const response = await apiRegister(payload);

        let tokenSaved = false;
        try {
          if (response.token) {
            const saveRes = await secureSet('auth.token', response.token);
            tokenSaved = saveRes.success;
          }
          if (response.user && Object.keys(response.user).length > 0) {
            await storeSetObject('auth.user', response.user);
          }
        } catch (storageErr: unknown) {
          console.warn('[DEBUG] [AuthContext] Failed to save session token after registration:', storageErr);
          tokenSaved = false;
        }

        if (tokenSaved && response.token) {
          setToken(response.token);
          setUser(response.user || null);
        }

        return {
          tokenSaved,
          user: response.user,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const forgotPassword = useCallback(
    async (email: string): Promise<{ success: boolean; message: string }> => {
      return apiForgotPassword(email);
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await secureDelete('auth.token');
      await secureDelete('auth.refresh_token');
      await storeRemove('auth.user');

      setToken(null);
      setUser(null);
      console.log(`[DEBUG] [AuthContext] Logged out from site: ${ENV.siteId}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (updated: Partial<User>): Promise<void> => {
      if (!user) return;
      const newUser = { ...user, ...updated };
      await storeSetObject('auth.user', newUser);
      setUser(newUser);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        forgotPassword,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
