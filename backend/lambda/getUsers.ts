import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  initializeDynamoDB,
  getAllUsers,
  dynamodbClient,
} from "@checkin-app/common";

// Initialize the common utilities with our DynamoDB client
initializeDynamoDB(dynamodbClient);

/**
 * Lambda handler to get all users from the checkin-users table
 * @param event - API Gateway event
 * @returns Promise<APIGatewayProxyResult> - Response with users data
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("📋 Getting all users from checkin-users table...");
    console.log("🔧 DynamoDB endpoint:", process.env.AWS_ENDPOINT);
    console.log("🌍 AWS Region:", process.env.AWS_REGION);

    const users = await getAllUsers();
    console.log("📊 Raw users result:", users);

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
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
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
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
      body: JSON.stringify({
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
