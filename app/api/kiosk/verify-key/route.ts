import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json()
    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Key required' }, { status: 400 })
    }

    const { data: keys, error } = await supabaseAdmin
      .from('kiosk_keys')
      .select('*')
      .eq('active', true)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    for (const k of (keys as any[]) || []) {
      const stored = ((k as any).key_hash || '').trim()
      let ok = false
      if (/^\$2[aby]\$/.test(stored)) {
        ok = await bcrypt.compare(key, stored)
      } else {
        ok = key.trim() === stored
      }
      if (ok) return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid key' }, { status: 401 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
