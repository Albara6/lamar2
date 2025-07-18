import { NextResponse } from 'next/server'
import twilio from 'twilio'

export async function POST(request: Request) {
  try {
    const { phone, message } = await request.json()

    if (!phone || !message) {
      return NextResponse.json({ error: 'phone and message are required' }, { status: 400 })
    }

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
      to: phone.startsWith('+') ? phone : `+1${phone}`, // Default to US country code if not supplied
      from: fromPhone
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to send SMS:', error)
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
  }
} 