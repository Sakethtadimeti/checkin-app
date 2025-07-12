import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { getAssignedCheckInsForUserHelper } from "./helpers/checkin";
import {
  initializeDynamoDB,
  dynamodbClient,
  UserIdParamSchema,
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

    const validatedPathParams = UserIdParamSchema.parse(pathParams);
    const { userId } = validatedPathParams;

    const assignedCheckIns = await getAssignedCheckInsForUserHelper(
      dynamodbClient,
      userId
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        assignedCheckIns,
        count: assignedCheckIns.length,
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
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: false,
        error: "Failed to get assigned check-ins",
        details: error.message,
      }),
    };
  }
};
