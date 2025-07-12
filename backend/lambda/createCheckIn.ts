import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { createCheckInHelper } from "./helpers/checkin";
import {
  initializeDynamoDB,
  dynamodbClient,
  CreateCheckInSchema,
  createValidationErrorResponse,
} from "@checkin-app/common";

initializeDynamoDB(dynamodbClient);

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Check if request body exists
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
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
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Invalid JSON in request body" }),
      };
    }

    // Validate the request data using Zod schema
    const validatedData = CreateCheckInSchema.parse(requestBody);

    // Create the check-in
    const createdCheckIn = await createCheckInHelper(
      dynamodbClient,
      validatedData
    );

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        message: "Check-in created successfully",
        checkIn: createdCheckIn,
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
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: false,
        error: "Failed to create check-in",
        details: error.message,
      }),
    };
  }
};
