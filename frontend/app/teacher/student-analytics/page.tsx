"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Search, Calendar, FileText, TrendingUp } from "lucide-react";

interface Student {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  user_id: string;
  enrollment_status: string;
  date_of_birth: string;
  gender: string;
  address: string;
  enrollment_date: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_notes: string | null;
  class_id: string;
  created_at: string;
}

interface AttendanceStats {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  excused_days: number;
  attendance_rate: number;
}

interface GradeStats {
  total_grades: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  grades_by_type: {
    [key: string]: {
      count: number;
      average: number;
    };
  };
}

export default function StudentAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [gradeStats, setGradeStats] = useState<GradeStats | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [recentGrades, setRecentGrades] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  const fetchStudentData = async (id: string) => {
    if (!id) {
      setError("Please enter a student ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Fetch student basic info
      const studentResponse = await fetch(`/api/students/${id}`);
      const studentData = await studentResponse.json();

      if (!studentData.success) {
        setError(studentData.error || "Student not found");
        setStudent(null);
        setLoading(false);
        return;
      }

      setStudent(studentData.student);

      // Fetch attendance statistics
      const attendanceResponse = await fetch(
        `/api/students/${id}/attendance-stats`
      );
      const attendanceData = await attendanceResponse.json();

      if (attendanceData.success) {
        setAttendanceStats(attendanceData.stats);
        setRecentAttendance(attendanceData.recent || []);
      }

      // Fetch grade statistics
      const gradesResponse = await fetch(`/api/students/${id}/grade-stats`);
      const gradesData = await gradesResponse.json();

      if (gradesData.success) {
        setGradeStats(gradesData.stats);
        setRecentGrades(gradesData.recent || []);
      }

      // Fetch student's classes
      const classesResponse = await fetch(`/api/students/${id}/classes`);
      const classesData = await classesResponse.json();

      if (classesData.success) {
        setClasses(classesData.classes || []);
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      setError("An error occurred while fetching student data");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchStudentData(studentId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/teacher/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Student Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Track student attendance, grades, and performance
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Student</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="student-search">Student ID or Code</Label>
                <Input
                  id="student-search"
                  placeholder="Enter student ID or code..."
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Student Information */}
        {student && (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-semibold text-lg">
                    {student.first_name} {student.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Student ID</p>
                  <p className="font-mono font-semibold">
                    {student.student_code}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{student.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-semibold">{student.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-semibold">
                    {student.date_of_birth
                      ? new Date(student.date_of_birth).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-semibold capitalize">
                    {student.gender || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Enrollment Status
                  </p>
                  <Badge
                    variant={
                      student.enrollment_status === "active"
                        ? "default"
                        : "secondary"
                    }
                    className={
                      student.enrollment_status === "active"
                        ? "bg-green-600"
                        : ""
                    }
                  >
                    {student.enrollment_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Enrollment Date
                  </p>
                  <p className="font-semibold">
                    {student.enrollment_date
                      ? new Date(
                          student.enrollment_date
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-semibold">{student.address || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Attendance Statistics */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Attendance Rate
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {attendanceStats?.attendance_rate?.toFixed(1) || 0}%
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Present</p>
                      <p className="font-semibold text-green-600">
                        {attendanceStats?.present_days || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Absent</p>
                      <p className="font-semibold text-red-600">
                        {attendanceStats?.absent_days || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Late</p>
                      <p className="font-semibold text-yellow-600">
                        {attendanceStats?.late_days || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Days</p>
                      <p className="font-semibold">
                        {attendanceStats?.total_days || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grade Statistics */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Grade
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {gradeStats?.average_score?.toFixed(1) || 0}%
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Highest</p>
                      <p className="font-semibold text-green-600">
                        {gradeStats?.highest_score?.toFixed(1) || 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lowest</p>
                      <p className="font-semibold text-red-600">
                        {gradeStats?.lowest_score?.toFixed(1) || 0}%
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Total Grades</p>
                      <p className="font-semibold">
                        {gradeStats?.total_grades || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enrolled Classes */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Enrolled Classes
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{classes.length}</div>
                  <div className="mt-4 space-y-2">
                    {classes.slice(0, 3).map((cls) => (
                      <div
                        key={cls.id}
                        className="text-sm p-2 bg-muted rounded"
                      >
                        <p className="font-semibold">{cls.subject_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cls.academic_year}
                        </p>
                      </div>
                    ))}
                    {classes.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{classes.length - 3} more classes
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Attendance */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                {recentAttendance.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No attendance records found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentAttendance.map((record, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-semibold">
                            {record.class_name || "Unknown Class"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(
                              record.attendance_date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            record.status === "present"
                              ? "default"
                              : record.status === "absent"
                              ? "destructive"
                              : "outline"
                          }
                          className={
                            record.status === "present"
                              ? "bg-green-600"
                              : record.status === "late"
                              ? "bg-yellow-600 text-white"
                              : ""
                          }
                        >
                          {record.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Grades */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Grades</CardTitle>
              </CardHeader>
              <CardContent>
                {recentGrades.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No grades found
                  </p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Assessment</th>
                        <th className="text-center p-3">Type</th>
                        <th className="text-center p-3">Score</th>
                        <th className="text-center p-3">Percentage</th>
                        <th className="text-left p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentGrades.map((grade, index) => {
                        const percentage = (
                          (grade.score / grade.max_score) *
                          100
                        ).toFixed(1);
                        const percentageColor =
                          parseFloat(percentage) >= 80
                            ? "text-green-600"
                            : parseFloat(percentage) >= 60
                            ? "text-yellow-600"
                            : "text-red-600";
                        return (
                          <tr key={index} className="border-b hover:bg-muted/30">
                            <td className="p-3">{grade.notes || "Assessment"}</td>
                            <td className="p-3 text-center">
                              <Badge variant="outline">
                                {grade.assessment_type}
                              </Badge>
                            </td>
                            <td className="p-3 text-center font-semibold">
                              {grade.score}/{grade.max_score}
                            </td>
                            <td className={`p-3 text-center font-bold ${percentageColor}`}>
                              {percentage}%
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {new Date(
                                grade.assessment_date || grade.created_at
                              ).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!student && !loading && !error && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">
                  Enter a student ID to view analytics and tracking data
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
