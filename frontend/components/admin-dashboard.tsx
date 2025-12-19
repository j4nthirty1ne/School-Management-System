"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  GraduationCap,
  Calendar,
  TrendingUp,
  Search,
  Plus,
  Download,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  RefreshCw,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddUserDialog } from "@/components/add-user-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TimetableManagement } from "@/components/timetable-management";
import { TimetableCalendarView } from "@/components/timetable-calendar-view";
import { SubjectManagement } from "@/components/subject-management";

interface Student {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  enrollment_status: string;
  date_of_birth: string;
  phone: string;
  class_id?: string;
  class_name?: string;
  gender?: string;
  address?: string;
}

interface Teacher {
  id: string;
  teacher_code: string;
  first_name: string;
  last_name: string;
  subject_specialization: string;
  status: string;
  user_id?: string;
  phone?: string;
  email?: string;
  hire_date?: string;
}

interface Class {
  id: string;
  class_name?: string;
  subject_name?: string;
  subject_code?: string;
  subject_id?: string;
  grade_level?: string;
  section?: string;
  teacher_id?: string;
  teacher_name?: string;
  room_number?: string;
  capacity?: number;
  student_count?: number;
  schedule?: string;
  academic_year?: string;
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
  created_at?: string;
}

interface ClassRecord {
  id: string;
  class_name: string;
  grade_level?: string;
  section: string;
  room_number?: string;
  capacity?: number;
  student_count?: number;
  created_at?: string;
}

