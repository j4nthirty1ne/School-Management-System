"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  BookOpen,
  TrendingUp,
  ChevronDown,
  Eye,
  Plus,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Student {
  id: string;
  student_code: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  enrollment_status: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  class_id?: string;
}

interface Enrollment {
  id: string;
  subject_classes: {
    id: string;
    subjects: {
      subject_name: string;
      subject_code: string;
    };
    teachers: {
      user_profiles: {
        first_name: string;
        last_name: string;
      };
    };
    schedule?: string;
    room_number?: string;
    day_of_week?: string;
    start_time?: string;
    end_time?: string;
  };
  enrollment_status: string;
  enrolled_at: string;
}

interface Class {
  id: string;
  subject_name?: string;
  subject_code?: string;
  room_number?: string;
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
  academic_year?: string;
  teacher_id?: string;
  teacher_name?: string;
  teacher_first_name?: string;
  teacher_last_name?: string;
  section?: string;
  semester?: string;
}

export function StudentDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    role: string;
  } | null>(null);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAdmin && selectedStudent) {
      loadStudentEnrollments(selectedStudent.user_id);
    } else if (!isAdmin && currentUser) {
      loadMyEnrollments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, selectedStudent, currentUser]);

  const loadCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/user");
      const data = await res.json();
      console.log("Current user:", data);
      if (data.success && data.user) {
        setCurrentUser(data.user);
        const userIsAdmin = data.user.role === "admin";
        setIsAdmin(userIsAdmin);

        if (userIsAdmin) {
          loadStudents();
        } else {
          loadMyEnrollments();
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      console.log("Students API response:", data);
      if (data.success && data.students) {
        setStudents(data.students);
        if (data.students.length > 0) {
          setSelectedStudent(data.students[0]);
        }
      }
    } catch (error) {
      console.error("Error loading students:", error);
    }
  };

  const loadStudentEnrollments = async (userId: string) => {
    try {
      console.log("Loading enrollments for student:", userId);
      // Get student ID first
      const studentsRes = await fetch("/api/students");
      const studentsData = await studentsRes.json();

      if (studentsData.success && studentsData.students) {
        const student = studentsData.students.find(
          (s: Student) => s.user_id === userId
        );

        if (student) {
          // Get enrollments from class_students table
          const res = await fetch(
            `/api/class-enrollments?student_id=${student.id}`
          );
          const data = await res.json();
          console.log("Student enrollments:", data);

          if (data.success && data.enrollments) {
            // Convert to display format
            const formattedEnrollments = data.enrollments.map(
              (enrollment: any) => {
                // Get teacher info from API response
                const teacherFirstName =
                  enrollment.classes?.teachers?.user_profiles?.first_name || "";
                const teacherLastName =
                  enrollment.classes?.teachers?.user_profiles?.last_name || "";

                return {
                  id: enrollment.id,
                  subject_classes: {
                    id: enrollment.classes.id,
                    subjects: {
                      subject_name: enrollment.classes.subject_name,
                      subject_code: enrollment.classes.subject_code,
                    },
                    teachers: {
                      user_profiles: {
                        first_name: teacherFirstName,
                        last_name: teacherLastName,
                      },
                    },
                    room_number: enrollment.classes.room_number,
                    day_of_week: enrollment.classes.day_of_week,
                    start_time: enrollment.classes.start_time,
                    end_time: enrollment.classes.end_time,
                  },
                  enrollment_status: enrollment.status || "active",
                  enrolled_at: enrollment.enrolled_at,
                };
              }
            );
            setEnrollments(formattedEnrollments);
            return;
          }
        }
      }
      setEnrollments([]);
    } catch (error) {
      console.error("Error loading enrollments:", error);
      setEnrollments([]);
    }
  };

  const loadMyEnrollments = async () => {
    try {
      if (!currentUser) return;
      // Get my student record
      const studentsRes = await fetch("/api/students");
      const studentsData = await studentsRes.json();

      if (studentsData.success && studentsData.students) {
        const myStudent = studentsData.students.find(
          (s: Student) => s.user_id === currentUser.id
        );

        if (myStudent) {
          // Get enrollments from class_students table
          const res = await fetch(
            `/api/class-enrollments?student_id=${myStudent.id}`
          );
          const data = await res.json();
          console.log("My enrollments:", data);

          if (data.success && data.enrollments) {
            // Convert to display format
            const formattedEnrollments = data.enrollments.map(
              (enrollment: any) => {
                // Get teacher info from API response
                const teacherFirstName =
                  enrollment.classes?.teachers?.user_profiles?.first_name || "";
                const teacherLastName =
                  enrollment.classes?.teachers?.user_profiles?.last_name || "";

                return {
                  id: enrollment.id,
                  subject_classes: {
                    id: enrollment.classes.id,
                    subjects: {
                      subject_name: enrollment.classes.subject_name || "",
                      subject_code: enrollment.classes.subject_code || "",
                    },
                    teachers: {
                      user_profiles: {
                        first_name: teacherFirstName,
                        last_name: teacherLastName,
                      },
                    },
                    room_number: enrollment.classes.room_number,
                    day_of_week: enrollment.classes.day_of_week,
                    start_time: enrollment.classes.start_time,
                    end_time: enrollment.classes.end_time,
                  },
                  enrollment_status: enrollment.status || "active",
                  enrolled_at: enrollment.enrolled_at,
                };
              }
            );
            setEnrollments(formattedEnrollments);
            return;
          }
        }
      }
      setEnrollments([]);
    } catch (error) {
      console.error("Error loading enrollments:", error);
    }
  };

  const loadAvailableClasses = async () => {
    try {
      // Use the classes API which shows the actual classes in the admin dashboard
      const res = await fetch("/api/classes");
      const data = await res.json();
      console.log("Available classes:", data);
      if (data.success && data.classes) {
        setAvailableClasses(data.classes);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
    }
  };

  const handleEnrollClass = async (classId: string) => {
    try {
      setEnrolling(true);
      // Use the actual student.id, not user_id
      const studentId = isAdmin && selectedStudent ? selectedStudent.id : null;

      // If not admin, we need to get the student id from current user
      let finalStudentId = studentId;
      if (!isAdmin && currentUser) {
        // Fetch student record for current user
        const studentsRes = await fetch("/api/students");
        const studentsData = await studentsRes.json();
        if (studentsData.success && studentsData.students) {
          const myStudent = studentsData.students.find(
            (s: Student) => s.user_id === currentUser.id
          );
          if (myStudent) {
            finalStudentId = myStudent.id;
          }
        }
      }

      if (!finalStudentId) {
        alert("Student record not found");
        return;
      }

      // Create enrollment in class_students table
      const res = await fetch("/api/class-enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: finalStudentId,
          class_id: classId,
        }),
      });

      const data = await res.json();
      console.log("Enrollment response:", data);
      if (data.success) {
        // Reload enrollments
        if (isAdmin && selectedStudent) {
          loadStudentEnrollments(selectedStudent.user_id);
        } else {
          loadMyEnrollments();
        }
        setEnrollDialogOpen(false);
        setSearchQuery("");
      } else {
        alert(data.error || "Failed to enroll in class");
      }
    } catch (error) {
      console.error("Error enrolling:", error);
      alert("Failed to enroll in class");
    } finally {
      setEnrolling(false);
    }
  };

  const openEnrollDialog = () => {
    loadAvailableClasses();
    setEnrollDialogOpen(true);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  };

  const activeEnrollments = enrollments.filter(
    (e) => e.enrollment_status === "active"
  );

  const enrolledClassIds = new Set(
    enrollments.map((e) => e.subject_classes?.id).filter(Boolean)
  );

  const filteredClasses = availableClasses.filter((cls) => {
    const matchesSearch =
      cls.subject_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.subject_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.teacher_first_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      cls.teacher_last_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      cls.section?.toLowerCase().includes(searchQuery.toLowerCase());
    const notEnrolled = !enrolledClassIds.has(cls.id);
    return matchesSearch && notEnrolled;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">
            {isAdmin ? "Student Dashboard (Admin View)" : "Student Dashboard"}
          </h2>
          <p className="text-muted-foreground">
            {isAdmin
              ? "View and track student information"
              : "Track your academic progress"}
          </p>
        </div>

        <div className="flex gap-2">
          {(isAdmin || currentUser?.role === "student") && (
            <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openEnrollDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Enroll in Class
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Enroll in Class</DialogTitle>
                  <DialogDescription>
                    {isAdmin && selectedStudent
                      ? `Enroll ${selectedStudent.first_name} ${selectedStudent.last_name} in a class`
                      : "Select a class to enroll in"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="search">Search Classes</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by subject name, code, or teacher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {filteredClasses.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No available classes found</p>
                      </div>
                    ) : (
                      filteredClasses.map((cls) => (
                        <div
                          key={cls.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold">
                                {cls.subject_name || "Unnamed Class"}
                              </h3>
                              {cls.subject_code && (
                                <Badge
                                  variant="outline"
                                  className="font-mono text-xs"
                                >
                                  {cls.subject_code}
                                </Badge>
                              )}
                              {cls.section && (
                                <Badge variant="secondary" className="text-xs">
                                  Section {cls.section}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {(cls.teacher_name ||
                                (cls.teacher_first_name &&
                                  cls.teacher_last_name)) && (
                                <span>
                                  Teacher:{" "}
                                  {cls.teacher_name ||
                                    `${cls.teacher_first_name} ${cls.teacher_last_name}`}
                                </span>
                              )}
                              {cls.room_number && (
                                <span>Room {cls.room_number}</span>
                              )}
                              {cls.day_of_week &&
                                cls.start_time &&
                                cls.end_time && (
                                  <span>
                                    {cls.day_of_week} • {cls.start_time} -{" "}
                                    {cls.end_time}
                                  </span>
                                )}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleEnrollClass(cls.id)}
                            disabled={enrolling}
                            size="sm"
                          >
                            {enrolling ? "Enrolling..." : "Enroll"}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {isAdmin && selectedStudent && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getInitials(
                        selectedStudent.first_name,
                        selectedStudent.last_name
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {students.map((student) => (
                  <DropdownMenuItem
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className="flex items-center gap-3 p-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(student.first_name, student.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {student.student_code}
                      </p>
                    </div>
                    {selectedStudent?.id === student.id && (
                      <Eye className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {isAdmin && selectedStudent && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {getInitials(
                    selectedStudent.first_name,
                    selectedStudent.last_name
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedStudent.student_code}
                    </p>
                  </div>
                  <Badge
                    variant={
                      selectedStudent.enrollment_status === "active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedStudent.enrollment_status}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Gender:</span>
                    <p className="font-medium">
                      {selectedStudent.gender || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Date of Birth:
                    </span>
                    <p className="font-medium">
                      {selectedStudent.date_of_birth || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">
                      {selectedStudent.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Enrolled Classes:
                    </span>
                    <p className="font-medium">{activeEnrollments.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{activeEnrollments.length}</div>
            <p className="text-sm text-muted-foreground">Enrolled Classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {isAdmin && students.length > 0 ? students.length : "-"}
            </div>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "Total Students" : "Attendance Rate"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {
                activeEnrollments.filter((e) => e.subject_classes?.day_of_week)
                  .length
              }
            </div>
            <p className="text-sm text-muted-foreground">Scheduled Classes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isAdmin && selectedStudent
              ? `${selectedStudent.first_name}'s Classes`
              : "My Classes"}
          </CardTitle>
          <CardDescription>
            {isAdmin
              ? "View student's enrolled classes"
              : "Your enrolled classes and schedule"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeEnrollments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No classes enrolled yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">
                        {enrollment.subject_classes?.subjects?.subject_name ||
                          "Unknown Subject"}
                      </h3>
                      {enrollment.subject_classes?.subjects?.subject_code && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {enrollment.subject_classes.subjects.subject_code}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      {(enrollment.subject_classes?.teachers?.user_profiles
                        ?.first_name ||
                        enrollment.subject_classes?.teachers?.user_profiles
                          ?.last_name) && (
                        <span>
                          Teacher:{" "}
                          {
                            enrollment.subject_classes.teachers.user_profiles
                              .first_name
                          }{" "}
                          {
                            enrollment.subject_classes.teachers.user_profiles
                              .last_name
                          }
                        </span>
                      )}
                      {enrollment.subject_classes?.room_number && (
                        <span>
                          Room {enrollment.subject_classes.room_number}
                        </span>
                      )}
                      {enrollment.subject_classes?.day_of_week &&
                        enrollment.subject_classes?.start_time &&
                        enrollment.subject_classes?.end_time && (
                          <span>
                            {enrollment.subject_classes.day_of_week} •{" "}
                            {enrollment.subject_classes.start_time} -{" "}
                            {enrollment.subject_classes.end_time}
                          </span>
                        )}
                    </div>
                  </div>
                  {!isAdmin && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignments & Quizzes</CardTitle>
          <CardDescription>View your assignments and quizzes</CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No assignments yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{assignment.title}</h3>
                      <Badge
                        variant={
                          assignment.type === "quiz" ? "secondary" : "outline"
                        }
                        className="text-xs capitalize"
                      >
                        {assignment.type}
                      </Badge>
                      {assignment.status === "active" && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {assignment.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {assignment.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due:{" "}
                          {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                      )}
                      <span>Max Score: {assignment.max_score}</span>
                      {assignment.instructions && (
                        <span className="text-xs">
                          📝 {assignment.instructions}
                        </span>
                      )}
                    </div>
                    {assignment.file_url && (
                      <div className="mt-2">
                        <a
                          href={assignment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          📎 {assignment.file_name || "View Attachment"}
                        </a>
                      </div>
                    )}
                  </div>
                  {!isAdmin && (
                    <div className="flex flex-col gap-2 ml-4">
                      <Button size="sm">Submit</Button>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
