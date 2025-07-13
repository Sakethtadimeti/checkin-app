# 🧪 Team Check-In System

A full-stack, cloud-native application that allows **managers** to create team check-ins and **team members** to respond. Built with TypeScript, Node.js, React, and AWS services emulated locally using LocalStack.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **Docker** and **Docker Compose**
- **Git**

### Setup Instructions

1. **Clone and navigate to the project:**

   ```bash
   git clone https://github.com/Sakethtadimeti/checkin-app.git
   cd checkin-app
   ```

2. **Bootstrap the application:**
   ```bash
   sh bootstrap.sh
   ```

This will:

- Start LocalStack and auth-server containers
- Build and deploy Lambda functions
- Create DynamoDB tables
- Seed users and data
- Start the frontend development server

### Access the Application

- **Frontend**: http://localhost:3000
- **Auth Server**: http://localhost:3001
- **LocalStack**: http://localhost:4566

### Default User Credentials

All users have password: `password123`

**Managers:**

- `sarah.johnson@company.com` (Engineering Team)
- `michael.chen@company.com` (Product Team)

**Team Members:**

- Engineering: `alex.rodriguez@company.com`, `emma.wilson@company.com`, etc.
- Product: `sophia.garcia@company.com`, `ryan.thompson@company.com`, etc.

## 🏗️ Architecture

### System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Auth Server   │    │   LocalStack    │
│   (React/TS)    │◄──►│   (Express)     │    │   (AWS Emulator)│
│   localhost:3000│    │   localhost:3001│    │   localhost:4566│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SWR Client    │    │   JWT Auth      │    │   Lambda        │
│   (Data Fetch)  │    │   (Mock Cognito)│    │   Functions     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │   DynamoDB      │    │   User Mgmt     │
│   (REST API)    │    │   (Single Table)│    │   (Common Pkg)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Model

#### Single Table Design (DynamoDB)

The application uses a single DynamoDB table with the following structure:

**Partition Key (PK):** `checkin#<checkInId>` or `user#<userId>`
**Sort Key (SK):** `meta`, `assignment#<userId>`, `response#<userId>`, or `user#<userId>`

**Entity Types:**

1. **Check-In (CHECKIN)**

   ```typescript
   {
     PK: "checkin#<id>",
     SK: "meta",
     type: "CHECKIN",
     title: string,
     description?: string,
     questions: Question[],
     dueDate: string,
     createdBy: string,
     createdAt: string,
     updatedAt: string
   }
   ```

2. **Assignment (ASSIGNMENT)**

   ```typescript
   {
     PK: "checkin#<id>",
     SK: "assignment#<userId>",
     type: "ASSIGNMENT",
     userId: string,
     status: "pending" | "completed" | "overdue",
     assignedAt: string,
     assignedBy: string,
     completedAt?: string
   }
   ```

3. **Response (RESPONSE)**

   ```typescript
   {
     PK: "checkin#<id>",
     SK: "response#<userId>",
     type: "RESPONSE",
     userId: string,
     answers: Answer[],
     submittedAt: string,
     updatedAt?: string
   }
   ```

4. **User (USER)**
   ```typescript
   {
     PK: "user#<id>",
     SK: "user#<id>",
     type: "USER",
     email: string,
     passwordHash: string,
     name: string,
     role: "manager" | "member",
     managerId?: string,
     teamId?: string,
     createdAt: string,
     updatedAt: string
   }
   ```

### Key Architecture Decisions

1. **Single Table Design**: Chose DynamoDB single table for efficient queries and reduced complexity
2. **JWT-based Auth**: Mocked Cognito with JWT tokens for stateless authentication
3. **Lambda Functions**: Serverless backend with individual functions for each operation
4. **SWR for Data Fetching**: Client-side caching and real-time updates
5. **TypeScript Throughout**: Full type safety across frontend, backend, and common packages
6. **LocalStack**: Complete AWS service emulation for local development

## 📚 API Documentation

### Authentication Endpoints

**Base URL:** `http://localhost:3001`

#### POST /api/v1/login

Authenticate user and receive JWT tokens.

**Request:**

```json
{
  "email": "sarah.johnson@company.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "sarah.johnson@company.com",
      "role": "manager",
      "name": "Sarah Johnson"
    }
  }
}
```

#### POST /api/v1/refresh

Refresh access token using refresh token.

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /api/v1/logout

Logout user (invalidate tokens).

### Application Endpoints

**Base URL:** `http://checkin-api.execute-api.localhost.localstack.cloud:4566/dev`

**Headers:** `Authorization: Bearer <accessToken>`

#### GET /users

Get all users (for manager dashboard).

**Response:**

