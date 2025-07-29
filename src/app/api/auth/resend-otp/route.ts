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

// POST /api/auth/resend-otp
// body: { phone }
export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Missing phone number' }, { status: 400 })
    }

    // Format phone number to E.164 format
    const formattedPhone = formatPhoneNumber(phone)
    
    // Validate phone number format
    if (!formattedPhone.match(/^\+[1-9]\d{1,14}$/)) {
      return NextResponse.json({ error: 'Invalid phone number format. Please use a valid phone number.' }, { status: 400 })
    }

    // Send OTP via SMS
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
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