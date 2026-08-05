import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email/EmailService'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dp1vaoeb',
  api_key: process.env.CLOUDINARY_API_KEY || '546568288193999',
  api_secret: process.env.CLOUDINARY_API_SECRET || '8v441vRRl6vZYc4Q_-7IQo_FgS4',
  secure: true,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const clientType = formData.get('clientType') as 'individual' | 'business'
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const company = formData.get('company') as string
    const message = formData.get('message') as string
    const file = formData.get('file') as File | null

    if (!name || !email || !clientType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let fileBuffer: Buffer | undefined
    let fileName: string | undefined
    let fileType: string | undefined
    let fileUrl: string | undefined

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      fileBuffer = Buffer.from(bytes)
      fileName = file.name
      fileType = file.type

      try {
        console.log(`Uploading customize attachment ${fileName} to Cloudinary...`)
        const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'customization-requests',
              resource_type: 'auto',
            },
            (err, res) => {
              if (err || !res) reject(err || new Error('Upload to Cloudinary failed'))
              else resolve({ secure_url: res.secure_url })
            }
          )
          uploadStream.end(fileBuffer)
        })

        fileUrl = result.secure_url
        console.log('Customize file uploaded successfully to Cloudinary:', fileUrl)
      } catch (storageErr) {
        console.error('Cloudinary customize storage upload failed:', storageErr)
        // Fallback to sending mail without publicUrl, just the attachment
      }
    }

    const success = await emailService.sendCustomizeInquiry({
      clientType,
      name,
      email,
      phone: phone || undefined,
      company: company || undefined,
      message: message || undefined,
      fileName,
      fileBuffer,
      fileType,
      fileUrl,
    })

    if (!success) {
      return NextResponse.json({ error: 'Failed to send inquiry emails' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Customize API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
