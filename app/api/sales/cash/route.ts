import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function dayWindow3am(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const start = new Date(d)
  start.setHours(3, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

    const { start, end } = dayWindow3am(date)

    const [{ data: drops }, { data: cashExp }] = await Promise.all([
      (supabaseAdmin as any)
        .from('safe_drops')
        .select('amount, timestamp')
        .eq('confirmed', true)
        .gte('timestamp', start.toISOString())
        .lt('timestamp', end.toISOString()),
      (supabaseAdmin as any)
        .from('expenses')
        .select('amount')
        .eq('payment_type', 'cash')
        .eq('date', date),
    ])

    const totalDrops = (drops || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
    const totalCashExpenses = (cashExp || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0)

    return NextResponse.json({ cashSales: Number((totalDrops + totalCashExpenses).toFixed(2)) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
