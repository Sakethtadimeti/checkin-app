#!/usr/bin/env ts-node

import {
  createUser,
  isValidEmail,
  userExists,
  initializeDynamoDB,
  logEnvironment,
  dynamodbClient,
} from "@checkin-app/common";

// Initialize DynamoDB client for the common package
initializeDynamoDB(dynamodbClient);

/**
 * Displays usage information for the script
 */
function showUsage(): void {
  console.log(`
📝 Usage: npm run add-user <email> <password> <name> <role> [managerId]

Required arguments:
  email     - User's email address
  password  - User's password (will be hashed)
  name      - User's display name
  role      - User role (manager or member)

Optional arguments:
  managerId - Manager's user ID (required for members, not allowed for managers)

Examples:
  npm run add-user john@example.com password123 "John Doe" manager
  npm run add-user jane@example.com password123 "Jane Smith" member manager123

Note: Members must have a managerId, managers cannot have a managerId.
`);
}

/**
 * Validates command line arguments
 */
function validateArgs(args: string[]): {
  email: string;
  password: string;
  name: string;
  role: "manager" | "member";
  managerId?: string;
} {
  if (args.length < 4) {
    throw new Error("Missing required arguments");
  }

  const [email, password, name, role, managerId] = args;

  // Validate email
  if (!isValidEmail(email)) {
    throw new Error(`Invalid email format: ${email}`);
  }

  // Validate password
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  // Validate name
  if (name.trim().length === 0) {
    throw new Error("Name cannot be empty");
  }

  // Validate role
  if (role !== "manager" && role !== "member") {
    throw new Error(`Invalid role: ${role}. Must be 'manager' or 'member'`);
  }

  // Validate managerId based on role
  if (role === "member" && !managerId) {
    throw new Error("Members must have a managerId");
  }

  if (role === "manager" && managerId) {
    throw new Error("Managers cannot have a managerId");
  }

  return {
    email: email.toLowerCase().trim(),
    password,
    name: name.trim(),
    role,
    managerId: managerId?.trim(),
  };
}

/**
 * Main function to add a user
 */
async function main(): Promise<void> {
  try {
    // Get command line arguments (skip first two: node and script path)
    const args = process.argv.slice(2);

    // Show usage if no arguments or help flag
    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
      showUsage();
      return;
    }

    console.log("🚀 Starting user creation process...");
    logEnvironment();

    // Validate arguments
    const userData = validateArgs(args);

    console.log("✅ Arguments validated successfully");
    console.log("📋 User data:", {
      email: userData.email,
      name: userData.name,
      role: userData.role,
      managerId: userData.managerId || "N/A",
    });

    // Check if user already exists
    console.log("🔍 Checking if user already exists...");
    const exists = await userExists(userData.email);
    if (exists) {
      throw new Error(`User with email ${userData.email} already exists`);
    }

    // Create the user
    console.log("👤 Creating user...");
    const user = await createUser(userData);

    console.log("✅ User created successfully!");
    console.log("📋 User details:", {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      managerId: user.managerId || "N/A",
      teamId: user.teamId || "N/A",
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.log("\n💡 Use --help for usage information");
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Unhandled error:", error);
    process.exit(1);
  });
}
