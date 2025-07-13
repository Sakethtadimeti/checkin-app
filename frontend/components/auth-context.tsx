"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import type {
  AuthContextType,
  LoginCredentials,
  AuthState,
} from "../types/auth";
import { AuthApiStatus } from "../types/auth";
import {
  authStateUtils,
  loginUser,
  logoutUser,
  refreshAuthToken,
  tokenUtils,
} from "../lib/auth";

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    loginStatus: AuthApiStatus.IDLE,
    logoutStatus: AuthApiStatus.IDLE,
    refreshStatus: AuthApiStatus.IDLE,
  });

  const router = useRouter();

  // Initialize auth state from session storage
  useEffect(() => {
    const initializeAuth = () => {
      const currentState = authStateUtils.getAuthState();
      setAuthState(currentState);
    };

    initializeAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!authState.isAuthenticated) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    const checkAndRefreshToken = async () => {
      const accessToken = authState.accessToken;
      if (!accessToken) return;

      // Check if token is expiring soon
      if (tokenUtils.isTokenExpiringSoon(accessToken)) {
        const newTokens = await refreshAuthToken();
        if (newTokens) {
          setAuthState((prev) => ({
            ...prev,
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
          }));
        } else {
          // Refresh failed, redirect to login
          router.push("/login");
        }
      }
    };

    // Check token every 30 seconds
    const interval = setInterval(checkAndRefreshToken, 30000);

    // Initial check
    checkAndRefreshToken();

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.accessToken, router]);

  // Login function
  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setAuthState((prev) => ({
          ...prev,
          loginStatus: AuthApiStatus.IN_PROGRESS,
        }));

        const { user, accessToken, refreshToken } = await loginUser(
          credentials
        );

        setAuthState({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          loginStatus: AuthApiStatus.SUCCESS,
          logoutStatus: AuthApiStatus.IDLE,
          refreshStatus: AuthApiStatus.IDLE,
        });

        // Redirect to dashboard
        router.push("/dashboard");
      } catch (error) {
        setAuthState((prev) => ({
          ...prev,
          loginStatus: AuthApiStatus.FAILURE,
        }));
        throw error;
      }
    },
    [router]
  );

  // Logout function
  const handleLogout = useCallback(async () => {
    try {
      setAuthState((prev) => ({
        ...prev,
        logoutStatus: AuthApiStatus.IN_PROGRESS,
      }));

      await logoutUser();

      setAuthState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        loginStatus: AuthApiStatus.IDLE,
        logoutStatus: AuthApiStatus.SUCCESS,
        refreshStatus: AuthApiStatus.IDLE,
      });

      // Redirect to login
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout API fails, clear local state
      setAuthState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        loginStatus: AuthApiStatus.IDLE,
        logoutStatus: AuthApiStatus.FAILURE,
        refreshStatus: AuthApiStatus.IDLE,
      });
      router.push("/login");
    }
  }, [router]);

  // Refresh auth function
  const handleRefreshAuth = useCallback(async () => {
    const newTokens = await refreshAuthToken();
    if (newTokens) {
      setAuthState((prev) => ({
        ...prev,
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      }));
    }
  }, []);

  const contextValue: AuthContextType = {
    ...authState,
    login: handleLogin,
    logout: handleLogout,
    refreshAuth: handleRefreshAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
