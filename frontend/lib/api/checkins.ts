import type { BaseResponse } from "../../types/auth";
import type {
  CheckinData,
  CheckinListData,
  CheckinResponseData,
  AssignedCheckinListData,
  CheckinDetailsData,
} from "../../types/checkin";
import { API_URLS } from "./types";
import { createAuthenticatedCall } from "./utils";

// Create authenticated API call function for checkins
const authenticatedCall = createAuthenticatedCall<any>();

// Checkin API calls
export const checkinApi = {
  // Create a new checkin
  createCheckIn: async (data: {
    title: string;
    description: string;
    questions: string[];
    dueDate?: string;
    assignedUserIds: string[];
  }): Promise<BaseResponse<CheckinData>> => {
    return authenticatedCall(`${API_URLS.APP_BASE_URL}${API_URLS.CHECKINS}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

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
    responses: Array<{ questionId: string; response: string }>
  ): Promise<BaseResponse<CheckinResponseData>> => {
    return authenticatedCall(
      `${API_URLS.APP_BASE_URL}${API_URLS.CHECKINS}/${checkinId}/responses`,
      {
        method: "POST",
        body: JSON.stringify({ answers: responses }),
      }
    );
  },

  // Get assigned checkins for current user (members)
  getAssignedCheckIns: async (): Promise<
    BaseResponse<AssignedCheckinListData>
  > => {
    return authenticatedCall(
      `${API_URLS.APP_BASE_URL}${API_URLS.CHECKINS}/assigned`,
      {
        method: "GET",
      }
    );
  },

  // Get checkins created by current user (managers)
  getManagerCheckIns: async (): Promise<BaseResponse<CheckinListData>> => {
    return authenticatedCall(
      `${API_URLS.APP_BASE_URL}${API_URLS.CHECKINS}/manager`,
      {
        method: "GET",
      }
    );
  },

  // Get check-in details by ID
  getCheckInDetails: async (
    checkinId: string
  ): Promise<BaseResponse<CheckinDetailsData>> => {
    return authenticatedCall(
      `${API_URLS.APP_BASE_URL}${API_URLS.CHECKINS}/${checkinId}/details`,
      {
        method: "GET",
      }
    );
  },
};
