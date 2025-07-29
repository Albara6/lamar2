import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

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

// POST /api/auth/signup
// body: { name, email, phone, password }
export async function POST (request: Request) {
  try {
    const { name, email, phone, password } = await request.json()

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Format phone number to E.164 format
    const formattedPhone = formatPhoneNumber(phone)
    
    // Validate phone number format
    if (!formattedPhone.match(/^\+[1-9]\d{1,14}$/)) {
      return NextResponse.json({ error: 'Invalid phone number format. Please use a valid phone number.' }, { status: 400 })
    }

    // 1. Create the user with email confirmation disabled but phone confirmation enabled
    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      phone: formattedPhone,
      email_confirm: true, // Auto-confirm email to allow login
      phone_confirm: false, // Phone needs to be verified via OTP
      user_metadata: {
        name: name
      }
    })

    if (createError || !createdUser) {
      console.error('Signup error:', createError)
      return NextResponse.json({ error: createError?.message || 'Failed to create user' }, { status: 500 })
    }

    // 1.5. Ensure email is confirmed by updating the user
    if (createdUser.user && !createdUser.user.email_confirmed_at) {
      await supabaseAdmin.auth.admin.updateUserById(createdUser.user.id, {
        email_confirm: true
      })
    }

    // 2. Insert into public.customers with matching id
    const { error: insertError } = await supabaseAdmin.from('customers').insert({
      id: createdUser.user?.id,
      name,
      email,
      phone: formattedPhone
    })
    if (insertError) {
      console.error('Customer insert error:', insertError)
      // Rollback user creation
      await supabaseAdmin.auth.admin.deleteUser(createdUser.user?.id as string)
      return NextResponse.json({ error: 'Failed to store customer profile' }, { status: 500 })
    }

    // 3. Send phone verification OTP
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        channel: 'sms'
      }
    })

    if (otpError) {
      console.error('OTP send error:', otpError)
      // Don't rollback user creation, just let them know to verify later
    }

    // 4. Auto-sign-in to return a session (since email is confirmed)
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (signInErr) {
      console.error('Auto sign-in failed', signInErr)
      return NextResponse.json({ 
        user: createdUser.user, 
        message: 'Account created! Please verify your phone number.' 
      }, { status: 201 })
    }

    return NextResponse.json({ 
      session: signInData.session, 
      user: signInData.user,
      message: 'Account created! Please verify your phone number to skip verification at checkout.'
    }, { status: 201 })
  } catch (e) {
    console.error('Signup route error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 