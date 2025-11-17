"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JoinClassDialog } from "@/components/join-class-dialog";
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
    null | "attendance" | "grades" | "assignments" | "classes"
  >(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [gradesData, setGradesData] = useState<any[]>([]);
  const [assignmentsData, setAssignmentsData] = useState<any[]>([]);
  const [classesData, setClassesData] = useState<any[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);

  useEffect(() => {
    fetchUser();
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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const fetchDialogData = async (
    dialogType: "attendance" | "grades" | "assignments" | "classes"
  ) => {
    setDialogLoading(true);
    try {
      if (dialogType === "attendance") {
        const res = await fetch("/api/students/attendance");
        const json = await res.json();
        setAttendanceData(json.attendance || []);
      }
      if (dialogType === "grades") {
        const res = await fetch("/api/students/grades");
        const json = await res.json();
        setGradesData(json.grades || []);
      }
      if (dialogType === "assignments") {
        const res = await fetch("/api/students/assignments");
        const json = await res.json();
        setAssignmentsData(json.assignments || []);
      }
      if (dialogType === "classes") {
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

  const initials =
    user?.first_name && user?.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`
      : user?.email?.[0]?.toUpperCase() || "?";

  useEffect(() => {
    if (!openDialog) return;
    fetchDialogData(openDialog);
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
              <div className="text-2xl font-bold dark:text-white">95.5%</div>
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
              <div className="text-2xl font-bold dark:text-white">A-</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                85.3% overall
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
                3 Pending
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                2 due this week
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow dark:bg-[#1a1a1a] dark:border-gray-800"
            onClick={() => router.push("/student/timetable")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">
                My Timetable
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
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">
                View Schedule
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Click to see your weekly timetable
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
              <div className="text-2xl font-bold dark:text-white">6 Active</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your enrolled classes
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setJoinDialogOpen(true);
                }}
              >
                + Join New Class
              </Button>
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
              ) : (
                (attendanceData.length
                  ? attendanceData
                  : [
                      { date: "2025-10-01", status: "Present" },
                      { date: "2025-10-02", status: "Absent" },
                      { date: "2025-10-03", status: "Present" },
                    ]
                ).map((row: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between p-3 border border-border rounded-md dark:bg-[#1a1a1a] dark:border-gray-800"
                  >
                    <div className="text-sm dark:text-white">{row.date}</div>
                    <div
                      className={`text-sm font-medium ${
                        row.status === "present" || row.status === "Present"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {row.status}
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
                    {(gradesData.length
                      ? gradesData
                      : [
                          { subject: "Mathematics", score: "92/100" },
                          { subject: "Physics", score: "87/100" },
                          { subject: "English", score: "88/100" },
                        ]
                    ).map((g: any, i: number) => (
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
              ) : (
                (assignmentsData.length
                  ? assignmentsData
                  : [
                      {
                        title: "Chemistry Lab Report",
                        due: "Oct 23",
                        status: "urgent",
                      },
                      { title: "History Essay", due: "Oct 25", status: "soon" },
                      {
                        title: "Math Problem Set",
                        due: "Oct 28",
                        status: "normal",
                      },
                    ]
                ).map((a: any, i: number) => (
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Active Classes</DialogTitle>
              <DialogDescription>This semester's classes</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              {dialogLoading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              ) : (
                (classesData.length
                  ? classesData
                  : [
                      {
                        subject: "Mathematics",
                        time: "Mon/Wed 9:00 - 10:00",
                        teacher: "Dr. Sarah Miller",
                      },
                      {
                        subject: "Physics",
                        time: "Tue/Thu 10:30 - 11:30",
                        teacher: "Prof. John Wilson",
                      },
                      {
                        subject: "English",
                        time: "Mon/Wed 1:00 - 2:00",
                        teacher: "Ms. Emily Taylor",
                      },
                    ]
                ).map((c: any, i: number) => (
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
                          (c.start_time
                            ? `${c.start_time} - ${c.end_time}`
                            : "")}{" "}
                        • {c.teacher_name || c.teacher || c.instructor}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="ml-4"
                      onClick={() => {
                        // Handle join class action - could open a video call link or class page
                        window.alert(
                          `Joining class: ${
                            c.class_name || c.subject || c.subject_name
                          }`
                        );
                      }}
                    >
                      Join Class
                    </Button>
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

      <JoinClassDialog
        open={joinDialogOpen}
        onOpenChange={setJoinDialogOpen}
        studentId={user?.id || ""}
        onSuccess={() => {
          // Refresh classes data when dialog is open
          if (openDialog === "classes") {
            fetchDialogData("classes");
          }
        }}
      />
    </div>
  );
}
