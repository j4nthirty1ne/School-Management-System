import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get('file') as File | null
    const userId = form.get('userId') as string | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = (file.name || 'img').split('.').pop() || 'png'
    const path = `avatars/${userId || 'unknown'}-${Date.now()}.${ext}`

    const admin = createAdminClient()

    // Try upload, if bucket missing create it and retry
    let uploadResult = await admin.storage.from('avatars').upload(path, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    })

    if (uploadResult.error && /bucket not found/i.test(uploadResult.error.message)) {
      // Attempt to create bucket
      const { error: bucketError } = await admin.storage.createBucket('avatars', { public: true })
      if (bucketError) {
        return NextResponse.json({ success: false, error: `Failed to create bucket: ${bucketError.message}` }, { status: 500 })
      }

      // Retry upload
      uploadResult = await admin.storage.from('avatars').upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      })
    }

    if (uploadResult.error) {
      return NextResponse.json({ success: false, error: uploadResult.error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)

    return NextResponse.json({ success: true, publicUrl })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 })
  }
}
