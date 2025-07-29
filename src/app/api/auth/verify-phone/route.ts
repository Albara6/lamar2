import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/auth/verify-phone
// body: { phone, token }
export async function POST(request: Request) {
  try {
    const { phone, token } = await request.json()

    if (!phone || !token) {
      return NextResponse.json({ error: 'Missing phone or verification code' }, { status: 400 })
    }

    // Verify the OTP
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      session: data.session, 
      user: data.user,
      message: 'Phone number verified successfully!'
    })
  } catch (e) {
    console.error('Phone verification error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 