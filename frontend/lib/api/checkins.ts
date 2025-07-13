import type { BaseResponse } from "../../types/auth";
import type {
  CheckinData,
  CheckinListData,
  CheckinResponseData,
} from "../../types/checkin";
import { API_URLS } from "./types";
import { createAuthenticatedCall } from "./utils";

// Create authenticated API call function for checkins
const authenticatedCall = createAuthenticatedCall<any>();

// Checkin API calls
export const checkinApi = {
  // Get all checkins
  getCheckIns: async (): Promise<BaseResponse<CheckinListData>> => {
    return authenticatedCall(`${API_URLS.APP_BASE_URL}${API_URLS.CHECKINS}`, {
      method: "GET",
    });
  },

  // Get a specific checkin by ID
  getCheckIn: async (checkinId: string): Promise<BaseResponse<CheckinData>> => {
    return authenticatedCall(
      `${API_URLS.APP_BASE_URL}${API_URLS.CHECKINS}/${checkinId}`,
      {
        method: "GET",
      }
    );
  },

  // Submit checkin responses
  submitCheckIn: async (
    checkinId: string,
    responses: Array<{ questionId: string; answer: string | number | boolean }>
  ): Promise<BaseResponse<CheckinResponseData>> => {
    return authenticatedCall(
      `${API_URLS.APP_BASE_URL}${API_URLS.CHECKINS}/${checkinId}/submit`,
      {
        method: "POST",
        body: JSON.stringify({ responses }),
      }
    );
  },

  // Get assigned checkins for current user
  getAssignedCheckIns: async (): Promise<BaseResponse<CheckinListData>> => {
    return authenticatedCall(
      `${API_URLS.APP_BASE_URL}${API_URLS.CHECKINS}/assigned`,
      {
        method: "GET",
      }
    );
  },

  // Get checkins created by current user (for managers)
  getCreatedCheckIns: async (): Promise<BaseResponse<CheckinListData>> => {
    return authenticatedCall(
      `${API_URLS.APP_BASE_URL}${API_URLS.CHECKINS}/created`,
      {
        method: "GET",
      }
    );
  },
};
