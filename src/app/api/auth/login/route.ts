import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/auth/login
// body: { email, password }
export async function POST (request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ session: data.session, user: data.user })
  } catch (e) {
    console.error('Login route error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 