import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET () {
  try {
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ session })
  } catch (e) {
    console.error('Session route error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 