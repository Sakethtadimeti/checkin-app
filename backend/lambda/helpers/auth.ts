import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  validateAuthHeader,
  createJWTValidationErrorResponse,
  AccessTokenPayload,
} from "@checkin-app/common";

/**
 * JWT validation result for lambda handlers
 */
export interface JWTValidationResult {
  isValid: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  errorResponse?: APIGatewayProxyResult;
}

/**
 * Validates JWT token from the Authorization header in lambda events
 * This is a reusable helper for all lambda functions
 *
 * @param event - The API Gateway event containing headers
 * @returns JWTValidationResult with validation status and user info if valid
 */
export const validateJWTFromEvent = (
  event: APIGatewayProxyEvent
): JWTValidationResult => {
  // Extract Authorization header
  const authHeader = event.headers?.Authorization;

  // Get JWT secret from environment
  const jwtSecret = process.env.JWT_SECRET;

  // Check if JWT_SECRET is configured
  if (!jwtSecret) {
    console.error("JWT_SECRET environment variable is not set");
    return {
      isValid: false,
      errorResponse: {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: false,
          error: "Server configuration error",
          message: "JWT_SECRET not configured",
        }),
      },
    };
  }

  // Validate the JWT token
  const { isValid, error, payload } = validateAuthHeader(authHeader, jwtSecret);

  if (!isValid) {
    return {
      isValid: false,
      errorResponse: createJWTValidationErrorResponse(error!),
    };
  }

  // Ensure we have an access token payload
  if (!payload || payload.type !== "access") {
    return {
      isValid: false,
      errorResponse: createJWTValidationErrorResponse(
        "Invalid token type - access token required"
      ),
    };
  }

  const accessPayload = payload as AccessTokenPayload;

  return {
    isValid: true,
    user: {
      id: accessPayload.id,
      email: accessPayload.email,
      role: accessPayload.role,
    },
  };
};

/**
 * Higher-order function that wraps lambda handlers with JWT validation
 * Use this to automatically validate JWT before executing the handler logic
 *
 * @param handler - The original lambda handler function
 * @returns Wrapped handler with JWT validation
 */
export const withJWTValidation = <T extends APIGatewayProxyEvent>(
  handler: (
    event: T,
    user: { id: string; email: string; role: string }
  ) => Promise<APIGatewayProxyResult>
) => {
  return async (event: T): Promise<APIGatewayProxyResult> => {
    const validation = validateJWTFromEvent(event);

    if (!validation.isValid) {
      return validation.errorResponse!;
    }

    // Call the original handler with the validated user
    return await handler(event, validation.user!);
  };
};

export const withManagerRole = <T extends APIGatewayProxyEvent>(
  handler: (
    event: T,
    user: { id: string; email: string; role: string }
  ) => Promise<APIGatewayProxyResult>
) => {
  return async (event: T): Promise<APIGatewayProxyResult> => {
    const validation = validateJWTFromEvent(event);

    if (!validation.isValid) {
      return validation.errorResponse!;
    }

    if (validation.user!.role !== "manager") {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Forbidden" }),
      };
    }

    // Call the original handler with the validated user
    return await handler(event, validation.user!);
  };
};
