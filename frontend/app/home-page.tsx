'use client'

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MagnetizeButton } from "@/components/magnetize-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { GraduationCap, Users, BookOpen, Shield, ArrowRight } from "lucide-react"
import LightRays from "@/components/LightRays"
import { useTheme } from "next-themes"
import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function Home() {
  const { theme } = useTheme()
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const learnMoreRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!learnMoreRef.current) return
    
    const chars = learnMoreRef.current.querySelectorAll('.char')
    
    gsap.fromTo(
      chars,
      {
        opacity: 0,
        y: 100,
        scaleY: 2,
        scaleX: 0.7,
      },
      {
        opacity: 1,
        y: 0,
        scaleY: 1,
        scaleX: 1,
        duration: 1,
        ease: 'back.out(2)',
        stagger: 0.03,
        scrollTrigger: {
          trigger: learnMoreRef.current,
          start: 'top 80%',
          end: 'top 30%',
          scrub: 1,
        }
      }
    )
  }, [])
  
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

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-96" style={{ marginTop: '20vh' }}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-6xl font-bold mb-4 text-balance bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent pb-2">School Management System</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            A comprehensive platform for managing students, teachers, attendance, grades, and school communications all
            in one place
          </p>
        </div>

        <div className="max-w-6xl mx-auto mb-8 text-center mt-64">
          <div ref={learnMoreRef} className="text-3xl font-bold overflow-hidden">
            {'Learn More'.split('').map((char, i) => (
              <span key={i} className="char inline-block" style={{ display: 'inline-block' }}>
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div 
            onClick={() => setExpandedCard(expandedCard === 1 ? null : 1)}
            className="rounded-lg border border-primary/20 bg-background/30 backdrop-blur-md p-6 shadow-lg cursor-pointer transition-all hover:shadow-xl"
          >
            <div className="rounded-lg bg-primary/20 backdrop-blur-sm p-3 w-fit mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Admin Portal</h3>
            {expandedCard === 1 && (
              <p className="text-sm text-muted-foreground mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                Manage students, teachers, timetables, and generate comprehensive reports
              </p>
            )}
          </div>

          <div 
            onClick={() => setExpandedCard(expandedCard === 2 ? null : 2)}
            className="rounded-lg border border-primary/20 bg-background/30 backdrop-blur-md p-6 shadow-lg cursor-pointer transition-all hover:shadow-xl"
          >
            <div className="rounded-lg bg-primary/20 backdrop-blur-sm p-3 w-fit mb-4">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Teacher Tools</h3>
            {expandedCard === 2 && (
              <p className="text-sm text-muted-foreground mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                Track attendance, upload grades, and communicate with students and parents
              </p>
            )}
          </div>

          <div 
            onClick={() => setExpandedCard(expandedCard === 3 ? null : 3)}
            className="rounded-lg border border-primary/20 bg-background/30 backdrop-blur-md p-6 shadow-lg cursor-pointer transition-all hover:shadow-xl"
          >
            <div className="rounded-lg bg-primary/20 backdrop-blur-sm p-3 w-fit mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Student Access</h3>
            {expandedCard === 3 && (
              <p className="text-sm text-muted-foreground mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                View attendance, timetables, grades, and receive important announcements
              </p>
            )}
          </div>

          <div 
            onClick={() => setExpandedCard(expandedCard === 4 ? null : 4)}
            className="rounded-lg border border-primary/20 bg-background/30 backdrop-blur-md p-6 shadow-lg cursor-pointer transition-all hover:shadow-xl"
          >
            <div className="rounded-lg bg-primary/20 backdrop-blur-sm p-3 w-fit mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Parent Portal</h3>
            {expandedCard === 4 && (
              <p className="text-sm text-muted-foreground mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                Monitor your child's progress, attendance, and stay connected with teachers
              </p>
            )}
          </div>
        </div>

        <div className="mt-16 max-w-3xl mx-auto rounded-lg border border-primary/20 bg-background/30 backdrop-blur-md p-8 shadow-lg">
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
    </div>
  )
}