```json
{
  "success": true,
  "count": 12,
  "users": [
    {
      "id": "user-uuid",
      "email": "sarah.johnson@company.com",
      "name": "Sarah Johnson",
      "role": "manager",
      "managerId": null,
      "teamId": "engineering-team",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /users/manager/members

Get team members for authenticated manager.

**Response:**

```json
{
  "success": true,
  "message": "Members fetched successfully",
  "data": {
    "managerId": "manager-uuid",
    "count": 5,
    "members": [
      {
        "id": "member-uuid",
        "name": "Alex Rodriguez",
        "email": "alex.rodriguez@company.com"
      }
    ]
  }
}
```

#### POST /checkins

Create a new check-in (managers only).

**Request:**

```json
{
  "title": "Weekly Team Check-in",
  "description": "How is everyone doing this week?",
  "questions": [
    "What did you accomplish this week?",
    "What challenges are you facing?",
    "What are your goals for next week?"
  ],
  "dueDate": "2024-01-15T23:59:59Z",
  "assignedUserIds": ["user1", "user2", "user3"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Check-in created successfully",
  "data": {
    "checkIn": {
      "id": "checkin-uuid",
      "title": "Weekly Team Check-in",
      "description": "How is everyone doing this week?",
      "questions": [
        {
          "id": "question-uuid",
          "textContent": "What did you accomplish this week?"
        }
      ],
      "dueDate": "2024-01-15T23:59:59Z",
      "createdBy": "manager-uuid",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### GET /checkins/manager

Get all check-ins created by authenticated manager.

**Response:**

```json
{
  "success": true,
  "message": "Check-ins fetched successfully",
  "data": {
    "checkIns": [
      {
        "id": "checkin-uuid",
        "title": "Weekly Team Check-in",
        "description": "How is everyone doing this week?",
        "questions": [...],
        "dueDate": "2024-01-15T23:59:59Z",
        "createdBy": "manager-uuid",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "assignments": [
          {
            "userId": "user-uuid",
            "status": "completed",
            "assignedAt": "2024-01-01T00:00:00Z",
            "completedAt": "2024-01-02T00:00:00Z"
          }
        ]
      }
    ],
    "count": 1
  }
}
```

#### GET /checkins/assigned

Get check-ins assigned to authenticated user (members only).

**Response:**

```json
{
  "success": true,
  "message": "Assigned check-ins fetched successfully",
  "data": {
    "assignedCheckIns": [
      {
        "id": "checkin-uuid",
        "title": "Weekly Team Check-in",
        "description": "How is everyone doing this week?",
        "questions": [...],
        "dueDate": "2024-01-15T23:59:59Z",
        "status": "pending",
        "assignedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "count": 1
  }
}
```

#### GET /checkins/{checkInId}/details

Get detailed check-in information including responses (managers only).

**Response:**

```json
{
  "success": true,
  "message": "Check-in details fetched successfully",
  "data": {
    "checkIn": {
      "id": "checkin-uuid",
      "title": "Weekly Team Check-in",
      "description": "How is everyone doing this week?",
      "questions": [...],
      "dueDate": "2024-01-15T23:59:59Z",
      "createdBy": "manager-uuid",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    "assignments": [
      {
        "userId": "user-uuid",
        "userName": "Alex Rodriguez",
        "userEmail": "alex.rodriguez@company.com",
        "status": "completed",
        "assignedAt": "2024-01-01T00:00:00Z",
        "completedAt": "2024-01-02T00:00:00Z"
      }
    ],
    "responses": [
      {
        "userId": "user-uuid",
        "userName": "Alex Rodriguez",
        "userEmail": "alex.rodriguez@company.com",
        "answers": [
          {
            "questionId": "question-uuid",
            "response": "I completed the authentication system and started working on the dashboard."
          }
        ],
        "submittedAt": "2024-01-02T00:00:00Z"
      }
    ]
  }
}
```

#### POST /checkins/{checkInId}/responses

Submit responses to a check-in (members only).

**Request:**

```json
{
  "answers": [
    {
      "questionId": "question-uuid",
      "response": "I completed the authentication system and started working on the dashboard."
    },
    {
      "questionId": "question-uuid-2",
      "response": "I'm facing some challenges with the API integration."
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Response submitted successfully",
  "data": {
    "checkInId": "checkin-uuid",
    "userId": "user-uuid",
    "submittedAt": "2024-01-02T00:00:00Z"
  }
}
```

## 🔐 Mocked Authentication Flow

### Overview

The application implements a lightweight authentication server that simulates AWS Cognito behavior using JWT tokens.

### Flow Details

1. **User Login**

   - User submits email/password to `/api/v1/login`
   - Server validates credentials against DynamoDB
   - Server generates JWT access token (15 min expiry) and refresh token (7 days expiry)
   - Tokens include user ID, email, role, and token type

2. **Token Storage**

   - Frontend stores tokens in sessionStorage
   - Access token used for API requests
   - Refresh token used for token renewal

3. **API Authentication**

   - All API requests include `Authorization: Bearer <accessToken>` header
   - Lambda functions validate JWT using shared secret
   - User context extracted from token payload

4. **Token Refresh**

   - SWR middleware checks token expiry
   - Automatically calls `/api/v1/refresh` when token expires in <1 minute
   - Updates stored tokens and retries failed requests

5. **Role-Based Access**
   - JWT payload includes user role (`manager` or `member`)
   - Lambda functions enforce role-based permissions
   - Frontend shows different UI based on user role

### Security Features

- **JWT Secret**: Environment variable for token signing
- **Token Expiry**: Short-lived access tokens with refresh mechanism
- **Role Validation**: Server-side role checking for all operations
- **Password Hashing**: bcrypt for secure password storage
- **CORS Headers**: Proper CORS configuration for cross-origin requests

## 🔧 Development

### Project Structure

```
checkin-app/
├── auth-server/           # Mock authentication server
├── backend/              # Lambda functions and deployment
│   ├── lambda/           # Individual Lambda handlers
│   ├── deploy-lambda.ts  # Deployment script
│   └── build-lambda.js   # Build script
├── common/               # Shared utilities and types
│   ├── auth/            # JWT validation
│   ├── checkin/         # Check-in types and helpers
│   └── user/            # User management
├── frontend/            # React/Next.js application
│   ├── app/             # Next.js app router
│   ├── components/      # React components
│   ├── lib/             # Utilities and API clients
│   └── types/           # TypeScript type definitions
├── scripts/             # Setup and utility scripts
└── docker-compose.yml   # Local development environment
```

### Available Scripts

```bash
# Development
npm run dev              # Start all services
npm run stop             # Stop all containers
npm run build:common     # Build common package

# Backend
cd backend
npm run build:lambda     # Build Lambda functions
npm run deploy           # Deploy to LocalStack

# Frontend
cd frontend
npm run dev              # Start Next.js dev server
npm run build            # Build for production

# Scripts
cd scripts
sh setup-all.sh          # Complete setup (tables + users)
npm run list-users       # List all users
npm run create-seed-users # Create seed users
npm run remove-user -- --all # Remove all users
```

### Environment Variables

**Auth Server (.env):**

```env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

**Backend (Lambda Environment):**

```env
AWS_ENDPOINT=http://localstack:4566
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

## 🧪 Testing

### Manual Testing

1. **Start the application:**

   ```bash
   sh bootstrap.sh
   ```

2. **Test as Manager:**

   - Login with `sarah.johnson@company.com` / `password123`
   - Create a new check-in
   - Assign to team members
   - View responses

3. **Test as Member:**
   - Login with `alex.rodriguez@company.com` / `password123`
   - View assigned check-ins
   - Submit responses

### API Testing

```bash
# Test authentication
curl -X POST http://localhost:3001/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah.johnson@company.com","password":"password123"}'

# Test API endpoints (replace with actual API ID and token)
curl -H "Authorization: Bearer <token>" \
  http://localhost:4566/restapis/<API_ID>/dev/_user_request_/users
```

## 📊 Trade-offs and Limitations

### Current Limitations

1. **Local Development Only**: Designed for local development with LocalStack
2. **Mock Authentication**: Not production-ready authentication system
3. **No Real AWS Integration**: All AWS services are emulated
4. **Limited Error Handling**: Basic error handling in some areas
5. **No Real-time Updates**: No WebSocket or real-time notifications
6. **No File Uploads**: No support for file attachments in responses
7. **Basic UI**: Functional but not highly polished UI

### Technical Trade-offs

1. **Single Table vs Multi-table**: Chose single table for query efficiency but increased complexity
2. **JWT vs Session**: JWT for stateless auth but requires token management
3. **Lambda vs Monolith**: Lambda for scalability but increased cold start latency
4. **LocalStack vs Real AWS**: LocalStack for development but not production-ready

### Improvements for Production

1. **Authentication**

   - Implement real AWS Cognito or Auth0
   - Implement proper session management

2. **Security**

   - Add rate limiting
   - Implement proper CORS policies
   - Add input validation and sanitization
   - Implement audit logging

3. **Performance**

   - Add caching layer (Redis)
   - Implement database connection pooling
   - Add CDN for static assets
   - Optimize Lambda cold starts

4. **Features**

   - Real-time notifications (WebSocket)
   - File upload support
   - Email notifications
   - Advanced reporting and analytics
   - Team management features

5. **Infrastructure**

   - CI/CD pipeline
   - Infrastructure as Code (Terraform/CDK)
   - Monitoring and alerting
   - Backup and disaster recovery
   - Multi-region deployment

6. **Testing**
   - Unit tests for all functions
   - Integration tests
   - E2E tests
   - Performance testing

## 📄 License

This project is for demonstration purposes only.

## 🆘 Troubleshooting

### Common Issues

1. **LocalStack not starting:**

   ```bash
   docker-compose down
   docker system prune
   docker-compose up -d
   ```

2. **Lambda deployment fails:**

   ```bash
   cd backend
   npm run build:lambda
   npm run deploy
   ```

3. **Database connection issues:**

   ```bash
   cd scripts
   sh setup-all.sh
   ```

4. **Frontend not loading:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Getting Help

- Check the console logs for error messages
- Verify all services are running: `docker ps`
- Ensure environment variables are set correctly
- Check LocalStack logs: `docker logs localstack-main`

## Improvements I would make with more time

- Add the token validity at api gateway instead of individual lambdas
- Implement a JWK API for key rotation; currenty uses the same secret as ENV variabl in auth-server & lambdas
- Write UT's & SLT's for both frotend & backend
- Modularise frontend code & breakdown large files into components/helpers etc
- Bundle frontend code & serve via CDN(points to s3 for assets)
