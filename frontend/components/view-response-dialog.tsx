"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, User, Calendar } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { CheckinAssignmentDetail, CheckinData } from "@/types/checkin";

interface ViewResponseDialogProps {
  assignment: CheckinAssignmentDetail;
  checkIn: CheckinData;
}

export const ViewResponseDialog: React.FC<ViewResponseDialogProps> = ({
  assignment,
  checkIn,
}) => {
  if (!assignment.responses || assignment.responses.length === 0) {
    return null;
  }

  // Create a map of question ID to question text for easy lookup
  const questionMap = new Map(
    checkIn.questions.map((question) => [question.id, question.textContent])
  );

  // Create a map of question ID to response for easy lookup
  const responseMap = new Map(
    assignment.responses.map((response) => [
      response.questionId,
      response.response,
    ])
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-blue-600 hover:text-blue-800"
        >
          <Eye className="h-4 w-4 mr-1" />
          View Response
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {assignment.userName}'s Response
          </DialogTitle>
          <DialogDescription>
            Submitted on {formatDateTime(assignment.completedAt || "")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Questions and Responses */}
          <div className="space-y-4">
            {checkIn.questions.map((question, index) => {
              const response = responseMap.get(question.id);

              return (
                <div
                  key={question.id}
                  className="border rounded-lg overflow-hidden"
                >
                  {/* Question Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <h3 className="font-medium text-gray-900">
                        {question.textContent}
                      </h3>
                    </div>
                  </div>

                  {/* Response */}
                  <div className="p-4">
                    <div className="bg-white border rounded-lg p-4">
                      <p className="text-gray-900 leading-relaxed">
                        {response || "No response provided"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
