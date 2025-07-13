import React, { type ReactElement } from "react";
import { CheckCircle, Clock } from "lucide-react";

/**
 * Gets the status icon component based on due date
 * @param dueDate - Optional ISO date string
 * @returns React element with appropriate icon and color
 */
export function getStatusIcon(dueDate?: string): ReactElement {
  if (!dueDate)
    return React.createElement(Clock, { className: "h-4 w-4 text-gray-600" });

  const due = new Date(dueDate);
  const now = new Date();

  if (due < now)
    return React.createElement(Clock, { className: "h-4 w-4 text-red-600" });
  if (due.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
    return React.createElement(Clock, { className: "h-4 w-4 text-yellow-600" });
  }
  return React.createElement(CheckCircle, {
    className: "h-4 w-4 text-green-600",
  });
}

/**
 * Calculates the number of active check-ins
 * @param checkIns - Array of check-in data
 * @returns Number of active check-ins
 */
export function getActiveCheckInsCount(checkIns: any[]): number {
  return (
    checkIns?.filter(
      (checkin) => !checkin.dueDate || new Date(checkin.dueDate) > new Date()
    ).length || 0
  );
}

/**
 * Calculates the number of overdue check-ins
 * @param checkIns - Array of check-in data
 * @returns Number of overdue check-ins
 */
export function getOverdueCheckInsCount(checkIns: any[]): number {
  return (
    checkIns?.filter(
      (checkin) => checkin.dueDate && new Date(checkin.dueDate) < new Date()
    ).length || 0
  );
}

/**
 * Formats the question count text
 * @param count - Number of questions
 * @returns Formatted text (e.g., "1 question" or "5 questions")
 */
export function formatQuestionCount(count: number): string {
  return `${count} question${count !== 1 ? "s" : ""}`;
}

/**
 * Gets the status color class based on assignment status
 * @param status - Assignment status ("pending" | "completed" | "overdue")
 * @returns Tailwind CSS color class
 */
export function getAssignmentStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "text-green-600";
    case "overdue":
      return "text-red-600";
    case "pending":
    default:
      return "text-yellow-600";
  }
}

/**
 * Gets the status text based on assignment status
 * @param status - Assignment status ("pending" | "completed" | "overdue")
 * @returns Human-readable status text
 */
export function getAssignmentStatusText(status: string): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "overdue":
      return "Overdue";
    case "pending":
    default:
      return "Pending";
  }
}

/**
 * Gets the status icon component based on assignment status
 * @param status - Assignment status ("pending" | "completed" | "overdue")
 * @returns React element with appropriate icon and color
 */
export function getAssignmentStatusIcon(status: string): ReactElement {
  switch (status) {
    case "completed":
      return React.createElement(CheckCircle, {
        className: "h-4 w-4 text-green-600",
      });
    case "overdue":
      return React.createElement(Clock, { className: "h-4 w-4 text-red-600" });
    case "pending":
    default:
      return React.createElement(Clock, {
        className: "h-4 w-4 text-yellow-600",
      });
  }
}

/**
 * Calculates the number of active assigned check-ins
 * @param checkinsData - The full check-ins data object
 * @returns Number of active check-ins (excluding completed)
 */
export function getActiveAssignedCheckInsCount(checkinsData: any): number {
  const assignedCheckIns = checkinsData?.data?.assignedCheckIns || [];
  return (
    assignedCheckIns.filter(
      (item: any) =>
        item.assignment.status !== "completed" &&
        (!item.checkIn.dueDate || new Date(item.checkIn.dueDate) > new Date())
    ).length || 0
  );
}

/**
 * Calculates the number of overdue assigned check-ins
 * @param checkinsData - The full check-ins data object
 * @returns Number of overdue check-ins (excluding completed)
 */
export function getOverdueAssignedCheckInsCount(checkinsData: any): number {
  const assignedCheckIns = checkinsData?.data?.assignedCheckIns || [];
  return (
    assignedCheckIns.filter(
      (item: any) =>
        item.assignment.status !== "completed" &&
        item.checkIn.dueDate &&
        new Date(item.checkIn.dueDate) < new Date()
    ).length || 0
  );
}
