"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useSWR from "swr";
import { checkinApi } from "@/lib/api/checkins";
import { Calendar, FileText, CheckCircle, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  getAssignmentStatusIcon,
  getActiveAssignedCheckInsCount,
  getOverdueAssignedCheckInsCount,
  formatQuestionCount,
  getAssignmentStatusColor,
  getAssignmentStatusText,
} from "@/lib/helpers/dashboard";
import { ResponseDialog } from "./response-dialog";
import { If } from "@/components/ui/If";

interface MemberDashboardProps {
  userId: string;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ userId }) => {
  // Fetch assigned check-ins for the member
  const {
    data: checkinsData,
    error,
    mutate,
  } = useSWR("assigned-checkins", () => checkinApi.getAssignedCheckIns(), {
    revalidateOnFocus: false,
  });

  const handleResponseSuccess = () => {
    // Refresh the assigned check-ins data after successful response submission
    mutate();
  };

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Failed to load assigned check-ins. Please try again.</p>
              <Button
                onClick={() => mutate()}
                variant="outline"
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeAssignedCheckInsCount =
    getActiveAssignedCheckInsCount(checkinsData);
  const overdueAssignedCheckInsCount =
    getOverdueAssignedCheckInsCount(checkinsData);
  const totalAssignedCheckInsCount = checkinsData?.data?.count || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="px-4 py-6 sm:px-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Your assigned check-ins and tasks
          </h2>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 sm:px-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Assigned Check-ins
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeAssignedCheckInsCount}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Completed Check-ins
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalAssignedCheckInsCount - activeAssignedCheckInsCount}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Overdue Check-ins
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overdueAssignedCheckInsCount}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assigned Check-ins Table */}
      <div className="px-4 sm:px-0">
        <Card>
          <CardHeader>
            <CardTitle>Your Assigned Check-ins</CardTitle>
            <CardDescription>
              Check-ins assigned to you by your manager
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!checkinsData?.data?.assignedCheckIns?.length ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  No check-ins assigned to you yet.
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Check back later for new assignments.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkinsData.data.assignedCheckIns.map((item) => {
                    const isCompleted = item.assignment.status === "completed";

                    return (
                      <TableRow key={item.checkIn.id}>
                        <TableCell>
                          <div className="font-medium">
                            {item.checkIn.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {item.checkIn.description || "No description"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {formatQuestionCount(item.checkIn.questions.length)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {item.checkIn.dueDate
                              ? formatDate(item.checkIn.dueDate)
                              : "No due date"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getAssignmentStatusIcon(item.assignment.status)}
                            <span
                              className={getAssignmentStatusColor(
                                item.assignment.status
                              )}
                            >
                              {getAssignmentStatusText(item.assignment.status)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <If condition={!isCompleted}>
                            <ResponseDialog
                              checkinItem={item}
                              onSuccess={handleResponseSuccess}
                            />
                          </If>
                          <If condition={isCompleted}>
                            <span className="text-sm text-gray-500">
                              Completed
                            </span>
                          </If>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
