import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  BatchWriteCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";
import { findUsersByIds } from "@checkin-app/common";
import {
  CheckInItemType,
  AssignmentStatus,
  Question,
  CreateCheckInData,
  CheckIn,
  Answer,
  ResponseItem,
  AssignmentItem,
} from "@checkin-app/common/checkin/types";
import { TABLE_NAMES } from "@checkin-app/common/user/table-configs";

function generateId(): string {
  return crypto.randomUUID();
}

export async function createCheckInHelper(
  docClient: DynamoDBDocumentClient,
  checkInData: CreateCheckInData
): Promise<CheckIn> {
  const {
    title,
    description,
    questions: questionStrings,
    dueDate,
    createdBy,
    assignedUserIds,
  } = checkInData;

  // Generate check-in ID and timestamps
  const checkInId = generateId();
  const now = new Date().toISOString();

  // Convert question strings to Question objects with IDs
  const questions: Question[] = questionStrings.map((text) => ({
    id: generateId(),
    textContent: text,
  }));

  // Create the check-in item
  const checkInItem = {
    PK: `checkin#${checkInId}`,
    SK: "meta",
    type: CheckInItemType.CHECKIN,
    title,
    description,
    questions,
    dueDate,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };

  // Create assignment items for each user
  const assignmentItems = assignedUserIds.map((userId) => ({
    PK: `checkin#${checkInId}`,
    SK: `assignment#${userId}`,
    type: CheckInItemType.ASSIGNMENT,
    userId,
    status: AssignmentStatus.PENDING,
    assignedAt: now,
    assignedBy: createdBy,
  }));

  // Prepare batch write items
  const writeRequests = [
    { PutRequest: { Item: checkInItem } },
    ...assignmentItems.map((item) => ({ PutRequest: { Item: item } })),
  ];

  // Execute batch write
  await docClient.send(
    new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAMES.CHECKINS]: writeRequests,
      },
    })
  );

  // Return the check-in data (without DynamoDB keys)
  return {
    id: checkInId,
    title,
    description,
    questions,
    dueDate,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getCheckInsByManagerHelper(
  docClient: DynamoDBDocumentClient,
  createdBy: string
): Promise<CheckIn[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAMES.CHECKINS,
      IndexName: "created-by-index",
      KeyConditionExpression: "createdBy = :createdBy AND #type = :type",
      ExpressionAttributeNames: {
        "#type": "type",
      },
      ExpressionAttributeValues: {
        ":createdBy": createdBy,
        ":type": CheckInItemType.CHECKIN,
      },
    })
  );

  return (result.Items || []).map((item) => ({
    id: item.PK.replace("checkin#", ""),
    title: item.title,
    description: item.description,
    questions: item.questions,
    dueDate: item.dueDate,
    createdBy: item.createdBy,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

/**
 * Gets check-ins assigned to a user with full check-in details using batch operations
 * @param docClient - DynamoDB document client
 * @param userId - The user's ID
 * @returns Promise<Array<{checkIn: CheckIn, assignment: AssignmentItem}>> - Array of check-ins with assignment details
 */
export async function getAssignedCheckInsForUserHelper(
  docClient: DynamoDBDocumentClient,
  userId: string
): Promise<Array<{ checkIn: CheckIn; assignment: any }>> {
  // First, get all assignments for the user
  const assignmentsResult = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAMES.CHECKINS,
      IndexName: "user-type-index",
      KeyConditionExpression: "userId = :userId AND #type = :type",
      ExpressionAttributeNames: {
        "#type": "type",
      },
      ExpressionAttributeValues: {
        ":userId": userId,
        ":type": CheckInItemType.ASSIGNMENT,
      },
    })
  );

  const assignments = assignmentsResult.Items || [];

  if (assignments.length === 0) {
    return [];
  }

  // Prepare batch get keys for all check-ins
  const batchGetKeys = assignments.map((assignment) => ({
    PK: assignment.PK,
    SK: "meta",
  }));

  // Execute batch get operation
  const batchGetResult = await docClient.send(
    new BatchGetCommand({
      RequestItems: {
        [TABLE_NAMES.CHECKINS]: {
          Keys: batchGetKeys,
        },
      },
    })
  );

  const checkInItems = batchGetResult.Responses?.[TABLE_NAMES.CHECKINS] || [];

  // Create a map for quick lookup
  const checkInMap = new Map(checkInItems.map((item) => [item.PK, item]));

  // Combine assignments with check-in details
  const checkInsWithAssignments = assignments
    .map((assignment) => {
      const checkInItem = checkInMap.get(assignment.PK);

      if (!checkInItem) {
        return null; // Skip if check-in not found
      }

      const checkInId = assignment.PK.replace("checkin#", "");
      const checkIn: CheckIn = {
        id: checkInId,
        title: checkInItem.title,
        description: checkInItem.description,
        questions: checkInItem.questions,
        dueDate: checkInItem.dueDate,
        createdBy: checkInItem.createdBy,
        createdAt: checkInItem.createdAt,
        updatedAt: checkInItem.updatedAt,
      };

      return {
        checkIn,
        assignment: {
          status: assignment.status,
          assignedAt: assignment.assignedAt,
          assignedBy: assignment.assignedBy,
          completedAt: assignment.completedAt,
        },
      };
    })
    .filter(Boolean) as Array<{ checkIn: CheckIn; assignment: any }>;

  return checkInsWithAssignments;
}

