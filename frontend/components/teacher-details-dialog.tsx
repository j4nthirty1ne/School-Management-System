"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface Teacher {
  id: string
  user_id: string
  teacher_code: string
  first_name: string
  last_name: string
  phone: string
  status: string
  hire_date: string
  subject_specialization?: string
}

interface TeacherDetailsDialogProps {
  teacher: Teacher | null
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'view' | 'edit'
  onUpdate?: () => void
}

export function TeacherDetailsDialog({ teacher, open, onOpenChange, mode, onUpdate }: TeacherDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(mode === 'edit')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    firstName: teacher?.first_name || '',
    lastName: teacher?.last_name || '',
    phone: teacher?.phone || '',
    status: teacher?.status || 'active',
  })

  // Update form data when teacher changes
  useState(() => {
    if (teacher) {
      setFormData({
        firstName: teacher.first_name,
        lastName: teacher.last_name,
        phone: teacher.phone || '',
        status: teacher.status,
      })
    }
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSave = async () => {
    if (!teacher) return
    
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/teachers/${teacher.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          status: formData.status,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update teacher')
      }

      alert('Teacher updated successfully!')
      onUpdate?.()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!teacher) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Teacher' : 'Teacher Details'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update teacher information' 
              : `View ${teacher.first_name} ${teacher.last_name}'s details`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Teacher Code (Read-only) */}
          <div className="space-y-2">
            <Label>Teacher Code</Label>
            <Input value={teacher.teacher_code} disabled className="font-mono" />
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={isEditing ? formData.firstName : teacher.first_name}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              disabled={!isEditing || isLoading}
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={isEditing ? formData.lastName : teacher.last_name}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              disabled={!isEditing || isLoading}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={isEditing ? formData.phone : (teacher.phone || 'N/A')}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={!isEditing || isLoading}
            />
          </div>

          {/* Hire Date (Read-only) */}
          <div className="space-y-2">
            <Label>Hire Date</Label>
            <Input 
              value={new Date(teacher.hire_date).toLocaleDateString()} 
              disabled 
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            {isEditing ? (
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
                disabled={isLoading}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div>
                <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
                  {teacher.status}
                </Badge>
              </div>
            )}
          </div>

          {/* Specialization (Read-only) */}
          <div className="space-y-2">
            <Label>Subject Specialization</Label>
            <Input 
              value={teacher.subject_specialization || 'N/A'} 
              disabled 
            />
          </div>
        </div>

        <DialogFooter>
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (mode === 'view') {
                    setIsEditing(false)
                  } else {
                    onOpenChange(false)
                  }
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                Edit Teacher
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
