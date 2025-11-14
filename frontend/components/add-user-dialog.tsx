'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userType: 'student' | 'teacher' | 'admin' | null
  onUserAdded?: () => void
}

export function AddUserDialog({ open, onOpenChange, userType, onUserAdded }: AddUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    // Student specific
    studentCode: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    // Parent info (for students)
    parentEmail: '',
    parentFirstName: '',
    parentLastName: '',
    parentPhone: '',
    parentRelationship: 'father' as 'father' | 'mother' | 'guardian' | 'other',
    // Teacher specific
    teacherCode: '',
    subjectSpecialization: '',
    qualification: '',
    hireDate: '',
    // Admin specific
    department: '',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate required fields
      if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
        throw new Error('Please fill in all required fields')
      }

      if (!userType) {
        throw new Error('User type not specified')
      }

      // Build request body based on user type
      const requestBody: any = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        role: userType,
      }

      // Add role-specific fields
      if (userType === 'student') {
        // For students, admin only provides basic info
        // Student code is auto-generated
        // Other fields filled by student during completion
        requestBody.studentCode = `STU-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        // Default values for required fields (student will update later)
        requestBody.dateOfBirth = '2000-01-01' // Placeholder
        requestBody.gender = 'male' // Placeholder
        requestBody.address = '' // To be filled by student
      } else if (userType === 'teacher') {
        if (!formData.teacherCode || !formData.hireDate) {
          throw new Error('Please fill in all required teacher fields')
        }
        requestBody.teacherCode = formData.teacherCode
        requestBody.hireDate = formData.hireDate
        requestBody.subjectSpecialization = formData.subjectSpecialization || undefined
        requestBody.qualification = formData.qualification || undefined
      } else if (userType === 'admin') {
        requestBody.department = formData.department || undefined
      }

      console.log('Sending request:', requestBody)

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        console.error('API Error:', data)
        throw new Error(data.error || `Registration failed: ${response.status}`)
      }

      setSuccess(`${userType.charAt(0).toUpperCase() + userType.slice(1)} added successfully!`)
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        studentCode: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        parentEmail: '',
        parentFirstName: '',
        parentLastName: '',
        parentPhone: '',
        parentRelationship: 'father',
        teacherCode: '',
        subjectSpecialization: '',
        qualification: '',
        hireDate: '',
        department: '',
      })

      // Call callback if provided
      if (onUserAdded) {
        onUserAdded()
      }

      // Close dialog after 2 seconds
      setTimeout(() => {
        onOpenChange(false)
        setSuccess('')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getDialogTitle = () => {
    if (!userType) return 'Add User'
    return `Add ${userType.charAt(0).toUpperCase() + userType.slice(1)}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new {userType} account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Student Specific Fields */}
          {userType === 'student' && (
            <div className="space-y-4 border-t pt-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
                <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Student Account Creation</h3>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Admin provides basic info. Student will complete registration using the generated student code.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground">Student Code (Auto-generated)</Label>
                <p className="text-sm">System will generate a unique student code automatically</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Additional Information</Label>
                <p className="text-sm">Student will provide DOB, gender, address, emergency contacts, and parent information during registration</p>
              </div>
            </div>
          )}

          {/* Teacher Specific Fields */}
          {userType === 'teacher' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-sm">Teacher Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="teacherCode">Teacher Code *</Label>
                <Input
                  id="teacherCode"
                  value={formData.teacherCode}
                  onChange={(e) => handleInputChange('teacherCode', e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="e.g., TCH-2025-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hireDate">Hire Date *</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => handleInputChange('hireDate', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectSpecialization">Subject Specialization</Label>
                <Input
                  id="subjectSpecialization"
                  value={formData.subjectSpecialization}
                  onChange={(e) => handleInputChange('subjectSpecialization', e.target.value)}
                  disabled={isLoading}
                  placeholder="e.g., Mathematics"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  id="qualification"
                  value={formData.qualification}
                  onChange={(e) => handleInputChange('qualification', e.target.value)}
                  disabled={isLoading}
                  placeholder="e.g., M.Sc. Mathematics"
                />
              </div>
            </div>
          )}

          {/* Admin Specific Fields */}
          {userType === 'admin' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-sm">Admin Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  disabled={isLoading}
                  placeholder="e.g., Administration"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Adding...' : `Add ${userType || 'User'}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
