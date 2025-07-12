// Check-in item type enum
export enum CheckInItemType {
  CHECKIN = "CHECKIN",
  ASSIGNMENT = "ASSIGNMENT",
  RESPONSE = "RESPONSE",
}

// Assignment status enum
export enum AssignmentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  OVERDUE = "overdue",
}

/**
 * Question structure with ID and text content
 */
export interface Question {
  id: string; // UUID for the question
  textContent: string; // The actual question text
}

/**
 * Check-in data model interface (for CHECKIN type items)
 */
export interface CheckIn {
  id: string; // UUID for the check-in
  title: string; // Check-in title
  description?: string; // Optional description
  questions: Question[]; // Array of questions with IDs
  dueDate: string; // ISO timestamp when responses are due
  createdBy: string; // Manager's user ID
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Check-in creation data (without generated fields)
 */
export interface CreateCheckInData {
  title: string;
  description?: string;
  questions: Question[]; // Array of questions with IDs
  dueDate: string;
  createdBy: string;
  assignedUserIds: string[]; // Array of user IDs to assign this check-in to
}

/**
 * Base interface for all check-in related items in the single table
 */
export interface CheckInItem {
  PK: string; // Partition key: checkin#<id>
  SK: string; // Sort key: meta, assignment#<userId>, or response#<userId>
  type: CheckInItemType; // Entity type
  userId?: string; // User involved (for ASSIGNMENT and RESPONSE types)
  // Additional fields will be added based on type
}

/**
 * Complete check-in item with all data (for CHECKIN type)
 */
export interface CheckInItemComplete extends CheckInItem {
  type: CheckInItemType.CHECKIN;
  SK: string; // 'meta'
  // CheckIn fields
  title: string;
  description?: string;
  questions: Question[];
  dueDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Assignment item (for ASSIGNMENT type)
 */
export interface AssignmentItem extends CheckInItem {
  type: CheckInItemType.ASSIGNMENT;
  SK: string; // assignment#<userId>
  userId: string;
  status: AssignmentStatus; // Status is now on assignment
  assignedAt: string;
  assignedBy: string;
  completedAt?: string; // When the user completed the check-in
}

/**
 * Response item (for RESPONSE type)
 */
export interface ResponseItem extends CheckInItem {
  type: CheckInItemType.RESPONSE;
  SK: string; // response#<userId>
  userId: string;
  answers: Answer[]; // Array of answers with question IDs
  submittedAt: string;
  updatedAt?: string;
}

/**
 * Answer structure with question ID and response
 */
export interface Answer {
  questionId: string; // References the question ID
  response: string; // User's answer to the question
}

/**
 * Union type for all check-in related items
 */
export type CheckInTableItem =
  | CheckInItemComplete
  | AssignmentItem
  | ResponseItem;
