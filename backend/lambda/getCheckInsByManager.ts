import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getCheckInsByManagerHelper } from "./helpers/checkin";
import { initializeDynamoDB, dynamodbClient } from "@checkin-app/common";
import { withManagerRole } from "./helpers/auth";

initializeDynamoDB(dynamodbClient);

/** This is a workaround to allow CORS requests from the frontend */
const headers = {
  "Access-Control-Allow-Origin": "*",
};

const getCheckInsByManagerHandler = async (
  event: APIGatewayProxyEvent,
  user: { id: string; email: string; role: string }
): Promise<APIGatewayProxyResult> => {
  try {
    // Use the manager ID from the JWT token
    const createdBy = user.id;

    const checkIns = await getCheckInsByManagerHelper(
      dynamodbClient,
      createdBy
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Check-ins fetched successfully",
        data: {
          checkIns,
          count: checkIns.length,
        },
      }),
    };
  } catch (error: any) {
    // Handle other errors
    console.error("Error getting check-ins by manager:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Failed to get check-ins",
        details: error.message,
      }),
    };
  }
};

export const handler = withManagerRole(getCheckInsByManagerHandler);
