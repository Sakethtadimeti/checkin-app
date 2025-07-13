import type { BaseResponse } from "../../types/auth";
import { tokenUtils } from "../auth";

// Helper function to handle API responses
export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  const responseData = await response.json();

  if (!response.ok) {
    // Handle HTTP errors
    const errorMessage =
      responseData.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  // Handle API-level errors (success: false)
  if (!responseData.success) {
    throw new Error(responseData.message || "API request failed");
  }

  return responseData;
};

// Generic API call function
export const apiCall = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  return handleApiResponse<T>(response);
};

// Generic API call function with automatic token refresh
export const apiCallWithAuth = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    return await apiCall<T>(url, options);
  } catch (error) {
    // If it's a 401 error, try to refresh the token and retry
    if (error instanceof Error && error.message.includes("401")) {
      try {
        const { refreshAuthToken } = await import("../auth");
        const newTokens = await refreshAuthToken();

        if (newTokens) {
          // Retry the request with the new token
          const newOptions = {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newTokens.accessToken}`,
            },
          };
          return await apiCall<T>(url, newOptions);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
      }
    }
    throw error;
  }
};

// Helper function to create authenticated API call
export const createAuthenticatedCall = <T>() => {
  return async (
    url: string,
    options: RequestInit = {}
  ): Promise<BaseResponse<T>> => {
    const accessToken = tokenUtils.getAccessToken();
    if (!accessToken) {
      throw new Error("No access token available");
    }

    return apiCallWithAuth<BaseResponse<T>>(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  };
};
