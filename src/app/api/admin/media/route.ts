import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { verifyToken } from '@/lib/auth'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dp1vaoeb',
  api_key: process.env.CLOUDINARY_API_KEY || '546568288193999',
  api_secret: process.env.CLOUDINARY_API_SECRET || '8v441vRRl6vZYc4Q_-7IQo_FgS4',
  secure: true,
})

// GET — list all files in Cloudinary (default folder: products)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = verifyToken(token)
    if (!user || !user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || 'products'

    const response = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder ? `${folder}/` : '',
      max_results: 500,
    })

    const files = (response.resources || []).map((r: any) => ({
      id: r.public_id,
      name: r.public_id.split('/').pop() || r.public_id,
      path: r.public_id,
      url: r.secure_url,
      size: r.bytes || 0,
      mimeType: `${r.resource_type}/${r.format || 'jpg'}`,
      createdAt: r.created_at || new Date().toISOString(),
    }))

    return NextResponse.json({ files, folders: [] })
  } catch (error) {
    console.error('Cloudinary media GET error:', error)
    return NextResponse.json({ files: [], folders: [] })
  }
}

// DELETE — remove files from Cloudinary storage
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = verifyToken(token)
    if (!user || !user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { paths } = await request.json()
    if (!paths?.length) return NextResponse.json({ error: 'No paths provided' }, { status: 400 })

    await cloudinary.api.delete_resources(paths)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cloudinary media DELETE error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
