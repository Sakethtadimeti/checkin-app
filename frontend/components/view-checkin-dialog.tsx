"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Eye } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { formatQuestionCount } from "@/lib/helpers/dashboard";
import type { CheckinData } from "@/types/checkin";

interface ViewCheckinDialogProps {
  checkin: CheckinData;
}

export const ViewCheckinDialog: React.FC<ViewCheckinDialogProps> = ({
  checkin,
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Check-in Details</DialogTitle>
          <DialogDescription>
            View details of the check-in you created
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Title</Label>
            <p className="text-lg font-semibold text-gray-900">
              {checkin.title}
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Description
            </Label>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {checkin.description || "No description provided"}
            </p>
          </div>

          {/* Questions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Questions ({formatQuestionCount(checkin.questions.length)})
            </Label>
            <div className="space-y-2">
              {checkin.questions.map((question, index) => (
                <div key={question.id} className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Question {index + 1}
                  </p>
                  <p className="text-sm text-gray-600">
                    {question.textContent}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Due Date
            </Label>
            <p className="text-sm text-gray-600">
              {checkin.dueDate
                ? formatDate(checkin.dueDate)
                : "No due date set"}
            </p>
          </div>

          {/* Created Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Created</Label>
            <p className="text-sm text-gray-600">
              {formatDateTime(checkin.createdAt)}
            </p>
          </div>

          {/* Last Updated */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Last Updated
            </Label>
            <p className="text-sm text-gray-600">
              {formatDateTime(checkin.updatedAt)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
