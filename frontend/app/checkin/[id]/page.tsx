"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
} from "lucide-react";
import useSWR from "swr";
import { checkinApi } from "@/lib/api/checkins";
import { formatDate, formatDateTime } from "@/lib/utils";
import { If } from "@/components/ui/If";
import { ViewResponseDialog } from "@/components/view-response-dialog";
import { useAuth } from "@/components/auth-context";

const CheckinDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { logout } = useAuth();
  const checkinId = params.id as string;

  const {
    data: checkinDetails,
    error,
    isLoading,
  } = useSWR(
    checkinId ? `checkin-details-${checkinId}` : null,
    () => checkinApi.getCheckInDetails(checkinId),
    {
      revalidateOnFocus: false,
    }
  );

  const handleBack = () => {
    router.push("/dashboard");
  };

  const handleLogout = async () => {
    await logout();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading check-in details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !checkinDetails?.data) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Failed to load check-in details. Please try again.</p>
              <Button onClick={handleBack} variant="outline" className="mt-2">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { checkIn, assignments, statusCounts } = checkinDetails.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {checkIn.title}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Check-in created on {formatDateTime(checkIn.createdAt)}
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              aria-label="Sign out"
            >
              Sign out
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Check-in Details */}
          <div className="px-4 sm:px-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Check-in Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-900">
                      {checkIn.description || "No description provided"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </h3>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900">
                        {checkIn.dueDate
                          ? formatDate(checkIn.dueDate)
                          : "No due date"}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Questions */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Questions ({checkIn.questions.length})
                  </h3>
                  <div className="space-y-3">
                    {checkIn.questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <p className="text-gray-900">
                            {question.textContent}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assignment Stats */}
          <div className="px-4 sm:px-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Assignments
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {assignments.length}
                      </p>
                    </div>
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Pending
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {statusCounts.pending}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Completed
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {statusCounts.completed}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Assignments Table */}
          <div className="px-4 sm:px-0">
            <Card>
              <CardHeader>
                <CardTitle>Team Assignments</CardTitle>
                <CardDescription>
                  Members assigned to this check-in and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <If condition={!assignments.length}>
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No assignments found.</p>
                  </div>
                </If>

                <If condition={assignments.length > 0}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.userId}>
                          <TableCell>
                            <div className="font-medium">
                              {assignment.userName}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(assignment.status)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {formatDateTime(assignment.assignedAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {assignment.status === "completed" && (
                              <ViewResponseDialog
                                assignment={assignment}
                                checkIn={checkIn}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </If>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckinDetailPage;
