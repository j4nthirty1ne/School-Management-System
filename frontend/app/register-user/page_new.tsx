'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function CompleteStudentRegistrationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Step 1: Verify student code
  const [studentCode, setStudentCode] = useState('')
  const [studentInfo, setStudentInfo] = useState<any>(null)

  // Step 2: Complete profile
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male')
  const [address, setAddress] = useState('')
  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('')

  // Step 3: Parent information
  const [parentFirstName, setParentFirstName] = useState('')
  const [parentLastName, setParentLastName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [parentRelationship, setParentRelationship] = useState<'father' | 'mother' | 'guardian' | 'other'>('father')

  // Step 1: Verify student code and get student info
  const handleVerifyCode = async () => {
    if (!studentCode.trim()) {
      setError('Please enter your student code')
      return
    }

    setVerifying(true)
    setError('')

    try {
      // Call API to verify student code and get student info
      const response = await fetch('/api/students/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentCode: studentCode.trim() })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Invalid student code')
        setVerified(false)
        return
      }

      // Student code is valid, show their basic info
      setStudentInfo(data.student)
      setVerified(true)
      setSuccess('Student code verified! Please complete your profile below.')
    } catch (err: any) {
      setError(err.message || 'Verification failed')
      setVerified(false)
    } finally {
      setVerifying(false)
    }
  }

  // Step 2: Complete registration
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate required fields
      if (!dateOfBirth || !gender) {
        throw new Error('Please fill in all required student information')
      }

      if (!parentFirstName || !parentLastName || !parentEmail || !parentRelationship) {
        throw new Error('Please fill in all required parent information')
      }

      const response = await fetch('/api/students/complete-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentCode,
          dateOfBirth,
          gender,
          address,
          emergencyContactName,
          emergencyContactPhone,
          parentFirstName,
          parentLastName,
          parentEmail,
          parentPhone,
          parentRelationship
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Registration failed')
      }

      setSuccess('Registration completed successfully! You can now login with your student code.')
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Complete Student Registration</CardTitle>
          <CardDescription>
            Use the student code provided by your admin to complete your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Verify Student Code */}
          {!verified ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentCode">Student Code *</Label>
                <div className="flex gap-2">
                  <Input
                    id="studentCode"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    placeholder="e.g., STU-1731024589-789"
                    disabled={verifying}
                    autoFocus
                  />
                  <Button 
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={verifying || !studentCode.trim()}
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Code'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the student code provided by your school administrator
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            /* Step 2: Complete Profile */
            <form onSubmit={handleCompleteRegistration} className="space-y-6">
              {/* Success message */}
              {success && (
                <Alert className="bg-green-50 text-green-900 border-green-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Error message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Student Info Display */}
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md space-y-2">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Student Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Name:</span>{' '}
                    <span className="font-medium">{studentInfo?.first_name} {studentInfo?.last_name}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Email:</span>{' '}
                    <span className="font-medium">{studentInfo?.email}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Phone:</span>{' '}
                    <span className="font-medium">{studentInfo?.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Student Code:</span>{' '}
                    <span className="font-medium">{studentCode}</span>
                  </div>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Personal Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      value={gender}
                      onValueChange={(value: any) => setGender(value)}
                      disabled={loading}
                    >
                      <SelectTrigger id="gender">
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

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={loading}
                    placeholder="Full address"
                  />
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Emergency Contact</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      disabled={loading}
                      placeholder="Full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      disabled={loading}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Parent/Guardian Information Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Parent/Guardian Information</h3>
                <p className="text-sm text-muted-foreground">
                  This information will be used to create a parent account
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentFirstName">First Name *</Label>
                    <Input
                      id="parentFirstName"
                      value={parentFirstName}
                      onChange={(e) => setParentFirstName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentLastName">Last Name *</Label>
                    <Input
                      id="parentLastName"
                      value={parentLastName}
                      onChange={(e) => setParentLastName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentEmail">Parent Email *</Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="parent@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentPhone">Parent Phone</Label>
                    <Input
                      id="parentPhone"
                      type="tel"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentRelationship">Relationship *</Label>
                    <Select
                      value={parentRelationship}
                      onValueChange={(value: any) => setParentRelationship(value)}
                      disabled={loading}
                    >
                      <SelectTrigger id="parentRelationship">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="father">Father</SelectItem>
                        <SelectItem value="mother">Mother</SelectItem>
                        <SelectItem value="guardian">Guardian</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setVerified(false)
                    setStudentInfo(null)
                    setError('')
                    setSuccess('')
                  }}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing Registration...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
