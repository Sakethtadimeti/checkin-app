import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createCheckInHelper } from "./helpers/checkin";
import { initializeDynamoDB } from "@checkin-app/common";
import { dynamodbClient } from "@checkin-app/common";
initializeDynamoDB(dynamodbClient);

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
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
    const requestBody = JSON.parse(event.body);
    const {
      title,
      description,
      questions,
      dueDate,
      createdBy,
      assignedUserIds,
    } = requestBody;
    if (!title || !questions || !dueDate || !createdBy || !assignedUserIds) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error:
            "Missing required fields: title, questions, dueDate, createdBy, assignedUserIds",
        }),
      };
    }
    if (
      !Array.isArray(questions) ||
      !questions.every((q) => typeof q === "string")
    ) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Questions must be an array of strings",
        }),
      };
    }
    if (
      !Array.isArray(assignedUserIds) ||
      !assignedUserIds.every((id) => typeof id === "string")
    ) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "assignedUserIds must be an array of strings",
        }),
      };
    }
    const checkInData = {
      title,
      description,
      questions,
      dueDate,
      createdBy,
      assignedUserIds,
    };
    const createdCheckIn = await createCheckInHelper(
      dynamodbClient,
      checkInData
    );
    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Check-in created successfully",
        checkIn: createdCheckIn,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Failed to create check-in",
        details: error.message,
      }),
    };
  }
};
