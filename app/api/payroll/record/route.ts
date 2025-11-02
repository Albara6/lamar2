import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { employee_id, week_start, week_end, hours, hourly_rate, expenses_total, gross_pay, net_pay } = await request.json()

    if (!employee_id || !week_start || !week_end) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Prevent duplicate payments for the same employee and week
    const { data: existing, error: existErr } = await (supabaseAdmin as any)
      .from('employee_paychecks')
      .select('id')
      .eq('employee_id', employee_id)
      .eq('week_start', week_start)
      .eq('week_end', week_end)
      .limit(1)
    if (existErr) return NextResponse.json({ error: existErr.message }, { status: 500 })
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'This week is already paid for this employee.' }, { status: 409 })
    }

    const payload = {
      employee_id,
      week_start,
      week_end,
      hours: Number(hours || 0),
      hourly_rate: Number(hourly_rate || 0),
      gross_pay: Number(gross_pay || (Number(hours || 0) * Number(hourly_rate || 0))),
      expenses_total: Number(expenses_total || 0),
      net_pay: Number(net_pay || ((Number(hours || 0) * Number(hourly_rate || 0)) - Number(expenses_total || 0))),
    }

    const { error } = await (supabaseAdmin as any).from('employee_paychecks').insert(payload as any)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
