import { z } from "zod";

// ============================================================================
// USER VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for creating a new user
 */
export const CreateUserSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  role: z.enum(["manager", "member"]),
  managerId: z.uuid("Invalid manager ID").optional(),
  teamId: z.string().max(50, "Team ID too long").optional(),
});

/**
 * Schema for user login
 */
export const LoginSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Schema for user updates
 */
export const UpdateUserSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .optional(),
  teamId: z.string().max(50, "Team ID too long").optional(),
  managerId: z.uuid("Invalid manager ID").optional(),
});

// ============================================================================
// CHECK-IN VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for a single question
 */
export const QuestionSchema = z.object({
  id: z.uuid("Invalid question ID"),
  textContent: z
    .string()
    .min(1, "Question text cannot be empty")
    .max(500, "Question too long"),
});

/**
 * Schema for a single answer
 */
export const AnswerSchema = z.object({
  questionId: z.uuid("Invalid question ID"),
  response: z
    .string()
    .min(1, "Response cannot be empty")
    .max(2000, "Response too long"),
});

/**
 * Schema for creating a new check-in (request body - excludes createdBy)
 */
export const CreateCheckInRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  questions: z
    .array(
      z
        .string()
        .min(1, "Question cannot be empty")
        .max(500, "Question too long")
    )
    .min(1, "At least one question is required")
    .max(20, "Too many questions (max 20)"),
  dueDate: z
    .string()
    .datetime({ message: "Invalid date format - must be ISO 8601" }),
  assignedUserIds: z
    .array(z.uuid("Invalid user ID"))
    .min(1, "At least one user must be assigned")
    .max(100, "Too many users assigned (max 100)"),
});

/**
 * Schema for updating a check-in
 */
export const UpdateCheckInSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title too long")
    .optional(),
  description: z.string().max(1000, "Description too long").optional(),
  dueDate: z
    .string()
    .datetime({ message: "Invalid date format - must be ISO 8601" })
    .optional(),
});

// ============================================================================
// RESPONSE VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for submitting a response to a check-in
 */
export const SubmitResponseSchema = z.object({
  answers: z
    .array(AnswerSchema)
    .min(1, "At least one answer is required")
    .max(20, "Too many answers (max 20)"),
});

// ============================================================================
// QUERY PARAMETER SCHEMAS
// ============================================================================

/**
 * Schema for pagination parameters
 */
export const PaginationSchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit too high")
    .default(20),
  offset: z.coerce
    .number()
    .int()
    .min(0, "Offset must be non-negative")
    .default(0),
});

/**
 * Schema for check-in filters
 */
export const CheckInFilterSchema = z.object({
  status: z.enum(["pending", "completed", "overdue"]).optional(),
  createdBy: z.uuid("Invalid user ID").optional(),
  assignedTo: z.uuid("Invalid user ID").optional(),
  dueDateFrom: z.iso.datetime({ message: "Invalid date format" }).optional(),
  dueDateTo: z.iso.datetime({ message: "Invalid date format" }).optional(),
});

// ============================================================================
// PATH PARAMETER SCHEMAS
// ============================================================================

/**
 * Schema for check-in ID path parameter
 */
export const CheckInIdParamSchema = z.object({
  checkInId: z.uuid("Invalid check-in ID"),
});

/**
 * Schema for user ID path parameter
 */
export const UserIdParamSchema = z.object({
  userId: z.uuid("Invalid user ID"),
});

/**
 * Schema for manager ID path parameter (createdBy)
 */
export const ManagerIdParamSchema = z.object({
  createdBy: z.uuid("Invalid manager ID"),
});

/**
 * Schema for check-in response path parameters
 */
export const CheckInResponseParamsSchema = z.object({
  checkInId: z.uuid("Invalid check-in ID"),
  userId: z.uuid("Invalid user ID"),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type ValidatedCreateUserData = z.infer<typeof CreateUserSchema>;
export type ValidatedLoginData = z.infer<typeof LoginSchema>;
export type ValidatedUpdateUserData = z.infer<typeof UpdateUserSchema>;
export type ValidatedCreateCheckInRequestData = z.infer<
  typeof CreateCheckInRequestSchema
>;
export type ValidatedUpdateCheckInData = z.infer<typeof UpdateCheckInSchema>;
export type ValidatedSubmitResponseData = z.infer<typeof SubmitResponseSchema>;
export type ValidatedPaginationParams = z.infer<typeof PaginationSchema>;
export type ValidatedCheckInFilters = z.infer<typeof CheckInFilterSchema>;
export type ValidatedCheckInIdParam = z.infer<typeof CheckInIdParamSchema>;
export type ValidatedUserIdParam = z.infer<typeof UserIdParamSchema>;
export type ValidatedManagerIdParam = z.infer<typeof ManagerIdParamSchema>;
export type ValidatedCheckInResponseParams = z.infer<
  typeof CheckInResponseParamsSchema
>;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates a date string and ensures it's in the future
 */
export const FutureDateSchema = z
  .string()
  .datetime({ message: "Invalid date format" })
  .refine(
    (date) => new Date(date) > new Date(),
    "Due date must be in the future"
  );

/**
 * Validates that all question IDs in answers match the check-in questions
 */
export function validateAnswerQuestionIds(
  answers: ValidatedSubmitResponseData["answers"],
  checkInQuestions: { id: string }[]
): boolean {
  const questionIds = new Set(checkInQuestions.map((q) => q.id));
  return answers.every((answer: { questionId: string }) =>
    questionIds.has(answer.questionId)
  );
}

/**
 * Creates a custom error response for validation failures
 */
export function createValidationErrorResponse(error: z.ZodError) {
  return {
    statusCode: 400,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    },
    body: JSON.stringify({
      success: false,
      error: "Validation error",
      details: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      })),
    }),
  };
}
