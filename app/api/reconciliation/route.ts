import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    if (!start || !end) return NextResponse.json({ error: 'start and end required' }, { status: 400 })

    const [{ data: sales }, { data: checks }, { data: deps }] = await Promise.all([
      (supabaseAdmin as any)
        .from('daily_sales')
        .select('card_sales')
        .gte('date', start)
        .lte('date', end),
      (supabaseAdmin as any)
        .from('expenses')
        .select('amount')
        .gte('date', start)
        .lte('date', end)
        .eq('payment_type', 'check'),
      (supabaseAdmin as any)
        .from('deposits')
        .select('amount')
        .gte('date', start)
        .lte('date', end),
    ])

    const totalCardSales = (sales || []).reduce((s: number, r: any) => s + Number(r.card_sales || 0), 0)
    const totalCheckExpenses = (checks || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
    const totalDeposits = (deps || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0)

    const expectedDeposits = totalCardSales + totalCheckExpenses
    const variance = totalDeposits - expectedDeposits

    return NextResponse.json({ expectedDeposits, actualDeposits: totalDeposits, variance })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
