"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, TrendingUp, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ParentDashboard() {
  const children = [
    { name: "Emma Davis", class: "10-A", attendance: "98%", grade: "A+", alerts: 0 },
    { name: "James Davis", class: "8-B", attendance: "94%", grade: "A", alerts: 1 },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Parent Dashboard</h2>
        <p className="text-muted-foreground">Monitor your children's academic progress</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {children.map((child, idx) => (
          <Card key={idx}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{child.name}</CardTitle>
                  <CardDescription>Class {child.class}</CardDescription>
                </div>
                {child.alerts > 0 && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <Bell className="h-4 w-4" />
                    <span className="text-sm font-medium">{child.alerts} Alert</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Attendance</span>
                  </div>
                  <div className="text-2xl font-bold">{child.attendance}</div>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Overall Grade</span>
                  </div>
                  <div className="text-2xl font-bold">{child.grade}</div>
                </div>

                <div className="p-4 border border-border rounded-lg flex items-center">
                  <Button className="w-full">View Detailed Report</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
