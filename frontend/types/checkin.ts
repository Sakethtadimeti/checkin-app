import { z } from "zod";
import type { BaseResponse } from "./auth";

// Checkin data types based on actual API response
export interface CheckinData {
  id: string;
  title: string;
  description?: string;
  questions: CheckinQuestion[];
  dueDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckinResponseData {
  checkinId: string;
  responses: CheckinResponseItem[];
}

export interface CheckinListData {
  checkIns: CheckinData[];
  count: number;
}

// Assigned check-ins response structure
export interface AssignedCheckinItem {
  checkIn: CheckinData;
  assignment: {
    status: "pending" | "completed" | "overdue";
    assignedAt: string;
    assignedBy: string;
  };
}

export interface AssignedCheckinListData {
  assignedCheckIns: AssignedCheckinItem[];
  count: number;
}

// API response types
export type CheckinResponse = BaseResponse<CheckinData>;
export type CheckinListResponse = BaseResponse<CheckinListData>;
export type AssignedCheckinListResponse = BaseResponse<AssignedCheckinListData>;
export type SubmitCheckinResponse = BaseResponse<CheckinResponseData>;

// Zod schemas for validation
export const checkinQuestionSchema = z.object({
  id: z.string(),
  textContent: z.string(),
});

export const checkinDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  questions: z.array(checkinQuestionSchema),
  dueDate: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const checkinResponseItemSchema = z.object({
  questionId: z.string(),
  answer: z.union([z.string(), z.number(), z.boolean()]),
});

export const checkinResponseDataSchema = z.object({
  checkinId: z.string(),
  responses: z.array(checkinResponseItemSchema),
});

export const checkinListDataSchema = z.object({
  checkIns: z.array(checkinDataSchema),
  count: z.number(),
});

// Inferred types from schemas
export type CheckinQuestion = z.infer<typeof checkinQuestionSchema>;
export type CheckinResponseItem = z.infer<typeof checkinResponseItemSchema>;

// Additional types for the checkin system
export interface CheckinAssignment {
  id: string;
  checkinId: string;
  userId: string;
  assignedAt: string;
  completedAt?: string;
  status: "pending" | "completed" | "overdue";
}

// Check-in details response types
export interface CheckinAssignmentDetail {
  userId: string;
  userName: string;
  userEmail: string;
  status: "pending" | "completed" | "overdue";
  assignedAt: string;
  assignedBy: string;
  completedAt?: string;
  responses?: Array<{
    questionId: string;
    response: string;
  }>;
}

export interface CheckinStatusCounts {
  pending: number;
  completed: number;
}

export interface CheckinDetailsData {
  checkIn: CheckinData;
  assignments: CheckinAssignmentDetail[];
  statusCounts: CheckinStatusCounts;
}

export type CheckinDetailsResponse = BaseResponse<CheckinDetailsData>;
