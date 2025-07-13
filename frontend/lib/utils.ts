import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string to a readable date format
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "Dec 15, 2024")
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Formats a date string to a readable date and time format
 * @param dateString - ISO date string
 * @returns Formatted date and time string (e.g., "Dec 15, 2024, 2:30 PM")
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Gets the status color class based on due date
 * @param dueDate - Optional ISO date string
 * @returns Tailwind CSS color class
 */
export function getStatusColor(dueDate?: string): string {
  if (!dueDate) return "text-gray-600";
  const due = new Date(dueDate);
  const now = new Date();

  if (due < now) return "text-red-600";
  if (due.getTime() - now.getTime() < 24 * 60 * 60 * 1000)
    return "text-yellow-600";
  return "text-green-600";
}

/**
 * Gets the status text based on due date
 * @param dueDate - Optional ISO date string
 * @returns Status text string
 */
export function getStatusText(dueDate?: string): string {
  if (!dueDate) return "No due date";
  const due = new Date(dueDate);
  const now = new Date();

  if (due < now) return "Overdue";
  if (due.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return "Due soon";
  return "Active";
}
