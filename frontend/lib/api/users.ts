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

// Manager members data types
export interface ManagerMemberData {
  id: string;
  name: string;
  email: string;
}

export interface ManagerMembersData {
  managerId: string;
  count: number;
  members: ManagerMemberData[];
}

// Users API calls
export const userApi = {
  // Get users by manager (for manager role)
  getUsersByManager: async (): Promise<BaseResponse<UserListData>> => {
    return authenticatedCall(
      `${API_URLS.APP_BASE_URL}${API_URLS.USERS}/managed`,
      {
        method: "GET",
      }
    );
  },

  // Get team members for current manager
  getManagerMembers: async (): Promise<BaseResponse<ManagerMembersData>> => {
    return authenticatedCall(
      `${API_URLS.APP_BASE_URL}${API_URLS.USERS}/manager/members`,
      {
        method: "GET",
      }
    );
  },
};
