import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
// @ts-ignore
const twilio = require('twilio')

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber || phoneNumber.length !== 10) {
      return NextResponse.json(
        { error: 'Valid 10-digit phone number is required' },
        { status: 400 }
      )
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // In development, skip database storage
    if (process.env.NODE_ENV !== 'development') {
      // Store verification code in database
      const { error: dbError } = await supabaseAdmin
        .from('phone_verifications')
        .insert({
          phone_number: phoneNumber,
          verification_code: verificationCode,
          expires_at: expiresAt,
          is_used: false
        })

      if (dbError) {
        console.error('Database error:', dbError)
        return NextResponse.json(
          { error: 'Failed to store verification code' },
          { status: 500 }
        )
      }
    }

    // Always return the code in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`DEV MODE: Verification code for ${phoneNumber}: ${verificationCode}`)
      return NextResponse.json({ 
        success: true,
        message: 'Verification code sent successfully',
        devCode: verificationCode // Only for development
      })
    }

    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.log(`DEMO MODE: Verification code for ${phoneNumber}: ${verificationCode}`)
      return NextResponse.json({ 
        success: true,
        message: 'Verification code sent successfully',
        devCode: verificationCode // For demo purposes
      })
    }

    // Send SMS via Twilio in production
    try {
      const toNumber = phoneNumber.startsWith('+1') ? phoneNumber : `+1${phoneNumber}`
      console.log(`Attempting to send SMS from ${process.env.TWILIO_PHONE_NUMBER} to ${toNumber}`)

      await client.messages.create({
        body: `Your Crazy Chicken verification code is: ${verificationCode}. This code expires in 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: toNumber
      })

      console.log(`Verification code sent to ${phoneNumber}`)
      
      return NextResponse.json({ 
        success: true,
        message: 'Verification code sent successfully' 
      })
    } catch (smsError: any) {
      console.error('SMS sending error:', smsError)
      console.error('Error details:', {
        code: smsError.code,
        message: smsError.message,
        status: smsError.status,
        moreInfo: smsError.moreInfo
      })
      return NextResponse.json(
        { error: 'Failed to send verification code: ' + smsError.message },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Send verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 