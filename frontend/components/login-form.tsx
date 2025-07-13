"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "./auth-context";
import {
  loginSchema,
  type LoginCredentials,
  AuthApiStatus,
} from "../types/auth";

export const LoginForm: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const { login, loginStatus } = useAuth();

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      await login(credentials);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await form.trigger();
    if (isValid) {
      const credentials = form.getValues();
      await handleSubmit(credentials);
    }
  };

  // Clear error when starting a new login attempt
  useEffect(() => {
    if (loginStatus === AuthApiStatus.IN_PROGRESS) {
      setError(null);
    }
  }, [loginStatus]);

  const handleKeyDown = async (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && loginStatus !== AuthApiStatus.IN_PROGRESS) {
      event.preventDefault();
      const isValid = await form.trigger();
      if (isValid) {
        const credentials = form.getValues();
        await handleSubmit(credentials);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Sign in
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email"
                        disabled={loginStatus === AuthApiStatus.IN_PROGRESS}
                        onKeyDown={handleKeyDown}
                        aria-label="Email address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter your password"
                        disabled={loginStatus === AuthApiStatus.IN_PROGRESS}
                        onKeyDown={handleKeyDown}
                        aria-label="Password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loginStatus === AuthApiStatus.IN_PROGRESS}
                aria-label={
                  loginStatus === AuthApiStatus.IN_PROGRESS
                    ? "Signing in..."
                    : "Sign in"
                }
              >
                {loginStatus === AuthApiStatus.IN_PROGRESS
                  ? "Signing in..."
                  : "Sign in"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
