import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/auth/confirm-email
// body: { email }
export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    // Find user by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      return NextResponse.json({ error: 'Failed to find user' }, { status: 500 })
    }

    const user = users.users.find((u: any) => u.email === email)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Confirm the user's email
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirm: true
    })

    if (updateError) {
      return NextResponse.json({ error: 'Failed to confirm email' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Email confirmed successfully! You can now login.' })
  } catch (e) {
    console.error('Email confirmation error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 