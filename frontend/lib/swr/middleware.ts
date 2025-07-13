import { tokenUtils, refreshAuthToken } from "../auth";

/**
 * SWR middleware for automatic token refresh
 * Checks if the access token is about to expire before making API calls
 * and automatically refreshes it if needed
 */
export function tokenRefreshMiddleware(useSWRNext: any) {
  return (key: any, fetcher: any, config: any) => {
    // Create an enhanced fetcher that handles token refresh
    const enhancedFetcher = async (...args: any[]) => {
      try {
        // Check if we have an access token
        const accessToken = tokenUtils.getAccessToken();

        if (accessToken) {
          // Check if token is about to expire
          if (tokenUtils.isTokenExpiringSoon(accessToken)) {
            console.log("Token expiring soon, refreshing...");

            // Try to refresh the token
            const newTokens = await refreshAuthToken();

            if (!newTokens) {
              // Refresh failed, clear auth state and throw error
              console.error("Token refresh failed");
              throw new Error("Authentication expired. Please login again.");
            }

            console.log("Token refreshed successfully");
          }
        }

        // Call the original fetcher
        return await fetcher(...args);
      } catch (error) {
        // If it's a 401 error, try to refresh token and retry once
        if (error instanceof Error && error.message.includes("401")) {
          console.log("Received 401, attempting token refresh...");

          try {
            const newTokens = await refreshAuthToken();

            if (newTokens) {
              console.log("Token refreshed after 401, retrying request...");
              // Retry the original request with new token
              return await fetcher(...args);
            }
          } catch (refreshError) {
            console.error("Token refresh failed after 401:", refreshError);
          }
        }

        // Re-throw the original error
        throw error;
      }
    };

    // Execute the hook with the enhanced fetcher
    return useSWRNext(key, enhancedFetcher, config);
  };
}

/**
 * SWR middleware for authentication state management
 * Automatically redirects to login when authentication fails
 */
export function authStateMiddleware(useSWRNext: any) {
  return (key: any, fetcher: any, config: any) => {
    const swr = useSWRNext(key, fetcher, config);

    // Handle authentication errors
    if (swr.error && swr.error.message.includes("Authentication expired")) {
      // Clear auth state and redirect to login
      const { authStateUtils } = require("../auth");
      authStateUtils.clearAuthState();

      // Redirect to login (this will be handled by the auth context)
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return swr;
  };
}

/**
 * Combined middleware that includes both token refresh and auth state management
 */
export function authMiddleware(useSWRNext: any) {
  return (key: any, fetcher: any, config: any) => {
    // Apply token refresh middleware first
    const tokenRefreshSWR = tokenRefreshMiddleware(useSWRNext);
    const swr = tokenRefreshSWR(key, fetcher, config);

    // Then apply auth state middleware
    return authStateMiddleware(() => swr)(key, fetcher, config);
  };
}
