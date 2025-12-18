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
  TrendingUp,
  BookOpen,
  ChevronDown,
  Eye,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    room_number?: string;
    day_of_week?: string;
    start_time?: string;
    end_time?: string;
  };
  enrollment_status: string;
  enrolled_at: string;
}

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  status: string;
  class_id: string;
  subject_name?: string;
}

interface GradeRecord {
  id: string;
  score: number;
  max_score: number;
  grade_type: string;
  grade_date: string;
  class_id: string;
  subject_name?: string;
  notes?: string;
}

export function ParentDashboard() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [attendanceRate, setAttendanceRate] = useState<string>("-");

  useEffect(() => {
    loadCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentEnrollments(selectedStudent.id);
      loadStudentAttendance(selectedStudent.id);
      loadStudentGrades(selectedStudent.id);
    }
  }, [selectedStudent]);

  const loadCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/user");
      const data = await res.json();
      if (data.success && data.user) {
        loadStudents();
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

  const loadStudentEnrollments = async (studentId: string) => {
    try {
      const res = await fetch(`/api/class-enrollments?student_id=${studentId}`);
      const data = await res.json();
      console.log("Student enrollments:", data);

      if (data.success && data.enrollments) {
        const formattedEnrollments = data.enrollments.map((enrollment: any) => {
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
        });
        setEnrollments(formattedEnrollments);
      } else {
        setEnrollments([]);
      }
    } catch (error) {
      console.error("Error loading enrollments:", error);
      setEnrollments([]);
    }
  };

  const loadStudentAttendance = async (studentId: string) => {
    try {
      const res = await fetch(`/api/attendance?student_id=${studentId}`);
      const data = await res.json();
      console.log("Student attendance:", data);

      if (data.success && data.attendance) {
        setAttendance(data.attendance);

        // Calculate attendance rate
        const total = data.attendance.length;
        if (total > 0) {
          const present = data.attendance.filter(
            (a: AttendanceRecord) => a.status === "present"
          ).length;
          const rate = ((present / total) * 100).toFixed(1);
          setAttendanceRate(`${rate}%`);
        } else {
          setAttendanceRate("-");
        }
      } else {
        setAttendance([]);
        setAttendanceRate("-");
      }
    } catch (error) {
      console.error("Error loading attendance:", error);
      setAttendance([]);
      setAttendanceRate("-");
    }
  };

  const loadStudentGrades = async (studentId: string) => {
    try {
      const res = await fetch(`/api/grades?student_id=${studentId}`);
      const data = await res.json();
      console.log("Student grades:", data);

      if (data.success && data.grades) {
        setGrades(data.grades);
      } else {
        setGrades([]);
      }
    } catch (error) {
      console.error("Error loading grades:", error);
      setGrades([]);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  };

  const activeEnrollments = enrollments.filter(
    (e) => e.enrollment_status === "active"
  );

  const calculateAverageGrade = () => {
    if (grades.length === 0) return "-";
    const total = grades.reduce(
      (sum, g) => sum + (g.score / g.max_score) * 100,
      0
    );
    return `${(total / grades.length).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <User className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
          <p className="text-muted-foreground">
            No student records are linked to your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Parent Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor your child&apos;s academic progress
          </p>
        </div>

        {students.length > 1 && selectedStudent && (
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

      {selectedStudent && (
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
            <div className="text-2xl font-bold">{attendanceRate}</div>
            <p className="text-sm text-muted-foreground">Attendance Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{calculateAverageGrade()}</div>
            <p className="text-sm text-muted-foreground">Average Grade</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Enrolled Classes</CardTitle>
            <CardDescription>View class schedule and teachers</CardDescription>
          </CardHeader>
          <CardContent>
            {activeEnrollments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No classes enrolled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">
                        {enrollment.subject_classes?.subjects?.subject_name ||
                          "Unknown"}
                      </h3>
                      {enrollment.subject_classes?.subjects?.subject_code && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {enrollment.subject_classes.subjects.subject_code}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {(enrollment.subject_classes?.teachers?.user_profiles
                        ?.first_name ||
                        enrollment.subject_classes?.teachers?.user_profiles
                          ?.last_name) && (
                        <p>
                          Teacher:{" "}
                          {
                            enrollment.subject_classes.teachers.user_profiles
                              .first_name
                          }{" "}
                          {
                            enrollment.subject_classes.teachers.user_profiles
                              .last_name
                          }
                        </p>
                      )}
                      {enrollment.subject_classes?.room_number && (
                        <p>Room {enrollment.subject_classes.room_number}</p>
                      )}
                      {enrollment.subject_classes?.day_of_week &&
                        enrollment.subject_classes?.start_time &&
                        enrollment.subject_classes?.end_time && (
                          <p>
                            {enrollment.subject_classes.day_of_week} •{" "}
                            {enrollment.subject_classes.start_time} -{" "}
                            {enrollment.subject_classes.end_time}
                          </p>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>View attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            {attendance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No attendance records</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attendance.slice(0, 10).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {record.subject_name || "Class"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.attendance_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        record.status === "present"
                          ? "default"
                          : record.status === "late"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {record.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Grades</CardTitle>
          <CardDescription>View academic performance</CardDescription>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No grades recorded</p>
            </div>
          ) : (
            <div className="space-y-3">
              {grades.map((grade) => (
                <div
                  key={grade.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">
                        {grade.subject_name || "Subject"}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {grade.grade_type}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{new Date(grade.grade_date).toLocaleDateString()}</p>
                      {grade.notes && (
                        <p className="text-xs mt-1">{grade.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {grade.score}/{grade.max_score}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {((grade.score / grade.max_score) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
