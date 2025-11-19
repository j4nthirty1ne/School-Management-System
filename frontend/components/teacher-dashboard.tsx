"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  BookOpen,
  Users,
  ChevronDown,
  Eye,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Teacher {
  id: string;
  teacher_code: string;
  user_id: string;
  first_name: string;
  last_name: string;
  subject_specialization: string;
  status: string;
  phone?: string;
  email?: string;
}

interface Class {
  id: string;
  subject_name: string;
  subject_code?: string;
  room_number?: string;
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
  academic_year?: string;
  teacher_id?: string;
}

export function TeacherDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    loadCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAdmin && selectedTeacher) {
      loadTeacherClasses(selectedTeacher.id);
    } else if (!isAdmin && currentUser) {
      loadMyClasses();
    }
  }, [isAdmin, selectedTeacher, currentUser]);

  const loadCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/user");
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        const userIsAdmin = data.user.role === "admin";
        setIsAdmin(userIsAdmin);

        if (userIsAdmin) {
          loadTeachers();
        } else {
          loadMyClasses();
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const res = await fetch("/api/teachers");
      const data = await res.json();
      console.log("Teachers API response:", data);
      if (data.success && data.teachers) {
        setTeachers(data.teachers);
        if (data.teachers.length > 0) {
          setSelectedTeacher(data.teachers[0]);
        }
      }
    } catch (error) {
      console.error("Error loading teachers:", error);
    }
  };

  const loadTeacherClasses = async (teacherId: string) => {
    try {
      console.log("Loading classes for teacher:", teacherId);
      // Get all classes and filter by teacher_id on the client side
      const res = await fetch("/api/classes");
      const data = await res.json();
      console.log("All classes:", data);
      if (data.success && data.classes) {
        // Filter classes for the selected teacher
        const teacherClasses = data.classes.filter(
          (cls: Class & { teacher_id?: string }) => cls.teacher_id === teacherId
        );
        console.log("Filtered classes for teacher:", teacherClasses);
        setClasses(teacherClasses);
      } else {
        setClasses([]);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
      setClasses([]);
    }
  };

  const loadMyClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  };

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
            {isAdmin ? "Teacher Dashboard (Admin View)" : "Teacher Dashboard"}
          </h2>
          <p className="text-muted-foreground">
            {isAdmin
              ? "View and track teacher information"
              : "Manage your classes and students"}
          </p>
        </div>

        {isAdmin && selectedTeacher && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(
                      selectedTeacher.first_name,
                      selectedTeacher.last_name
                    )}
                  </AvatarFallback>
                </Avatar>
                <span>
                  {selectedTeacher.first_name} {selectedTeacher.last_name}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {teachers.map((teacher) => (
                <DropdownMenuItem
                  key={teacher.id}
                  onClick={() => setSelectedTeacher(teacher)}
                  className="flex items-center gap-3 p-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(teacher.first_name, teacher.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {teacher.first_name} {teacher.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {teacher.subject_specialization || "General"}
                    </p>
                  </div>
                  {selectedTeacher?.id === teacher.id && (
                    <Eye className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {isAdmin && selectedTeacher && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {getInitials(
                    selectedTeacher.first_name,
                    selectedTeacher.last_name
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedTeacher.first_name} {selectedTeacher.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedTeacher.teacher_code}
                    </p>
                  </div>
                  <Badge
                    variant={
                      selectedTeacher.status === "active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedTeacher.status}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Specialization:
                    </span>
                    <p className="font-medium">
                      {selectedTeacher.subject_specialization || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">
                      {selectedTeacher.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">
                      {selectedTeacher.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Total Classes:
                    </span>
                    <p className="font-medium">{classes.length}</p>
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
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-sm text-muted-foreground">Active Classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {classes.filter((c) => c.day_of_week).length}
            </div>
            <p className="text-sm text-muted-foreground">Scheduled Classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {isAdmin && teachers.length > 0 ? teachers.length : "-"}
            </div>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "Total Teachers" : "Total Students"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isAdmin && selectedTeacher
              ? `${selectedTeacher.first_name}'s Classes`
              : "My Classes"}
          </CardTitle>
          <CardDescription>
            {isAdmin
              ? "View and track teacher's assigned classes"
              : "View and manage your assigned classes"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No classes assigned yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">{cls.subject_name}</h3>
                      {cls.subject_code && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {cls.subject_code}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {cls.room_number && <span>Room {cls.room_number}</span>}
                      {cls.day_of_week && cls.start_time && cls.end_time && (
                        <span>
                          {cls.day_of_week} • {cls.start_time} - {cls.end_time}
                        </span>
                      )}
                      {cls.academic_year && <span>{cls.academic_year}</span>}
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
    </div>
  );
}
