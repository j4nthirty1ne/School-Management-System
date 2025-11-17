"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface JoinClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  onSuccess?: () => void;
}

export function JoinClassDialog({
  open,
  onOpenChange,
  studentId,
  onSuccess,
}: JoinClassDialogProps) {
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!joinCode.trim()) {
      setError("Please enter a join code");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(null);

    try {
      const response = await fetch("/api/student-enrollments/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          join_code: joinCode.trim().toUpperCase(),
          student_id: studentId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || "Successfully enrolled in class!");
        setJoinCode("");
        setTimeout(() => {
          onSuccess?.();
          onOpenChange(false);
          setSuccess(null);
        }, 2000);
      } else {
        setError(data.error || "Failed to join class");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Class</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleJoinClass} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Class Join Code</label>
            <Input
              placeholder="Enter 6-character code (e.g., ABC123)"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setError("");
              }}
              maxLength={6}
              className="font-mono text-lg tracking-wider"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Enter the join code provided by your teacher or administrator
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setJoinCode("");
                setError("");
                setSuccess(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !joinCode.trim()}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? "Joining..." : "Join Class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
