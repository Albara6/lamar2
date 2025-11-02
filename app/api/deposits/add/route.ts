import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vendor_id, amount, date, notes, created_by_user_id } = body || {}

    if (!vendor_id || !amount || !date || !created_by_user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await (supabaseAdmin as any)
      .from('deposits')
      .insert({
        vendor_id,
        amount: Number(amount),
        date,
        notes: notes || null,
        created_by_user_id,
      } as any)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
