"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminDashboard } from "@/components/admin-dashboard"
import { TeacherDashboard } from "@/components/teacher-dashboard"
import { StudentDashboard } from "@/components/student-dashboard"
import { ParentDashboard } from "@/components/parent-dashboard"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { GraduationCap, Users, BookOpen, UserCircle, LogOut } from "lucide-react"
import LightRays from "@/components/LightRays"
import { useTheme } from "next-themes"

type Role = "admin" | "teacher" | "student" | "parent"

export default function DashboardPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const { theme } = useTheme()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (!selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        {/* LightRays Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <LightRays
            raysOrigin="top-center"
            raysColor={theme === "light" ? "#6B7280" : "#B19EEF"}
            raysSpeed={1.5}
            lightSpread={0.8}
            rayLength={1.2}
            followMouse={true}
            mouseInfluence={0.1}
            noiseAmount={0.1}
            distortion={0.05}
          />
        </div>

        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>

        <div className="max-w-4xl w-full relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-3 text-balance">School Management System</h1>
            <p className="text-muted-foreground text-lg">Select your role to continue</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedRole("admin")}
              className="group relative overflow-hidden rounded-lg border border-border bg-card p-8 text-left transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Administrator</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage students, teachers, timetables, and generate reports
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Student & teacher management</li>
                    <li>• Timetable scheduling</li>
                    <li>• Performance reports</li>
                  </ul>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole("teacher")}
              className="group relative overflow-hidden rounded-lg border border-border bg-card p-8 text-left transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Teacher</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track attendance, upload grades, and post announcements
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Mark attendance</li>
                    <li>• Upload grades & results</li>
                    <li>• Post announcements</li>
                  </ul>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole("student")}
              className="group relative overflow-hidden rounded-lg border border-border bg-card p-8 text-left transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Student</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    View attendance, timetable, results, and announcements
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• View attendance history</li>
                    <li>• Check timetable & results</li>
                    <li>• Receive updates</li>
                  </ul>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole("parent")}
              className="group relative overflow-hidden rounded-lg border border-border bg-card p-8 text-left transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                  <UserCircle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Parent</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Monitor your child's attendance, grades, and progress
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Monitor attendance</li>
                    <li>• View grades & progress</li>
                    <li>• Receive communications</li>
                  </ul>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">School Management System</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => setSelectedRole(null)}>
              Change Role
            </Button>
            <Button variant="outline" onClick={handleLogout} className="text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {selectedRole === "admin" && <AdminDashboard />}
      {selectedRole === "teacher" && <TeacherDashboard />}
      {selectedRole === "student" && <StudentDashboard />}
      {selectedRole === "parent" && <ParentDashboard />}
    </div>
  )
}
