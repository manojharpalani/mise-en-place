import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPresignedUploadUrl, getS3Key } from '@/lib/s3'
import { z } from 'zod'

const schema = z.object({
  filename: z.string(),
  contentType: z.string(),
  folder: z.string().default('uploads'),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { filename, contentType, folder } = schema.parse(body)

    // Validate content type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    if (!allowed.includes(contentType)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    const key = getS3Key(`${folder}/${session.user.id}`, filename)
    const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, contentType)

    return NextResponse.json({ uploadUrl, publicUrl, key })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
