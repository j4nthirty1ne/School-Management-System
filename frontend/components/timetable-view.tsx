"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  User,
  BookOpen,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubjectClass {
  id: string;
  subject_id: string;
  subject_name?: string;
  subject_code?: string;
  teacher_id: string;
  teacher_name?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_number: string;
  class_type: string;
  section: string;
  academic_year: string;
  semester: string;
  join_code: string;
}

interface TimetableViewProps {
  userId?: string; // Teacher ID or Student ID
  userType: "teacher" | "student";
  showJoinCode?: boolean;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function TimetableView({
  userId,
  userType,
  showJoinCode = false,
}: TimetableViewProps) {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<SubjectClass[]>([]);
  const [error, setError] = useState("");
  const [academicYear] = useState("2024-2025");

  useEffect(() => {
    fetchTimetable();
  }, [userId, userType]);

  const fetchTimetable = async () => {
    setLoading(true);
    setError("");

    try {
      let url = `/api/subject-classes?academic_year=${academicYear}`;

      if (userType === "teacher" && userId) {
        url += `&teacher_id=${userId}`;
      }
      // For students, we would need to fetch enrolled classes
      // This would require an additional API endpoint or query parameter

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setClasses(data.classes || []);
      } else {
        setError(data.error || "Failed to fetch timetable");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getClassTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      lecture: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      practice: "bg-green-500/10 text-green-700 dark:text-green-400",
      lab: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
      tutorial: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    };
    return (
      colors[type.toLowerCase()] ||
      "bg-gray-500/10 text-gray-700 dark:text-gray-400"
    );
  };

  // Group classes by day
  const classesByDay = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = classes
      .filter((c) => c.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    return acc;
  }, {} as Record<string, SubjectClass[]>);

  const totalClasses = classes.length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading timetable...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {userType === "teacher"
                  ? "My Teaching Schedule"
                  : "My Class Schedule"}
              </CardTitle>
              <CardDescription>{academicYear} Academic Year</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <BookOpen className="h-3 w-3" />
                {totalClasses} {totalClasses === 1 ? "Class" : "Classes"}
              </Badge>
              <Button variant="outline" size="sm" onClick={fetchTimetable}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Timetable Grid */}
      {totalClasses === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">
              {userType === "teacher"
                ? "No classes assigned yet"
                : "No classes enrolled yet"}
            </p>
            {userType === "student" && (
              <p className="text-sm text-muted-foreground">
                Use a join code to enroll in classes
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {DAYS_OF_WEEK.map((day) => (
            <Card key={day}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span>{day}</span>
                  {classesByDay[day].length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {classesByDay[day].length}{" "}
                      {classesByDay[day].length === 1 ? "class" : "classes"}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {classesByDay[day].length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No classes scheduled
                  </p>
                ) : (
                  <div className="space-y-3">
                    {classesByDay[day].map((item) => (
                      <div
                        key={item.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            {/* Subject and Section */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-base">
                                {item.subject_name || "Subject"}
                              </h4>
                              {item.subject_code && (
                                <Badge variant="outline" className="text-xs">
                                  {item.subject_code}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {item.section}
                              </Badge>
                              <Badge
                                className={`text-xs ${getClassTypeColor(
                                  item.class_type
                                )}`}
                              >
                                {item.class_type}
                              </Badge>
                            </div>

                            {/* Class Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {formatTime(item.start_time)} -{" "}
                                  {formatTime(item.end_time)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>Room {item.room_number}</span>
                              </div>

                              {userType === "student" && item.teacher_name && (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span>{item.teacher_name}</span>
                                </div>
                              )}
                            </div>

                            {/* Join Code for Teachers */}
                            {showJoinCode && userType === "teacher" && (
                              <div className="flex items-center gap-2 pt-2">
                                <span className="text-sm text-muted-foreground">
                                  Join Code:
                                </span>
                                <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                                  {item.join_code}
                                </code>
                              </div>
                            )}

                            {/* Semester Info */}
                            <div className="text-xs text-muted-foreground pt-1">
                              {item.semester}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Weekly Summary */}
      {totalClasses > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span className="text-sm font-medium">
                    {day.substring(0, 3)}
                  </span>
                  <Badge variant="secondary">{classesByDay[day].length}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
