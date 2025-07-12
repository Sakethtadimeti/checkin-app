/**
 * User data model interface
 */
export interface User {
  id: string; // Primary key, UUID
  email: string; // Unique login identifier
  passwordHash: string; // Hashed password (bcrypt)
  name: string; // Display name
  role: "manager" | "member"; // User role
  managerId?: string; // FK to manager's user ID (only for members)
  teamId?: string; // Optional team grouping identifier
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * User creation data (without generated fields)
 */
export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: "manager" | "member";
  managerId?: string;
  teamId?: string;
}

/**
 * User role type
 */
export type UserRole = "manager" | "member";
