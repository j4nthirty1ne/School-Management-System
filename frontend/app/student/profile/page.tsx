'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save } from 'lucide-react'

interface User {
  id: string
  email: string
  role: string
  first_name?: string
  last_name?: string
}

export default function StudentProfile() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    avatar_url: ''
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/user')
      const data = await response.json()

      if (data.success && data.user) {
        setUser(data.user)
        setFormData({
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          email: data.user.email || '',
          avatar_url: (data.user as any).avatar_url || ''
        })
      } else {
        router.push('/login')
      }
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          avatar_url: formData.avatar_url,
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        setUser(prev => prev ? { ...prev, ...formData } : null)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating profile' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  const initials = formData.first_name && formData.last_name
    ? `${formData.first_name[0]}${formData.last_name[0]}`
    : formData.email?.[0]?.toUpperCase() || '?'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1a1a1a] border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/student/dashboard')}
                className="dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5 dark:text-gray-300" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Profile Settings
              </h1>
            </div>

            <Badge variant="secondary" className="capitalize">
              {user?.role || 'Student'}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="dark:bg-[#1a1a1a] dark:border-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Personal Information</CardTitle>
            <CardDescription className="dark:text-gray-400">Update your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6 p-4 bg-gray-50 dark:bg-[#0f0f0f] rounded-lg border border-gray-200 dark:border-gray-800">
                <Avatar className="h-24 w-24 border-2 border-gray-200 dark:border-gray-700">
                  <AvatarImage src={formData.avatar_url || ''} alt={formData.email} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Profile Picture</h3>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file || !user) return
                      setUploading(true)
                      try {
                        const fd = new FormData()
                        fd.append('file', file)
                        fd.append('userId', user.id)

                        const res = await fetch('/api/storage/avatars/upload', {
                          method: 'POST',
                          body: fd,
                        })

                        const json = await res.json()
                        if (!res.ok || !json.success) throw new Error(json?.error || 'Upload failed')

                        const publicUrl = json.publicUrl

                        // update profile with avatar_url
                        await fetch('/api/auth/update-profile', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            first_name: formData.first_name,
                            last_name: formData.last_name,
                            avatar_url: publicUrl,
                          }),
                        })

                        setFormData((f) => ({ ...f, avatar_url: publicUrl }))
                      } catch (err) {
                        console.error('Avatar upload failed', err)
                        alert('Avatar upload failed: ' + (err as any).message)
                      } finally {
                        setUploading(false)
                      }
                    }}
                    className="text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400 dark:hover:file:bg-blue-900/30"
                  />
                  {uploading && <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Uploading...</p>}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="dark:text-gray-200">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="dark:text-gray-200">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="dark:text-gray-200">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  disabled
                  className="bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
              </div>

              {/* Message Display */}
              {message && (
                <div
                  className={`p-4 rounded-lg flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                      : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                  }`}
                >
                  <span className="font-medium">{message.text}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/student/dashboard')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info Card */}
        <Card className="mt-6 dark:bg-[#1a1a1a] dark:border-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Account Information</CardTitle>
            <CardDescription className="dark:text-gray-400">Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">User ID</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{user?.id}</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Account Role</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Password</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">••••••••</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/student/change-password')}
                  className="dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300"
                >
                  Change Password
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
