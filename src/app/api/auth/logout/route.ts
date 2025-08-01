import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST () {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Logout error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 