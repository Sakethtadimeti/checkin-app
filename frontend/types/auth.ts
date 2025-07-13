import { z } from "zod";

// Auth API status enum
export enum AuthApiStatus {
  IDLE = "idle",
  IN_PROGRESS = "in_progress",
  SUCCESS = "success",
  FAILURE = "failure",
}

// Generic base response type for all APIs
export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Login data type
export interface LoginData {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Refresh data type
export interface RefreshData {
  accessToken: string;
  refreshToken: string;
}

// Logout data type (usually empty or minimal)
export interface LogoutData {
  // Empty for logout, but keeping structure consistent
}

// API response types
export type LoginResponse = BaseResponse<LoginData>;
export type RefreshResponse = BaseResponse<RefreshData>;
export type LogoutResponse = BaseResponse<LogoutData>;

// Zod schemas for validation
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Zod schemas for API responses
export const loginDataSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    role: z.string(),
  }),
});

export const refreshDataSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const logoutDataSchema = z.object({});

export const baseResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema,
  });

export const loginResponseSchema = baseResponseSchema(loginDataSchema);
export const refreshResponseSchema = baseResponseSchema(refreshDataSchema);
export const logoutResponseSchema = baseResponseSchema(logoutDataSchema);

// Inferred types from schemas
export type LoginCredentials = z.infer<typeof loginSchema>;

// Additional types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Only for initial mount/auth state checking
  loginStatus: AuthApiStatus; // For login API operations
  logoutStatus: AuthApiStatus; // For logout API operations
  refreshStatus: AuthApiStatus; // For refresh API operations
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}
