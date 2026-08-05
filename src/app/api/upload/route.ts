import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { verifyToken } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dp1vaoeb',
  api_key: process.env.CLOUDINARY_API_KEY || '546568288193999',
  api_secret: process.env.CLOUDINARY_API_SECRET || '8v441vRRl6vZYc4Q_-7IQo_FgS4',
  secure: true,
})

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  // Require admin authentication
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = verifyToken(token)
  if (!user || !user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Rate limit: 500 uploads per admin per hour
  const ip = getClientIp(request)
  const rl = rateLimit(`upload:${ip}`, { windowMs: 60 * 60 * 1000, max: 500 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Upload limit reached. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Normalize MIME type (handle image/jpg, uppercase, and params)
    const rawType = (file.type || '').split(';')[0].trim().toLowerCase()
    const normalizedType = rawType === 'image/jpg' ? 'image/jpeg' : rawType

    if (!normalizedType || !ALLOWED_MIME_TYPES.has(normalizedType)) {
      return NextResponse.json(
        { error: `File type not allowed (${file.type || 'unknown'}). Allowed types: JPEG, PNG, WEBP, GIF, AVIF` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB` },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log(`[Upload API] Uploading ${file.name} (${file.size} bytes) to Cloudinary...`)

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'products',
          resource_type: 'auto',
        },
        (error, res) => {
          if (error || !res) {
            reject(error || new Error('Upload to Cloudinary failed'))
          } else {
            resolve({ secure_url: res.secure_url, public_id: res.public_id })
          }
        }
      )
      uploadStream.end(buffer)
    })

    console.log(`[Upload API Success] ${file.name} -> ${result.secure_url}`)
    return NextResponse.json({ url: result.secure_url, public_id: result.public_id })
  } catch (error) {
    console.error('[Upload API Exception]', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `Upload failed: ${errorMsg}` }, { status: 500 })
  }
}

// Health check — no credentials exposed
export async function GET() {
  return NextResponse.json({ healthy: true })
}
