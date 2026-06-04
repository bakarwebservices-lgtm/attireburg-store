import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key)
}

// GET — list all files in the product-images bucket
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = verifyToken(token)
    if (!user || !user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || 'products'

    const { data, error } = await supabase.storage
      .from('product-images')
      .list(folder, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })

    if (error) {
      console.error('Supabase list error:', error)
      return NextResponse.json({ files: [] })
    }

    const files = (data || [])
      .filter(f => f.name !== '.emptyFolderPlaceholder')
      .map(f => {
        const path = folder ? `${folder}/${f.name}` : f.name
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(path)

        return {
          id: f.id || f.name,
          name: f.name,
          path,
          url: publicUrl,
          size: f.metadata?.size || 0,
          mimeType: f.metadata?.mimetype || 'image/jpeg',
          createdAt: f.created_at || new Date().toISOString(),
        }
      })

    // Also list any subfolders
    const folders = (data || [])
      .filter(f => !f.id) // folders have no id in Supabase list
      .map(f => f.name)

    return NextResponse.json({ files, folders })
  } catch (error) {
    console.error('Media GET error:', error)
    return NextResponse.json({ files: [], folders: [] })
  }
}

// DELETE — remove a file from storage
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = verifyToken(token)
    if (!user || !user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { paths } = await request.json()
    if (!paths?.length) return NextResponse.json({ error: 'No paths provided' }, { status: 400 })

    const supabase = getSupabase()
    const { error } = await supabase.storage
      .from('product-images')
      .remove(paths)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Media DELETE error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
