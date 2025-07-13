import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  getUsersByManager,
  initializeDynamoDB,
  dynamodbClient,
} from "@checkin-app/common";
import { withManagerRole } from "./helpers/auth";

// Initialize the common package with DynamoDB client
initializeDynamoDB(dynamodbClient);

/** This is a workaround to allow CORS requests from the frontend */
const headers = {
  "Access-Control-Allow-Origin": "*",
};

/**
 * GET /users/manager/members
 * Returns all team members associated with the authenticated manager
 * Only accessible to authenticated managers
 */
const getMembersByManagerHandler = async (
  event: APIGatewayProxyEvent,
  user: { id: string; email: string; role: string }
): Promise<APIGatewayProxyResult> => {
  try {
    // Use the manager ID from the JWT token
    const managerId = user.id;

    // Get team members directly from the database using the managerId-index
    const members = await getUsersByManager(managerId);

    // Return only the necessary fields for selection (name and id)
    const memberSelections = members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email, // Include email for additional context
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Members fetched successfully",
        data: {
          managerId,
          count: memberSelections.length,
          members: memberSelections,
        },
      }),
    };
  } catch (error) {
    console.error("Error fetching members by manager:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Internal server error",
        message: "Failed to fetch members for the specified manager",
      }),
    };
  }
};

export const handler = withManagerRole(getMembersByManagerHandler);
