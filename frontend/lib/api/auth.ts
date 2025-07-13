import type {
  LoginResponse,
  RefreshResponse,
  LogoutResponse,
} from "../../types/auth";
import { API_URLS } from "./types";
import { apiCall } from "./utils";

// Auth API calls
export const authApi = {
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<LoginResponse> => {
    return apiCall<LoginResponse>(
      `${API_URLS.AUTH_BASE_URL}${API_URLS.LOGIN}`,
      {
        method: "POST",
        body: JSON.stringify(credentials),
      }
    );
  },

  refresh: async (): Promise<RefreshResponse> => {
    const { tokenUtils } = await import("../auth");
    const refreshToken = tokenUtils.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    return apiCall<RefreshResponse>(
      `${API_URLS.AUTH_BASE_URL}${API_URLS.REFRESH}`,
      {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }
    );
  },

  logout: async (): Promise<LogoutResponse> => {
    const { tokenUtils } = await import("../auth");
    const { getAuthHeaders } = await import("./types");

    const accessToken = tokenUtils.getAccessToken();
    if (!accessToken) {
      throw new Error("No access token available");
    }

    return apiCall<LogoutResponse>(
      `${API_URLS.AUTH_BASE_URL}${API_URLS.LOGOUT}`,
      {
        method: "POST",
        headers: getAuthHeaders(accessToken),
      }
    );
  },
};
