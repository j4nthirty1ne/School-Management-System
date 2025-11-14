"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, BookOpen, TrendingUp } from "lucide-react"

export function StudentDashboard() {
  const upcomingClasses = [
    { subject: "Mathematics", time: "9:00 AM - 10:00 AM", teacher: "Dr. Sarah Miller" },
    { subject: "Physics", time: "10:30 AM - 11:30 AM", teacher: "Prof. John Wilson" },
    { subject: "English", time: "1:00 PM - 2:00 PM", teacher: "Ms. Emily Taylor" },
  ]

  const recentGrades = [
    { subject: "Mathematics", grade: "A", score: "95%" },
    { subject: "Physics", grade: "B+", score: "88%" },
    { subject: "Chemistry", grade: "A-", score: "92%" },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Student Dashboard</h2>
        <p className="text-muted-foreground">Track your academic progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">96%</div>
            <p className="text-sm text-muted-foreground">Attendance Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">A</div>
            <p className="text-sm text-muted-foreground">Overall Grade</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">8</div>
            <p className="text-sm text-muted-foreground">Classes This Week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Your upcoming classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingClasses.map((cls, idx) => (
                <div key={idx} className="flex items-start gap-4 p-3 border border-border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{cls.subject}</h3>
                    <p className="text-sm text-muted-foreground">{cls.time}</p>
                    <p className="text-sm text-muted-foreground">{cls.teacher}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Grades</CardTitle>
            <CardDescription>Your latest assessment results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentGrades.map((grade, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{grade.subject}</h3>
                    <p className="text-sm text-muted-foreground">{grade.score}</p>
                  </div>
                  <div className="text-2xl font-bold text-primary">{grade.grade}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
