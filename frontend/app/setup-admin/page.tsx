"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const setupAdmin = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/setup-admin", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setMessage(
          "✅ " +
            data.message +
            "\n\nYou can now go back to the admin dashboard and create classes!"
        );
      } else {
        setMessage("❌ Error: " + data.error);
      }
    } catch (error) {
      setMessage("❌ Failed to setup admin profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>
            Click the button below to setup your admin profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={setupAdmin} disabled={loading} className="w-full">
            {loading ? "Setting up..." : "Setup Admin Profile"}
          </Button>

          {message && (
            <div className="p-4 rounded-md bg-muted whitespace-pre-line">
              {message}
            </div>
          )}

          {message.includes("✅") && (
            <Button
              onClick={() => (window.location.href = "/admin/dashboard")}
              variant="outline"
              className="w-full"
            >
              Go to Admin Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
