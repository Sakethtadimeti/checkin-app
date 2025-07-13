"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";
import { checkinApi } from "@/lib/api/checkins";
import type { AssignedCheckinItem } from "@/types/checkin";

interface ResponseDialogProps {
  checkinItem: AssignedCheckinItem;
  onSuccess?: () => void;
}

export const ResponseDialog: React.FC<ResponseDialogProps> = ({
  checkinItem,
  onSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});

  // Initialize responses with empty strings for each question
  React.useEffect(() => {
    const initialResponses: Record<string, string> = {};
    checkinItem.checkIn.questions.forEach((question) => {
      initialResponses[question.id] = "";
    });
    setResponses(initialResponses);
  }, [checkinItem]);

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation - check if all questions have responses
    const unansweredQuestions = checkinItem.checkIn.questions.filter(
      (question) => !responses[question.id]?.trim()
    );

    if (unansweredQuestions.length > 0) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare responses in the format expected by the API
      const responseData = checkinItem.checkIn.questions.map((question) => ({
        questionId: question.id,
        response: responses[question.id].trim(),
      }));

      await checkinApi.submitCheckIn(checkinItem.checkIn.id, responseData);

      // Reset form
      const initialResponses: Record<string, string> = {};
      checkinItem.checkIn.questions.forEach((question) => {
        initialResponses[question.id] = "";
      });
      setResponses(initialResponses);

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting check-in response:", error);
      alert("Failed to submit response. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    const initialResponses: Record<string, string> = {};
    checkinItem.checkIn.questions.forEach((question) => {
      initialResponses[question.id] = "";
    });
    setResponses(initialResponses);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Respond
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Respond to Check-in</DialogTitle>
          <DialogDescription>
            Please answer all the questions below for:{" "}
            <strong>{checkinItem.checkIn.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Check-in Details */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Description
            </Label>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {checkinItem.checkIn.description || "No description provided"}
            </p>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">
              Questions *
            </Label>
            {checkinItem.checkIn.questions.map((question, index) => (
              <div key={question.id} className="space-y-2">
                <Label
                  htmlFor={`question-${question.id}`}
                  className="text-sm font-medium"
                >
                  Question {index + 1}
                </Label>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md mb-2">
                  {question.textContent}
                </p>
                <Textarea
                  id={`question-${question.id}`}
                  value={responses[question.id] || ""}
                  onChange={(e) =>
                    handleResponseChange(question.id, e.target.value)
                  }
                  placeholder="Enter your response..."
                  rows={3}
                  required
                  className="min-h-[80px]"
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Response"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
