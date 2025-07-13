import jwt from "jsonwebtoken";
import { z } from "zod";

/**
 * JWT payload schema for access tokens
 */
export const AccessTokenPayloadSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(["manager", "member"]),
  type: z.literal("access"),
  iat: z.number(),
  exp: z.number(),
});

/**
 * JWT payload schema for refresh tokens
 */
export const RefreshTokenPayloadSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  type: z.literal("refresh"),
  iat: z.number(),
  exp: z.number(),
});

/**
 * Type for access token payload
 */
export type AccessTokenPayload = z.infer<typeof AccessTokenPayloadSchema>;

/**
 * Type for refresh token payload
 */
export type RefreshTokenPayload = z.infer<typeof RefreshTokenPayloadSchema>;

/**
 * JWT validation result
 */
export interface JWTValidationResult {
  isValid: boolean;
  payload?: AccessTokenPayload | RefreshTokenPayload;
  error?: string;
}

/**
 * JWT validation error response for API Gateway
 */
export interface JWTValidationErrorResponse {
  statusCode: number;
  headers: {
    "Content-Type": string;
    "Access-Control-Allow-Origin": string;
  };
  body: string;
}

/**
 * Validates a JWT token from the auth-server
 * @param token - The JWT token to validate
 * @param secret - The JWT secret used by the auth-server
 * @returns JWTValidationResult with validation status and payload
 */
export const validateJWT = (
  token: string,
  secret: string
): JWTValidationResult => {
  try {
    // Verify the token signature and expiration
    const decoded = jwt.verify(token, secret) as any;

    // Validate the payload structure based on token type
    if (decoded.type === "access") {
      const validatedPayload = AccessTokenPayloadSchema.parse(decoded);
      return {
        isValid: true,
        payload: validatedPayload,
      };
    } else if (decoded.type === "refresh") {
      const validatedPayload = RefreshTokenPayloadSchema.parse(decoded);
      return {
        isValid: true,
        payload: validatedPayload,
      };
    } else {
      return {
        isValid: false,
        error: "Invalid token type",
      };
    }
  } catch (error: unknown) {
    if (error instanceof jwt.JsonWebTokenError) {
      return {
        isValid: false,
        error: `JWT validation failed: ${error.message}`,
      };
    } else if (error instanceof jwt.TokenExpiredError) {
      return {
        isValid: false,
        error: "Token has expired",
      };
    } else if (error instanceof jwt.NotBeforeError) {
      return {
        isValid: false,
        error: "Token not yet valid",
      };
    } else if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: `Invalid token payload: ${error.message}`,
      };
    } else {
      return {
        isValid: false,
        error: "Unknown JWT validation error",
      };
    }
  }
};

/**
 * Extracts and validates JWT token from Authorization header
 * @param authHeader - The Authorization header value
 * @param secret - The JWT secret used by the auth-server
 * @returns JWTValidationResult with validation status and payload
 */
export const validateAuthHeader = (
  authHeader: string | undefined,
  secret: string
): JWTValidationResult => {
  // Check if Authorization header exists
  if (!authHeader) {
    return {
      isValid: false,
      error: "Authorization header is required",
    };
  }

  // Check if it's a Bearer token
  if (!authHeader.startsWith("Bearer ")) {
    return {
      isValid: false,
      error: "Authorization header must start with 'Bearer '",
    };
  }

  // Extract the token
  const token = authHeader.substring(7); // Remove "Bearer " prefix

  if (!token) {
    return {
      isValid: false,
      error: "Access token is required",
    };
  }

  // Validate the token
  return validateJWT(token, secret);
};

/**
 * Creates a standardized error response for JWT validation failures
 * @param error - The error message
 * @param statusCode - HTTP status code (default: 401)
 * @returns JWTValidationErrorResponse
 */
export const createJWTValidationErrorResponse = (
  error: string,
  statusCode: number = 401
): JWTValidationErrorResponse => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      success: false,
      error: "Authentication failed",
      message: error,
    }),
  };
};

/**
 * Validates JWT token and returns user information if valid
 * @param authHeader - The Authorization header value
 * @param secret - The JWT secret used by the auth-server
 * @returns Object with validation result and user info if valid
 */
export const validateAndExtractUser = (
  authHeader: string | undefined,
  secret: string
): {
  isValid: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  error?: string;
} => {
  const validation = validateAuthHeader(authHeader, secret);

  if (!validation.isValid) {
    return {
      isValid: false,
      error: validation.error,
    };
  }

  // Ensure we have an access token payload
  if (!validation.payload || validation.payload.type !== "access") {
    return {
      isValid: false,
      error: "Invalid token type - access token required",
    };
  }

  const accessPayload = validation.payload as AccessTokenPayload;

  return {
    isValid: true,
    user: {
      id: accessPayload.id,
      email: accessPayload.email,
      role: accessPayload.role,
    },
  };
};
