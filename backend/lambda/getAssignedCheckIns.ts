import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getAssignedCheckInsForUserHelper } from "./helpers/checkin";
import { initializeDynamoDB, dynamodbClient } from "@checkin-app/common";

// Initialize the common utilities with our DynamoDB client
initializeDynamoDB(dynamodbClient);

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;

    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "userId parameter is required" }),
      };
    }

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
    console.error("❌ Error getting assigned check-ins:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Failed to get assigned check-ins",
        details: error.message,
      }),
    };
  }
};
