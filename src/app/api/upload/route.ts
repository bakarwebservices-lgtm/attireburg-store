import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: `Missing env vars: URL=${!!supabaseUrl}, KEY=${!!supabaseKey}`
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `products/${Date.now()}.${ext}`

    console.log(`Uploading ${fileName} (${buffer.length} bytes) to Supabase...`)

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true
      })

    if (error) {
      console.error('Supabase upload error:', JSON.stringify(error))
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data?.path) {
      return NextResponse.json({ error: 'Upload succeeded but no path returned' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path)

    console.log('Upload successful:', publicUrl)
    return NextResponse.json({ url: publicUrl })

  } catch (error) {
    console.error('Upload exception:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// GET endpoint to test if the route and env vars are working
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return NextResponse.json({
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    url: supabaseUrl,
    keyPreview: supabaseKey ? supabaseKey.substring(0, 20) + '...' : null
  })
}