export function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [classSearchQuery, setClassSearchQuery] = useState("");
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [addClassDialogOpen, setAddClassDialogOpen] = useState(false);
  const [viewClassDialogOpen, setViewClassDialogOpen] = useState(false);
  const [editClassDialogOpen, setEditClassDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedUserType, setSelectedUserType] = useState<
    "student" | "teacher" | "admin" | null
  >(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null
  );
  const router = useRouter();

  // Data states
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [teachersData, setTeachersData] = useState<Teacher[]>([]);
  const [classesData, setClassesData] = useState<Class[]>([]);
  const [allClassesData, setAllClassesData] = useState<ClassRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Stats states
  const [statsData, setStatsData] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 42,
    avgAttendance: "94.2%",
  });

  // Admin profile for welcome message
  const [adminProfile, setAdminProfile] = useState<{
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string;
  } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/auth/user");
        const json = await res.json();
        if (json?.success && json.user) {
          setAdminProfile({
            first_name: json.user.first_name,
            last_name: json.user.last_name,
            email: json.user.email,
            avatar_url: (json.user as any).avatar_url,
          });
        }
      } catch (err) {
        // ignore profile errors — admin can still use dashboard
        console.debug("Could not load admin profile", err);
      }
    };

    loadProfile();
  }, []);

  // Fetch students data
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(""); // Clear previous errors
      const response = await fetch("/api/students", {
        cache: "no-store", // Disable caching to always get fresh data
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      const data = await response.json();

      console.log("✅ Students API response:", data);
      console.log(`📊 Found ${data.students?.length || 0} students`);

      if (data.success) {
        setStudentsData(data.students);
        setStatsData((prev) => ({ ...prev, totalStudents: data.count }));
      } else {
        console.error("❌ Failed to fetch students:", data.error);
        setError(data.error || "Failed to fetch students");
      }
    } catch (err: any) {
      console.error("❌ Error fetching students:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Fetch teachers data
  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/admin/teachers", {
        cache: "no-store", // Disable caching to always get fresh data
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      const data = await response.json();

      console.log("✅ Teachers API response:", data);
      console.log(`📊 Found ${data.teachers?.length || 0} teachers`);

      if (data.success) {
        setTeachersData(data.teachers);
        setStatsData((prev) => ({ ...prev, totalTeachers: data.count }));
      } else {
        console.error("❌ Failed to fetch teachers:", data.error);
      }
    } catch (err) {
      console.error("❌ Error fetching teachers:", err);
    }
  };

  // Fetch classes data
  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      const data = await response.json();

      console.log("✅ Classes API response:", data);
      console.log("📊 Classes data:", data.classes);

      // Log each class with its teacher info
      data.classes?.forEach((cls: any) => {
        console.log(
          `📋 Class: ${cls.subject_name}, Teacher ID: ${cls.teacher_id}, Teacher Name: ${cls.teacher_name}`
        );
      });

      if (data.success) {
        setClassesData(data.classes || []);
        setStatsData((prev) => ({
          ...prev,
          totalClasses: data.classes?.length || 0,
        }));
      } else {
        console.error("❌ Failed to fetch classes:", data.error);
      }
    } catch (err) {
      console.error("❌ Error fetching classes:", err);
    }
  };

  const fetchAllClasses = async () => {
    try {
      const response = await fetch("/api/classes-list", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      const data = await response.json();

      if (data.success) {
        setAllClassesData(data.classes || []);
      } else {
        console.error("❌ Failed to fetch all classes:", data.error);
      }
    } catch (err) {
      console.error("❌ Error fetching all classes:", err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchStudents();
    fetchTeachers();
    fetchClasses();
    fetchAllClasses();
  }, []);

  const handleOpenAddUser = (userType: "student" | "teacher" | "admin") => {
    setSelectedUserType(userType);
    setAddUserDialogOpen(true);
  };

  const handleUserAdded = () => {
    // Refresh data after adding user
    fetchStudents();
    fetchTeachers();
    setAddUserDialogOpen(false);
  };

  // Class handlers
  const [newClass, setNewClass] = useState({
    subject_name: "",
    subject_code: "",
    academic_year: "",
    teacher_id: "",
    room_number: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
  });
  const [classLoading, setClassLoading] = useState(false);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate teacher selection
    if (!newClass.teacher_id) {
      alert("Please select a teacher");
      return;
    }

    setClassLoading(true);
    try {
      const payload = {
        subject_name: newClass.subject_name,
        teacher_id: newClass.teacher_id,
        room_number: newClass.room_number,
        day_of_week: newClass.day_of_week,
        start_time: newClass.start_time,
        end_time: newClass.end_time,
      };

      console.log("Creating class with payload:", payload);

      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      console.log("Response:", data);

      if (data.success) {
        alert("Class created successfully!");
        setAddClassDialogOpen(false);
        setNewClass({
          subject_name: "",
          subject_code: "",
          academic_year: "",
          teacher_id: "",
          room_number: "",
          day_of_week: "",
          start_time: "",
          end_time: "",
        });
        fetchClasses();
      } else {
        alert(data.error || "Failed to create group");
      }
    } catch (err: any) {
      console.error("Error creating class:", err);
      alert(err.message || "An error occurred");
    } finally {
      setClassLoading(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;

    try {
      const response = await fetch(`/api/classes/${id}`, { method: "DELETE" });
      const data = await response.json();

      if (data.success) {
        fetchClasses();
      } else {
        alert(data.error || "Failed to delete group");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      const response = await fetch(`/api/students/${id}`, { method: "DELETE" });
      const data = await response.json();

      if (data.success) {
        fetchStudents();
      } else {
        alert(data.error || "Failed to delete student");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    }
  };

  const handleDeleteTeacher = async (userId: string, teacherName: string) => {
    if (!confirm(`Are you sure you want to delete teacher: ${teacherName}?`))
      return;

    try {
      const response = await fetch(`/api/admin/teachers/${userId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        alert("Teacher deleted successfully");
        fetchTeachers();
      } else {
        alert(data.error || "Failed to delete teacher");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    }
  };

  // Teacher view/edit handlers
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null);
  const [editTeacherState, setEditTeacherState] = useState<Teacher | null>(
    null
  );
  const [editTeacherLoading, setEditTeacherLoading] = useState(false);

  const handleViewTeacher = async (userId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/teachers/${userId}`);
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to fetch teacher");
      setViewTeacher(data.teacher);
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditTeacher = async (userId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/teachers/${userId}`);
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to fetch teacher");
      setEditTeacherState(data.teacher);
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTeacherEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeacherState) return;
    setEditTeacherLoading(true);
    try {
      const payload: any = {
        first_name: editTeacherState.first_name,
        last_name: editTeacherState.last_name,
        phone: editTeacherState.phone,
        email: editTeacherState.email,
        hire_date: editTeacherState.hire_date,
        status: editTeacherState.status,
        teacher_code: editTeacherState.teacher_code,
      };

      const res = await fetch(
        `/api/admin/teachers/${
          editTeacherState.user_id || editTeacherState.id
        }`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to update teacher");

      fetchTeachers();
      setEditTeacherState(null);
      alert("Teacher updated");
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setEditTeacherLoading(false);
    }
  };

  // View / Edit student handlers
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Create class handlers
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [createClassForm, setCreateClassForm] = useState({
    class_name: "",
    section: "",
    grade_level: "",
    academic_year: new Date().getFullYear().toString(),
  });
  const [createClassLoading, setCreateClassLoading] = useState(false);

  const handleViewStudent = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/students/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to fetch student");
      setViewStudent(data.student);
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditStudent = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/students/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to fetch student");
      setEditStudent(data.student);
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    setEditLoading(true);
    try {
      const payload: any = {
        date_of_birth: editStudent.date_of_birth,
        gender: editStudent.gender,
        address: editStudent.address,
        class_id: editStudent.class_id,
        enrollment_status: editStudent.enrollment_status,
        phone: editStudent.phone,
      };

      const res = await fetch(`/api/students/${editStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to update");

      // Refresh list and close
      fetchStudents();
      setEditStudent(null);
      alert("Student updated");
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreateNewClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateClassLoading(true);
    try {
      const payload = {
        class_name: createClassForm.class_name,
        section: createClassForm.section,
        grade_level: createClassForm.grade_level,
        academic_year: createClassForm.academic_year,
      };

      const res = await fetch("/api/classes-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to create class");

      // Refresh list and close dialog
      fetchAllClasses();
      setShowCreateClass(false);
      setCreateClassForm({
        class_name: "",
        section: "",
        grade_level: "",
        academic_year: new Date().getFullYear().toString(),
      });
      alert("Class created successfully");
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setCreateClassLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "active") return "default";
    if (statusLower === "inactive") return "secondary";
    if (statusLower === "pending") return "outline";
    return "secondary";
  };

  // Filter students based on search
  const filteredStudents = studentsData.filter(
    (student) =>
      student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter teachers based on search
  const filteredTeachers = teachersData.filter(
    (teacher) =>
      teacher.first_name
        ?.toLowerCase()
        .includes(teacherSearchQuery.toLowerCase()) ||
      teacher.last_name
        ?.toLowerCase()
        .includes(teacherSearchQuery.toLowerCase()) ||
      teacher.teacher_code
        ?.toLowerCase()
        .includes(teacherSearchQuery.toLowerCase())
  );

  // Filter classes based on search and selected teacher
  const filteredClasses = classesData.filter((cls) => {
    const matchesSearch =
      cls.subject_name
        ?.toLowerCase()
        .includes(classSearchQuery.toLowerCase()) ||
      cls.teacher_name
        ?.toLowerCase()
        .includes(classSearchQuery.toLowerCase()) ||
      cls.room_number?.toLowerCase().includes(classSearchQuery.toLowerCase());

    const matchesTeacher =
      !selectedTeacherId || cls.teacher_id === selectedTeacherId;

    if (selectedTeacherId) {
      console.log("Filtering class:", {
        className: cls.subject_name,
        classTeacherId: cls.teacher_id,
        selectedTeacherId,
        matchesTeacher,
      });
    }

    return matchesSearch && matchesTeacher;
  });

  console.log("Total classes:", classesData.length);
  console.log("Filtered classes:", filteredClasses.length);
  console.log("Selected teacher ID:", selectedTeacherId);

  const stats = [
    {
      label: "Total Students",
      value: statsData.totalStudents.toString(),
      icon: Users,
      change: "+12%",
    },
    {
      label: "Total Teachers",
      value: statsData.totalTeachers.toString(),
      icon: GraduationCap,
      change: "+3%",
    },
    {
      label: "Groups",
      value: statsData.totalClasses.toString(),
      icon: Calendar,
      change: "0%",
    },
    {
      label: "Avg Attendance",
      value: statsData.avgAttendance,
      icon: TrendingUp,
      change: "+2.1%",
    },
  ];

  const adminName = adminProfile
    ? `${adminProfile.first_name || ""} ${adminProfile.last_name || ""}`.trim()
    : "";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Admin Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            {adminName ? (
              <>
                Welcome back, <span className="font-medium">{adminName}</span> —
                manage your school operations
              </>
            ) : (
              "Manage your school operations"
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              fetchStudents();
              fetchTeachers();
              fetchClasses();
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <ThemeToggle />

          {/* Profile dropdown */}
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                  <Avatar>
                    <AvatarImage
                      src={adminProfile?.avatar_url || ""}
                      alt={adminName || "Admin"}
                    />
                    <AvatarFallback>
                      {(adminName &&
                        adminName
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")) ||
                        "AD"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">
                    {adminName || "Administrator"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {adminProfile?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/admin/profile")}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    router.push("/login");
                  }}
                  className="text-red-600"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {error.includes("Teacher record not found") && (
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/setup-admin", {
                      method: "POST",
                    });
                    const data = await res.json();
                    if (data.success) {
                      alert("Admin profile created! Please refresh the page.");
                      window.location.reload();
                    } else {
                      alert("Error: " + data.error);
                    }
                  } catch (err: any) {
                    alert("Error setting up admin");
                  }
                }}
              >
                Fix Admin Profile
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <span
                  className={`text-sm font-medium ${
                    stat.change.startsWith("+")
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* <AttendanceChart />
        <PerformanceChart /> */}
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="classes-new">Classes</TabsTrigger>
          <TabsTrigger value="classes">Groups</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Management</CardTitle>
                  <CardDescription>
                    Add, update, and manage student records
                  </CardDescription>
                </div>
                <Button
                  className="gap-2"
                  onClick={() => handleOpenAddUser("student")}
                >
                  <Plus className="h-4 w-4" />
                  Add Student
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Loading students...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No students found</p>
                  <Button
                    className="mt-4"
                    onClick={() => handleOpenAddUser("student")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Student
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">
                            Student Code
                          </th>
                          <th className="text-left p-3 text-sm font-medium">
                            Name
                          </th>
                          <th className="text-left p-3 text-sm font-medium">
                            Class
                          </th>
                          <th className="text-left p-3 text-sm font-medium">
                            Status
                          </th>
                          <th className="text-left p-3 text-sm font-medium">
                            Phone
                          </th>
                          <th className="text-left p-3 text-sm font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => (
                          <tr
                            key={student.id}
                            className="border-t border-border hover:bg-muted/30"
                          >
                            <td className="p-3 text-sm font-mono">
                              {student.student_code}
                            </td>
                            <td className="p-3 text-sm font-medium">
                              {student.first_name} {student.last_name}
                            </td>
                            <td className="p-3 text-sm">
                              {student.class_name || "Not assigned"}
                            </td>
                            <td className="p-3 text-sm">
                              <Badge
                                variant={getStatusBadgeVariant(
                                  student.enrollment_status
                                )}
                              >
                                {student.enrollment_status}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {student.phone || "N/A"}
                            </td>
                            <td className="p-3 text-sm">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleViewStudent(student.id)
                                    }
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleOpenEditStudent(student.id)
                                    }
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() =>
                                      handleDeleteStudent(student.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Teacher Management</CardTitle>
                  <CardDescription>
                    Manage teacher records and assignments
                  </CardDescription>
                </div>
                <Button
                  className="gap-2"
                  onClick={() => handleOpenAddUser("teacher")}
                >
                  <Plus className="h-4 w-4" />
                  Add Teacher
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teachers by name, code, or subject..."
                  value={teacherSearchQuery}
                  onChange={(e) => setTeacherSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Loading teachers...</p>
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No teachers found</p>
                  <Button
                    className="mt-4"
                    onClick={() => handleOpenAddUser("teacher")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Teacher
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">
                            Teacher Code
                          </th>
                          <th className="text-left p-3 text-sm font-medium">
                            Name
                          </th>
                          <th className="text-left p-3 text-sm font-medium">
                            Specialization
                          </th>
                          <th className="text-left p-3 text-sm font-medium">
                            Status
                          </th>
                          <th className="text-left p-3 text-sm font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTeachers.map((teacher) => (
                          <tr
                            key={teacher.id}
                            className="border-t border-border hover:bg-muted/30"
                          >
                            <td className="p-3 text-sm font-mono">
                              {teacher.teacher_code}
                            </td>
                            <td className="p-3 text-sm font-medium">
                              {teacher.first_name} {teacher.last_name}
                            </td>
                            <td className="p-3 text-sm">
                              {teacher.subject_specialization || "N/A"}
                            </td>
                            <td className="p-3 text-sm">
                              <Badge
                                variant={getStatusBadgeVariant(teacher.status)}
                              >
                                {teacher.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleViewTeacher(
                                        teacher.user_id ?? teacher.id
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleOpenEditTeacher(
                                        teacher.user_id ?? teacher.id
                                      )
                                    }
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() =>
                                      handleDeleteTeacher(
                                        teacher.user_id ?? teacher.id,
                                        `${teacher.first_name} ${teacher.last_name}`
                                      )
                                    }
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Group Management</CardTitle>
                  <CardDescription>
                    Create and manage subject groups for teachers
                  </CardDescription>
                </div>
                <Button
                  className="gap-2"
                  onClick={() => setAddClassDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Group
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups by name, teacher, or room..."
                  value={classSearchQuery}
                  onChange={(e) => setClassSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Loading groups...</p>
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No groups found</p>
                  <Button
                    className="mt-4"
                    onClick={() => setAddClassDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Group
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">
                            Group Name
                          </th>
                          <th className="text-left p-3 text-sm font-medium">
                            Grade/Section
                          </th>
                          <th className="text-left p-3 text-sm font-medium">
                            Teacher
                          </th>
                          <th className="text-left p-3 text-sm font-medium">
                            Room
                          </th>
                          <th className="text-left p-3 text-sm font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClasses.map((cls) => {
                          console.log("Rendering class:", cls);
                          return (
                            <tr
                              key={cls.id}
                              className="border-t border-border hover:bg-muted/30"
                            >
                              <td className="p-3 text-sm font-medium">
                                {cls.subject_name || "(No name)"}
                              </td>
                              <td className="p-3 text-sm">
                                {cls.grade_level && cls.section
                                  ? `${cls.grade_level} - ${cls.section}`
                                  : cls.grade_level ||
                                    cls.section ||
                                    cls.academic_year ||
                                    "N/A"}
                              </td>
                              <td className="p-3 text-sm">
                                {cls.teacher_name || "Not assigned"}
                              </td>
                              <td className="p-3 text-sm">
                                {cls.room_number || "N/A"}
                              </td>
                              <td className="p-3 text-sm">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedClass(cls);
                                        setViewClassDialogOpen(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedClass(cls);
                                        setEditClassDialogOpen(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => handleDeleteClass(cls.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes-new" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Class Management</CardTitle>
                  <CardDescription>
                    Create and manage classes like Math-M1, Khmer-A1
                  </CardDescription>
                </div>
                <Button
                  className="gap-2"
                  onClick={() => setShowCreateClass(true)}
                >
                  <Plus size={16} />
                  Create Class
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="px-6 py-3 text-left text-sm font-semibold">
                        Class Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">
                        Section
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">
                        Grade Level
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">
                        Students
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">
                        Capacity
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">
                        Room
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allClassesData.map((cls) => (
                      <tr
                        key={cls.id}
                        className="border-b hover:bg-muted/50 transition"
                      >
                        <td className="px-6 py-4">
                          <span className="font-medium">{cls.class_name}</span>
                        </td>
                        <td className="px-6 py-4">{cls.section}</td>
                        <td className="px-6 py-4">{cls.grade_level || "-"}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline">
                            {cls.student_count || 0} students
                          </Badge>
                        </td>
                        <td className="px-6 py-4">{cls.capacity || "-"}</td>
                        <td className="px-6 py-4">{cls.room_number || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allClassesData.length === 0 && (
                  <div className="px-6 py-8 text-center text-muted-foreground">
                    No classes created yet. Create one to get started!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timetable" className="space-y-4">
          <TimetableCalendarView />
        </TabsContent>
      </Tabs>

      <AddUserDialog
        open={addUserDialogOpen}
        onOpenChange={setAddUserDialogOpen}
        userType={selectedUserType}
        onUserAdded={handleUserAdded}
      />

      {/* View Student Modal */}
      <Dialog open={!!viewStudent} onOpenChange={() => setViewStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {viewStudent && (
            <div className="space-y-2">
              <p>
                <strong>Student Code:</strong> {viewStudent.student_code}
              </p>
              <p>
                <strong>Name:</strong> {viewStudent.first_name}{" "}
                {viewStudent.last_name}
              </p>
              <p>
                <strong>DOB:</strong> {viewStudent.date_of_birth || "N/A"}
              </p>
              <p>
                <strong>Gender:</strong> {viewStudent.gender || "N/A"}
              </p>
              <p>
                <strong>Phone:</strong> {viewStudent.phone || "N/A"}
              </p>
              <p>
                <strong>Class:</strong>{" "}
                {viewStudent.class_name || "Not assigned"}
              </p>
              <p>
                <strong>Status:</strong> {viewStudent.enrollment_status}
              </p>
              <p>
                <strong>Address:</strong> {viewStudent.address || "N/A"}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewStudent(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Modal */}
      <Dialog open={!!editStudent} onOpenChange={() => setEditStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>

          {editStudent && (
            <form onSubmit={handleSubmitEdit} className="space-y-3">
              <div>
                <label className="text-sm">First Name</label>
                <Input
                  value={editStudent.first_name || ""}
                  onChange={(e) =>
                    setEditStudent({
                      ...editStudent,
                      first_name: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm">Last Name</label>
                <Input
                  value={editStudent.last_name || ""}
                  onChange={(e) =>
                    setEditStudent({
                      ...editStudent,
                      last_name: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm">Date of Birth</label>
                <Input
                  type="date"
                  value={editStudent.date_of_birth || ""}
                  onChange={(e) =>
                    setEditStudent({
                      ...editStudent,
                      date_of_birth: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm">Gender</label>
                <Input
                  value={editStudent.gender || ""}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, gender: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm">Phone</label>
                <Input
                  value={editStudent.phone || ""}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm">Class Name</label>
                <Select
                  value={editStudent.class_id || ""}
                  onValueChange={(value) =>
                    setEditStudent({
                      ...editStudent,
                      class_id: value,
                      class_name:
                        classesData.find((c) => c.id === value)?.class_name ||
                        "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={editStudent.class_name || "Not assigned"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {classesData.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.section
                          ? `${cls.class_name}-${cls.section}`
                          : cls.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm">Address</label>
                <Input
                  value={editStudent.address || ""}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, address: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm">Status</label>
                <Input
                  value={editStudent.enrollment_status || ""}
                  onChange={(e) =>
                    setEditStudent({
                      ...editStudent,
                      enrollment_status: e.target.value,
                    })
                  }
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditStudent(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Class Modal */}
      <Dialog open={showCreateClass} onOpenChange={setShowCreateClass}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateNewClass} className="space-y-4">
            <div>
              <label className="text-sm">Class Name *</label>
              <Input
                value={createClassForm.class_name}
                onChange={(e) =>
                  setCreateClassForm({
                    ...createClassForm,
                    class_name: e.target.value,
                  })
                }
                placeholder="e.g., Mathematics, Chemistry"
                required
              />
            </div>

            <div>
              <label className="text-sm">Section *</label>
              <Input
                value={createClassForm.section}
                onChange={(e) =>
                  setCreateClassForm({
                    ...createClassForm,
                    section: e.target.value,
                  })
                }
                placeholder="e.g., M1, A1, B2"
                required
              />
            </div>

            <div>
              <label className="text-sm">Grade Level *</label>
              <Input
                type="number"
                value={createClassForm.grade_level}
                onChange={(e) =>
                  setCreateClassForm({
                    ...createClassForm,
                    grade_level: e.target.value,
                  })
                }
                placeholder="e.g., 10, 11, 12"
                required
              />
            </div>

            <div>
              <label className="text-sm">Academic Year *</label>
              <Input
                value={createClassForm.academic_year}
                onChange={(e) =>
                  setCreateClassForm({
                    ...createClassForm,
                    academic_year: e.target.value,
                  })
                }
                placeholder="e.g., 2024-2025"
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateClass(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createClassLoading}>
                {createClassLoading ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Teacher Modal */}
      <Dialog open={!!viewTeacher} onOpenChange={() => setViewTeacher(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
          </DialogHeader>
          {viewTeacher && (
            <div className="space-y-2">
              <p>
                <strong>Teacher Code:</strong> {viewTeacher.teacher_code}
              </p>
              <p>
                <strong>Name:</strong> {viewTeacher.first_name}{" "}
                {viewTeacher.last_name}
              </p>
              <p>
                <strong>Hire Date:</strong> {viewTeacher.hire_date || "N/A"}
              </p>
              <p>
                <strong>Phone:</strong> {viewTeacher.phone || "N/A"}
              </p>
              <p>
                <strong>Email:</strong> {viewTeacher.email || "N/A"}
              </p>
              <p>
                <strong>Status:</strong> {viewTeacher.status}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTeacher(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Modal */}
      <Dialog
        open={!!editTeacherState}
        onOpenChange={() => setEditTeacherState(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
          </DialogHeader>

          {editTeacherState && (
            <form onSubmit={handleSubmitTeacherEdit} className="space-y-3">
              <div>
                <label className="text-sm">First Name</label>
                <Input
                  value={editTeacherState.first_name || ""}
                  onChange={(e) =>
                    setEditTeacherState({
                      ...editTeacherState,
                      first_name: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm">Last Name</label>
                <Input
                  value={editTeacherState.last_name || ""}
                  onChange={(e) =>
                    setEditTeacherState({
                      ...editTeacherState,
                      last_name: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm">Email</label>
                <Input
                  value={editTeacherState.email || ""}
                  onChange={(e) =>
                    setEditTeacherState({
                      ...editTeacherState,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm">Phone</label>
                <Input
                  value={editTeacherState.phone || ""}
                  onChange={(e) =>
                    setEditTeacherState({
                      ...editTeacherState,
                      phone: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm">Hire Date</label>
                <Input
                  type="date"
                  value={editTeacherState.hire_date || ""}
                  onChange={(e) =>
                    setEditTeacherState({
                      ...editTeacherState,
                      hire_date: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm">Status</label>
                <Input
                  value={editTeacherState.status || ""}
                  onChange={(e) =>
                    setEditTeacherState({
                      ...editTeacherState,
                      status: e.target.value,
                    })
                  }
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditTeacherState(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={editTeacherLoading}>
                  {editTeacherLoading ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Class Dialog */}
      <Dialog open={addClassDialogOpen} onOpenChange={setAddClassDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateClass} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Group Name *</label>
                <Input
                  placeholder="e.g., Mathematics"
                  value={newClass.subject_name}
                  onChange={(e) =>
                    setNewClass({ ...newClass, subject_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Assign Teacher *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={newClass.teacher_id}
                  onChange={(e) =>
                    setNewClass({ ...newClass, teacher_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select a teacher</option>
                  {teachersData.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name} -{" "}
                      {teacher.subject_specialization || "General"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Room Number</label>
                <Input
                  placeholder="e.g., Room 301"
                  value={newClass.room_number}
                  onChange={(e) =>
                    setNewClass({ ...newClass, room_number: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Day of Week</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={newClass.day_of_week}
                  onChange={(e) =>
                    setNewClass({ ...newClass, day_of_week: e.target.value })
                  }
                >
                  <option value="">Select day</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time</label>
                <Input
                  type="time"
                  value={newClass.start_time}
                  onChange={(e) =>
                    setNewClass({ ...newClass, start_time: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <Input
                  type="time"
                  value={newClass.end_time}
                  onChange={(e) =>
                    setNewClass({ ...newClass, end_time: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddClassDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={classLoading}>
                {classLoading ? "Creating..." : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Class Details Dialog */}
      <Dialog open={viewClassDialogOpen} onOpenChange={setViewClassDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Group Details</DialogTitle>
          </DialogHeader>
          {selectedClass && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Subject Name
                  </p>
                  <p className="text-base">
                    {selectedClass.subject_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Subject Code
                  </p>
                  <p className="text-base">
                    {selectedClass.subject_code || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Academic Year
                  </p>
                  <p className="text-base">
                    {selectedClass.academic_year || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Teacher
                  </p>
                  <p className="text-base">
                    {selectedClass.teacher_name || "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Room Number
                  </p>
                  <p className="text-base">
                    {selectedClass.room_number || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Day of Week
                  </p>
                  <p className="text-base">
                    {selectedClass.day_of_week || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Schedule
                  </p>
                  <p className="text-base">
                    {selectedClass.start_time && selectedClass.end_time
                      ? `${selectedClass.start_time} - ${selectedClass.end_time}`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewClassDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={editClassDialogOpen} onOpenChange={setEditClassDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          {selectedClass && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setClassLoading(true);
                  const response = await fetch("/api/classes", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(selectedClass),
                  });
                  const data = await response.json();
                  if (data.success) {
                    setEditClassDialogOpen(false);
                    fetchClasses();
                    setSelectedClass(null);
                  } else {
                    alert(data.error || "Failed to update group");
                  }
                } catch (error) {
                  console.error("Error updating class:", error);
                  alert("Failed to update group");
                } finally {
                  setClassLoading(false);
                }
              }}
            >
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject Name *</label>
                  <Input
                    placeholder="e.g., Mathematics"
                    value={selectedClass.subject_name}
                    onChange={(e) =>
                      setSelectedClass({
                        ...selectedClass,
                        subject_name: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject Code</label>
                  <Input
                    placeholder="e.g., MATH101"
                    value={selectedClass.subject_code || ""}
                    onChange={(e) =>
                      setSelectedClass({
                        ...selectedClass,
                        subject_code: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Academic Year</label>
                  <Input
                    placeholder="e.g., 2024-2025"
                    value={selectedClass.academic_year || ""}
                    onChange={(e) =>
                      setSelectedClass({
                        ...selectedClass,
                        academic_year: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Assign Teacher</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={selectedClass.teacher_id || ""}
                    onChange={(e) =>
                      setSelectedClass({
                        ...selectedClass,
                        teacher_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Select a teacher</option>
                    {teachersData.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name} -{" "}
                        {teacher.subject_specialization || "General"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Room Number</label>
                  <Input
                    placeholder="e.g., Room 301"
                    value={selectedClass.room_number || ""}
                    onChange={(e) =>
                      setSelectedClass({
                        ...selectedClass,
                        room_number: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Day of Week</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={selectedClass.day_of_week || ""}
                    onChange={(e) =>
                      setSelectedClass({
                        ...selectedClass,
                        day_of_week: e.target.value,
                      })
                    }
                  >
                    <option value="">Select day</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Time</label>
                  <Input
                    type="time"
                    value={selectedClass.start_time || ""}
                    onChange={(e) =>
                      setSelectedClass({
                        ...selectedClass,
                        start_time: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">End Time</label>
                  <Input
                    type="time"
                    value={selectedClass.end_time || ""}
                    onChange={(e) =>
                      setSelectedClass({
                        ...selectedClass,
                        end_time: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditClassDialogOpen(false);
                    setSelectedClass(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={classLoading}>
                  {classLoading ? "Updating..." : "Update Group"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
