import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import {
  getUsersByManager,
  initializeDynamoDB,
  dynamodbClient,
  createValidationErrorResponse,
} from "@checkin-app/common";

// Initialize the common package with DynamoDB client
initializeDynamoDB(dynamodbClient);

/**
 * Schema for manager ID path parameter
 */
const ManagerIdPathParamSchema = z.object({
  managerId: z.uuid("Invalid manager ID"),
});

/**
 * GET /users/manager/{managerId}/members
 * Returns all team members associated with a specific manager
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Set CORS headers
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
    };

    // Handle OPTIONS request for CORS
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers,
        body: "",
      };
    }

    // Validate path parameters
    const pathParams = event.pathParameters;
    if (!pathParams) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Path parameters are required",
          message: "Please provide a valid manager ID in the URL path",
        }),
      };
    }

    const validatedPathParams = ManagerIdPathParamSchema.parse(pathParams);
    const { managerId } = validatedPathParams;

    // Get team members directly from the database using the managerId-index
    const members = await getUsersByManager(managerId);

    // Return only the necessary fields for selection (name and id)
    const memberSelections = members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email, // Include email for additional context
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        managerId,
        count: memberSelections.length,
        members: memberSelections,
      }),
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(error);
    }

    console.error("Error fetching members by manager:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
      },
      body: JSON.stringify({
        success: false,
        error: "Internal server error",
        message: "Failed to fetch members for the specified manager",
      }),
    };
  }
};
