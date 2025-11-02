import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vendor_id, user_id, amount, payment_type, date, notes, receipt_url } = body || {}

    if (!vendor_id || !user_id || !amount || !payment_type || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await (supabaseAdmin as any)
      .from('expenses')
      .insert({
        vendor_id,
        user_id,
        amount: Number(amount),
        payment_type,
        date,
        notes: notes || null,
        receipt_url: receipt_url || null,
      } as any)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
