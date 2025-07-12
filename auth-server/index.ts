import express from "express";
import cors from "cors";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import { z } from "zod";
import {
  authenticateUser,
  findUserById,
  getAllUsers,
  initializeDynamoDB,
  dynamodbClient,
  LoginSchema,
  createValidationErrorResponse,
} from "@checkin-app/common";

// Initialize the common package with DynamoDB client
initializeDynamoDB(dynamodbClient);

const app = express();
const PORT = process.env.PORT || 3001;

// JWT configuration
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "auth-server",
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/v1/login
 * User login endpoint - returns accessToken & refreshToken
 */
app.post("/api/v1/login", async (req, res) => {
  try {
    // Validate request body using Zod schema
    const validatedData = LoginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Authenticate user using the common package
    console.log(`🔍 Attempting to authenticate user: ${email}`);
    const user = await authenticateUser(email, password);

    if (!user) {
      console.log(`❌ Authentication failed for user: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    console.log(`✅ Authentication successful for user: ${email} (${user.id})`);

    // Generate access token
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        type: "access",
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY as any as number }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        type: "refresh",
      },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY as any as number }
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
      },
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(error);
    }

    // Handle other errors
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * POST /api/v1/refresh
 * Refresh token endpoint - returns new accessToken & refreshToken
 */
app.post("/api/v1/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;

    if (decoded.type !== "refresh") {
      return res.status(401).json({
        success: false,
        message: "Invalid token type",
      });
    }

    // Fetch real user data from database
    const user = await findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        type: "access",
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY as any as number }
    );

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        type: "refresh",
      },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY as any as number }
    );

    res.json({
      success: true,
      message: "Tokens refreshed successfully",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
      },
    });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
});

/**
 * GET /api/v1/users
 * Debug endpoint to list all users (for development only)
 */
app.get("/api/v1/users", async (req, res) => {
  try {
    console.log("🔍 Fetching all users for debugging...");
    const users = await getAllUsers();

    // Return users without sensitive information
    const safeUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      managerId: user.managerId,
      teamId: user.teamId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Note: passwordHash is intentionally excluded for security
    }));

    console.log(`✅ Found ${users.length} users in database`);

    res.json({
      success: true,
      message: `Found ${users.length} users`,
      data: {
        count: users.length,
        users: safeUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching users",
    });
  }
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Auth server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 Login endpoint: http://localhost:${PORT}/api/v1/login`);
  console.log(`🔄 Refresh endpoint: http://localhost:${PORT}/api/v1/refresh`);
  console.log(`👥 Debug users endpoint: http://localhost:${PORT}/api/v1/users`);
});
