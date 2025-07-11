import {
  createTable,
  dropTable,
  verifyTable,
  listAllTables,
  logEnvironment,
  checkTableExists,
} from "./helpers/dynamodb";
import {
  allTableConfigs,
  usersTableConfig,
  checkinsTableConfig,
  responsesTableConfig,
  TABLE_NAMES,
} from "./helpers/table-configs";

// Command line argument parsing
const command = process.argv[2];
const tableName = process.argv[3];

async function setupAllTables(): Promise<void> {
  console.log("🚀 Setting up all DynamoDB tables...");
  logEnvironment();
  console.log("---");

  for (const config of allTableConfigs) {
    try {
      const exists = await checkTableExists(config.tableName);
      if (exists) {
        console.log(`✅ ${config.tableName} already exists, skipping...`);
        continue;
      }

      await createTable(config);
      await verifyTable(config.tableName);
      console.log("---");
    } catch (error) {
      console.error(`❌ Failed to setup ${config.tableName}:`, error);
      process.exit(1);
    }
  }

  console.log("🎉 All tables setup completed!");
}

async function setupTable(tableName: string): Promise<void> {
  console.log(`🚀 Setting up ${tableName} table...`);
  logEnvironment();
  console.log("---");

  let config;
  switch (tableName) {
    case TABLE_NAMES.USERS:
      config = usersTableConfig;
      break;
    case TABLE_NAMES.CHECKINS:
      config = checkinsTableConfig;
      break;
    case TABLE_NAMES.RESPONSES:
      config = responsesTableConfig;
      break;
    default:
      console.error(`❌ Unknown table: ${tableName}`);
      console.log("Available tables:", Object.values(TABLE_NAMES));
      process.exit(1);
  }

  try {
    const exists = await checkTableExists(config.tableName);
    if (exists) {
      console.log(`✅ ${config.tableName} already exists`);
      return;
    }

    await createTable(config);
    await verifyTable(config.tableName);
  } catch (error) {
    console.error(`❌ Failed to setup ${config.tableName}:`, error);
    process.exit(1);
  }
}

async function dropAllTables(): Promise<void> {
  console.log("🚀 Dropping all DynamoDB tables...");
  logEnvironment();
  console.log("⚠️  WARNING: This will permanently delete all tables and data!");
  console.log("---");

  for (const config of allTableConfigs) {
    try {
      const exists = await checkTableExists(config.tableName);
      if (!exists) {
        console.log(`ℹ️  ${config.tableName} does not exist, skipping...`);
        continue;
      }

      await dropTable(config.tableName);
      console.log("---");
    } catch (error) {
      console.error(`❌ Failed to drop ${config.tableName}:`, error);
    }
  }

  console.log("🎉 All tables dropped!");
}

async function dropSpecificTable(tableName: string): Promise<void> {
  console.log(`🚀 Dropping ${tableName} table...`);
  logEnvironment();
  console.log(
    "⚠️  WARNING: This will permanently delete the table and all data!"
  );
  console.log("---");

  try {
    const exists = await checkTableExists(tableName);
    if (!exists) {
      console.log(`ℹ️  ${tableName} does not exist`);
      return;
    }

    await dropTable(tableName);
  } catch (error) {
    console.error(`❌ Failed to drop ${tableName}:`, error);
    process.exit(1);
  }
}

async function verifyAllTables(): Promise<void> {
  console.log("🔍 Verifying all DynamoDB tables...");
  logEnvironment();
  console.log("---");

  let allValid = true;
  for (const config of allTableConfigs) {
    const isValid = await verifyTable(config.tableName);
    if (!isValid) {
      allValid = false;
    }
    console.log("---");
  }

  if (allValid) {
    console.log("✅ All tables are valid!");
  } else {
    console.log("❌ Some tables have issues");
    process.exit(1);
  }
}

function showHelp(): void {
  console.log(`
🗄️  DynamoDB Bootstrap Script

Usage: npm run bootstrap <command> [table-name]

Commands:
  setup                    Setup all tables
  setup <table>           Setup specific table (users, checkins, responses)
  drop                     Drop all tables (⚠️ destructive)
  drop <table>            Drop specific table (⚠️ destructive)
  verify                   Verify all tables
  list                     List all tables
  help                     Show this help

Examples:
  npm run bootstrap setup
  npm run bootstrap setup users
  npm run bootstrap drop
  npm run bootstrap drop checkins
  npm run bootstrap verify
  npm run bootstrap list

Available tables:
  - users (${TABLE_NAMES.USERS})
  - checkins (${TABLE_NAMES.CHECKINS})
  - responses (${TABLE_NAMES.RESPONSES})
`);
}

async function main(): Promise<void> {
  try {
    switch (command) {
      case "setup":
        if (tableName) {
          await setupTable(tableName);
        } else {
          await setupAllTables();
        }
        break;

      case "drop":
        if (tableName) {
          await dropSpecificTable(tableName);
        } else {
          await dropAllTables();
        }
        break;

      case "verify":
        await verifyAllTables();
        break;

      case "list":
        await listAllTables();
        break;

      case "help":
      case "--help":
      case "-h":
        showHelp();
        break;

      default:
        console.log("❌ Unknown command:", command);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Bootstrap failed:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export {
  setupAllTables,
  setupTable,
  dropAllTables,
  dropSpecificTable,
  verifyAllTables,
};
