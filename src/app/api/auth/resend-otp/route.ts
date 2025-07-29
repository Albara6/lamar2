import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/auth/resend-otp
// body: { phone }
export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Missing phone number' }, { status: 400 })
    }

    // Send OTP via SMS
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms'
      }
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Verification code sent!' })
  } catch (e) {
    console.error('Resend OTP error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 