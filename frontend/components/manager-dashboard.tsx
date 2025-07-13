"use client";

import React, { useState } from "react";
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
import { userApi } from "@/lib/api/users";
import { Plus, Calendar, Users, FileText } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  getActiveCheckInsCount,
  formatQuestionCount,
} from "@/lib/helpers/dashboard";
import { AddCheckinDialog } from "./add-checkin-dialog";
import { ViewCheckinDialog } from "./view-checkin-dialog";

interface ManagerDashboardProps {
  userId: string;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  userId,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Fetch check-ins created by the manager
  const {
    data: checkinsData,
    error,
    mutate,
  } = useSWR("manager-checkins", () => checkinApi.getManagerCheckIns(), {
    revalidateOnFocus: false,
  });

  // Fetch team members for the manager
  const { data: membersData, error: membersError } = useSWR(
    "manager-members",
    () => userApi.getManagerMembers(),
    {
      revalidateOnFocus: false,
    }
  );

  const handleAddCheckinSuccess = () => {
    // Refresh the check-ins data after successful creation
    mutate();
  };

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Failed to load check-ins. Please try again.</p>
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

  return (
    <div className="space-y-6">
      {/* Header with Add Check-in Button */}
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Manage your team check-ins
            </h2>
          </div>
          <AddCheckinDialog onSuccess={handleAddCheckinSuccess} />
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
                    Total Check-ins
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {checkinsData?.data?.count || 0}
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
                    Active Check-ins
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getActiveCheckInsCount(checkinsData?.data?.checkIns || [])}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Team Members
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {membersData?.data?.count || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Check-ins Table */}
      <div className="px-4 sm:px-0">
        <Card>
          <CardHeader>
            <CardTitle>Your Check-ins</CardTitle>
            <CardDescription>
              Check-ins you have created for your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!checkinsData?.data?.checkIns?.length ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No check-ins created yet.</p>
                <p className="text-sm text-gray-500 mt-1">
                  Create your first check-in to get started.
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
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkinsData.data.checkIns.map((checkin) => (
                    <TableRow key={checkin.id}>
                      <TableCell>
                        <div className="font-medium">{checkin.title}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {checkin.description || "No description"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {formatQuestionCount(checkin.questions.length)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {checkin.dueDate
                            ? formatDate(checkin.dueDate)
                            : "No due date"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{formatDateTime(checkin.createdAt)}</div>
                      </TableCell>
                      <TableCell>
                        <ViewCheckinDialog checkin={checkin} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
