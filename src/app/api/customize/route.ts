import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email/EmailService'
import { createClient } from '@supabase/supabase-js'

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

      // Upload to Supabase Storage if configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && supabaseKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseKey)
          const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
          // Place in a dedicated "customization-requests" folder
          const storagePath = `customization-requests/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`

          console.log(`Uploading customize attachment ${storagePath} to Supabase...`)
          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(storagePath, fileBuffer, {
              contentType: file.type || 'application/octet-stream',
              upsert: true
            })

          if (error) {
            console.error('Supabase customize file upload error:', error.message)
          } else if (data?.path) {
            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(data.path)

            fileUrl = publicUrl
            console.log('Customize file uploaded successfully:', fileUrl)
          }
        } catch (storageErr) {
          console.error('Supabase storage upload failed:', storageErr)
          // Fallback to sending mail without publicUrl, just the attachment
        }
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
