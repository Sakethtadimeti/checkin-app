import type { BaseResponse } from "../../types/auth";
import { API_URLS } from "./types";
import { createAuthenticatedCall } from "./utils";

// Create authenticated API call function for users
const authenticatedCall = createAuthenticatedCall<any>();

// User data types
export interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface UserListData {
  users: UserData[];
}

// Users API calls
export const userApi = {
  // Get all users
  getUsers: async (): Promise<BaseResponse<UserListData>> => {
    return authenticatedCall(`${API_URLS.APP_BASE_URL}${API_URLS.USERS}`, {
      method: "GET",
    });
  },

  // Get current user profile
  getCurrentUser: async (): Promise<BaseResponse<UserData>> => {
    return authenticatedCall(`${API_URLS.APP_BASE_URL}${API_URLS.USERS}/me`, {
      method: "GET",
    });
  },

  // Get users by manager (for manager role)
  getUsersByManager: async (): Promise<BaseResponse<UserListData>> => {
    return authenticatedCall(
      `${API_URLS.APP_BASE_URL}${API_URLS.USERS}/managed`,
      {
        method: "GET",
      }
    );
  },
};
