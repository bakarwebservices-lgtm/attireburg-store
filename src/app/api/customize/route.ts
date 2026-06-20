import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email/EmailService'

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

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      fileBuffer = Buffer.from(bytes)
      fileName = file.name
      fileType = file.type
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
