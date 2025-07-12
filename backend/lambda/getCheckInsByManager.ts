import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getCheckInsByManagerHelper } from "./helpers/checkin";
import { initializeDynamoDB, dynamodbClient } from "@checkin-app/common";
initializeDynamoDB(dynamodbClient);

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const createdBy = event.pathParameters?.createdBy;
    if (!createdBy) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "createdBy parameter is required" }),
      };
    }
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
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Failed to get check-ins",
        details: error.message,
      }),
    };
  }
};
