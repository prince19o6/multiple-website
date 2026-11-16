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
import {
  login as apiLogin,
  register as apiRegister,
  forgotPassword as apiForgotPassword,
  resetPassword as apiResetPassword,
  verifyEmail as apiVerifyEmail,
  resendVerification as apiResendVerification,
  refreshSession as apiRefreshSession,
  getMe as apiGetMe,
  updateProfile as apiUpdateProfile,
  changePassword as apiChangePassword,
  deleteAccount as apiDeleteAccount,
  logout as apiLogout,
} from '@/services/api';
import { ENV } from '@/src/config/env';
import {
  secureGet,
  secureSet,
  storeGetObject,
  storeSetObject,
  clearAuthStorage,
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
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; claimedBookings?: number; message?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; message?: string }>;
  refreshSession: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updated: Partial<User>) => Promise<void>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<{ success: boolean; message?: string }>;
  deleteAccount: (password: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => ({ tokenSaved: false }),
  forgotPassword: async () => ({ success: false, message: '' }),
  resetPassword: async () => ({ success: false, message: '' }),
  verifyEmail: async () => ({ success: false }),
  resendVerification: async () => ({ success: false }),
  refreshSession: async () => false,
  logout: async () => {},
  updateProfile: async () => {},
  changePassword: async () => ({ success: false }),
  deleteAccount: async () => ({ success: false }),
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
        await migrateLegacyStorage(ENV.siteId);

        const storedToken = await secureGet('auth.token');
        const storedUser = await storeGetObject<User>('auth.user');

        if (!cancelled && storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          console.log(`[DEBUG] [AuthContext] Restored active session for site: ${ENV.siteId} (${storedUser.email})`);

          // Background sync profile from /api/auth/me
          apiGetMe()
            .then((freshUser) => {
              if (!cancelled && freshUser?.id) {
                setUser(freshUser);
                storeSetObject('auth.user', freshUser);
              }
            })
            .catch(() => {});
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

  const resetPassword = useCallback(
    async (rToken: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
      return apiResetPassword(rToken, newPassword);
    },
    []
  );

  const verifyEmail = useCallback(
    async (vToken: string): Promise<{ success: boolean; claimedBookings?: number; message?: string }> => {
      const res = await apiVerifyEmail(vToken);
      if (res.success && user) {
        const updated = { ...user, isEmailVerified: true };
        setUser(updated);
        await storeSetObject('auth.user', updated);
      }
      return res;
    },
    [user]
  );

  const resendVerification = useCallback(
    async (vEmail: string): Promise<{ success: boolean; message?: string }> => {
      return apiResendVerification(vEmail);
    },
    []
  );

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const success = await apiRefreshSession();
    if (success) {
      const refreshedToken = await secureGet('auth.token');
      const refreshedUser = await storeGetObject<User>('auth.user');
      setToken(refreshedToken);
      setUser(refreshedUser);
    }
    return success;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setToken(null);
    setUser(null);

    try {
      await apiLogout().catch(() => {});
      await clearAuthStorage(ENV.siteId);
      console.log(`[DEBUG] [AuthContext] Logged out from site: ${ENV.siteId}`);
    } catch (err: unknown) {
      console.warn('[DEBUG] [AuthContext] Error during logout cleanup:', err);
    } finally {
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (updated: Partial<User>): Promise<void> => {
      if (!user) return;
      const responseUser = await apiUpdateProfile({
        fullName: updated.fullName || updated.name || user.fullName || user.name,
        phoneCountryCode: updated.phoneCountryCode || user.phoneCountryCode,
        phone: updated.phone || user.phone,
        dietaryPreference: updated.dietaryPreference || user.dietaryPreference,
        preferredCurrency: updated.preferredCurrency || user.preferredCurrency,
        marketingOptIn: updated.marketingOptIn ?? user.marketingOptIn,
      });

      const newUser = { ...user, ...responseUser };
      await storeSetObject('auth.user', newUser);
      setUser(newUser);
    },
    [user]
  );

  const changePassword = useCallback(
    async (data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message?: string }> => {
      return apiChangePassword(data);
    },
    []
  );

  const deleteAccount = useCallback(
    async (password: string): Promise<{ success: boolean; message?: string }> => {
      const res = await apiDeleteAccount(password);
      setToken(null);
      setUser(null);
      return res;
    },
    []
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
        resetPassword,
        verifyEmail,
        resendVerification,
        refreshSession,
        logout,
        updateProfile,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