/**
 * Gets all assignments and their statuses for a specific check-in, including responses
 * @param docClient - DynamoDB document client
 * @param checkInId - The check-in ID
 * @returns Promise<{checkIn: CheckIn, assignments: Array<{userId: string, userName: string, userEmail: string, status: AssignmentStatus, assignedAt: string, assignedBy: string, completedAt?: string, responses?: Answer[]}>, statusCounts: {pending: number, completed: number}}>
 */
export async function getCheckInDetailsHelper(
  docClient: DynamoDBDocumentClient,
  checkInId: string
): Promise<{
  checkIn: CheckIn;
  assignments: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    status: AssignmentStatus;
    assignedAt: string;
    assignedBy: string;
    completedAt?: string;
    responses?: Answer[];
  }>;
  statusCounts: { pending: number; completed: number };
}> {
  const pk = `checkin#${checkInId}`;

  // Get the check-in meta details
  const checkInResult = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAMES.CHECKINS,
      Key: {
        PK: pk,
        SK: "meta",
      },
    })
  );

  if (!checkInResult.Item) {
    throw new Error(`Check-in with ID ${checkInId} not found`);
  }

  // Get all assignments for this check-in
  const assignmentsResult = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAMES.CHECKINS,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": pk,
        ":skPrefix": "assignment#",
      },
    })
  );

  const assignments = (assignmentsResult.Items || []) as AssignmentItem[];

  // Get all responses for this check-in
  const responsesResult = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAMES.CHECKINS,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": pk,
        ":skPrefix": "response#",
      },
    })
  );

  const responses = (responsesResult.Items || []) as ResponseItem[];

  // Create a map of responses by userId for quick lookup
  const responseMap = new Map(
    responses.map((response) => [response.userId, response.answers])
  );

  // Calculate status counts
  const statusCounts = assignments.reduce((counts, assignment) => {
    counts[assignment.status] = (counts[assignment.status] || 0) + 1;
    return counts;
  }, {} as { [key: string]: number });

  // Ensure all statuses are represented
  const finalStatusCounts = {
    pending: statusCounts[AssignmentStatus.PENDING] || 0,
    completed: statusCounts[AssignmentStatus.COMPLETED] || 0,
  };

  const checkIn: CheckIn = {
    id: checkInId,
    title: checkInResult.Item.title,
    description: checkInResult.Item.description,
    questions: checkInResult.Item.questions,
    dueDate: checkInResult.Item.dueDate,
    createdBy: checkInResult.Item.createdBy,
    createdAt: checkInResult.Item.createdAt,
    updatedAt: checkInResult.Item.updatedAt,
  };

  // Get all unique user IDs from assignments
  const userIds = [
    ...new Set(assignments.map((assignment) => assignment.userId)),
  ];

  // Fetch all user details in a single batch operation
  const users = await findUsersByIds(userIds);

  // Create a map for quick lookup
  const userMap = new Map(users.map((user) => [user.id, user]));

  // Map assignments with user details and responses
  const userDetails = assignments.map((assignment) => {
    const user = userMap.get(assignment.userId);
    const responses = responseMap.get(assignment.userId);

    return {
      userId: assignment.userId,
      userName: user?.name || "Unknown User",
      userEmail: user?.email || "unknown@example.com",
      status: assignment.status,
      assignedAt: assignment.assignedAt,
      assignedBy: assignment.assignedBy,
      completedAt: assignment.completedAt,
      responses: responses || undefined,
    };
  });

  return {
    checkIn,
    assignments: userDetails,
    statusCounts: finalStatusCounts,
  };
}
