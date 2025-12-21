'use client'

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MagnetizeButton } from "@/components/magnetize-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { GraduationCap, Users, BookOpen, Shield, ArrowRight } from "lucide-react"
import LightRays from "@/components/LightRays"
import { useTheme } from "next-themes"

export default function Home() {
  const { theme } = useTheme()
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  
  return (
    <div className="min-h-screen bg-background relative">
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
      
      {/* Content Layer */}
      <div className="relative z-10">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Sign In</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="bg-background/50 hover:bg-gray-300 dark:hover:bg-background/10 backdrop-blur-sm border-primary/30 transition-all hover:scale-110 hover:font-semibold hover:text-black dark:hover:text-white">
          <Link href="/register-user">Create Account</Link>
        </Button>
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-6xl font-bold mb-4 text-balance bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent pb-2">School Management System</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            A comprehensive platform for managing students, teachers, attendance, grades, and school communications all
            in one place
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
