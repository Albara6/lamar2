import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/customer/profile
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error) {
      console.error('Failed to fetch customer:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    return NextResponse.json({ customer })
  } catch (e) {
    console.error('Profile route error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/customer/profile
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, email, phone } = await request.json()
    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Update customer record
    const { error: updateError } = await supabaseAdmin
      .from('customers')
      .update({ name, email, phone })
      .eq('id', session.user.id)

    if (updateError) {
      console.error('Failed to update customer:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // 2. If email/phone changed, trigger re-verification via Supabase Auth
    const needsEmailVerify = email !== session.user.email
    const needsPhoneVerify = phone !== session.user.phone

    if (needsEmailVerify || needsPhoneVerify) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        session.user.id,
        {
          email: needsEmailVerify ? email : undefined,
          phone: needsPhoneVerify ? phone : undefined,
          email_confirm: needsEmailVerify ? false : undefined,
          phone_confirm: needsPhoneVerify ? false : undefined
        }
      )

      if (authError) {
        console.error('Failed to update auth:', authError)
        return NextResponse.json({ error: 'Failed to update contact info' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Profile update error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 