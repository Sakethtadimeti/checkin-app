import {
  DynamoDBClient,
  DescribeTableCommand,
  CreateTableCommand,
  DeleteTableCommand,
  ListTablesCommand,
  KeySchemaElement,
  AttributeDefinition,
  GlobalSecondaryIndex,
  CreateTableInput,
  waitUntilTableExists,
  waitUntilTableNotExists,
} from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configure AWS SDK v3 for LocalStack
export const dynamodbClient = new DynamoDBClient({
  endpoint: process.env.AWS_ENDPOINT || "http://localhost:4566",
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
  },
});

// Common table interface
export interface TableConfig {
  tableName: string;
  keySchema: KeySchemaElement[];
  attributeDefinitions: AttributeDefinition[];
  globalSecondaryIndexes?: GlobalSecondaryIndex[];
}

// Common functions
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    await dynamodbClient.send(
      new DescribeTableCommand({ TableName: tableName })
    );
    return true;
  } catch (error: any) {
    if (error.name === "ResourceNotFoundException") {
      return false;
    }
    throw error;
  }
}

export async function createTable(tableConfig: TableConfig): Promise<void> {
  try {
    console.log(`🏗️  Creating ${tableConfig.tableName} table...`);

    const params: CreateTableInput = {
      TableName: tableConfig.tableName,
      KeySchema: tableConfig.keySchema,
      AttributeDefinitions: tableConfig.attributeDefinitions,
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    };

    if (tableConfig.globalSecondaryIndexes) {
      params.GlobalSecondaryIndexes = tableConfig.globalSecondaryIndexes;
    }

    const result = await dynamodbClient.send(new CreateTableCommand(params));

    console.log(`⏳ Waiting for ${tableConfig.tableName} to be active...`);
    await waitUntilTableExists(
      { client: dynamodbClient, maxWaitTime: 60 },
      { TableName: tableConfig.tableName }
    );

    console.log(`✅ ${tableConfig.tableName} created successfully!`);
    console.log("📋 Table details:", {
      TableName: result.TableDescription?.TableName,
      TableStatus: result.TableDescription?.TableStatus,
      ItemCount: result.TableDescription?.ItemCount || 0,
    });
  } catch (error: any) {
    console.error(`❌ Error creating ${tableConfig.tableName}:`, error);
    if (error.name === "ResourceInUseException") {
      console.log(
        `ℹ️  ${tableConfig.tableName} might already exist or be in use`
      );
    }
    throw error;
  }
}

export async function dropTable(tableName: string): Promise<void> {
  try {
    console.log(`🗑️  Dropping ${tableName} table...`);

    const result = await dynamodbClient.send(
      new DeleteTableCommand({ TableName: tableName })
    );

    console.log(`⏳ Waiting for ${tableName} to be deleted...`);
    await waitUntilTableNotExists(
      { client: dynamodbClient, maxWaitTime: 60 },
      { TableName: tableName }
    );

    console.log(`✅ ${tableName} dropped successfully!`);
    console.log("📋 Table details:", {
      TableName: result.TableDescription?.TableName,
      TableStatus: result.TableDescription?.TableStatus,
    });
  } catch (error: any) {
    console.error(`❌ Error dropping ${tableName}:`, error);
    if (error.name === "ResourceNotFoundException") {
      console.log(`ℹ️  ${tableName} does not exist`);
    } else if (error.name === "ResourceInUseException") {
      console.log(`ℹ️  ${tableName} is in use, try again later`);
    }
    throw error;
  }
}

export async function verifyTable(tableName: string): Promise<boolean> {
  try {
    console.log(`🔍 Verifying ${tableName}...`);

    const result = await dynamodbClient.send(
      new DescribeTableCommand({ TableName: tableName })
    );

    if (!result.Table) {
      console.error(`❌ ${tableName} description is undefined`);
      return false;
    }

    console.log(`✅ ${tableName} verification successful!`);
    console.log("📊 Table status:", result.Table.TableStatus);
    console.log("🔑 Primary key:", result.Table.KeySchema?.[0]?.AttributeName);
    console.log(
      "📈 Indexes:",
      result.Table.GlobalSecondaryIndexes?.length || 0
    );

    return true;
  } catch (error: any) {
    console.error(`❌ Error verifying ${tableName}:`, error.message);
    return false;
  }
}

export async function listAllTables(): Promise<void> {
  try {
    console.log("🔗 Connecting to LocalStack...");

    const result = await dynamodbClient.send(new ListTablesCommand({}));

    if (!result.TableNames || result.TableNames.length === 0) {
      console.log("📋 No tables found in LocalStack");
      return;
    }

    console.log("📋 Tables found in LocalStack:");
    console.log("---");

    for (const tableName of result.TableNames) {
      try {
        const tableInfo = await dynamodbClient.send(
          new DescribeTableCommand({ TableName: tableName })
        );
        const table = tableInfo.Table;

        console.log(`📊 Table: ${tableName}`);
        console.log(`   Status: ${table?.TableStatus}`);
        console.log(`   Items: ${table?.ItemCount || 0}`);
        console.log(`   Primary Key: ${table?.KeySchema?.[0]?.AttributeName}`);
        console.log(
          `   Indexes: ${table?.GlobalSecondaryIndexes?.length || 0}`
        );
        console.log("---");
      } catch (error) {
        console.log(`📊 Table: ${tableName} (error getting details)`);
        console.log("---");
      }
    }

    console.log(`🎯 Total tables: ${result.TableNames.length}`);
  } catch (error: any) {
    console.error("❌ Error listing tables:", error);
    throw error;
  }
}

export function logEnvironment(): void {
  console.log(
    "📍 LocalStack endpoint:",
    process.env.AWS_ENDPOINT || "http://localhost:4566"
  );
  console.log("🌍 AWS Region:", process.env.AWS_REGION || "us-east-1");
}
