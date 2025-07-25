import { NextResponse } from 'next/server'
import twilio from 'twilio'

export async function POST(request: Request) {
  try {
    const { phone, message } = await request.json()

    if (!phone || !message) {
      return NextResponse.json({ error: 'phone and message are required' }, { status: 400 })
    }

    // Sanitize phone: keep digits only
    const digitsOnly = phone.replace(/\D/g, '')

    // Basic validation: US 10-digit numbers only (extend as needed)
    if (digitsOnly.length !== 10) {
      console.warn('SMS skipped – invalid phone:', phone)
      return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 })
    }

    const toNumber = `+1${digitsOnly}`

    const accountSid = process.env.TWILIO_ACCOUNT_SID!
    const authToken = process.env.TWILIO_AUTH_TOKEN!
    const fromPhone = process.env.TWILIO_PHONE_NUMBER!

    if (!accountSid || !authToken || !fromPhone) {
      console.error('Missing Twilio environment variables')
      return NextResponse.json({ error: 'SMS service not configured' }, { status: 500 })
    }

    const client = twilio(accountSid, authToken)

    await client.messages.create({
      body: message,
      to: toNumber,
      from: fromPhone
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to send SMS:', error)
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
  }
} 