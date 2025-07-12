# Checkin App Setup Scripts

This directory contains scripts for setting up and managing the checkin application infrastructure.

## Prerequisites

- Docker and Docker Compose running
- LocalStack container running (via `docker-compose up localstack`)
- Node.js and npm installed

## Scripts

### Bootstrap (`npm run bootstrap`)

Sets up the complete infrastructure:

- Creates DynamoDB tables in LocalStack
- Verifies table creation
- Lists all tables

### Add User (`npm run add-user`)

Adds a new user to the system with proper password hashing and validation.

#### Usage

```bash
npm run add-user <email> <password> <name> <role> [managerId]
```

#### Arguments

- **email** (required): User's email address
- **password** (required): User's password (will be hashed using bcrypt)
- **name** (required): User's display name
- **role** (required): User role (`manager` or `member`)
- **managerId** (optional): Manager's user ID (required for members, not allowed for managers)

#### Examples

```bash
# Create a manager
npm run add-user john@example.com password123 "John Doe" manager

# Create a member with a manager
npm run add-user jane@example.com password123 "Jane Smith" member d27e68ea-3d47-408e-890b-d1595b0f26c1

# Show help
npm run add-user -- --help
```

#### Validation Rules

- Email must be in valid format
- Password must be at least 6 characters long
- Name cannot be empty
- Role must be either `manager` or `member`
- Members must have a `managerId`
- Managers cannot have a `managerId`
- Email must be unique (duplicate check)

#### Features

- **Password Security**: Passwords are hashed using bcrypt with 12 salt rounds
- **Data Validation**: Comprehensive input validation with helpful error messages
- **Duplicate Prevention**: Checks for existing users by email
- **Role-based Logic**: Enforces manager/member relationship rules
- **UUID Generation**: Automatically generates unique user IDs
- **Timestamps**: Adds creation and update timestamps

## Installation

```bash
npm install
```

## Environment Setup

The scripts use environment variables for AWS/LocalStack configuration. Create a `.env` file or set these variables:

- `AWS_ENDPOINT`: LocalStack endpoint (default: `http://localhost:4566`)
- `AWS_REGION`: AWS region (default: `us-east-1`)
- `AWS_ACCESS_KEY_ID`: Access key (default: `test`)
- `AWS_SECRET_ACCESS_KEY`: Secret key (default: `test`)

## Database Schema

The scripts create three DynamoDB tables:

1. **checkin-users**: User accounts and authentication
2. **checkin-checkins**: Check-in sessions
3. **checkin-responses**: User responses to check-ins

See `helpers/table-configs.ts` for detailed schema information.
