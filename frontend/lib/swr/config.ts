import { SWRConfiguration } from "swr";
import { authMiddleware } from "./middleware";

/**
 * Global SWR configuration
 * Applies authentication middleware to all SWR hooks
 */
export const swrConfig: SWRConfiguration = {
  // Apply authentication middleware to all SWR hooks
  use: [authMiddleware],

  // Global error retry configuration
  errorRetryCount: 3,
  errorRetryInterval: 5000,

  // Revalidation configuration
  revalidateOnFocus: true,
  revalidateOnReconnect: true,

  // Deduplication
  dedupingInterval: 2000,

  // Focus revalidation
  focusThrottleInterval: 5000,

  // Loading timeout
  loadingTimeout: 3000,

  // Error handling
  onError: (error) => {
    console.error("SWR Error:", error);
  },

  // Success handling
  onSuccess: (data, key) => {
    console.log(`SWR Success for ${key}:`, data);
  },
};
