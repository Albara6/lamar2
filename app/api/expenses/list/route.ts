import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from('expenses')
      .select('id, date, amount, payment_type, notes, receipt_url, vendors(name), users(name)')
      .order('date', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ expenses: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
