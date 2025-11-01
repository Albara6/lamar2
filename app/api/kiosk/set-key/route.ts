import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { secret, name } = await request.json()
    if (!secret || typeof secret !== 'string') return NextResponse.json({ error: 'secret required' }, { status: 400 })
    const key_hash = await bcrypt.hash(secret, 10)

    // deactivate old
    await supabaseAdmin.from('kiosk_keys').update({ active: false }).eq('active', true)
    // insert new
    const { error } = await supabaseAdmin.from('kiosk_keys').insert({ name: name || 'Default', key_hash, active: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
