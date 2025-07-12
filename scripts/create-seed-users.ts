#!/usr/bin/env ts-node

import {
  createUser,
  userExists,
  initializeDynamoDB,
  logEnvironment,
  dynamodbClient,
} from "@checkin-app/common";

// Initialize DynamoDB client for the common package
initializeDynamoDB(dynamodbClient);

/**
 * Seed user data structure
 */
interface SeedUser {
  email: string;
  password: string;
  name: string;
  role: "manager" | "member";
  managerId?: string;
  teamId?: string;
}

/**
 * Generate seed users data
 */
function generateSeedUsers(): SeedUser[] {
  const users: SeedUser[] = [];

  // Manager 1: Sarah Johnson - Engineering Team
  const manager1: SeedUser = {
    email: "sarah.johnson@company.com",
    password: "password123",
    name: "Sarah Johnson",
    role: "manager",
    teamId: "engineering-team",
  };
  users.push(manager1);

  // Manager 2: Michael Chen - Product Team
  const manager2: SeedUser = {
    email: "michael.chen@company.com",
    password: "password123",
    name: "Michael Chen",
    role: "manager",
    teamId: "product-team",
  };
  users.push(manager2);

  // Engineering Team Members (5 members under Sarah)
  const engineeringMembers = [
    {
      email: "alex.rodriguez@company.com",
      password: "password123",
      name: "Alex Rodriguez",
      role: "member" as const,
      teamId: "engineering-team",
    },
    {
      email: "emma.wilson@company.com",
      password: "password123",
      name: "Emma Wilson",
      role: "member" as const,
      teamId: "engineering-team",
    },
    {
      email: "david.kim@company.com",
      password: "password123",
      name: "David Kim",
      role: "member" as const,
      teamId: "engineering-team",
    },
    {
      email: "lisa.patel@company.com",
      password: "password123",
      name: "Lisa Patel",
      role: "member" as const,
      teamId: "engineering-team",
    },
    {
      email: "james.anderson@company.com",
      password: "password123",
      name: "James Anderson",
      role: "member" as const,
      teamId: "engineering-team",
    },
  ];

  // Product Team Members (5 members under Michael)
  const productMembers = [
    {
      email: "sophia.garcia@company.com",
      password: "password123",
      name: "Sophia Garcia",
      role: "member" as const,
      teamId: "product-team",
    },
    {
      email: "ryan.thompson@company.com",
      password: "password123",
      name: "Ryan Thompson",
      role: "member" as const,
      teamId: "product-team",
    },
    {
      email: "olivia.martinez@company.com",
      password: "password123",
      name: "Olivia Martinez",
      role: "member" as const,
      teamId: "product-team",
    },
    {
      email: "daniel.lee@company.com",
      password: "password123",
      name: "Daniel Lee",
      role: "member" as const,
      teamId: "product-team",
    },
    {
      email: "ava.brown@company.com",
      password: "password123",
      name: "Ava Brown",
      role: "member" as const,
      teamId: "product-team",
    },
  ];

  // Add all members (we'll set managerId after creating managers)
  users.push(...engineeringMembers, ...productMembers);

  return users;
}

/**
 * Create users in the correct order (managers first, then members)
 */
async function createSeedUsers(): Promise<void> {
  const seedUsers = generateSeedUsers();
  const createdUsers: { [key: string]: string } = {}; // email -> userId mapping

  console.log("🚀 Starting seed user creation process...");
  logEnvironment();
  console.log(`📋 Creating ${seedUsers.length} users...`);
  console.log("---");

  // First, create managers
  const managers = seedUsers.filter((user) => user.role === "manager");
  console.log(`👔 Creating ${managers.length} managers...`);

  for (const userData of managers) {
    try {
      console.log(`🔍 Checking if ${userData.email} exists...`);
      const exists = await userExists(userData.email);
      if (exists) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      console.log(`👤 Creating manager: ${userData.name} (${userData.email})`);
      const user = await createUser(userData);
      createdUsers[userData.email] = user.id;

      console.log(`✅ Created manager: ${user.name} (ID: ${user.id})`);
    } catch (error: any) {
      console.error(
        `❌ Error creating manager ${userData.email}:`,
        error.message
      );
    }
  }

  console.log("---");
  console.log(
    `👥 Creating ${seedUsers.length - managers.length} team members...`
  );

  // Then, create members with proper managerId
  const members = seedUsers.filter((user) => user.role === "member");

  for (const userData of members) {
    try {
      console.log(`🔍 Checking if ${userData.email} exists...`);
      const exists = await userExists(userData.email);
      if (exists) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Determine managerId based on teamId
      let managerId: string;
      if (userData.teamId === "engineering-team") {
        managerId = createdUsers["sarah.johnson@company.com"];
      } else if (userData.teamId === "product-team") {
        managerId = createdUsers["michael.chen@company.com"];
      } else {
        throw new Error(`Unknown teamId: ${userData.teamId}`);
      }

      if (!managerId) {
        throw new Error(`Manager not found for team: ${userData.teamId}`);
      }

      const memberData = {
        ...userData,
        managerId,
      };

      console.log(`👤 Creating member: ${userData.name} (${userData.email})`);
      const user = await createUser(memberData);
      createdUsers[userData.email] = user.id;

      console.log(
        `✅ Created member: ${user.name} (ID: ${user.id}, Manager: ${managerId})`
      );
    } catch (error: any) {
      console.error(
        `❌ Error creating member ${userData.email}:`,
        error.message
      );
    }
  }

  console.log("---");
  console.log("🎉 Seed user creation completed!");
  console.log(
    `📊 Created ${Object.keys(createdUsers).length} users successfully`
  );
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);

    if (args.includes("--help") || args.includes("-h")) {
      console.log(`
🌱 Seed User Creation Script

Usage: npm run create-seed-users

This script creates 12 seed users:
- 2 managers (Sarah Johnson, Michael Chen)
- 10 team members (5 per manager)

Teams:
- Engineering Team (Sarah Johnson + 5 members)
- Product Team (Michael Chen + 5 members)

All users use password: password123
`);
      return;
    }

    await createSeedUsers();
  } catch (error: any) {
    console.error("❌ Error:", error.message);
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
