import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { getCheckInDetailsHelper } from "./helpers/checkin";
import {
  initializeDynamoDB,
  dynamodbClient,
  CheckInIdParamSchema,
  createValidationErrorResponse,
} from "@checkin-app/common";
import { withJWTValidation } from "./helpers/auth";

// Initialize the common utilities with our DynamoDB client
initializeDynamoDB(dynamodbClient);

/** This is a workaround to allow CORS requests from the frontend */
const headers = {
  "Access-Control-Allow-Origin": "*",
};

const getCheckInDetailsHandler = async (
  event: APIGatewayProxyEvent,
  user: { id: string; email: string; role: string }
): Promise<APIGatewayProxyResult> => {
  try {
    // Validate path parameters
    const pathParams = event.pathParameters;
    if (!pathParams) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Path parameters are required",
        }),
      };
    }

    const validatedPathParams = CheckInIdParamSchema.parse(pathParams);
    const { checkInId } = validatedPathParams;

    const checkInDetails = await getCheckInDetailsHelper(
      dynamodbClient,
      checkInId
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Check-in details fetched successfully",
        data: checkInDetails,
      }),
    };
  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(error);
    }

    // Handle other errors
    console.error("❌ Error getting check-in details:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Failed to get check-in details",
        details: error.message,
      }),
    };
  }
};

export const handler = withJWTValidation(getCheckInDetailsHandler);
