import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { getCheckInDetailsHelper } from "./helpers/checkin";
import {
  initializeDynamoDB,
  dynamodbClient,
  CheckInIdParamSchema,
  createValidationErrorResponse,
} from "@checkin-app/common";

// Initialize the common utilities with our DynamoDB client
initializeDynamoDB(dynamodbClient);

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Validate path parameters
    const pathParams = event.pathParameters;
    if (!pathParams) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Path parameters are required" }),
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
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(checkInDetails),
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
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: false,
        error: "Failed to get check-in details",
        details: error.message,
      }),
    };
  }
};
