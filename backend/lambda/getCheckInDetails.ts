import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getCheckInDetailsHelper } from "./helpers/checkin";
import { initializeDynamoDB, dynamodbClient } from "@checkin-app/common";

// Initialize the common utilities with our DynamoDB client
initializeDynamoDB(dynamodbClient);

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const checkInId = event.pathParameters?.checkInId;

    if (!checkInId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "checkInId parameter is required" }),
      };
    }

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
    console.error("❌ Error getting check-in details:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Failed to get check-in details",
        details: error.message,
      }),
    };
  }
};
