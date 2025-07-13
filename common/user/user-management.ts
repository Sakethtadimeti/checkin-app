import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import bcrypt from "bcryptjs";
import { User, CreateUserData, UserRole } from "./types";
import { TABLE_NAMES } from "./table-configs";

// Create DynamoDB client - this will be configured by the consuming package
let dynamodbClient: DynamoDBClient | null = null;
let docClient: DynamoDBDocumentClient | null = null;

/**
 * Initialize the DynamoDB client
 * @param client - The DynamoDB client instance
 */
export function initializeDynamoDB(client: DynamoDBClient): void {
  dynamodbClient = client;
  docClient = DynamoDBDocumentClient.from(client);
}

/**
 * Get the DynamoDB document client
 * @returns DynamoDBDocumentClient instance
 */
function getDocClient(): DynamoDBDocumentClient {
  if (!docClient) {
    throw new Error(
      "DynamoDB client not initialized. Call initializeDynamoDB() first."
    );
  }
  return docClient;
}

/**
 * Hashes a password using bcrypt.js
 * @param password - The plain text password to hash
 * @returns Promise<string> - The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compares a plain text password with a hashed password using bcrypt.js
 * @param password - The plain text password
 * @param hash - The hashed password
 * @returns Promise<boolean> - True if passwords match
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Validates user role
 * @param role - The role to validate
 * @returns boolean - True if role is valid
 */
export function isValidRole(role: string): role is UserRole {
  return role === "manager" || role === "member";
}

/**
 * Generates a UUID for user ID
 * @returns string - A UUID
 */
export function generateUserId(): string {
  return crypto.randomUUID();
}

/**
 * Validates email format
 * @param email - The email to validate
 * @returns boolean - True if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Creates a new user in the database
 * @param userData - User data without id and timestamps
 * @returns Promise<User> - The created user with generated fields
 */
export async function createUser(userData: CreateUserData): Promise<User> {
  const { email, password, name, role, managerId, teamId } = userData;

  // Validate role
  if (!isValidRole(role)) {
    throw new Error(`Invalid role: ${role}. Must be 'manager' or 'member'`);
  }

  // Validate that members have a managerId
  if (role === "member" && !managerId) {
    throw new Error("Members must have a managerId");
  }

  // Validate that managers don't have a managerId
  if (role === "manager" && managerId) {
    throw new Error("Managers cannot have a managerId");
  }

  // Hash the password
  const passwordHash = await hashPassword(password);

  // Generate user ID and timestamps
  const id = generateUserId();
  const now = new Date().toISOString();

  const user: User = {
    id,
    email,
    passwordHash,
    name,
    role,
    managerId,
    teamId,
    createdAt: now,
    updatedAt: now,
  };

  // Store user in DynamoDB
  await getDocClient().send(
    new PutCommand({
      TableName: TABLE_NAMES.USERS,
      Item: user,
    })
  );

  return user;
}

/**
 * Finds a user by email
 * @param email - The email to search for
 * @returns Promise<User | null> - The user if found, null otherwise
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await getDocClient().send(
      new QueryCommand({
        TableName: TABLE_NAMES.USERS,
        IndexName: "email-index",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
      })
    );
    console.log(result.Items);
    return (result.Items?.[0] as User) || null;
  } catch (error: any) {
    console.warn("⚠️  Could not find user by email:", error.message);
    return null;
  }
}

/**
 * Finds a user by ID
 * @param id - The user ID to search for
 * @returns Promise<User | null> - The user if found, null otherwise
 */
export async function findUserById(id: string): Promise<User | null> {
  try {
    const result = await getDocClient().send(
      new GetCommand({
        TableName: TABLE_NAMES.USERS,
        Key: { id },
      })
    );
    return (result.Item as User) || null;
  } catch (error: any) {
    console.warn("⚠️  Could not find user by ID:", error.message);
    return null;
  }
}

/**
 * Authenticates a user with email and password
 * @param email - The user's email
 * @param password - The user's password
 * @returns Promise<User | null> - The authenticated user if successful, null otherwise
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  const isValid = await comparePassword(password, user.passwordHash);
  return isValid ? user : null;
}

/**
 * Checks if a user with the given email already exists
 * @param email - The email to check
 * @returns Promise<boolean> - True if user exists
 */
