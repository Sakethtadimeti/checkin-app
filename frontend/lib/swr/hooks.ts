import useSWR from "swr";
import { userApi } from "../api/users";
import { checkinApi } from "../api/checkins";

/**
 * Hook to fetch users managed by current user (for managers)
 * Automatically handles token refresh via middleware
 */
export const useManagedUsers = () => {
  return useSWR("managed-users", () => userApi.getUsersByManager(), {
    revalidateOnFocus: true,
    dedupingInterval: 60000, // Cache for 1 minute
  });
};

/**
 * Hook to fetch all checkins
 * Automatically handles token refresh via middleware
 */
export const useCheckIns = () => {
  return useSWR("checkins", () => checkinApi.getCheckIns(), {
    revalidateOnFocus: true,
    dedupingInterval: 30000, // Cache for 30 seconds
  });
};

/**
 * Hook to fetch a specific checkin by ID
 * Automatically handles token refresh via middleware
 */
export const useCheckIn = (checkinId: string | null) => {
  return useSWR(
    checkinId ? `checkin-${checkinId}` : null,
    () => (checkinId ? checkinApi.getCheckIn(checkinId) : null),
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000, // Cache for 30 seconds
    }
  );
};

/**
 * Hook to fetch assigned checkins for current user
 * Automatically handles token refresh via middleware
 */
export const useAssignedCheckIns = () => {
  return useSWR("assigned-checkins", () => checkinApi.getAssignedCheckIns(), {
    revalidateOnFocus: true,
    dedupingInterval: 30000, // Cache for 30 seconds
  });
};

/**
 * Hook to fetch checkins created by current user (for managers)
 * Automatically handles token refresh via middleware
 */
export const useCreatedCheckIns = () => {
  return useSWR("created-checkins", () => checkinApi.getCreatedCheckIns(), {
    revalidateOnFocus: true,
    dedupingInterval: 30000, // Cache for 30 seconds
  });
};
