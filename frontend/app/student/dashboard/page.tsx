"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState<
    null | "attendance" | "grades" | "assignments" | "groups"
  >(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [gradesData, setGradesData] = useState<any[]>([]);
  const [gradeStats, setGradeStats] = useState<any>(null);
  const [assignmentsData, setAssignmentsData] = useState<any[]>([]);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  const [assignmentStats, setAssignmentStats] = useState<any>(null);
  const [classesData, setClassesData] = useState<any[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [showJoinClassDialog, setShowJoinClassDialog] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [joinClassLoading, setJoinClassLoading] = useState(false);
  const [joinClassError, setJoinClassError] = useState("");
  const [joinClassSuccess, setJoinClassSuccess] = useState("");
  const [selectedClassForAssignments, setSelectedClassForAssignments] =
    useState<any>(null);

  useEffect(() => {
    fetchUser();
    loadClassesData();
    loadAllAssignments();
    loadGradesData();
  }, []);

  // Calculate attendance stats from attendance data
  useEffect(() => {
    if (attendanceData.length > 0) {
      const present = attendanceData.filter(
        (a) => a.status === "present"
      ).length;
      const absent = attendanceData.filter((a) => a.status === "absent").length;
      const late = attendanceData.filter((a) => a.status === "late").length;
      const excused = attendanceData.filter(
        (a) => a.status === "excused"
      ).length;
      const total = attendanceData.length;
      const attendanceRate = total > 0 ? (present / total) * 100 : 0;

      setAttendanceStats({
        attendance_rate: attendanceRate,
        present_days: present,
        absent_days: absent,
        late_days: late,
        excused_days: excused,
        total_days: total,
      });
    }
  }, [attendanceData]);

  // Calculate grade stats from grades data
  useEffect(() => {
    if (gradesData.length > 0) {
      const avgPercentage =
        gradesData.reduce((s: number, g: any) => s + (g.percentage || 0), 0) /
        gradesData.length;
      const roundedAvg = Math.round(avgPercentage * 10) / 10;

      setGradeStats({
        average: roundedAvg,
        total: gradesData.length,
      });
    } else {
      setGradeStats(null);
    }
  }, [gradesData]);

  // Calculate assignment stats from all assignments
  useEffect(() => {
    if (allAssignments.length > 0) {
      const now = new Date();
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(now.getDate() + 7);

      const pending = allAssignments.filter(
        (a) => a.status !== "completed" && a.status !== "submitted"
      ).length;
      const dueThisWeek = allAssignments.filter((a) => {
        if (!a.due_date) return false;
        const dueDate = new Date(a.due_date);
        return dueDate >= now && dueDate <= oneWeekFromNow;
      }).length;

      setAssignmentStats({
        pending: pending,
        dueThisWeek: dueThisWeek,
        total: allAssignments.length,
      });
    } else {
      setAssignmentStats({ pending: 0, dueThisWeek: 0, total: 0 });
    }
  }, [allAssignments]);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/user");
      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
      } else {
        router.push("/login");
      }
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const loadClassesData = async () => {
    try {
      const res = await fetch("/api/students/classes");
      const json = await res.json();
      setClassesData(json.classes || []);
    } catch (err) {
      console.error("Failed to load classes", err);
    }
  };

  const loadAllAssignments = async () => {
    try {
      const res = await fetch("/api/students/assignments");
      const json = await res.json();
      setAllAssignments(json.assignments || []);
    } catch (err) {
      console.error("Failed to load assignments", err);
    }
  };

  const loadGradesData = async () => {
    try {
      const res = await fetch("/api/students/grades");
      const json = await res.json();
      setGradesData(json.grades || []);
    } catch (err) {
      console.error("Failed to load grades", err);
    }
  };

  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      setJoinClassError("Please enter a class code");
      return;
    }

    setJoinClassLoading(true);
    setJoinClassError("");
    setJoinClassSuccess("");

    try {
      const response = await fetch("/api/students/join-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectCode: classCode.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setJoinClassSuccess(data.message || "Successfully joined class!");
        setClassCode("");
        // Refresh classes data
        loadClassesData();
        setTimeout(() => {
          setShowJoinClassDialog(false);
          setJoinClassSuccess("");
          // Refetch classes if dialog is open
          if (openDialog === "classes") {
            setOpenDialog(null);
            setTimeout(() => setOpenDialog("classes"), 100);
          }
        }, 2000);
      } else {
        setJoinClassError(data.error || "Failed to join class");
      }
    } catch (error) {
      setJoinClassError("An error occurred. Please try again.");
    } finally {
      setJoinClassLoading(false);
    }
  };

  const initials =
    user?.first_name && user?.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`
      : user?.email?.[0]?.toUpperCase() || "?";

  useEffect(() => {
    if (!openDialog) return;

    const fetchData = async () => {
      setDialogLoading(true);
      try {
        if (openDialog === "attendance") {
          const res = await fetch("/api/students/attendance");
          const json = await res.json();
          setAttendanceData(json.attendance || []);
        }

        if (openDialog === "grades") {
          const res = await fetch("/api/students/grades");
          const json = await res.json();
          setGradesData(json.grades || []);
        }

        if (openDialog === "assignments") {
          // Filter assignments by selected class if one is selected
          if (selectedClassForAssignments) {
            const filtered = allAssignments.filter(
              (a) => a.class_id === selectedClassForAssignments.id
            );
            setAssignmentsData(filtered);
          } else {
            setAssignmentsData(allAssignments);
          }
        }

        if (openDialog === "classes") {
          const res = await fetch("/api/students/classes");
          const json = await res.json();
          setClassesData(json.classes || []);
        }
      } catch (err) {
        console.error("Failed to fetch dialog data", err);
      } finally {
        setDialogLoading(false);
      }
    };

    fetchData();
  }, [openDialog, selectedClassForAssignments, allAssignments]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1a1a1a] border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                School Management System
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="capitalize">
                {user?.role || "Student"}
              </Badge>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar>
                      <AvatarImage
                        src={user?.avatar_url || ""}
                        alt={user?.email}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/student/profile")}
                  >
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Student, {user?.last_name || "Student"}!
            </h2>
            <p className="text-gray-600 dark:text-gray-500">
              Here&apos;s what&apos;s happening with your academic progress
              today.
            </p>
          </div>
          <Button
            onClick={() => setShowJoinClassDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 mr-2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Join Class
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow dark:bg-[#1a1a1a] dark:border-gray-800"
            onClick={() => setOpenDialog("attendance")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">
                Attendance
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-green-600"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">
                {attendanceStats?.attendance_rate?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {attendanceStats?.present_days || 0} present /{" "}
                {attendanceStats?.total_days || 0} total days
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow dark:bg-[#1a1a1a] dark:border-gray-800"
            onClick={() => setOpenDialog("grades")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">
                Average Grade
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-blue-600"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">
                {gradeStats ? `${gradeStats.average}%` : "No grades"}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {gradeStats
                  ? `${gradeStats.total} ${
                      gradeStats.total === 1 ? "grade" : "grades"
                    } recorded`
                  : "No grades yet"}
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow dark:bg-[#1a1a1a] dark:border-gray-800"
            onClick={() => setOpenDialog("assignments")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">
                Assignments
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-yellow-600"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">
                {assignmentStats?.pending || 0} Pending
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {assignmentStats?.dueThisWeek || 0} due this week
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow dark:bg-[#1a1a1a] dark:border-gray-800"
            onClick={() => setOpenDialog("groups")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">
                Groups
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-purple-600"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">
                {classesData.length} Active
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enrolled classes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dialogs for details */}
        <Dialog
          open={showJoinClassDialog}
          onOpenChange={setShowJoinClassDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join a Class</DialogTitle>
              <DialogDescription>
                Enter the class code provided by your teacher to join a class
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium dark:text-white mb-2 block">
                  Class Code
                </label>
                <Input
                  type="text"
                  placeholder="Enter class code (e.g., ABC123)"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  className="uppercase"
                  disabled={joinClassLoading}
                />
              </div>
              {joinClassError && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {joinClassError}
                </div>
              )}
              {joinClassSuccess && (
                <div className="text-sm text-green-600 dark:text-green-400">
                  {joinClassSuccess}
                </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline" disabled={joinClassLoading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={handleJoinClass}
                disabled={joinClassLoading || !classCode.trim()}
              >
                {joinClassLoading ? "Joining..." : "Join Class"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={openDialog === "attendance"}
          onOpenChange={(val) => setOpenDialog(val ? "attendance" : null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Attendance Details</DialogTitle>
              <DialogDescription>
                Your attendance history and trends
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {attendanceStats && (
                <div className="mb-4 grid grid-cols-4 gap-2">
                  <div className="text-center p-2 border border-border rounded-md dark:bg-[#1a1a1a] dark:border-gray-800">
                    <div className="text-lg font-bold text-green-600">
                      {attendanceStats.present_days || 0}
                    </div>
                    <div className="text-xs text-gray-500">Present</div>
                  </div>
                  <div className="text-center p-2 border border-border rounded-md dark:bg-[#1a1a1a] dark:border-gray-800">
                    <div className="text-lg font-bold text-red-600">
                      {attendanceStats.absent_days || 0}
                    </div>
                    <div className="text-xs text-gray-500">Absent</div>
                  </div>
                  <div className="text-center p-2 border border-border rounded-md dark:bg-[#1a1a1a] dark:border-gray-800">
                    <div className="text-lg font-bold text-yellow-600">
                      {attendanceStats.late_days || 0}
                    </div>
                    <div className="text-xs text-gray-500">Late</div>
                  </div>
                  <div className="text-center p-2 border border-border rounded-md dark:bg-[#1a1a1a] dark:border-gray-800">
                    <div className="text-lg font-bold text-blue-600">
                      {attendanceStats.excused_days || 0}
                    </div>
                    <div className="text-xs text-gray-500">Excused</div>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                {dialogLoading ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Loading...
                  </div>
                ) : attendanceData.length > 0 ? (
                  attendanceData.map((row, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-3 border border-border rounded-md dark:bg-[#1a1a1a] dark:border-gray-800"
                    >
                      <div>
                        <div className="text-sm dark:text-white font-medium">
                          {row.class_name || "Unknown Class"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(row.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            row.status === "present"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : row.status === "absent"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : row.status === "late"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {row.status.charAt(0).toUpperCase() +
                            row.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No attendance records found
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={openDialog === "grades"}
          onOpenChange={(val) => setOpenDialog(val ? "grades" : null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grades Overview</DialogTitle>
              <DialogDescription>
                Your average grade and recent breakdown
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {dialogLoading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              ) : gradesData.length > 0 ? (
                <>
                  <div className="text-4xl font-bold dark:text-white mb-2">
                    {Math.round(
                      (gradesData.reduce(
                        (s: number, g: any) => s + (g.percentage || 0),
                        0
                      ) /
                        gradesData.length) *
                        10
                    ) / 10}
                    %
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Average across {gradesData.length}{" "}
                    {gradesData.length === 1 ? "grade" : "grades"}
                  </p>
                  <div className="space-y-3">
                    {gradesData.map((g: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 border border-border rounded-md dark:bg-[#1a1a1a] dark:border-gray-800"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-medium dark:text-white">
                              {g.subject || "Unknown Subject"}
                            </p>
                            {g.subject_code && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Code: {g.subject_code}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold dark:text-white">
                              {g.marks_obtained}/{g.total_marks}
                            </p>
                            <Badge
                              variant={
                                g.percentage >= 70
                                  ? "default"
                                  : g.percentage >= 50
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="mt-1"
                            >
                              {g.percentage}%
                            </Badge>
                          </div>
                        </div>
                        {g.exam_type && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Type: {g.exam_type}
                          </p>
                        )}
                        {g.created_at && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Date: {new Date(g.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl font-bold dark:text-white">A-</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    85.3% overall
                  </p>
                  <div className="mt-4 space-y-3">
                    {[
                      { subject: "Mathematics", score: "92/100" },
                      { subject: "Physics", score: "87/100" },
                      { subject: "English", score: "88/100" },
                    ].map((g: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between p-3 border border-border rounded-md dark:bg-[#1a1a1a] dark:border-gray-800"
                      >
                        <div className="text-sm dark:text-white">
                          {g.subject}
                        </div>
                        <div className="text-sm font-medium dark:text-white">
                          {g.score}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={openDialog === "assignments"}
          onOpenChange={(val) => setOpenDialog(val ? "assignments" : null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assignments</DialogTitle>
              <DialogDescription>
                List of your assignments and due dates
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              {dialogLoading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              ) : assignmentsData.length > 0 ? (
                assignmentsData.map((a: any, i: number) => (
                  <div
                    key={i}
                    className="p-4 border border-border rounded-md dark:bg-[#1a1a1a] dark:border-gray-800 space-y-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium dark:text-white">{a.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {a.type || "assignment"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {a.class_name} • Code: {a.class_code}
                      </p>
                      {a.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {a.description}
                        </p>
                      )}
                      {a.instructions && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                          <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
                            Instructions:
                          </p>
                          <p className="text-xs text-blue-800 dark:text-blue-400">
                            {a.instructions}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          Due: {new Date(a.due_date).toLocaleDateString()}
                        </Badge>
                        {a.max_score && (
                          <Badge variant="secondary" className="text-xs">
                            {a.max_score} marks
                          </Badge>
                        )}
                        {a.status && (
                          <Badge
                            variant={
                              a.status === "active" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {a.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {a.file_url && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border dark:border-gray-800">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          className="h-4 w-4 text-gray-500"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                          {a.file_name || "Assignment file"}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(a.file_url, "_blank")}
                          className="h-8"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 mr-1"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          View File
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No assignments found
                </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={openDialog === "groups"}
          onOpenChange={(val) => setOpenDialog(val ? "groups" : null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>My Groups</DialogTitle>
              <DialogDescription>
                Your subject groups this semester
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              {dialogLoading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              ) : classesData.length > 0 ? (
                classesData.map((c: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border border-border rounded-md dark:bg-[#1a1a1a] dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium dark:text-white text-base">
                        {c.subject_name || c.class_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {c.day_of_week} • {c.start_time} - {c.end_time} • Room{" "}
                        {c.room_number}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Code: {c.subject_code || c.class_code}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="ml-4"
                      onClick={() => {
                        window.alert(
                          `Joining class: ${c.subject_name || c.class_name}`
                        );
                      }}
                    >
                      Join Group
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No classes found
                </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="dark:bg-[#1a1a1a] dark:border-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-white">My Classes</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Your enrolled classes this semester
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {classesData.length > 0 ? (
                  classesData.slice(0, 4).map((classItem, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 border border-border rounded-md dark:bg-[#0a0a0a] dark:border-gray-800"
                    >
                      <div className="flex-1">
                        <p className="font-medium dark:text-white">
                          {classItem.subject_name || classItem.class_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {classItem.day_of_week} • {classItem.start_time} -{" "}
                          {classItem.end_time}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Room {classItem.room_number} • Code:{" "}
                          {classItem.subject_code}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedClassForAssignments(classItem);
                          setOpenDialog("assignments");
                        }}
                      >
                        View Assignments
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="mb-2">No classes enrolled yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowJoinClassDialog(true)}
                    >
                      Join a Class
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-[#1a1a1a] dark:border-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-white">
                Upcoming Assignments
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Don&apos;t forget these deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allAssignments.length > 0 ? (
                  allAssignments
                    .sort(
                      (a, b) =>
                        new Date(a.due_date).getTime() -
                        new Date(b.due_date).getTime()
                    )
                    .slice(0, 5)
                    .map((item, i) => {
                      const dueDate = new Date(item.due_date);
                      const now = new Date();
                      const daysUntilDue = Math.ceil(
                        (dueDate.getTime() - now.getTime()) /
                          (1000 * 60 * 60 * 24)
                      );
                      const isUrgent = daysUntilDue <= 3 && daysUntilDue >= 0;
                      const isPast = daysUntilDue < 0;

                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <p className="font-medium dark:text-white">
                              {item.title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {item.class_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                isUrgent || isPast ? "destructive" : "outline"
                              }
                            >
                              {dueDate.toLocaleDateString()}
                            </Badge>
                            {item.max_score && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {item.max_score} marks
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No upcoming assignments</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
