import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { getCheckInsByManagerHelper } from "./helpers/checkin";
import {
  initializeDynamoDB,
  dynamodbClient,
  ManagerIdParamSchema,
  createValidationErrorResponse,
} from "@checkin-app/common";

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

    const validatedPathParams = ManagerIdParamSchema.parse(pathParams);
    const { createdBy } = validatedPathParams;

    const checkIns = await getCheckInsByManagerHelper(
      dynamodbClient,
      createdBy
    );
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ checkIns, count: checkIns.length }),
    };
  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(error);
    }

    // Handle other errors
    console.error("Error getting check-ins by manager:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: false,
        error: "Failed to get check-ins",
        details: error.message,
      }),
    };
  }
};
