"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Avatar components are rendered inside AvatarUploader now
import AvatarUploader from '@/components/avatar-uploader'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Profile {
  id?: string
  email?: string
  first_name?: string
  last_name?: string
}

export default function AdminProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/auth/user')
        const json = await res.json()
        if (json?.success && json.user) setProfile(json.user)
        else setError(json?.error || 'Failed to load profile')
      } catch (err: any) {
        setError(err.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: profile.first_name, last_name: profile.last_name, avatar_url: (profile as any).avatar_url }),
      })
      const json = await res.json()
      if (res.ok && json?.success) {
        setSuccess('Profile updated')
        // refresh auth user
        router.refresh()
      } else {
        setError(json?.error || 'Failed to update profile')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8">Loading profile...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-center">
                <AvatarUploader
                  userId={profile?.id as string}
                  avatarUrl={(profile as any)?.avatar_url}
                  showLabel={false}
                  fallback={((profile?.first_name?.[0] || '') + (profile?.last_name?.[0] || '')).toUpperCase() || 'AD'}
                  onUploaded={async (publicUrl) => {
                      try {
                        const r = await fetch('/api/auth/update-profile', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ first_name: profile?.first_name, last_name: profile?.last_name, avatar_url: publicUrl }),
                        })
                        const j = await r.json()
                        if (j?.success) {
                          setProfile((p) => p ? ({ ...p, ...( (j.profile as any) || {} ) }) : p)
                          router.refresh()
                        } else {
                          alert(j?.error || 'Failed to save avatar')
                        }
                      } catch (err: any) {
                        console.error('Save avatar url failed', err)
                        alert('Failed to save avatar')
                      }
                    }}
                    onRemoved={async () => {
                      try {
                        const r = await fetch('/api/auth/update-profile', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ first_name: profile?.first_name, last_name: profile?.last_name, avatar_url: null }),
                        })
                        const j = await r.json()
                        if (j?.success) {
                          setProfile((p) => p ? ({ ...p, avatar_url: null }) : p)
                          router.refresh()
                        } else {
                          alert(j?.error || 'Failed to remove avatar')
                        }
                      } catch (err: any) {
                        console.error('Remove avatar failed', err)
                        alert('Failed to remove avatar')
                      }
                    }}
                  />
                </div>

              <div>
                <Label htmlFor="first_name">First name</Label>
                <Input id="first_name" value={profile?.first_name || ''} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} />
              </div>

              <div>
                <Label htmlFor="last_name">Last name</Label>
                <Input id="last_name" value={profile?.last_name || ''} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={profile?.email || ''} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
                <Button variant="ghost" onClick={() => router.push('/admin/dashboard')}>Back</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
