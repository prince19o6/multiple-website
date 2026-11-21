"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from "./schemas";

export interface AuthUser {
  id: string;
  userCode?: string;
  fullName: string;
  email: string;
  phoneCountryCode?: string;
  phone?: string;
  role: string;
  isEmailVerified: boolean;
  dietaryPreference?: string;
  preferredCurrency?: string;
  marketingOptIn?: boolean;
  termsAcceptedAt?: string;
  createdAt?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  siteId: string;
  getAccessToken: () => string | null;
  login: (input: LoginInput) => Promise<{ success: boolean; error?: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  verifyEmail: (token: string) => Promise<{ success: boolean; claimedBookings?: number; error?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (input: ForgotPasswordInput) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (input: ResetPasswordInput) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (input: UpdateProfileInput) => Promise<{ success: boolean; error?: string }>;
  changePassword: (input: ChangePasswordInput) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: (password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialSiteId = "gujjutours",
}: {
  children: ReactNode;
  initialSiteId?: string;
}) {
  const params = useParams();
  const router = useRouter();

  const siteId =
    (params?.site as string) ||
    initialSiteId ||
    "gujjutours";

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isRefreshingRef = useRef<boolean>(false);

  const tokenKey = `auth_token_${siteId}`;
  const refreshKey = `auth_refresh_${siteId}`;
  const userKey = `auth_user_${siteId}`;

  // Helper to get stored access token
  const getAccessToken = useCallback(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(tokenKey);
  }, [tokenKey]);

  // Helper to persist auth payload
  const persistAuth = useCallback(
    (userData: AuthUser, accessToken: string, refreshToken?: string) => {
      if (typeof window === "undefined") return;
      localStorage.setItem(tokenKey, accessToken);
      if (refreshToken) {
        localStorage.setItem(refreshKey, refreshToken);
      }
      localStorage.setItem(userKey, JSON.stringify(userData));

      // Also set fallback keys for legacy compatibility
      localStorage.setItem("customer_user", JSON.stringify({ name: userData.fullName, email: userData.email }));
      localStorage.setItem("customer_email", userData.email);

      // Set cookie for Next.js SSR / API routes
      document.cookie = `${tokenKey}=${encodeURIComponent(accessToken)}; path=/; max-age=604800; SameSite=Lax`;
      if (refreshToken) {
        document.cookie = `${refreshKey}=${encodeURIComponent(refreshToken)}; path=/; max-age=2592000; SameSite=Lax`;
      }

      setUser(userData);
      window.dispatchEvent(new CustomEvent("tours_auth_changed", { detail: { siteId, user: userData } }));
      window.dispatchEvent(new CustomEvent("storage"));
    },
    [refreshKey, tokenKey, userKey, siteId]
  );

  // Helper to clear auth
  const clearAuth = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(refreshKey);
    localStorage.removeItem(userKey);
    localStorage.removeItem("customer_user");
    localStorage.removeItem("customer_email");

    document.cookie = `${tokenKey}=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `${refreshKey}=; path=/; max-age=0; SameSite=Lax`;

    setUser(null);
    window.dispatchEvent(new CustomEvent("tours_auth_changed", { detail: { siteId, user: null } }));
    window.dispatchEvent(new CustomEvent("storage"));
  }, [refreshKey, tokenKey, userKey, siteId]);

  // Refresh access token using refresh token
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if (isRefreshingRef.current) return false;

    const rToken = localStorage.getItem(refreshKey);
    if (!rToken) {
      clearAuth();
      return false;
    }

    try {
      isRefreshingRef.current = true;
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Website-Id": siteId,
        },
        body: JSON.stringify({ refreshToken: rToken, siteId }),
      });

      if (!res.ok) {
        clearAuth();
        return false;
      }

      const data = await res.json();
      if (data.success && data.data?.accessToken) {
        persistAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
        return true;
      }

      clearAuth();
      return false;
    } catch {
      clearAuth();
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [clearAuth, persistAuth, refreshKey, siteId]);

  // Fetch current user from /api/auth/me
  const fetchCurrentUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/auth/me?siteId=${encodeURIComponent(siteId)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Website-Id": siteId,
        },
      });

      if (res.status === 401) {
        const refreshed = await refreshSession();
        if (!refreshed) {
          setUser(null);
        }
        setLoading(false);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const profile = data.data || data.user || data;
        if (profile?.id) {
          const formattedUser: AuthUser = {
            id: profile.id,
            userCode: profile.userCode,
            fullName: profile.fullName || profile.name || "Customer",
            email: profile.email,
            phoneCountryCode: profile.phoneCountryCode,
            phone: profile.phone,
            role: profile.role || "Customer",
            isEmailVerified: Boolean(profile.isEmailVerified),
            dietaryPreference: profile.dietaryPreference,
            preferredCurrency: profile.preferredCurrency,
            marketingOptIn: Boolean(profile.marketingOptIn),
            termsAcceptedAt: profile.termsAcceptedAt,
            createdAt: profile.createdAt,
          };
          setUser(formattedUser);
          if (typeof window !== "undefined") {
            localStorage.setItem(userKey, JSON.stringify(formattedUser));
          }
        }
      } else {
        clearAuth();
      }
    } catch {
      // offline or network error; keep cached user if present
      const cached = localStorage.getItem(userKey);
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, [clearAuth, getAccessToken, refreshSession, siteId, userKey]);

  useEffect(() => {
    fetchCurrentUser();

    const handleStorage = () => {
      fetchCurrentUser();
    };

    window.addEventListener("storage", handleStorage as EventListener);
    window.addEventListener("tours_auth_changed", handleStorage as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage as EventListener);
      window.removeEventListener("tours_auth_changed", handleStorage as EventListener);
    };
  }, [fetchCurrentUser]);

  // Login handler
  const login = async (input: LoginInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Website-Id": siteId,
        },
        body: JSON.stringify({
          email: input.email.trim(),
          password: input.password,
          siteId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || data.message || "Invalid email or password",
        };
      }

      const payload = data.data;
      const user = payload?.user || payload;
      const token = payload?.accessToken || payload?.token;
      persistAuth(user, token, payload?.refreshToken);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to connect to authentication service",
      };
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (input: RegisterInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Website-Id": siteId,
        },
        body: JSON.stringify({
          fullName: input.fullName.trim(),
          email: input.email.trim().toLowerCase(),
          phoneCountryCode: input.phoneCountryCode.trim(),
          phone: input.phone.trim(),
          password: input.password,
          dietaryPreference: input.dietaryPreference,
          marketingOptIn: input.marketingOptIn,
          termsAccepted: input.termsAccepted,
          siteId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || data.message || "Failed to create account",
        };
      }

      const payload = data.data;
      const user = payload?.user || payload;
      const token = payload?.accessToken || payload?.token;
      const refreshToken = payload?.refreshToken;
      persistAuth(user, token, refreshToken);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Registration service unreachable",
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      const rToken = localStorage.getItem(refreshKey);
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Website-Id": siteId,
        },
        body: JSON.stringify({ refreshToken: rToken, siteId }),
      });
    } catch {}
    clearAuth();
    router.push(`/${siteId}/en`);
  };

  // Verify Email handler
  const verifyEmail = async (token: string) => {
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Website-Id": siteId,
        },
        body: JSON.stringify({ token, siteId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Failed to verify email address",
        };
      }

      await fetchCurrentUser();
      return {
        success: true,
        claimedBookings: data.data?.claimedBookings || 0,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to verify email",
      };
    }
  };

  // Resend Verification handler
  const resendVerification = async (email: string) => {
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Website-Id": siteId,
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), siteId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Failed to resend verification email",
        };
      }
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Service unreachable",
      };
    }
  };

  // Forgot Password handler
  const forgotPassword = async (input: ForgotPasswordInput) => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Website-Id": siteId,
        },
        body: JSON.stringify({ email: input.email.trim().toLowerCase(), siteId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Failed to send reset link",
        };
      }
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Service unreachable",
      };
    }
  };

  // Reset Password handler
  const resetPassword = async (input: ResetPasswordInput) => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Website-Id": siteId,
        },
        body: JSON.stringify({
          token: input.token,
          newPassword: input.newPassword,
          siteId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Failed to reset password",
        };
      }
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Service unreachable",
      };
    }
  };

  // Update Profile handler
  const updateProfile = async (input: UpdateProfileInput) => {
    const token = getAccessToken();
    if (!token) {
      return { success: false, error: "Authentication required" };
    }

    try {
      const res = await fetch(`/api/auth/me?siteId=${encodeURIComponent(siteId)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Website-Id": siteId,
        },
        body: JSON.stringify({
          fullName: input.fullName.trim(),
          phoneCountryCode: input.phoneCountryCode.trim(),
          phone: input.phone.trim(),
          dietaryPreference: input.dietaryPreference,
          preferredCurrency: input.preferredCurrency,
          marketingOptIn: input.marketingOptIn,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Failed to update profile",
        };
      }

      await fetchCurrentUser();
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to update profile",
      };
    }
  };

  // Change Password handler
  const changePassword = async (input: ChangePasswordInput) => {
    const token = getAccessToken();
    if (!token) {
      return { success: false, error: "Authentication required" };
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Website-Id": siteId,
        },
        body: JSON.stringify({
          currentPassword: input.currentPassword,
          newPassword: input.newPassword,
          siteId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Failed to change password",
        };
      }
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Service unreachable",
      };
    }
  };

  // Delete Account handler
  const deleteAccount = async (password: string) => {
    const token = getAccessToken();
    if (!token) {
      return { success: false, error: "Authentication required" };
    }

    try {
      const res = await fetch(`/api/auth/me?siteId=${encodeURIComponent(siteId)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Website-Id": siteId,
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Failed to delete account",
        };
      }

      clearAuth();
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Service unreachable",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        siteId,
        getAccessToken,
        login,
        register,
        logout,
        refreshSession,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
