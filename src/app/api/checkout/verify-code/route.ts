import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { phoneNumber, verificationCode } = await request.json()

    if (!phoneNumber || !verificationCode) {
      return NextResponse.json(
        { error: 'Phone number and verification code are required' },
        { status: 400 }
      )
    }

    if (verificationCode.length !== 6) {
      return NextResponse.json(
        { error: 'Verification code must be 6 digits' },
        { status: 400 }
      )
    }

    // In development or demo mode, accept any 6-digit code
    if (process.env.NODE_ENV === 'development' || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      // Skip verification in development/demo mode
    } else {
      // Find the most recent unused verification code for this phone number
      const { data: verification, error: verifyError } = await supabaseAdmin
        .from('phone_verifications')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('verification_code', verificationCode)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (verifyError || !verification) {
        return NextResponse.json(
          { error: 'Invalid or expired verification code' },
          { status: 400 }
        )
      }

      // Mark the verification code as used
      const { error: updateError } = await supabaseAdmin
        .from('phone_verifications')
        .update({ is_used: true })
        .eq('id', verification.id)

      if (updateError) {
        console.error('Error marking verification as used:', updateError)
      }
    }

    // Check if this is a returning customer
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single()

    let customerData = null

    if (customer && !customerError) {
      // Returning customer - mark as verified and return their info
      const { error: customerUpdateError } = await supabaseAdmin
        .from('customers')
        .update({ is_verified: true })
        .eq('id', customer.id)

      if (customerUpdateError) {
        console.error('Error updating customer verification:', customerUpdateError)
      }

      customerData = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        isReturning: true
      }
    } else {
      // New customer - create a basic record
      const { data: newCustomer, error: createError } = await supabaseAdmin
        .from('customers')
        .insert({
          phone_number: phoneNumber,
          is_verified: true
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating new customer:', createError)
        return NextResponse.json(
          { error: 'Failed to create customer record' },
          { status: 500 }
        )
      }

      customerData = {
        id: newCustomer.id,
        name: '',
        email: '',
        isReturning: false
      }
    }

    return NextResponse.json({
      success: true,
      verified: true,
      customer: customerData
    })

  } catch (error: any) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 