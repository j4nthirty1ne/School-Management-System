"use client"

import React, { useRef, useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { UploadCloud } from 'lucide-react'

interface Props {
  userId: string
  avatarUrl?: string | null
  size?: number
  onUploaded?: (publicUrl: string) => void
  onRemoved?: () => void
  /** hide the descriptive label/text next to the avatar */
  showLabel?: boolean
  /** fallback text to show inside avatar when no image */
  fallback?: string
}

export default function AvatarUploader({ userId, avatarUrl, size = 80, onUploaded, onRemoved, showLabel = true, fallback }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [preview, setPreview] = useState<string | undefined>(avatarUrl || undefined)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPreview(avatarUrl || undefined)
  }, [avatarUrl])

  const triggerFile = () => inputRef.current?.click()

  const handleRemove = async () => {
    // Let parent perform removal (should call update-profile with avatar_url null)
    setError(null)
    setPreview(undefined)
    onRemoved?.()
  }

  const handleFile = async (file?: File) => {
    setError(null)
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('userId', userId)

      const res = await fetch('/api/storage/avatars/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json?.error || 'Upload failed')

      const publicUrl = json.publicUrl
      setPreview(publicUrl)
      onUploaded?.(publicUrl)
    } catch (err: any) {
      setError(err?.message || 'Upload failed')
      console.error('Avatar upload error', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="rounded-full" style={{ width: size, height: size }}>
          {preview ? (
            <AvatarImage src={preview} alt="avatar" />
          ) : (
            <AvatarFallback className="text-lg">{fallback || ''}</AvatarFallback>
          )}
        </Avatar>

        <div className="absolute right-0 bottom-0">
          <Button size="sm" variant="ghost" onClick={triggerFile} aria-label="Upload avatar">
            <UploadCloud className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            // show temporary preview
            const url = URL.createObjectURL(file)
            setPreview(url)
            handleFile(file)
            // revokeObjectURL later
            setTimeout(() => URL.revokeObjectURL(url), 5000)
          }}
        />

        {showLabel ? (
          <div className="text-sm text-gray-600">
            <div className="font-medium">Profile Picture</div>
            <div className="text-xs">Upload a JPG/PNG image (recommended 256x256)</div>
            {uploading && <div className="text-xs text-gray-500 mt-1">Uploading...</div>}
            {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
          </div>
        ) : (
          // still show minimal upload/error text when label hidden
          <div className="text-sm">
            {uploading && <div className="text-xs text-gray-500 mt-1">Uploading...</div>}
            {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
          </div>
        )}
      </div>
    </div>
  )
}

// extract props after function so we can reference fallback with proper name inside component
