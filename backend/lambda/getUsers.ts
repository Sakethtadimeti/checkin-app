import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  getAllUsers,
  initializeDynamoDB,
  dynamodbClient,
} from "@checkin-app/common";

// Initialize the common utilities with our DynamoDB client
initializeDynamoDB(dynamodbClient);

/** This is a workaround to allow CORS requests from the frontend */
const headers = {
  "Access-Control-Allow-Origin": "*",
};

/**
 * Lambda handler to get all users from the TABLE_NAMES.USERS table
 * @param event - API Gateway event
 * @returns Promise<APIGatewayProxyResult> - Response with users data
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const users = await getAllUsers();

    // Remove sensitive data before returning
    const safeUsers = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      managerId: user.managerId,
      teamId: user.teamId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // passwordHash is intentionally excluded for security
    }));

    console.log(`✅ Successfully retrieved ${safeUsers.length} users`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: safeUsers.length,
        users: safeUsers,
      }),
    };
  } catch (error) {
    console.error("❌ Error getting users:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
