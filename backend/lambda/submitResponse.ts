import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import {
  CheckInItemType,
  AssignmentStatus,
  ResponseItem,
} from "@checkin-app/common/checkin/types";
import { TABLE_NAMES } from "@checkin-app/common/user/table-configs";
import { PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodbClient, initializeDynamoDB } from "@checkin-app/common";

initializeDynamoDB(dynamodbClient);

// Validation schema for answers
const answerSchema = z.object({
  questionId: z.string().min(1, "Question ID is required"),
  response: z.string().min(1, "Response cannot be empty"),
});

// Validation schema for submitting a response
const submitResponseSchema = z.object({
  answers: z.array(answerSchema).min(1, "At least one answer is required"),
});

function createCheckInPK(checkInId: string) {
  return `checkin#${checkInId}`;
}
function createResponseSK(userId: string) {
  return `response#${userId}`;
}
function createAssignmentSK(userId: string) {
  return `assignment#${userId}`;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Extract check-in ID and user ID from path parameters
    const checkInId = event.pathParameters?.checkInId;
    const userId = event.pathParameters?.userId;

    if (!checkInId || !userId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Check-in ID and user ID are required in path parameters",
        }),
      };
    }

    // Parse and validate request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Request body is required",
        }),
      };
    }

    const requestBody = JSON.parse(event.body);
    const validatedData = submitResponseSchema.parse(requestBody);
    const now = new Date().toISOString();
    const pk = createCheckInPK(checkInId);

    // Create the response item
    const responseItem: ResponseItem = {
      PK: pk,
      SK: createResponseSK(userId),
      type: CheckInItemType.RESPONSE,
      userId,
      answers: validatedData.answers,
      submittedAt: now,
      updatedAt: now,
    };

    // Update the assignment status to completed
    const assignmentUpdate = {
      TableName: TABLE_NAMES.CHECKINS,
      Key: {
        PK: pk,
        SK: createAssignmentSK(userId),
      },
      UpdateExpression: "SET #status = :status, completedAt = :completedAt",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": AssignmentStatus.COMPLETED,
        ":completedAt": now,
      },
    };

    // Execute both operations
    await Promise.all([
      dynamodbClient.send(
        new PutCommand({
          TableName: TABLE_NAMES.CHECKINS,
          Item: responseItem,
        })
      ),
      dynamodbClient.send(new UpdateCommand(assignmentUpdate)),
    ]);

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Response submitted successfully",
        checkInId,
        userId,
        submittedAt: now,
      }),
    };
  } catch (error: any) {
    console.error("Error submitting response:", error);

    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Validation error",
          details: error.issues,
        }),
      };
    }

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    };
  }
};
