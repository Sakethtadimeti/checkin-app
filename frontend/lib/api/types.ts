// API URL constants
export const API_URLS = {
  // Auth APIs (localhost:3001)
  AUTH_BASE_URL: "http://localhost:3001",
  LOGIN: "/api/v1/login",
  REFRESH: "/api/v1/refresh",
  LOGOUT: "/api/v1/logout",

  // App APIs (checkin-api)
  APP_BASE_URL:
    "http://checkin-api.execute-api.localhost.localstack.cloud:4566/dev",
  USERS: "/users",
  CHECKINS: "/checkins",
} as const;

// Helper function to get auth headers
export const getAuthHeaders = (accessToken: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${accessToken}`,
});
