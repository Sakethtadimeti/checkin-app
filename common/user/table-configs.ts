import { TableConfig } from "./dynamodb";

// Table names for easy access
export const TABLE_NAMES = {
  USERS: "users",
  CHECKINS: "checkins", // Single table for check-ins, assignments, and responses
} as const;

// Users table configuration
export const usersTableConfig: TableConfig = {
  tableName: TABLE_NAMES.USERS,
  keySchema: [
    { AttributeName: "id", KeyType: "HASH" }, // Partition key
  ],
  attributeDefinitions: [
    { AttributeName: "id", AttributeType: "S" }, // String type
    { AttributeName: "email", AttributeType: "S" },
    { AttributeName: "role", AttributeType: "S" },
    { AttributeName: "managerId", AttributeType: "S" }, // ✅ Added for manager relationships
  ],
  globalSecondaryIndexes: [
    {
      IndexName: "email-index",
      KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
      Projection: {
        ProjectionType: "ALL",
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
    {
      IndexName: "role-index",
      KeySchema: [{ AttributeName: "role", KeyType: "HASH" }],
      Projection: {
        ProjectionType: "ALL",
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
    {
      IndexName: "managerId-index", // ✅ Added for manager-team relationships
      KeySchema: [{ AttributeName: "managerId", KeyType: "HASH" }],
      Projection: {
        ProjectionType: "ALL",
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
  ],
};

// Check-ins table configuration (Single Table Design)
export const checkinsTableConfig: TableConfig = {
  tableName: TABLE_NAMES.CHECKINS,
  keySchema: [
    { AttributeName: "PK", KeyType: "HASH" }, // Partition key: checkin#<id>
    { AttributeName: "SK", KeyType: "RANGE" }, // Sort key: meta, assignment#<userId>, response#<userId>
  ],
  attributeDefinitions: [
    { AttributeName: "PK", AttributeType: "S" },
    { AttributeName: "SK", AttributeType: "S" },
    { AttributeName: "createdBy", AttributeType: "S" },
    { AttributeName: "userId", AttributeType: "S" },
    { AttributeName: "type", AttributeType: "S" },
  ],
  globalSecondaryIndexes: [
    {
      IndexName: "created-by-index", // For: check-ins created by a manager
      KeySchema: [
        { AttributeName: "createdBy", KeyType: "HASH" },
        { AttributeName: "type", KeyType: "RANGE" }, // must filter where type = "CHECKIN"
      ],
      Projection: { ProjectionType: "ALL" },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
    {
      IndexName: "user-type-index", // For: user-specific assignments/responses
      KeySchema: [
        { AttributeName: "userId", KeyType: "HASH" },
        { AttributeName: "type", KeyType: "RANGE" }, // ASSIGNMENT / RESPONSE
      ],
      Projection: { ProjectionType: "ALL" },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
  ],
};

// All table configurations
export const allTableConfigs: TableConfig[] = [
  usersTableConfig,
  checkinsTableConfig,
];
