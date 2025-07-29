import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// POST /api/auth/signup
// body: { name, email, phone, password }
export async function POST (request: Request) {
  try {
    const { name, email, phone, password } = await request.json()

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // 1. Create the user (email + password + phone)
    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      phone,
      email_confirm: false,
      phone_confirm: false
    })

    if (createError || !createdUser) {
      console.error('Signup error:', createError)
      return NextResponse.json({ error: createError?.message || 'Failed to create user' }, { status: 500 })
    }

    // 2. Insert into public.customers with matching id
    const { error: insertError } = await supabaseAdmin.from('customers').insert({
      id: createdUser.user?.id,
      name,
      email,
      phone
    })
    if (insertError) {
      console.error('Customer insert error:', insertError)
      // Rollback user creation
      await supabaseAdmin.auth.admin.deleteUser(createdUser.user?.id as string)
      return NextResponse.json({ error: 'Failed to store customer profile' }, { status: 500 })
    }

    // 3. Auto-sign-in to return a session (optional)
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (signInErr) {
      console.error('Auto sign-in failed', signInErr)
      return NextResponse.json({ user: createdUser.user }, { status: 201 })
    }

    return NextResponse.json({ session: signInData.session, user: signInData.user }, { status: 201 })
  } catch (e) {
    console.error('Signup route error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 