"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, BookOpen, Users, Bell } from "lucide-react";

export function TeacherDashboard() {
  const classes = [
    {
      id: "C001",
      name: "Mathematics 10-A",
      students: 28,
      time: "Mon, Wed, Fri 9:00 AM",
    },
    {
      id: "C002",
      name: "Mathematics 10-B",
      students: 32,
      time: "Tue, Thu 10:00 AM",
    },
    {
      id: "C003",
      name: "Advanced Math 11-A",
      students: 24,
      time: "Mon, Wed 2:00 PM",
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Teacher Dashboard</h2>
        <p className="text-muted-foreground">Manage your groups and students</p>
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
            <div className="text-2xl font-bold">3</div>
            <p className="text-sm text-muted-foreground">Active Groups</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">15</div>
            <p className="text-sm text-muted-foreground">Groups This Week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">78</div>
            <p className="text-sm text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
<<<<<<< HEAD
          <CardTitle>My Groups</CardTitle>
          <CardDescription>
            View and manage your assigned groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div>
                  <h3 className="font-semibold">{cls.name}</h3>
                  <p className="text-sm text-muted-foreground">
          <CardTitle>My Groups</CardTitle>
          <CardDescription>
            View and manage your assigned groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div>
                  <h3 className="font-semibold">{cls.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {cls.students} students • {cls.time}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Mark Attendance
                  </Button>
                  <Button variant="outline" size="sm">
                    Upload Grades
                  </Button>
                </div>
              </div>
            ))}
          </div>