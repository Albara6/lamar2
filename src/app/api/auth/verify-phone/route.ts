import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Function to format phone number to E.164 format
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // If it starts with 1 and is 11 digits, it's already US format
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`
  }
  
  // If it's 10 digits, assume US and add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  }
  
  // If it already starts with country code but no +, add +
  if (cleaned.length > 10 && !phone.startsWith('+')) {
    return `+${cleaned}`
  }
  
  // If it already has +, return as is
  if (phone.startsWith('+')) {
    return phone
  }
  
  // Default: assume US and add +1
  return `+1${cleaned}`
}

// POST /api/auth/verify-phone
// body: { phone, token }
export async function POST(request: Request) {
  try {
    const { phone, token } = await request.json()

    if (!phone || !token) {
      return NextResponse.json({ error: 'Missing phone or verification code' }, { status: 400 })
    }

    // Format phone number to E.164 format
    const formattedPhone = formatPhoneNumber(phone)

    // Verify the OTP
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
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