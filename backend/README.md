# Check-in App Backend

This backend contains Lambda functions and deployment scripts for the check-in application.

## Prerequisites

- Node.js 20+
- LocalStack running locally
- Docker (for LocalStack)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Ensure LocalStack is running:

```bash
docker-compose up -d
```

## Lambda Functions

### getUsers Lambda

Returns all users from the `checkin-users` DynamoDB table.

**Features:**

- Uses common utilities from `@checkin-app/common`
- Removes sensitive data (passwordHash) before returning
- Includes CORS headers
- Proper error handling

### createCheckIn Lambda

Creates a new check-in with title, due date, questions, and manager ID.

**Features:**

- Validates required fields
- Generates unique check-in ID
- Returns created check-in data
- Includes CORS headers

### getCheckIns Lambda

Returns all check-ins (currently returns mock data).

**Features:**

- Returns list of check-ins
- Includes count and check-in details
- Includes CORS headers
- Ready for DynamoDB integration

## Building and Deploying

### Build Lambda Functions

```bash
npm run build:lambda
```

This uses esbuild to bundle all Lambda functions with their dependencies into individual files in `dist/` and creates zipped packages in `zipped-lambdas/`.

### Deploy to LocalStack

```bash
npm run deploy
```

This will:

1. Build all Lambda functions
2. Create/update all Lambda functions in LocalStack
3. Create an API Gateway REST API
4. Create resources and methods for each Lambda function
5. Integrate Lambda functions with API Gateway
6. Deploy the API to the `dev` stage

## API Endpoints

After deployment, you can access:

- **GET /users** - Returns all users from the database
- **POST /checkins** - Creates a new check-in
- **GET /checkins** - Returns all check-ins

Example:

```bash
# Get all users
curl http://localhost:4566/restapis/{API_ID}/dev/_user_request_/users

# Create a check-in
curl -X POST http://localhost:4566/restapis/{API_ID}/dev/_user_request_/checkins \
  -H "Content-Type: application/json" \
  -d '{"title":"Weekly Check-in","dueDate":"2024-01-15T23:59:59Z","questions":["How are you?"],"managerId":"manager-1"}'

# Get all check-ins
curl http://localhost:4566/restapis/{API_ID}/dev/_user_request_/checkins
```

## Architecture

- **Lambda Functions**:
  - `lambda/getUsers.ts` - Handles user retrieval
  - `lambda/createCheckIn.ts` - Handles check-in creation
  - `lambda/getCheckIns.ts` - Handles check-in retrieval
- **Build Script**: `build-lambda.js` - Uses esbuild to bundle all Lambda functions with dependencies
- **Deploy Script**: `deploy.ts` - Uses AWS SDK v3 to deploy all Lambda functions to LocalStack
- **Common Utils**: Uses `@checkin-app/common` for DynamoDB operations
- **Packaging**: Each Lambda is bundled and zipped individually for deployment

## Environment Variables

The Lambda function expects these environment variables:

- `AWS_ENDPOINT` - DynamoDB endpoint (default: http://localstack:4566)
- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_ACCESS_KEY_ID` - AWS access key (default: test)
- `AWS_SECRET_ACCESS_KEY` - AWS secret key (default: test)

## Development

To modify Lambda functions:

1. Edit the Lambda function files in `lambda/`
2. Run `npm run build:lambda` to rebuild all functions
3. Run `npm run deploy` to redeploy all functions

To add a new Lambda function:

1. Create a new `.ts` file in `lambda/`
2. Add the configuration to `lambdaConfigs` in `deploy.ts`
3. Run `npm run build:lambda && npm run deploy`
