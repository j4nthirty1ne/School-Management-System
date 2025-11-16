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
    null | "attendance" | "grades" | "assignments" | "classes" | "join-class"
  >(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [gradesData, setGradesData] = useState<any[]>([]);
  const [assignmentsData, setAssignmentsData] = useState<any[]>([]);
  const [classesData, setClassesData] = useState<any[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [subjectCode, setSubjectCode] = useState("");
  const [joinClassError, setJoinClassError] = useState("");
  const [joinClassSuccess, setJoinClassSuccess] = useState("");

  // Stats state
  const [attendancePercentage, setAttendancePercentage] = useState("95.5%");
  const [averageGrade, setAverageGrade] = useState("A-");
  const [averageGradePercent, setAverageGradePercent] = useState("85.3%");
  const [pendingAssignments, setPendingAssignments] = useState("3");
  const [activeClasses, setActiveClasses] = useState("6");

  useEffect(() => {
    fetchUser();
    fetchDashboardStats();
  }, []);

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

  const fetchDashboardStats = async () => {
    try {
      // Fetch attendance
      const attendanceRes = await fetch("/api/students/attendance");
      const attendanceJson = await attendanceRes.json();
      const attendance = attendanceJson.attendance || [];

      if (attendance.length > 0) {
        const presentCount = attendance.filter(
          (a: any) => a.status === "present"
        ).length;
        const percentage =
          Math.round((presentCount / attendance.length) * 100 * 10) / 10;
        setAttendancePercentage(`${percentage}%`);
      }

      // Fetch grades
      const gradesRes = await fetch("/api/students/grades");
      const gradesJson = await gradesRes.json();
      const grades = gradesJson.grades || [];

      if (grades.length > 0) {
        const avg =
          Math.round(
            (grades.reduce((s: number, g: any) => s + (g.percentage || 0), 0) /
              grades.length) *
              10
          ) / 10;
        setAverageGradePercent(`${avg}%`);

        // Convert to letter grade
        const letterGrade =
          avg >= 93
            ? "A"
            : avg >= 90
            ? "A-"
            : avg >= 87
            ? "B+"
            : avg >= 83
            ? "B"
            : avg >= 80
            ? "B-"
            : avg >= 77
            ? "C+"
            : avg >= 73
            ? "C"
            : avg >= 70
            ? "C-"
            : avg >= 67
            ? "D+"
            : avg >= 63
            ? "D"
            : avg >= 60
            ? "D-"
            : "F";
        setAverageGrade(letterGrade);
      }

      // Fetch assignments
      const assignmentsRes = await fetch("/api/students/assignments");
      const assignmentsJson = await assignmentsRes.json();
      const assignments = assignmentsJson.assignments || [];
      const pending = assignments.filter(
        (a: any) => a.status !== "submitted" && a.status !== "graded"
      ).length;
      setPendingAssignments(pending.toString());

      // Fetch classes
      const classesRes = await fetch("/api/students/classes");
      const classesJson = await classesRes.json();
      const classes = classesJson.classes || [];
      setActiveClasses(classes.length.toString());
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const initials =
    user?.first_name && user?.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`
      : user?.email?.[0]?.toUpperCase() || "?";

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

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
          const res = await fetch("/api/students/assignments");
          const json = await res.json();
          setAssignmentsData(json.assignments || []);
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
  }, [openDialog]);

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

              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenDialog("join-class")}
                className="gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" x2="19" y1="8" y2="14" />
                  <line x1="22" x2="16" y1="11" y2="11" />
                </svg>
                Join Class
              </Button>

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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Student, {user?.last_name || "Student"}!
          </h2>
          <p className="text-gray-600 dark:text-gray-500">
            Here's what's happening with your academic progress today.
          </p>
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
                {attendancePercentage}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                +2.5% from last month
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
                {averageGrade}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {averageGradePercent} overall
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
                {pendingAssignments} Pending
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                2 due this week
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow dark:bg-[#1a1a1a] dark:border-gray-800"
            onClick={() => setOpenDialog("classes")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">
                Classes
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
                {activeClasses} Active
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This semester
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dialogs for details */}
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
            <div className="mt-4 space-y-3">
              {dialogLoading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              ) : attendanceData.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No attendance records found
                </div>
              ) : (
                attendanceData.map((row: any, i: number) => (
                  <div
                    key={i}
                    className="p-4 border border-border rounded-lg dark:bg-[#1a1a1a] dark:border-gray-800 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-base dark:text-white">
                          {row.class_name || "Class"}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {row.date}
                          {row.class_code && (
                            <span className="ml-2 font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                              {row.class_code}
                            </span>
                          )}
                        </div>
                        {(row.start_time || row.end_time) && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            ⏰ {formatTime(row.start_time)} -{" "}
                            {formatTime(row.end_time)}
                            {row.room_number && ` • Room ${row.room_number}`}
                          </div>
                        )}
                        {row.notes && (
                          <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic">
                            💬 {row.notes}
                          </div>
                        )}
                      </div>
                      <div
                        className={`text-sm font-semibold px-3 py-1 rounded-full ${
                          row.status === "present" || row.status === "Present"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : row.status === "absent" || row.status === "Absent"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : row.status === "late" || row.status === "Late"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {row.status.charAt(0).toUpperCase() +
                          row.status.slice(1).toLowerCase()}
                      </div>
                    </div>
                  </div>
                ))
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
              ) : (
                <>
                  <div className="text-4xl font-bold dark:text-white">
                    {gradesData.length
                      ? Math.round(
                          (gradesData.reduce(
                            (s: number, g: any) => s + (g.percentage || 0),
                            0
                          ) /
                            gradesData.length) *
                            10
                        ) /
                          10 +
                        "%"
                      : "A-"}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {gradesData.length
                      ? `Average ${
                          Math.round(
                            (gradesData.reduce(
                              (s: number, g: any) => s + (g.percentage || 0),
                              0
                            ) /
                              gradesData.length) *
                              10
                          ) / 10
                        }% overall`
                      : "85.3% overall"}
                  </p>
                  <div className="mt-4 space-y-3">
                    {gradesData.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        No grades available yet
                      </div>
                    ) : (
                      gradesData.map((g: any, i: number) => (
                        <div
                          key={i}
                          className="flex justify-between p-3 border border-border rounded-md dark:bg-[#1a1a1a] dark:border-gray-800"
                        >
                          <div className="text-sm dark:text-white">
                            {g.subject || g.subject_name || g.subject_id}
                          </div>
                          <div className="text-sm font-medium dark:text-white">
                            {g.score ||
                              (g.marks_obtained
                                ? `${g.marks_obtained}/${g.total_marks}`
                                : g.percentage
                                ? `${g.percentage}%`
                                : "N/A")}
                          </div>
                        </div>
                      ))
                    )}
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
              ) : assignmentsData.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No assignments found
                </div>
              ) : (
                assignmentsData.map((a: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border border-border rounded-md dark:bg-[#1a1a1a] dark:border-gray-800"
                  >
                    <div>
                      <p className="font-medium dark:text-white">
                        {a.title || a.assignment_title || a.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Due: {a.due_date || a.due || "TBD"}
                      </p>
                    </div>
                    <div>
                      <Badge
                        variant={
                          a.status === "urgent" ? "destructive" : "outline"
                        }
                      >
                        {a.due_date
                          ? new Date(a.due_date).toLocaleDateString()
                          : a.due || ""}
                      </Badge>
                    </div>
                  </div>
                ))
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
          open={openDialog === "classes"}
          onOpenChange={(val) => setOpenDialog(val ? "classes" : null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>My Classes</DialogTitle>
              <DialogDescription>
                Manage your enrolled classes
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium dark:text-white">
                  Enrolled Classes
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setOpenDialog("join-class");
                  }}
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
                    <line x1="12" x2="12" y1="5" y2="19" />
                    <line x1="5" x2="19" y1="12" y2="12" />
                  </svg>
                  Join New Class
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {dialogLoading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              ) : classesData.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No classes enrolled yet. Join a class to get started!
                </div>
              ) : (
                classesData.map((c: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border border-border rounded-md dark:bg-[#1a1a1a] dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium dark:text-white text-base">
                        {c.class_name || c.subject || c.subject_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {c.time ||
                          (c.start_time && c.end_time
                            ? `${formatTime(c.start_time)} - ${formatTime(
                                c.end_time
                              )}`
                            : "")}
                        {(c.time || c.start_time) &&
                          (c.teacher_name || c.teacher || c.instructor) &&
                          " • "}
                        {c.teacher_name || c.teacher || c.instructor}
                      </p>
                    </div>
                  </div>
                ))
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
          open={openDialog === "join-class"}
          onOpenChange={(val) => {
            setOpenDialog(val ? "join-class" : null);
            if (!val) {
              setSubjectCode("");
              setJoinClassError("");
              setJoinClassSuccess("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join a Class</DialogTitle>
              <DialogDescription>
                Enter the class code or subject code provided by your teacher or
                admin
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              {joinClassError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm">
                  {joinClassError}
                </div>
              )}
              {joinClassSuccess && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-md text-sm">
                  {joinClassSuccess}
                </div>
              )}
              <div className="space-y-2">
                <label
                  htmlFor="subject-code"
                  className="text-sm font-medium dark:text-white"
                >
                  Class Code or Subject Code
                </label>
                <input
                  id="subject-code"
                  type="text"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                  placeholder="e.g., U2767X, MATH-101"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-[#1a1a1a] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={dialogLoading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter the class code (e.g., U2767X) or subject code (e.g.,
                  MATH-101) provided by your teacher
                </p>
              </div>
            </div>
            <DialogFooter className="mt-4 gap-2">
              <DialogClose asChild>
                <Button variant="outline" disabled={dialogLoading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={async () => {
                  if (!subjectCode.trim()) {
                    setJoinClassError("Please enter a subject code");
                    return;
                  }

                  setDialogLoading(true);
                  setJoinClassError("");
                  setJoinClassSuccess("");

                  try {
                    const response = await fetch("/api/students/join-class", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ subjectCode: subjectCode.trim() }),
                    });

                    const data = await response.json();

                    if (data.success) {
                      setJoinClassSuccess(
                        `Successfully joined ${data.className || "class"}!`
                      );
                      setSubjectCode("");
                      // Refresh classes list and stats
                      fetchDashboardStats();
                      setOpenDialog("classes");
                      setTimeout(async () => {
                        setDialogLoading(true);
                        try {
                          const res = await fetch("/api/students/classes");
                          const json = await res.json();
                          setClassesData(json.classes || []);
                        } catch (err) {
                          console.error("Failed to refresh classes", err);
                        } finally {
                          setDialogLoading(false);
                        }
                        setJoinClassSuccess("");
                      }, 1500);
                    } else {
                      setJoinClassError(data.error || "Failed to join class");
                    }
                  } catch (error) {
                    setJoinClassError("An error occurred. Please try again.");
                  } finally {
                    setDialogLoading(false);
                  }
                }}
                disabled={dialogLoading || !subjectCode.trim()}
              >
                {dialogLoading ? "Joining..." : "Join Class"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="dark:bg-[#1a1a1a] dark:border-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-white">Recent Grades</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Your latest exam and assignment scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    subject: "Mathematics",
                    grade: "A",
                    score: "92/100",
                    date: "Oct 18",
                  },
                  {
                    subject: "Physics",
                    grade: "B+",
                    score: "87/100",
                    date: "Oct 15",
                  },
                  {
                    subject: "English",
                    grade: "A-",
                    score: "88/100",
                    date: "Oct 12",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium dark:text-white">
                        {item.subject}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{item.grade}</Badge>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {item.score}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-[#1a1a1a] dark:border-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-white">
                Upcoming Assignments
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Don't forget these deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: "Chemistry Lab Report",
                    subject: "Chemistry",
                    due: "Oct 23",
                    status: "urgent",
                  },
                  {
                    title: "History Essay",
                    subject: "History",
                    due: "Oct 25",
                    status: "soon",
                  },
                  {
                    title: "Math Problem Set",
                    subject: "Mathematics",
                    due: "Oct 28",
                    status: "normal",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium dark:text-white">
                        {item.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.subject}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          item.status === "urgent" ? "destructive" : "outline"
                        }
                      >
                        {item.due}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
