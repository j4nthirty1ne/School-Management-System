"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const data = await response.json().catch(() => null);

      // Dev debug output
      try {
        // @ts-ignore
        if (process.env.NODE_ENV === "development")
          console.debug("login response", { status: response.status, data });
      } catch (e) {
        // ignore
      }

      if (!response.ok) {
        setError(data?.error || `Login failed (${response.status})`);
        setIsLoading(false);
        return;
      }

      if (!data?.success) {
        setError(data?.error || "Login failed");
        setIsLoading(false);
        return;
      }

      // Ensure server-set cookies are applied client-side
      try {
        await router.refresh();
        await new Promise((r) => setTimeout(r, 100));
      } catch (e) {
        // ignore
      }

      const rawRole = data.profile?.role ?? "student";
      const role = String(rawRole).toLowerCase().replace(/\s+/g, "_");

      let target = "/student/dashboard";
      if (role.includes("super") && role.includes("admin"))
        target = "/super-admin/dashboard";
      else if (role === "admin") target = "/landing-page";
      else if (role === "teacher") target = "/teacher/dashboard";
      else if (role === "parent") target = "/parent/dashboard";

      console.log("Navigating to:", target, "Role:", role);

      // Force immediate navigation - keep loading state active until redirect completes

      window.location.href = target;
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">School Management System</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your.email@school.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoFocus
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Forgot password?{" "}
              <a
                href="/forgot-password"
                className="text-primary hover:underline"
              >
                Reset here
              </a>
            </p>
          </CardFooter>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            © 2025 School Management System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
