import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { createCheckInHelper } from "./helpers/checkin";
import {
  initializeDynamoDB,
  dynamodbClient,
  CreateCheckInRequestSchema,
  createValidationErrorResponse,
} from "@checkin-app/common";
import { withManagerRole } from "./helpers/auth";

initializeDynamoDB(dynamodbClient);

const createCheckInHandler = async (
  event: APIGatewayProxyEvent,
  user: { id: string; email: string; role: string }
): Promise<APIGatewayProxyResult> => {
  try {
    // Check if request body exists
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Request body is required" }),
      };
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON in request body" }),
      };
    }

    // Validate the request data using Zod schema (excluding createdBy)
    const validatedRequestData = CreateCheckInRequestSchema.parse(requestBody);

    // Combine request data with user ID from JWT token
    const validatedData = {
      ...validatedRequestData,
      createdBy: user.id,
    };

    // Create the check-in
    const createdCheckIn = await createCheckInHelper(
      dynamodbClient,
      validatedData
    );

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        message: "Check-in created successfully",
        data: {
          checkIn: createdCheckIn,
        },
      }),
    };
  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(error);
    }

    // Handle other errors
    console.error("Error creating check-in:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "Failed to create check-in",
        details: error.message || "Unknown error",
      }),
    };
  }
};

export const handler = withManagerRole(createCheckInHandler);
