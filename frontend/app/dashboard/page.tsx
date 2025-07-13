"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { If } from "@/components/ui/If";
import { useAuth } from "@/components/auth-context";
import { ManagerDashboard } from "@/components/manager-dashboard";
import { MemberDashboard } from "@/components/member-dashboard";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = async () => {
    await logout();
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h1>
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

        {/* Role-based Dashboard Content */}
        <If condition={!!user && user.role === "manager"}>
          <ManagerDashboard userId={user!.id} />
        </If>
        <If condition={!!user && user.role !== "manager"}>
          <MemberDashboard userId={user!.id} />
        </If>
      </div>
    </div>
  );
}
