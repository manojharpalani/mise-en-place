import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET = process.env.AWS_S3_BUCKET || 'mise-en-place-uploads'

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })

  const url = await getSignedUrl(s3, command, { expiresIn })
  const publicUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`

  return { uploadUrl: url, publicUrl }
}

export async function deleteFile(key: string) {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    )
    return { success: true }
  } catch (error) {
    console.error('S3 delete error:', error)
    return { success: false, error }
  }
}

export function getS3Key(folder: string, filename: string) {
  const timestamp = Date.now()
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${folder}/${timestamp}-${sanitized}`
}
