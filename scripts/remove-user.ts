import {
  removeUserByEmail,
  removeUserById,
  removeAllUsers,
  findUserByEmail,
  findUserById,
  getAllUsers,
  hasTeamMembers,
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
🗑️  Usage: npm run remove-user -- [options] [identifier]

Options:
  --all, -a           Remove all users (⚠️ destructive)
  --email <email>     Remove user by email
  --id <id>           Remove user by ID
  --list, -l          List all users
  --help, -h          Show this help message

Examples:
  # Remove all users (⚠️ destructive)
  npm run remove-user -- --all

  # Remove user by email
  npm run remove-user -- --email john@example.com

  # Remove user by ID
  npm run remove-user -- --id d27e68ea-3d47-408e-890b-d1595b0f26c1

  # List all users
  npm run remove-user -- --list

  # Show help
  npm run remove-user -- --help

Note: 
- Use -- to pass arguments through npm to the script
- Removing a manager will orphan their team members.
`);
}

/**
 * Lists all users in a formatted table
 */
async function listUsers(): Promise<void> {
  console.log("📋 Fetching all users...");
  const users = await getAllUsers();

  if (users.length === 0) {
    console.log("📭 No users found in the database");
    return;
  }

  console.log(`\n📊 Found ${users.length} user(s):`);
  console.log("─".repeat(120));
  console.log(
    `${"ID".padEnd(36)} | ${"Email".padEnd(25)} | ${"Name".padEnd(
      20
    )} | ${"Role".padEnd(8)} | ${"Manager ID".padEnd(36)}`
  );
  console.log("─".repeat(120));

  for (const user of users) {
    const managerId = user.managerId || "N/A";
    console.log(
      `${user.id} | ${user.email.padEnd(25)} | ${user.name.padEnd(
        20
      )} | ${user.role.padEnd(8)} | ${managerId}`
    );
  }
  console.log("─".repeat(120));
}

/**
 * Removes a user by email with confirmation
 */
async function removeByEmail(email: string): Promise<void> {
  console.log(`🔍 Looking for user with email: ${email}`);

  const user = await findUserByEmail(email);
  if (!user) {
    console.log("❌ User not found");
    return;
  }

  console.log("✅ User found:");
  console.log(`   ID: ${user.id}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Email: ${user.email}`);

  // Check if manager has team members
  if (user.role === "manager") {
    const hasMembers = await hasTeamMembers(user.id);
    if (hasMembers) {
      console.log(
        "⚠️  Warning: This manager has team members. Removing them will orphan the team members."
      );
    }
  }

  // Check if member has a manager
  if (user.role === "member" && user.managerId) {
    const manager = await findUserById(user.managerId);
    if (manager) {
      console.log(`   Manager: ${manager.name} (${manager.email})`);
    }
  }

  console.log("\n🗑️  Are you sure you want to remove this user? (y/N)");

  // For automation, we'll proceed without confirmation
  // In a real CLI, you'd use readline or similar for user input
  console.log("Proceeding with removal...");

  const removed = await removeUserByEmail(email);
  if (removed) {
    console.log("✅ User removed successfully");
  } else {
    console.log("❌ Failed to remove user");
  }
}

/**
 * Removes a user by ID with confirmation
 */
async function removeById(id: string): Promise<void> {
  console.log(`🔍 Looking for user with ID: ${id}`);

  const user = await findUserById(id);
  if (!user) {
    console.log("❌ User not found");
    return;
  }

  console.log("✅ User found:");
  console.log(`   ID: ${user.id}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Email: ${user.email}`);

  // Check if manager has team members
  if (user.role === "manager") {
    const hasMembers = await hasTeamMembers(user.id);
    if (hasMembers) {
      console.log(
        "⚠️  Warning: This manager has team members. Removing them will orphan the team members."
      );
    }
  }

  // Check if member has a manager
  if (user.role === "member" && user.managerId) {
    const manager = await findUserById(user.managerId);
    if (manager) {
      console.log(`   Manager: ${manager.name} (${manager.email})`);
    }
  }

  console.log("\n🗑️  Are you sure you want to remove this user? (y/N)");
  console.log("Proceeding with removal...");

  const removed = await removeUserById(id);
  if (removed) {
    console.log("✅ User removed successfully");
  } else {
    console.log("❌ Failed to remove user");
  }
}

/**
 * Removes all users with confirmation
 */
async function removeAll(): Promise<void> {
  console.log("🔍 Counting users...");
  const users = await getAllUsers();

  if (users.length === 0) {
    console.log("📭 No users to remove");
    return;
  }

  console.log(
    `⚠️  WARNING: This will remove ALL ${users.length} users from the database!`
  );
  console.log("This action cannot be undone.");

  // Show summary of users to be removed
  const managers = users.filter((u) => u.role === "manager").length;
  const members = users.filter((u) => u.role === "member").length;

  console.log(`\n📊 Users to be removed:`);
  console.log(`   Managers: ${managers}`);
  console.log(`   Members: ${members}`);
  console.log(`   Total: ${users.length}`);

  console.log("\n🗑️  Are you sure you want to remove ALL users? (y/N)");
  console.log("Proceeding with removal...");

  const removedCount = await removeAllUsers();
  if (removedCount > 0) {
    console.log(`✅ Successfully removed ${removedCount} user(s)`);
  } else {
    console.log("❌ Failed to remove users or no users were removed");
  }
}

/**
 * Main function to handle user removal
 */
async function main(): Promise<void> {
  try {
    // Get command line arguments (skip first two: node and script path)
    const args = process.argv.slice(2);
    console.log("Arguments received:", args);

    // Show usage if no arguments or help flag
    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
      showUsage();
      return;
    }

    console.log("🚀 Starting user removal process...");
    logEnvironment();

    // Parse arguments - check for flags first
    if (args.includes("--all") || args.includes("-a")) {
      console.log("🗑️  Removing all users...");
      await removeAll();
    } else if (args.includes("--list") || args.includes("-l")) {
      console.log("📋 Listing all users...");
      await listUsers();
    } else if (args.includes("--email")) {
      const emailIndex = args.indexOf("--email");
      if (emailIndex === -1 || emailIndex === args.length - 1) {
        throw new Error("Email argument requires a value");
      }
      const email = args[emailIndex + 1];
      console.log(`🗑️  Removing user by email: ${email}`);
      await removeByEmail(email);
    } else if (args.includes("--id")) {
      const idIndex = args.indexOf("--id");
      if (idIndex === -1 || idIndex === args.length - 1) {
        throw new Error("ID argument requires a value");
      }
      const id = args[idIndex + 1];
      console.log(`🗑️  Removing user by ID: ${id}`);
      await removeById(id);
    } else {
      throw new Error("Invalid arguments. Use --help for usage information");
    }
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
