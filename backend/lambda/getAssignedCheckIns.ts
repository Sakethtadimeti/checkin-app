import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { getAssignedCheckInsForUserHelper } from "./helpers/checkin";
import {
  initializeDynamoDB,
  dynamodbClient,
  createValidationErrorResponse,
} from "@checkin-app/common";
import { withJWTValidation } from "./helpers/auth";

// Initialize the common utilities with our DynamoDB client
initializeDynamoDB(dynamodbClient);

/** This is a workaround to allow CORS requests from the frontend */
const headers = {
  "Access-Control-Allow-Origin": "*",
};

const getAssignedCheckInsHandler = async (
  event: APIGatewayProxyEvent,
  user: { id: string; email: string; role: string }
): Promise<APIGatewayProxyResult> => {
  try {
    // Use the user ID from the JWT token
    const userId = user.id;

    const assignedCheckIns = await getAssignedCheckInsForUserHelper(
      dynamodbClient,
      userId
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Assigned check-ins fetched successfully",
        data: {
          assignedCheckIns,
          count: assignedCheckIns.length,
        },
      }),
    };
  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(error);
    }

    // Handle other errors
    console.error("❌ Error getting assigned check-ins:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Failed to get assigned check-ins",
        details: error.message,
      }),
    };
  }
};

export const handler = withJWTValidation(getAssignedCheckInsHandler);
