'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function RegisterUserPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  // Common fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  // This register page is now student-only (two-step claim flow)
  const [role] = useState<'student' | 'teacher' | 'admin' | 'parent'>('student')
  const [phone, setPhone] = useState('')

  // Two-step validation state
  const [validated, setValidated] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationError, setValidationError] = useState('')

  // Student-specific fields
  const [studentCode, setStudentCode] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male')

  // Teacher-specific fields
  const [teacherCode, setTeacherCode] = useState('')
  const [hireDate, setHireDate] = useState('')
  const [subjectSpecialization, setSubjectSpecialization] = useState('')
  const [qualification, setQualification] = useState('')

  // Admin-specific fields
  const [department, setDepartment] = useState('')

  // Step 2: submit claim (complete registration)
  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      if (!validated) {
        setError('Please validate your student code first')
        return
      }

      if (!password || password.length < 6) {
        setError('Please provide a password with at least 6 characters')
        return
      }

      const claimBody: any = {
        student_code: studentCode,
        password,
        firstName,
        lastName,
      }

      const claimResp = await fetch('/api/auth/claim-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claimBody),
      })

      const claimData = await claimResp.json()

      if (!claimResp.ok || !claimData.success) {
        setError(claimData.error || 'Failed to complete student registration')
        return
      }

      setResult(claimData)

      // Clear form (keep role as student)
      setEmail('')
      setPassword('')
      setFirstName('')
      setLastName('')
      setPhone('')
      setStudentCode('')
      setDateOfBirth('')
      setSubjectSpecialization('')
      setQualification('')
      setDepartment('')
      setValidated(false)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Step 1: validate student code only
  const handleValidate = async () => {
    setValidating(true)
    setValidationError('')
    setError('')
    setResult(null)

    try {
      if (!studentCode || !dateOfBirth || !gender) {
        setValidationError('Please fill student code, date of birth and gender to validate')
        return
      }

      const validateResp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'student', studentCode, dateOfBirth, gender }),
      })

      const validateData = await validateResp.json()
      if (!validateResp.ok || !validateData.success) {
        setValidationError(validateData.error || 'Student code validation failed')
        setValidated(false)
        return
      }

      setValidated(true)
    } catch (err: any) {
      setValidationError(err.message || 'Validation error')
      setValidated(false)
    } finally {
      setValidating(false)
    }
  }

  const generateCode = () => {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${role === 'student' ? 'STU' : 'TCH'}-2025-${timestamp}${random}`
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Register New User</CardTitle>
          <CardDescription>
            Create a new user account and insert data into the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleComplete} className="space-y-6">
            {/* Register as Student (two-step claim flow) */}
            <div className="space-y-2">
              <Label>Register as Student</Label>
              <p className="text-sm text-muted-foreground">Enter your student code to validate, then complete registration.</p>
            </div>

            {/* Common Fields - only shown after student code is validated */}
            {validated && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="user@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Min 6 characters"
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="123-456-7890"
                  />
                </div>
              </>
            )}

            {/* Student-specific fields */}
            {role === 'student' && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Student Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="studentCode">Student Code *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="studentCode"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      required
                      placeholder="STU-2025-001"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setStudentCode(generateCode())}
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={gender} onValueChange={(value: any) => setGender(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {!validated ? (
                    <>
                      <Button type="button" onClick={handleValidate} disabled={validating}>
                        {validating ? 'Validating…' : 'Validate Student Code'}
                      </Button>
                      <p className="text-sm text-muted-foreground">After validation you'll be able to set your password and complete registration.</p>
                    </>
                  ) : (
                    <>
                      <div className="rounded-md bg-green-50 border border-green-200 p-3">
                        <p className="text-green-900 text-sm">Student code validated — proceed to complete registration below.</p>
                      </div>
                      <Button type="button" variant="outline" onClick={() => { setValidated(false); setValidationError('') }}>
                        Start Over
                      </Button>
                    </>
                  )}
                </div>

                {validationError && (
                  <div className="mt-2 text-sm text-red-700">{validationError}</div>
                )}
              </div>
            )}

            {/* Teacher-specific fields */}
            {role === 'teacher' && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Teacher Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="teacherCode">Teacher Code *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="teacherCode"
                      value={teacherCode}
                      onChange={(e) => setTeacherCode(e.target.value)}
                      required
                      placeholder="TCH-2025-001"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setTeacherCode(generateCode())}
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hireDate">Hire Date *</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subjectSpecialization">Subject Specialization</Label>
                  <Input
                    id="subjectSpecialization"
                    value={subjectSpecialization}
                    onChange={(e) => setSubjectSpecialization(e.target.value)}
                    placeholder="Mathematics, Science, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="Bachelor's in Education"
                  />
                </div>
              </div>
            )}

            {/* Admin-specific fields */}
            {role === 'admin' && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Admin Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Academics, Administration, etc."
                  />
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {result && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-900">
                  <strong>✓ Success!</strong> {result.message}
                  <div className="mt-2 text-sm">
                    <p>User ID: {result.user?.id}</p>
                    <p>Email: {result.user?.email}</p>
                    <p>Role: {result.user?.role}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Registering...' : 'Register User'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
