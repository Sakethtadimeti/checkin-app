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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MultiSelect } from "@/components/ui/multi-select";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { checkinApi } from "@/lib/api/checkins";
import { userApi } from "@/lib/api/users";
import useSWR from "swr";

interface AddCheckinDialogProps {
  onSuccess?: () => void;
}

export const AddCheckinDialog: React.FC<AddCheckinDialogProps> = ({
  onSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    questions: [""],
    dueDate: null as Date | null,
    assignedUserIds: [] as string[],
  });

  // Fetch team members for the multi-select
  const { data: membersData } = useSWR(
    "manager-members",
    () => userApi.getManagerMembers(),
    {
      revalidateOnFocus: false,
    }
  );

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | Date | null | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = value;
    setFormData((prev) => ({
      ...prev,
      questions: newQuestions,
    }));
  };

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, ""],
    }));
  };

  const removeQuestion = (index: number) => {
    if (formData.questions.length > 1) {
      const newQuestions = formData.questions.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        questions: newQuestions,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      alert("Title is required");
      return;
    }

    if (formData.questions.some((q) => !q.trim())) {
      alert("All questions must be filled");
      return;
    }

    if (formData.assignedUserIds.length === 0) {
      alert("Please select at least one team member");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        questions: formData.questions.map((q) => q.trim()).filter(Boolean),
        dueDate: formData.dueDate?.toISOString(),
        assignedUserIds: formData.assignedUserIds,
      };

      await checkinApi.createCheckIn(payload);

      // Reset form
      setFormData({
        title: "",
        description: "",
        questions: [""],
        dueDate: null,
        assignedUserIds: [],
      });

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating check-in:", error);
      alert("Failed to create check-in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      questions: [""],
      dueDate: null,
      assignedUserIds: [],
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  // Prepare options for multi-select
  const userOptions =
    membersData?.data?.members?.map((member) => ({
      label: member.name,
      value: member.id,
    })) || [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Check-in
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Check-in</DialogTitle>
          <DialogDescription>
            Create a new check-in for your team members. Fill in the details
            below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter check-in title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter check-in description (optional)"
              rows={3}
            />
          </div>

          {/* Questions */}
          <div className="space-y-2">
            <Label>Questions *</Label>
            <div className="space-y-3">
              {formData.questions.map((question, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={question}
                    onChange={(e) =>
                      handleQuestionChange(index, e.target.value)
                    }
                    placeholder={`Question ${index + 1}`}
                    required
                    className="flex-1"
                  />
                  {formData.questions.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeQuestion(index)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addQuestion}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dueDate ? (
                    format(formData.dueDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dueDate || undefined}
                  onSelect={(date) =>
                    handleInputChange("dueDate", date || null)
                  }
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Team Members */}
          <div className="space-y-2">
            <Label>Assign to Team Members *</Label>
            <MultiSelect
              options={userOptions}
              onValueChange={(values) =>
                handleInputChange("assignedUserIds", values)
              }
              placeholder="Select team members"
              className="w-full"
            />
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
              {isSubmitting ? "Creating..." : "Create Check-in"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
