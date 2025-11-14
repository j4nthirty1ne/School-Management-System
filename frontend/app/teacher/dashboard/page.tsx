'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BookOpen, Users, Calendar, FileText, LogOut, Plus, Edit, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface Class {
  id: string
  subject_name: string
  subject_code?: string
  subject_id?: string
  academic_year: string
  room_number?: string
  capacity: number
  day_of_week?: string
  start_time?: string
  end_time?: string
  created_at: string
  updated_at: string
}

interface Student {
  id: string
  student_id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
}

interface AttendanceRecord {
  student_id: string
  status: 'present' | 'absent' | 'late' | 'excused'
  notes?: string
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [teacher, setTeacher] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<Class[]>([])

  // Helper function to format time to 12-hour format with AM/PM
  const formatTime = (time: string) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [formData, setFormData] = useState({
    subject_name: '',
    subject_id: '',
    academic_year: '',
    room_number: '',
    capacity: '',
    day_of_week: '',
    start_time: '',
    end_time: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Attendance state
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false)
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState<string>('')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceRecord>>(new Map())
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [submittingAttendance, setSubmittingAttendance] = useState(false)

  // View Students state
  const [showViewStudentsDialog, setShowViewStudentsDialog] = useState(false)
  const [selectedClassForView, setSelectedClassForView] = useState<Class | null>(null)
  const [classStudents, setClassStudents] = useState<Student[]>([])
  const [loadingClassStudents, setLoadingClassStudents] = useState(false)

  // View Student Profile state
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  // Enter Grades state
  const [showGradesDialog, setShowGradesDialog] = useState(false)
  const [selectedClassForGrades, setSelectedClassForGrades] = useState<Class | null>(null)
  const [gradesStudents, setGradesStudents] = useState<Student[]>([])
  const [loadingGradesStudents, setLoadingGradesStudents] = useState(false)
  const [gradeData, setGradeData] = useState({
    notes: '',
    grade_type: 'assignment',
    max_score: '100',
    grade_date: new Date().toISOString().split('T')[0]
  })
  const [studentGrades, setStudentGrades] = useState<Map<string, string>>(new Map())
  const [submittingGrades, setSubmittingGrades] = useState(false)

  // View Grades state
  const [showViewGradesDialog, setShowViewGradesDialog] = useState(false)
  const [selectedClassForViewGrades, setSelectedClassForViewGrades] = useState<Class | null>(null)
  const [classGrades, setClassGrades] = useState<any[]>([])
  const [loadingGrades, setLoadingGrades] = useState(false)

  // View All Students state
  const [showAllStudentsDialog, setShowAllStudentsDialog] = useState(false)
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [loadingAllStudents, setLoadingAllStudents] = useState(false)

  // Stats state
  const [totalStudents, setTotalStudents] = useState(0)
  const [classesThisWeek, setClassesThisWeek] = useState(0)
  const [pendingGrades, setPendingGrades] = useState(0)

  useEffect(() => {
    fetchTeacherData()
    fetchClasses()
  }, [])

  // Calculate stats when classes change
  useEffect(() => {
    if (classes.length > 0) {
      calculateStats()
    }
  }, [classes])

  const calculateStats = async () => {
    // Calculate total students across all classes
    let studentIds = new Set()
    for (const classItem of classes) {
      try {
        const response = await fetch(`/api/classes/${classItem.id}/students`)
        const data = await response.json()
        if (data.success && data.students) {
          data.students.forEach((student: any) => studentIds.add(student.id))
        }
      } catch (error) {
        console.error('Error fetching students:', error)
      }
    }
    setTotalStudents(studentIds.size)

    // Calculate classes this week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const classesPerWeek = classes.filter(c => c.day_of_week && daysOfWeek.includes(c.day_of_week))
    setClassesThisWeek(classesPerWeek.length)

    // Calculate pending grades (classes without recent grades)
    // For now, we'll just use a simple count based on classes
    setPendingGrades(classes.length)
  }

  const fetchTeacherData = async () => {
    try {
      const response = await fetch('/api/auth/user')
      const data = await response.json()
      
      if (data.success) {
        // API returns { user: { ... } } — use data.user to set teacher info
        setTeacher(data.user || data.profile || null)
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes')
      const data = await response.json()
      
      if (data.success) {
        setClasses(data.classes)
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        const subjectCode = data.class?.subject_code
        const successMsg = subjectCode 
          ? `Class added successfully! Subject Code: ${subjectCode}` 
          : 'Class added successfully!'
        setSuccess(successMsg)
        setShowAddDialog(false)
        setFormData({
          subject_name: '',
          subject_id: '',
          academic_year: '',
          room_number: '',
          capacity: '',
          day_of_week: '',
          start_time: '',
          end_time: ''
        })
        fetchClasses()
        setTimeout(() => setSuccess(''), 5000)
      } else {
        setError(data.error || 'Failed to add class')
      }
    } catch (error) {
      setError('An error occurred while adding the class')
    }
  }

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClass) return

    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/classes/${selectedClass.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Class updated successfully!')
        setShowEditDialog(false)
        setSelectedClass(null)
        fetchClasses()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to update class')
      }
    } catch (error) {
      setError('An error occurred while updating the class')
    }
  }

  const handleDeleteClass = async () => {
    if (!selectedClass) return

    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/classes/${selectedClass.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Class deleted successfully!')
        setShowDeleteDialog(false)
        setSelectedClass(null)
        fetchClasses()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to delete class')
      }
    } catch (error) {
      setError('An error occurred while deleting the class')
    }
  }

  const openEditDialog = (classItem: Class) => {
    setSelectedClass(classItem)
    setFormData({
      subject_name: classItem.subject_name,
      subject_id: classItem.subject_id || '',
      academic_year: classItem.academic_year,
      room_number: classItem.room_number || '',
      capacity: classItem.capacity.toString(),
      day_of_week: classItem.day_of_week || '',
      start_time: classItem.start_time || '',
      end_time: classItem.end_time || ''
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (classItem: Class) => {
    setSelectedClass(classItem)
    setShowDeleteDialog(true)
  }

  // Attendance functions
  const openAttendanceDialog = () => {
    setShowAttendanceDialog(true)
    setError('')
    setSuccess('')
  }

  const fetchStudentsForClass = async (classId: string) => {
    setLoadingStudents(true)
    try {
      const response = await fetch(`/api/classes/${classId}/students`)
      const data = await response.json()

      if (data.success) {
        setStudents(data.students)
        // Initialize attendance records with all students as 'present' by default
        const initialRecords = new Map()
        data.students.forEach((student: Student) => {
          initialRecords.set(student.id, {
            student_id: student.id,
            status: 'present',
            notes: ''
          })
        })
        setAttendanceRecords(initialRecords)
      } else {
        setError(data.error || 'Failed to fetch students')
      }
    } catch (error) {
      setError('An error occurred while fetching students')
      console.error('Error fetching students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleClassSelectionForAttendance = async (classId: string) => {
    setSelectedClassForAttendance(classId)
    if (classId) {
      await fetchStudentsForClass(classId)
    } else {
      setStudents([])
      setAttendanceRecords(new Map())
    }
  }

  const updateAttendanceStatus = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendanceRecords(prev => {
      const newRecords = new Map(prev)
      const record = newRecords.get(studentId)
      if (record) {
        newRecords.set(studentId, { ...record, status })
      }
      return newRecords
    })
  }

  const updateAttendanceNotes = (studentId: string, notes: string) => {
    setAttendanceRecords(prev => {
      const newRecords = new Map(prev)
      const record = newRecords.get(studentId)
      if (record) {
        newRecords.set(studentId, { ...record, notes })
      }
      return newRecords
    })
  }

  const markAllPresent = () => {
    setAttendanceRecords(prev => {
      const newRecords = new Map(prev)
      students.forEach(student => {
        newRecords.set(student.id, {
          student_id: student.id,
          status: 'present',
          notes: ''
        })
      })
      return newRecords
    })
  }

  const handleSubmitAttendance = async () => {
    if (!selectedClassForAttendance) {
      setError('Please select a class')
      return
    }

    if (students.length === 0) {
      setError('No students found in this class')
      return
    }

    setSubmittingAttendance(true)
    setError('')
    setSuccess('')

    try {
      const recordsArray = Array.from(attendanceRecords.values())

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClassForAttendance,
          attendance_date: attendanceDate,
          attendance_records: recordsArray
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Attendance marked successfully for ${data.count} students!`)
        setTimeout(() => {
          setShowAttendanceDialog(false)
          setSelectedClassForAttendance('')
          setStudents([])
          setAttendanceRecords(new Map())
        }, 2000)
      } else {
        setError(data.error || 'Failed to mark attendance')
      }
    } catch (error) {
      setError('An error occurred while marking attendance')
      console.error('Error marking attendance:', error)
    } finally {
      setSubmittingAttendance(false)
    }
  }

  // View Students functions
  const openViewStudentsDialog = async (classItem: Class) => {
    setSelectedClassForView(classItem)
    setShowViewStudentsDialog(true)
    setLoadingClassStudents(true)
    setError('')

    try {
      const response = await fetch(`/api/classes/${classItem.id}/students`)
      const data = await response.json()

      if (data.success) {
        setClassStudents(data.students)
      } else {
        setError(data.error || 'Failed to fetch students')
      }
    } catch (error) {
      setError('An error occurred while fetching students')
      console.error('Error fetching students:', error)
    } finally {
      setLoadingClassStudents(false)
    }
  }

  // View Student Profile function
  const openStudentProfile = async (studentId: string) => {
    setLoadingProfile(true)
    setShowProfileDialog(true)
    setError('')

    try {
      const response = await fetch(`/api/students/${studentId}`)
      const data = await response.json()

      if (data.success) {
        setSelectedStudent(data.student)
      } else {
        setError(data.error || 'Failed to fetch student profile')
      }
    } catch (error) {
      setError('An error occurred while fetching student profile')
      console.error('Error fetching profile:', error)
    } finally {
      setLoadingProfile(false)
    }
  }

  // Open Enter Grades Dialog
  const openGradesDialog = () => {
    setShowGradesDialog(true)
    setError('')
    setSuccess('')
  }

  // Fetch students for grading when class is selected
  const handleClassSelectionForGrades = async (classId: string) => {
    const selectedClass = classes.find(c => c.id === classId)
    setSelectedClassForGrades(selectedClass || null)
    setLoadingGradesStudents(true)

    try {
      const response = await fetch(`/api/classes/${classId}/students`)
      const data = await response.json()

      if (data.success) {
        setGradesStudents(data.students)
      } else {
        setError(data.error || 'Failed to fetch students')
      }
    } catch (error) {
      setError('An error occurred while fetching students')
      console.error('Error fetching students:', error)
    } finally {
      setLoadingGradesStudents(false)
    }
  }

  // Update student grade
  const handleGradeChange = (studentId: string, score: string) => {
    const newGrades = new Map(studentGrades)
    newGrades.set(studentId, score)
    setStudentGrades(newGrades)
  }

  // Submit grades
  const handleSubmitGrades = async () => {
    if (!selectedClassForGrades) {
      setError('Please select a class')
      return
    }

    setSubmittingGrades(true)
    setError('')

    try {
      const gradesArray = Array.from(studentGrades.entries()).map(([student_id, score]) => ({
        student_id,
        score: parseFloat(score) || 0
      }))

      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClassForGrades.id,
          grade_type: gradeData.grade_type,
          max_score: parseFloat(gradeData.max_score),
          grade_date: gradeData.grade_date,
          notes: gradeData.notes,
          grades: gradesArray
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Grades submitted successfully for ${data.count} students!`)
        // Reset form
        setStudentGrades(new Map())
        setGradeData({
          notes: '',
          grade_type: 'assignment',
          max_score: '100',
          grade_date: new Date().toISOString().split('T')[0]
        })
        setTimeout(() => {
          setShowGradesDialog(false)
          setSuccess('')
        }, 2000)
      } else {
        setError(data.error || 'Failed to submit grades')
      }
    } catch (error) {
      setError('An error occurred while submitting grades')
      console.error('Error submitting grades:', error)
    } finally {
      setSubmittingGrades(false)
    }
  }

  // Open View Grades Dialog
  const openViewGradesDialog = async (classItem: Class) => {
    setSelectedClassForViewGrades(classItem)
    setShowViewGradesDialog(true)
    setLoadingGrades(true)
    setError('')

    try {
      // Fetch grades
      const gradesResponse = await fetch(`/api/grades?class_id=${classItem.id}`)
      const gradesData = await gradesResponse.json()

      if (!gradesData.success) {
        setError(gradesData.error || 'Failed to fetch grades')
        setLoadingGrades(false)
        return
      }

      // Fetch students to get names
      const studentsResponse = await fetch(`/api/classes/${classItem.id}/students`)
      const studentsData = await studentsResponse.json()

      if (studentsData.success) {
        // Map student IDs to names
        const studentMap = new Map()
        studentsData.students.forEach((student: any) => {
          console.log('Student:', student.id, student.first_name, student.last_name)
          studentMap.set(student.id, {
            name: `${student.first_name} ${student.last_name}`,
            student_code: student.student_id
          })
        })

        console.log('Student Map:', studentMap)
        console.log('Grades:', gradesData.grades)

        // Add student names to grades
        const gradesWithNames = gradesData.grades.map((grade: any) => {
          console.log('Mapping grade for student_id:', grade.student_id)
          const studentInfo = studentMap.get(grade.student_id)
          console.log('Found student info:', studentInfo)
          
          return {
            ...grade,
            student_name: studentInfo?.name || 'Unknown Student',
            student_code: studentInfo?.student_code || grade.student_id
          }
        })

        console.log('Grades with names:', gradesWithNames)
        setClassGrades(gradesWithNames)
      } else {
        setClassGrades(gradesData.grades)
      }
    } catch (error) {
      setError('An error occurred while fetching grades')
      console.error('Error fetching grades:', error)
    } finally {
      setLoadingGrades(false)
    }
  }

  const openAllStudentsDialog = async () => {
    setShowAllStudentsDialog(true)
    setLoadingAllStudents(true)
    setError('')

    try {
      // Fetch students from all classes
      const allStudentsMap = new Map()
      
      for (const classItem of classes) {
        const response = await fetch(`/api/classes/${classItem.id}/students`)
        const data = await response.json()

        if (data.success && data.students) {
          data.students.forEach((student: any) => {
            if (!allStudentsMap.has(student.id)) {
              allStudentsMap.set(student.id, {
                id: student.id,
                student_id: student.student_id,
                first_name: student.first_name,
                last_name: student.last_name,
                enrollment_status: student.enrollment_status,
                classes: [classItem.subject_name]
              })
            } else {
              // Student already exists, add this class to their list
              const existing = allStudentsMap.get(student.id)
              existing.classes.push(classItem.subject_name)
            }
          })
        }
      }

      setAllStudents(Array.from(allStudentsMap.values()))
    } catch (error) {
      setError('An error occurred while fetching students')
      console.error('Error fetching students:', error)
    } finally {
      setLoadingAllStudents(false)
    }
  }

  const handleViewStudentDetails = (studentId: string) => {
    openStudentProfile(studentId)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Teacher Portal</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {teacher?.first_name} {teacher?.last_name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="capitalize">{teacher?.role || 'Teacher'}</Badge>
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                  <Avatar>
                    <AvatarImage src={(teacher as any)?.avatar_url || ''} alt={(teacher?.email) || 'Teacher'} />
                    <AvatarFallback>{((teacher?.first_name?.[0] || '') + (teacher?.last_name?.[0] || '')).toUpperCase() || 'T'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{(teacher?.first_name || '') + ' ' + (teacher?.last_name || '')}</p>
                  <p className="text-xs text-muted-foreground">{teacher?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/teacher/profile')}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }} className="text-red-600">Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">My Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classes.length}</div>
              <p className="text-xs text-muted-foreground">Active classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">Across all classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classesThisWeek}</div>
              <p className="text-xs text-muted-foreground">Classes scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingGrades}</div>
              <p className="text-xs text-muted-foreground">Assignments to grade</p>
            </CardContent>
          </Card>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-900">
              {success.includes('Subject Code:') ? (
                <div className="flex items-center gap-2">
                  <span>{success.split('Subject Code:')[0]}</span>
                  <span className="font-mono font-bold text-lg text-green-700">
                    {success.split('Subject Code:')[1]}
                  </span>
                </div>
              ) : (
                success
              )}
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Class Management Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Classes</CardTitle>
                <CardDescription>Manage your classes</CardDescription>
              </div>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {classes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No classes found. Click &quot;Add Class&quot; to create your first class.
                </p>
              ) : (
                classes.map((classItem) => (
                  <div key={classItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{classItem.subject_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {classItem.subject_code ? (
                          <>Code: <span className="font-mono font-semibold text-primary">{classItem.subject_code}</span> • </>
                        ) : (
                          <span className="text-amber-600">No code yet • </span>
                        )}
                        {classItem.academic_year} • 
                        {classItem.room_number && ` Room ${classItem.room_number} • `}Capacity: {classItem.capacity}
                      </p>
                      {classItem.day_of_week && classItem.start_time && (
                        <p className="text-sm text-muted-foreground">
                          📅 {classItem.day_of_week} • {formatTime(classItem.start_time)}
                          {classItem.end_time && ` - ${formatTime(classItem.end_time)}`}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openViewStudentsDialog(classItem)} title="View Students">
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openViewGradesDialog(classItem)} title="View Grades">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(classItem)} title="Edit Class">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openDeleteDialog(classItem)} title="Delete Class">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your teaching tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" onClick={openAttendanceDialog}>
                <Calendar className="h-4 w-4 mr-2" />
                Mark Attendance
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={openGradesDialog}>
                <FileText className="h-4 w-4 mr-2" />
                Enter Grades
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={openAllStudentsDialog}>
                <Users className="h-4 w-4 mr-2" />
                View All Students
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Schedule</CardTitle>
              <CardDescription>Your classes for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
                  const todayClasses = classes.filter(c => c.day_of_week === today).sort((a, b) => {
                    if (!a.start_time || !b.start_time) return 0
                    return a.start_time.localeCompare(b.start_time)
                  })

                  if (todayClasses.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        No classes scheduled for today
                      </div>
                    )
                  }

                  return todayClasses.map((classItem) => (
                    <div key={classItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{classItem.subject_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {classItem.start_time && classItem.end_time && (
                            `${formatTime(classItem.start_time)} - ${formatTime(classItem.end_time)}`
                          )}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-primary">
                        {classItem.room_number || 'No room'}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Class Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
            <DialogDescription>Create a new class for your teaching schedule</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddClass} className="space-y-4">
            <div>
              <Label htmlFor="subject_name">Subject Name *</Label>
              <Input
                id="subject_name"
                value={formData.subject_name}
                onChange={(e) => setFormData({...formData, subject_name: e.target.value})}
                placeholder="Mathematics"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="academic_year">Academic Year *</Label>
                <Input
                  id="academic_year"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
                  placeholder="2024-2025"
                  required
                />
              </div>
              <div>
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  placeholder="30"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="room_number">Room Number</Label>
              <Input
                id="room_number"
                value={formData.room_number}
                onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                placeholder="301"
              />
            </div>
            <div>
              <Label htmlFor="day_of_week">Day of Week</Label>
              <Select
                value={formData.day_of_week}
                onValueChange={(value) => setFormData({...formData, day_of_week: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monday">Monday</SelectItem>
                  <SelectItem value="Tuesday">Tuesday</SelectItem>
                  <SelectItem value="Wednesday">Wednesday</SelectItem>
                  <SelectItem value="Thursday">Thursday</SelectItem>
                  <SelectItem value="Friday">Friday</SelectItem>
                  <SelectItem value="Saturday">Saturday</SelectItem>
                  <SelectItem value="Sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Class</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>Update class information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditClass} className="space-y-4">
            <div>
              <Label htmlFor="edit_subject_name">Subject Name *</Label>
              <Input
                id="edit_subject_name"
                value={formData.subject_name}
                onChange={(e) => setFormData({...formData, subject_name: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_academic_year">Academic Year *</Label>
                <Input
                  id="edit_academic_year"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_capacity">Capacity *</Label>
                <Input
                  id="edit_capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_room_number">Room Number</Label>
              <Input
                id="edit_room_number"
                value={formData.room_number}
                onChange={(e) => setFormData({...formData, room_number: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_day_of_week">Day of Week</Label>
              <Select
                value={formData.day_of_week}
                onValueChange={(value) => setFormData({...formData, day_of_week: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monday">Monday</SelectItem>
                  <SelectItem value="Tuesday">Tuesday</SelectItem>
                  <SelectItem value="Wednesday">Wednesday</SelectItem>
                  <SelectItem value="Thursday">Thursday</SelectItem>
                  <SelectItem value="Friday">Friday</SelectItem>
                  <SelectItem value="Saturday">Saturday</SelectItem>
                  <SelectItem value="Sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_start_time">Start Time</Label>
                <Input
                  id="edit_start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit_end_time">End Time</Label>
                <Input
                  id="edit_end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Class</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedClass?.subject_name}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClass}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={showAttendanceDialog} onOpenChange={setShowAttendanceDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
            <DialogDescription>
              Select a class and mark attendance for students
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Class and Date Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="attendance_class">Select Class *</Label>
                <Select
                  value={selectedClassForAttendance}
                  onValueChange={handleClassSelectionForAttendance}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.subject_name} - {classItem.academic_year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="attendance_date">Date *</Label>
                <Input
                  id="attendance_date"
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Loading State */}
            {loadingStudents && (
              <div className="text-center py-8 text-muted-foreground">
                Loading students...
              </div>
            )}

            {/* Student List */}
            {!loadingStudents && students.length > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    Students ({students.length})
                  </h3>
                  <Button variant="outline" size="sm" onClick={markAllPresent}>
                    Mark All Present
                  </Button>
                </div>

                <div className="space-y-3">
                  {students.map((student) => {
                    const record = attendanceRecords.get(student.id)
                    return (
                      <div key={student.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {student.student_id}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant={record?.status === 'present' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateAttendanceStatus(student.id, 'present')}
                            >
                              Present
                            </Button>
                            <Button
                              variant={record?.status === 'absent' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateAttendanceStatus(student.id, 'absent')}
                            >
                              Absent
                            </Button>
                            <Button
                              variant={record?.status === 'late' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateAttendanceStatus(student.id, 'late')}
                            >
                              Late
                            </Button>
                            <Button
                              variant={record?.status === 'excused' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateAttendanceStatus(student.id, 'excused')}
                            >
                              Excused
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Input
                            placeholder="Notes (optional)"
                            value={record?.notes || ''}
                            onChange={(e) => updateAttendanceNotes(student.id, e.target.value)}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* No Students Message */}
            {!loadingStudents && selectedClassForAttendance && students.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No students enrolled in this class
              </div>
            )}

            {/* Prompt to Select Class */}
            {!selectedClassForAttendance && (
              <div className="text-center py-8 text-muted-foreground">
                Please select a class to view students
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAttendanceDialog(false)
                setSelectedClassForAttendance('')
                setStudents([])
                setAttendanceRecords(new Map())
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitAttendance}
              disabled={submittingAttendance || students.length === 0}
            >
              {submittingAttendance ? 'Submitting...' : 'Submit Attendance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Students Dialog */}
      <Dialog open={showViewStudentsDialog} onOpenChange={setShowViewStudentsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Class Students</DialogTitle>
            <DialogDescription>
              {selectedClassForView && (
                <>
                  {selectedClassForView.subject_name} - {selectedClassForView.academic_year}
                  {selectedClassForView.subject_code && (
                    <span className="ml-2 font-mono text-primary">
                      ({selectedClassForView.subject_code})
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loadingClassStudents ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading students...
              </div>
            ) : classStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No students enrolled in this class yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Share the class code with students so they can join.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Enrolled Students ({classStudents.length})
                  </h3>
                </div>

                <div className="space-y-3">
                  {classStudents.map((student, index) => (
                    <Card key={student.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold">
                                {student.first_name && student.last_name 
                                  ? `${student.first_name} ${student.last_name}`
                                  : student.email || 'Unknown Student'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ID: {student.student_id}
                              </p>
                              {student.first_name && student.last_name && (
                                <p className="text-sm text-muted-foreground">
                                  {student.email}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openStudentProfile(student.id)}
                            >
                              View Profile
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowViewStudentsDialog(false)
                setSelectedClassForView(null)
                setClassStudents([])
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
            <DialogDescription>
              Detailed information about the student
            </DialogDescription>
          </DialogHeader>

          {loadingProfile ? (
            <div className="text-center py-12">
              <div className="text-lg text-muted-foreground">Loading profile...</div>
            </div>
          ) : selectedStudent ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-semibold">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Student ID</p>
                    <p className="font-mono font-semibold">{selectedStudent.student_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                    <p className="font-semibold">{selectedStudent.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-semibold">
                      {selectedStudent.date_of_birth 
                        ? new Date(selectedStudent.date_of_birth).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-semibold capitalize">{selectedStudent.gender}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-semibold">{selectedStudent.address}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Statistics</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{selectedStudent?.attendance?.attendance_rate ?? 0}%</p>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{selectedStudent?.attendance?.present_days ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Present</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{selectedStudent?.attendance?.total_days ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Total Days</p>
                  </div>
                </CardContent>
              </Card>

              {/* Enrolled Classes */}
              <Card>
                <CardHeader>
                  <CardTitle>Enrolled Classes ({selectedStudent.classes?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedStudent.classes && selectedStudent.classes.length > 0 ? (
                    <div className="space-y-2">
                      {selectedStudent.classes.map((cls: any) => (
                        <div key={cls.id} className="p-3 border rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{cls.subject_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Code: {cls.subject_code} • {cls.academic_year}
                              {cls.room_number && ` • Room ${cls.room_number}`}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            Enrolled {new Date(cls.enrolled_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No classes enrolled</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No student data available</p>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowProfileDialog(false)
                setSelectedStudent(null)
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enter Grades Dialog */}
      <Dialog open={showGradesDialog} onOpenChange={setShowGradesDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enter Grades</DialogTitle>
            <DialogDescription>
              Select a class and enter grades for students
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Class Selection */}
            <div className="space-y-2">
              <Label htmlFor="class-select">Select Class</Label>
              <Select onValueChange={handleClassSelectionForGrades}>
                <SelectTrigger id="class-select">
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.subject_name} - {classItem.academic_year}
                      {classItem.subject_code && ` (${classItem.subject_code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignment Details */}
            {selectedClassForGrades && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade-type">Assessment Type *</Label>
                    <Select 
                      value={gradeData.grade_type} 
                      onValueChange={(value) => setGradeData({ ...gradeData, grade_type: value })}
                    >
                      <SelectTrigger id="grade-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="midterm">Midterm</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-score">Max Score *</Label>
                    <Input
                      id="max-score"
                      type="number"
                      value={gradeData.max_score}
                      onChange={(e) => setGradeData({ ...gradeData, max_score: e.target.value })}
                      placeholder="100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade-date">Assessment Date *</Label>
                    <Input
                      id="grade-date"
                      type="date"
                      value={gradeData.grade_date}
                      onChange={(e) => setGradeData({ ...gradeData, grade_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      value={gradeData.notes}
                      onChange={(e) => setGradeData({ ...gradeData, notes: e.target.value })}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>

                {/* Students List with Grade Input */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">
                    Student Grades ({gradesStudents.length})
                  </h3>

                  {loadingGradesStudents ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading students...
                    </div>
                  ) : gradesStudents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No students enrolled in this class
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {gradesStudents.map((student) => (
                        <div key={student.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ID: {student.student_id}
                            </p>
                          </div>
                          <div className="w-32">
                            <Input
                              type="number"
                              placeholder="Score"
                              min="0"
                              max={gradeData.max_score}
                              value={studentGrades.get(student.id) || ''}
                              onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            / {gradeData.max_score}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-900">{success}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowGradesDialog(false)
                setSelectedClassForGrades(null)
                setGradesStudents([])
                setStudentGrades(new Map())
              }}
              disabled={submittingGrades}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitGrades} 
              disabled={submittingGrades || !selectedClassForGrades || gradesStudents.length === 0}
            >
              {submittingGrades ? 'Submitting...' : 'Submit Grades'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Grades Dialog */}
      <Dialog open={showViewGradesDialog} onOpenChange={setShowViewGradesDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Class Grades</DialogTitle>
            <DialogDescription>
              {selectedClassForViewGrades && (
                <>
                  {selectedClassForViewGrades.subject_name} - {selectedClassForViewGrades.academic_year}
                  {selectedClassForViewGrades.subject_code && (
                    <span className="ml-2 font-mono text-primary">
                      ({selectedClassForViewGrades.subject_code})
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loadingGrades ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading grades...
              </div>
            ) : classGrades.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No grades recorded for this class yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Use &quot;Enter Grades&quot; to add assessment scores.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {(() => {
                  // Group grades by student
                  const studentGradesMap = new Map()
                  classGrades.forEach((grade) => {
                    if (!studentGradesMap.has(grade.student_id)) {
                      studentGradesMap.set(grade.student_id, {
                        student_id: grade.student_id,
                        student_name: grade.student_name || 'Unknown Student',
                        student_code: grade.student_code || grade.student_id,
                        grades: {}
                      })
                    }
                    const student = studentGradesMap.get(grade.student_id)
                    const assessmentType = grade.assessment_type
                    if (!student.grades[assessmentType]) {
                      student.grades[assessmentType] = []
                    }
                    student.grades[assessmentType].push(grade)
                  })

                  // Get all unique assessment types
                  const assessmentTypes = ['quiz', 'assignment', 'midterm', 'final', 'project']

                  return (
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-left font-semibold sticky left-0 bg-muted/50">Student</th>
                          {assessmentTypes.map(type => (
                            <th key={type} className="p-3 text-center font-semibold capitalize">
                              {type}
                            </th>
                          ))}
                          <th className="p-3 text-center font-semibold">Average</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(studentGradesMap.values()).map((studentData) => {
                          // Calculate average
                          const allGrades = Object.values(studentData.grades).flat() as any[]
                          const totalPercentage = allGrades.reduce((sum, g) => {
                            const percentage = g.percentage || ((g.score / g.max_score) * 100)
                            return sum + parseFloat(percentage)
                          }, 0)
                          const average = allGrades.length > 0 ? (totalPercentage / allGrades.length).toFixed(1) : '0'
                          const averageColor = 
                            parseFloat(average) >= 80 ? 'text-green-600' :
                            parseFloat(average) >= 60 ? 'text-yellow-600' :
                            'text-red-600'

                          return (
                            <tr key={studentData.student_id} className="border-b hover:bg-muted/30">
                              <td className="p-3 sticky left-0 bg-background">
                                <div>
                                  <p className="font-semibold">{studentData.student_name}</p>
                                  <p className="text-xs text-muted-foreground">ID: {studentData.student_code}</p>
                                </div>
                              </td>
                              {assessmentTypes.map(type => {
                                const typeGrades = studentData.grades[type] || []
                                if (typeGrades.length === 0) {
                                  return (
                                    <td key={type} className="p-3 text-center text-muted-foreground">
                                      -
                                    </td>
                                  )
                                }
                                return (
                                  <td key={type} className="p-3 text-center">
                                    <div className="space-y-1">
                                      {typeGrades.map((grade: any, idx: number) => {
                                        const percentage = grade.percentage || ((grade.score / grade.max_score) * 100).toFixed(1)
                                        const percentageColor = 
                                          parseFloat(percentage) >= 80 ? 'text-green-600' :
                                          parseFloat(percentage) >= 60 ? 'text-yellow-600' :
                                          'text-red-600'
                                        return (
                                          <div key={idx} className="text-sm">
                                            <div className="font-semibold">
                                              {grade.score}/{grade.max_score}
                                            </div>
                                            <div className={`text-xs font-bold ${percentageColor}`}>
                                              {percentage}%
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </td>
                                )
                              })}
                              <td className="p-3 text-center">
                                <div className={`text-lg font-bold ${averageColor}`}>
                                  {average}%
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {allGrades.length} assessment{allGrades.length !== 1 ? 's' : ''}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )
                })()}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowViewGradesDialog(false)
                setSelectedClassForViewGrades(null)
                setClassGrades([])
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View All Students Dialog */}
      <Dialog open={showAllStudentsDialog} onOpenChange={setShowAllStudentsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>All Students</DialogTitle>
            <DialogDescription>
              View all students enrolled in your classes
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {loadingAllStudents ? (
              <div className="text-center py-8">Loading students...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-semibold">Student Code</th>
                      <th className="text-left p-3 font-semibold">Name</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Classes Enrolled</th>
                      <th className="text-center p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-muted-foreground">
                          No students found
                        </td>
                      </tr>
                    ) : (
                      allStudents.map((student) => (
                        <tr key={student.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div className="font-mono text-sm">{student.student_id}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold">
                              {student.first_name} {student.last_name}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant={student.enrollment_status === 'active' ? 'default' : 'secondary'}>
                              {student.enrollment_status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="text-sm">
                              <div className="font-semibold mb-1">
                                {student.classes.length} {student.classes.length === 1 ? 'class' : 'classes'}
                              </div>
                              <div className="text-muted-foreground">
                                {student.classes.slice(0, 3).join(', ')}
                                {student.classes.length > 3 && ` +${student.classes.length - 3} more`}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewStudentDetails(student.id)}
                            >
                              View Profile
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAllStudentsDialog(false)
                setAllStudents([])
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