export async function userExists(email: string): Promise<boolean> {
  try {
    // Try to query by email using the email-index GSI
    const result = await getDocClient().send(
      new QueryCommand({
        TableName: TABLE_NAMES.USERS,
        IndexName: "email-index",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
      })
    );
    return (result.Items?.length || 0) > 0;
  } catch (error: any) {
    // If the email index doesn't exist or other error, return false
    // This is a fallback for development when GSI might not be ready
    console.warn("⚠️  Could not check email uniqueness:", error.message);
    return false;
  }
}

/**
 * Removes a user by ID
 * @param id - The user ID to remove
 * @returns Promise<boolean> - True if user was removed, false if not found
 */
export async function removeUserById(id: string): Promise<boolean> {
  try {
    const result = await getDocClient().send(
      new DeleteCommand({
        TableName: TABLE_NAMES.USERS,
        Key: { id },
        ReturnValues: "ALL_OLD",
      })
    );
    return !!result.Attributes;
  } catch (error: any) {
    console.error("❌ Error removing user by ID:", error.message);
    return false;
  }
}

/**
 * Removes a user by email
 * @param email - The email of the user to remove
 * @returns Promise<boolean> - True if user was removed, false if not found
 */
export async function removeUserByEmail(email: string): Promise<boolean> {
  try {
    // First find the user by email to get their ID
    const user = await findUserByEmail(email);
    if (!user) {
      return false;
    }

    // Then remove by ID
    return await removeUserById(user.id);
  } catch (error: any) {
    console.error("❌ Error removing user by email:", error.message);
    return false;
  }
}

/**
 * Gets all users from the database
 * @returns Promise<User[]> - Array of all users
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const result = await getDocClient().send(
      new ScanCommand({
        TableName: TABLE_NAMES.USERS,
      })
    );
    return (result.Items || []) as User[];
  } catch (error: any) {
    console.error("❌ Error getting all users:", error.message);
    return [];
  }
}

/**
 * Removes all users from the database
 * @returns Promise<number> - Number of users removed
 */
export async function removeAllUsers(): Promise<number> {
  try {
    const users = await getAllUsers();
    if (users.length === 0) {
      return 0;
    }

    console.log(`🗑️  Removing ${users.length} users...`);

    // Delete all users
    const deletePromises = users.map((user) =>
      getDocClient().send(
        new DeleteCommand({
          TableName: TABLE_NAMES.USERS,
          Key: { id: user.id },
        })
      )
    );

    await Promise.all(deletePromises);
    return users.length;
  } catch (error: any) {
    console.error("❌ Error removing all users:", error.message);
    return 0;
  }
}

/**
 * Gets all team members for a specific manager
 * @param managerId - The manager's user ID
 * @returns Promise<User[]> - Array of team members
 */
export async function getUsersByManager(managerId: string): Promise<User[]> {
  try {
    const result = await getDocClient().send(
      new QueryCommand({
        TableName: TABLE_NAMES.USERS,
        IndexName: "managerId-index",
        KeyConditionExpression: "managerId = :managerId",
        ExpressionAttributeValues: {
          ":managerId": managerId,
        },
      })
    );

    if (result.Items && result.Items.length > 0) {
      return result.Items as User[];
    }

    return [];
  } catch (error: any) {
    console.warn("⚠️  Could not get team members:", error.message);
    return [];
  }
}

/**
 * Checks if a user has team members (for managers)
 * @param managerId - The manager's user ID
 * @returns Promise<boolean> - True if manager has team members
 */
export async function hasTeamMembers(managerId: string): Promise<boolean> {
  try {
    const result = await getDocClient().send(
      new QueryCommand({
        TableName: TABLE_NAMES.USERS,
        IndexName: "managerId-index",
        KeyConditionExpression: "managerId = :managerId",
        ExpressionAttributeValues: {
          ":managerId": managerId,
        },
      })
    );
    return (result.Items?.length || 0) > 0;
  } catch (error: any) {
    console.warn("⚠️  Could not check team members:", error.message);
    return false;
  }
}
