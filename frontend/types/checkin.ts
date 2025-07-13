import { z } from "zod";
import type { BaseResponse } from "./auth";

// Checkin data types
export interface CheckinData {
  id: string;
  title: string;
  description?: string;
  questions: CheckinQuestion[];
  assignedTo: string[];
  dueDate?: string;
  status: "active" | "completed" | "expired";
}

export interface CheckinResponseData {
  checkinId: string;
  responses: CheckinResponseItem[];
}

export interface CheckinListData {
  checkins: CheckinData[];
}

// API response types
export type CheckinResponse = BaseResponse<CheckinData>;
export type CheckinListResponse = BaseResponse<CheckinListData>;
export type SubmitCheckinResponse = BaseResponse<CheckinResponseData>;

// Zod schemas for validation
export const checkinQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: z.enum(["text", "number", "boolean", "select"]),
  options: z.array(z.string()).optional(),
});

export const checkinDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  questions: z.array(checkinQuestionSchema),
  assignedTo: z.array(z.string()),
  dueDate: z.string().optional(),
  status: z.enum(["active", "completed", "expired"]),
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
  checkins: z.array(checkinDataSchema),
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
