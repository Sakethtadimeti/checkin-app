import { TableConfig } from "./dynamodb";

// Users table configuration
export const usersTableConfig: TableConfig = {
  tableName: "checkin-users",
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

// Check-ins table configuration
export const checkinsTableConfig: TableConfig = {
  tableName: "checkin-checkins",
  keySchema: [
    { AttributeName: "id", KeyType: "HASH" }, // Partition key
    { AttributeName: "teamId", KeyType: "RANGE" }, // Sort key
  ],
  attributeDefinitions: [
    { AttributeName: "id", AttributeType: "S" },
    { AttributeName: "teamId", AttributeType: "S" },
    { AttributeName: "createdBy", AttributeType: "S" },
    { AttributeName: "status", AttributeType: "S" },
  ],
  globalSecondaryIndexes: [
    {
      IndexName: "team-status-index",
      KeySchema: [
        { AttributeName: "teamId", KeyType: "HASH" },
        { AttributeName: "status", KeyType: "RANGE" },
      ],
      Projection: {
        ProjectionType: "ALL",
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
    {
      IndexName: "created-by-index",
      KeySchema: [{ AttributeName: "createdBy", KeyType: "HASH" }],
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

// Responses table configuration
export const responsesTableConfig: TableConfig = {
  tableName: "checkin-responses",
  keySchema: [
    { AttributeName: "checkInId", KeyType: "HASH" }, // Partition key
    { AttributeName: "userId", KeyType: "RANGE" }, // Sort key
  ],
  attributeDefinitions: [
    { AttributeName: "checkInId", AttributeType: "S" },
    { AttributeName: "userId", AttributeType: "S" },
    { AttributeName: "submittedAt", AttributeType: "S" },
  ],
  globalSecondaryIndexes: [
    {
      IndexName: "user-responses-index",
      KeySchema: [
        { AttributeName: "userId", KeyType: "HASH" },
        { AttributeName: "submittedAt", KeyType: "RANGE" },
      ],
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

// All table configurations
export const allTableConfigs: TableConfig[] = [
  usersTableConfig,
  checkinsTableConfig,
  responsesTableConfig,
];

// Table names for easy access
export const TABLE_NAMES = {
  USERS: "checkin-users",
  CHECKINS: "checkin-checkins",
  RESPONSES: "checkin-responses",
} as const;
