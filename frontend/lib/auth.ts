import { authApi } from "./api/auth";
import type {
  LoginCredentials,
  LoginResponse,
  RefreshResponse,
  User,
  AuthState,
} from "../types/auth";
import { AuthApiStatus } from "../types/auth";

// Session storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
} as const;

// Token expiration check (1 minute before expiry)
const TOKEN_EXPIRY_BUFFER = 60 * 1000; // 1 minute in milliseconds

// Session storage utilities
export const sessionStorage = {
  get: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(key);
  },

  set: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(key, value);
  },

  remove: (key: string): void => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(key);
  },

  clear: (): void => {
    if (typeof window === "undefined") return;
    window.sessionStorage.clear();
  },
};

// Token utilities
export const tokenUtils = {
  // Get stored tokens
  getAccessToken: (): string | null => {
    return sessionStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken: (): string | null => {
    return sessionStorage.get(STORAGE_KEYS.REFRESH_TOKEN);
  },

  // Store tokens
  setTokens: (accessToken: string, refreshToken: string): void => {
    sessionStorage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    sessionStorage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  },

  // Clear tokens
  clearTokens: (): void => {
    sessionStorage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.remove(STORAGE_KEYS.REFRESH_TOKEN);
  },

  // Check if token is about to expire (JWT tokens)
  isTokenExpiringSoon: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      return expiryTime - currentTime < TOKEN_EXPIRY_BUFFER;
    } catch {
      return true; // If we can't parse the token, assume it's expired
    }
  },
};

// User utilities
export const userUtils = {
  // Get stored user
  getUser: (): User | null => {
    const userStr = sessionStorage.get(STORAGE_KEYS.USER);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Store user
  setUser: (user: User): void => {
    sessionStorage.set(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  // Clear user
  clearUser: (): void => {
    sessionStorage.remove(STORAGE_KEYS.USER);
  },
};

// Auth state utilities
export const authStateUtils = {
  // Get current auth state
  getAuthState: (): AuthState => {
    const accessToken = tokenUtils.getAccessToken();
    const refreshToken = tokenUtils.getRefreshToken();
    const user = userUtils.getUser();

    return {
      user,
      accessToken,
      refreshToken,
      isAuthenticated: !!(accessToken && user),
      isLoading: false,
      loginStatus: AuthApiStatus.IDLE,
      logoutStatus: AuthApiStatus.IDLE,
      refreshStatus: AuthApiStatus.IDLE,
    };
  },

  // Clear auth state
  clearAuthState: (): void => {
    tokenUtils.clearTokens();
    userUtils.clearUser();
  },
};

// Token refresh utility
export const refreshAuthToken = async (): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> => {
  try {
    const response = (await authApi.refresh()) as RefreshResponse;

    // Store new tokens
    tokenUtils.setTokens(response.data.accessToken, response.data.refreshToken);

    return {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    };
  } catch (error) {
    console.error("Failed to refresh token:", error);
    // Clear auth state on refresh failure
    authStateUtils.clearAuthState();
    return null;
  }
};

// Login utility
export const loginUser = async (
  credentials: LoginCredentials
): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
  const response = (await authApi.login(credentials)) as LoginResponse;

  // Store tokens and user
  tokenUtils.setTokens(response.data.accessToken, response.data.refreshToken);
  userUtils.setUser(response.data.user);

  return {
    user: response.data.user,
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
  };
};

// Logout utility
export const logoutUser = async (): Promise<void> => {
  try {
    await authApi.logout();
  } catch (error) {
    console.error("Logout API call failed:", error);
  }

  // Clear auth state regardless of API call success
  authStateUtils.clearAuthState();
};
