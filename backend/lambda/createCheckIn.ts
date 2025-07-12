import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import {
  CheckIn,
  CreateCheckInData,
  CheckInItemComplete,
  AssignmentItem,
  CheckInItemType,
  AssignmentStatus,
  Question,
} from "@checkin-app/common/checkin/types";
import { TABLE_NAMES } from "@checkin-app/common/user/table-configs";
import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodbClient, initializeDynamoDB } from "@checkin-app/common";

initializeDynamoDB(dynamodbClient);

// Validation schema for creating a check-in (questions as string[])
const createCheckInSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  questions: z
    .array(z.string().min(1, "Question text is required"))
    .min(1, "At least one question is required"),
  dueDate: z.string().min(1, "Due date is required"),
  assignedUserIds: z
    .array(z.string().min(1, "User ID cannot be empty"))
    .min(1, "At least one user must be assigned"),
  createdBy: z.string().min(1, "Created by is required").optional(), // for now, allow in body
});

function createCheckInPK(id: string) {
  return `checkin#${id}`;
}
function createCheckInMetaSK() {
  return "meta";
}
function createAssignmentSK(userId: string) {
  return `assignment#${userId}`;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing body" }),
      };
    }
    const parsed = createCheckInSchema.parse(JSON.parse(event.body));
    const checkInId = uuidv4();
    const now = new Date().toISOString();
    const pk = createCheckInPK(checkInId);
    const createdBy = parsed.createdBy || "manager-123";

    // Generate question objects with IDs
    const questions: Question[] = parsed.questions.map((text) => ({
      id: uuidv4(),
      textContent: text,
    }));

    const checkInItem: CheckInItemComplete = {
      PK: pk,
      SK: createCheckInMetaSK(),
      type: CheckInItemType.CHECKIN,
      title: parsed.title,
      description: parsed.description,
      questions,
      dueDate: parsed.dueDate,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    const assignmentItems: AssignmentItem[] = parsed.assignedUserIds.map(
      (userId) => ({
        PK: pk,
        SK: createAssignmentSK(userId),
        type: CheckInItemType.ASSIGNMENT,
        userId,
        status: AssignmentStatus.PENDING,
        assignedAt: now,
        assignedBy: createdBy,
      })
    );

    const writeRequests = [
      { PutRequest: { Item: checkInItem } },
      ...assignmentItems.map((item) => ({ PutRequest: { Item: item } })),
    ];

    console.log("Writing to table:", TABLE_NAMES.CHECKINS);
    console.log("Write requests:", JSON.stringify(writeRequests, null, 2));

    const batchWriteResult = await dynamodbClient.send(
      new BatchWriteCommand({
        RequestItems: { [TABLE_NAMES.CHECKINS]: writeRequests },
      })
    );

    console.log(
      "BatchWrite result:",
      JSON.stringify(batchWriteResult, null, 2)
    );

    const checkIn: CheckIn = {
      id: checkInId,
      title: parsed.title,
      description: parsed.description,
      questions,
      dueDate: parsed.dueDate,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkIn }),
    };
  } catch (err: any) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message, details: err.issues }),
    };
  }
};
