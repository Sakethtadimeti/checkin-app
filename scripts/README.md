# 🗄️ DynamoDB Setup Scripts

This directory contains TypeScript scripts to set up DynamoDB tables in LocalStack for the checkin-app.

## 📋 Prerequisites

1. **LocalStack running** on port 4566
2. **Node.js** and npm installed
3. **TypeScript** and ts-node for running scripts

## 🚀 Setup

### 1. Install Dependencies

```bash
cd scripts
npm install
```

### 2. Configure Environment

```bash
cp env.example .env
# Edit .env if needed
```

### 3. Run Scripts

#### Bootstrap Script (Recommended)

The bootstrap script provides a unified interface for managing all DynamoDB tables:

```bash
# Setup all tables
npm run bootstrap setup

# Setup specific table
npm run bootstrap setup users
npm run bootstrap setup checkins
npm run bootstrap setup responses

# Drop all tables (⚠️ destructive)
npm run bootstrap drop

# Drop specific table (⚠️ destructive)
npm run bootstrap drop users

# Verify all tables
npm run bootstrap verify

# List all tables
npm run bootstrap list

# Show help
npm run bootstrap help
```

#### Individual Scripts

```bash
# Create Users Table
npm run setup:users

# Drop Users Table
npm run drop:users

# List All Tables
npm run list:tables

# Create All Tables (legacy)
npm run setup:all
```

## 📊 Table Schemas

### Users Table (`checkin-users`)

- **Primary Key**: `id` (String)
- **GSI 1**: `email-index` for email lookups
- **GSI 2**: `role-index` for role-based queries

### Check-ins Table (`checkin-checkins`) - Coming Soon

- **Primary Key**: `id` (String)
- **Sort Key**: `teamId` (String)

### Responses Table (`checkin-responses`) - Coming Soon

- **Primary Key**: `checkInId` (String)
- **Sort Key**: `userId` (String)

## 🔧 Scripts

### Bootstrap Script

- `bootstrap.ts` - Unified table management script (recommended)

### Individual Scripts

- `setup-users-table.ts` - Creates users table with indexes
- `drop-users-table.ts` - Drops users table (⚠️ destructive)
- `list-tables.ts` - Lists all tables with details

### Helper Files

- `helpers/dynamodb.ts` - Common DynamoDB operations
- `helpers/table-configs.ts` - Table configurations and schemas

## 🐛 Troubleshooting

### LocalStack Not Running

```bash
docker-compose up localstack -d
```

### Permission Issues

```bash
# Check if LocalStack is accessible
curl http://localhost:4566/health
```

### Table Already Exists

Scripts will skip creation if tables already exist.

## 📝 Environment Variables

| Variable                | Default                 | Description               |
| ----------------------- | ----------------------- | ------------------------- |
| `AWS_ENDPOINT`          | `http://localhost:4566` | LocalStack endpoint       |
| `AWS_REGION`            | `us-east-1`             | AWS region                |
| `AWS_ACCESS_KEY_ID`     | `test`                  | Access key for LocalStack |
| `AWS_SECRET_ACCESS_KEY` | `test`                  | Secret key for LocalStack |
