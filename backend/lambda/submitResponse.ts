import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import {
  CheckInItemType,
  AssignmentStatus,
  ResponseItem,
} from "@checkin-app/common/checkin/types";
import { TABLE_NAMES } from "@checkin-app/common/user/table-configs";
import { PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import {
  initializeDynamoDB,
  dynamodbClient,
  SubmitResponseSchema,
  CheckInResponseParamsSchema,
  createValidationErrorResponse,
} from "@checkin-app/common";

initializeDynamoDB(dynamodbClient);

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
    // Extract and validate path parameters
    const pathParams = event.pathParameters;
    if (!pathParams) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Path parameters are required",
        }),
      };
    }

    const validatedPathParams = CheckInResponseParamsSchema.parse(pathParams);
    const { checkInId, userId } = validatedPathParams;

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
    const validatedData = SubmitResponseSchema.parse(requestBody);
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
      return createValidationErrorResponse(error);
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
