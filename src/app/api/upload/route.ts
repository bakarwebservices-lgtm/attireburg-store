import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Storage not configured (missing Supabase URL or Key)' }, { status: 500 })
    }

    // Clean URL to prevent malformed path issues (remove quotes, spaces, trailing slashes, /rest/v1, /storage/v1)
    let cleanUrl = supabaseUrl.trim().replace(/^["']|["']$/g, '').replace(/\/$/, '')
    cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/storage\/v1\/?$/i, '')

    const cleanKey = supabaseKey.trim().replace(/^["']|["']$/g, '')
    const supabase = createClient(cleanUrl, cleanKey)

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

    // Derive extension from MIME type
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/avif': 'avif',
    }
    const ext = mimeToExt[normalizedType] ?? 'jpg'
    const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    console.log(`[Upload API] Uploading ${file.name} (${file.size} bytes, ${normalizedType}) -> ${fileName} at ${cleanUrl}`)

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, buffer, {
        contentType: normalizedType,
        upsert: true,
      })

    if (error) {
      console.error('[Upload API Error]', error)
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
    }

    if (!data?.path) {
      return NextResponse.json({ error: 'Upload succeeded but no path returned' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path)

    console.log(`[Upload API Success] ${fileName} -> ${publicUrl}`)
    return NextResponse.json({ url: publicUrl })
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
