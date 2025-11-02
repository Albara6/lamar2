import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function toDateOnly(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    if (!start || !end) return NextResponse.json({ error: 'start and end required' }, { status: 400 })

    const startDate = new Date(start)
    const endDate = new Date(end)
    // Use [start, endExclusive) range to include entire end day
    const endExclusive = new Date(endDate)
    endExclusive.setDate(endExclusive.getDate() + 1)

    const [{ data: employees }, { data: entries }, { data: exps }] = await Promise.all([
      (supabaseAdmin as any).from('employees').select('*').eq('active', true),
      (supabaseAdmin as any)
        .from('time_entries')
        .select('*')
        .gte('clock_in', startDate.toISOString())
        .lt('clock_in', endExclusive.toISOString()),
      (supabaseAdmin as any)
        .from('employee_expenses')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lt('timestamp', endExclusive.toISOString()),
    ])

    const employeeMap: Record<string, any> = {}
    for (const emp of employees || []) {
      employeeMap[emp.id] = {
        employee: { id: emp.id, name: emp.name, hourly_rate: emp.hourly_rate },
        entries: [] as any[],
        expenses: [] as any[],
        totalHours: 0,
        expensesTotal: 0,
      }
    }

    for (const e of entries || []) {
      const bucket = employeeMap[e.employee_id]
      if (!bucket) continue
      bucket.entries.push(e)
      if (e.clock_in && e.clock_out) {
        const startTs = new Date(e.clock_in).getTime()
        const endTs = new Date(e.clock_out).getTime()
        const hours = Math.max(0, (endTs - startTs) / 3600000)
        bucket.totalHours += hours
      }
    }

    for (const x of exps || []) {
      const bucket = employeeMap[x.employee_id]
      if (!bucket) continue
      bucket.expenses.push(x)
      bucket.expensesTotal += Number(x.amount || 0)
    }

    const result = Object.values(employeeMap).map((b: any) => ({
      employee: b.employee,
      totalHours: Number(b.totalHours.toFixed(2)),
      expensesTotal: Number(b.expensesTotal.toFixed(2)),
      entries: b.entries,
      expenses: b.expenses,
      start: toDateOnly(startDate).toISOString().slice(0, 10),
      end: toDateOnly(endDate).toISOString().slice(0, 10),
    }))

    return NextResponse.json({ payroll: result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
