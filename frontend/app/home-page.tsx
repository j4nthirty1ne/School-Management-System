import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { GraduationCap, Users, BookOpen, Shield, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-4 text-balance">School Management System</h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty">
            A comprehensive platform for managing students, teachers, attendance, grades, and school communications all
            in one place
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/login">
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register-user">Create Account</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="rounded-lg bg-primary/10 p-3 w-fit mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Admin Portal</h3>
            <p className="text-sm text-muted-foreground">
              Manage students, teachers, timetables, and generate comprehensive reports
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="rounded-lg bg-primary/10 p-3 w-fit mb-4">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Teacher Tools</h3>
            <p className="text-sm text-muted-foreground">
              Track attendance, upload grades, and communicate with students and parents
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="rounded-lg bg-primary/10 p-3 w-fit mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Student Access</h3>
            <p className="text-sm text-muted-foreground">
              View attendance, timetables, grades, and receive important announcements
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="rounded-lg bg-primary/10 p-3 w-fit mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Parent Portal</h3>
            <p className="text-sm text-muted-foreground">
              Monitor your child's progress, attendance, and stay connected with teachers
            </p>
          </div>
        </div>

        <div className="mt-16 max-w-3xl mx-auto rounded-lg border border-border bg-card p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-1 mt-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Attendance Tracking</h4>
                <p className="text-sm text-muted-foreground">Real-time attendance monitoring and reporting</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-1 mt-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Grade Management</h4>
                <p className="text-sm text-muted-foreground">Easy grade entry and performance analytics</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-1 mt-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Timetable Scheduling</h4>
                <p className="text-sm text-muted-foreground">Automated scheduling and conflict detection</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-1 mt-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Communication Hub</h4>
                <p className="text-sm text-muted-foreground">Announcements and direct messaging system</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
