import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { employee_id, week_start, week_end, hours, hourly_rate, expenses_total, gross_pay, net_pay, created_by_user_id } = await request.json()

    if (!employee_id || !week_start || !week_end) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Allow multiple partial payments within the same week

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

    // Create paycheck and return id
    const { data: inserted, error } = await (supabaseAdmin as any)
      .from('employee_paychecks')
      .insert(payload as any)
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const paycheckId = inserted.id
    // Mark included time_entries and employee_expenses as paid for this paycheck
    const startDate = new Date(week_start)
    const endDate = new Date(week_end)
    const endExclusive = new Date(endDate)
    endExclusive.setDate(endExclusive.getDate() + 1)

    const [u1, u2] = await Promise.all([
      (supabaseAdmin as any)
        .from('time_entries')
        .update({ paycheck_id: paycheckId } as any)
        .eq('employee_id', employee_id)
        .is('paycheck_id', null)
        .gte('clock_in', startDate.toISOString())
        .lt('clock_in', endExclusive.toISOString()),
      (supabaseAdmin as any)
        .from('employee_expenses')
        .update({ paycheck_id: paycheckId } as any)
        .eq('employee_id', employee_id)
        .is('paycheck_id', null)
        .gte('timestamp', startDate.toISOString())
        .lt('timestamp', endExclusive.toISOString()),
    ])
    if (u1.error) return NextResponse.json({ error: u1.error.message }, { status: 500 })
    if (u2.error) return NextResponse.json({ error: u2.error.message }, { status: 500 })

    // Create a business expense under vendor "Payroll" for net_pay
    // Ensure vendor exists
    const { data: vendorRow } = await (supabaseAdmin as any)
      .from('vendors')
      .select('*')
      .eq('name', 'Payroll')
      .limit(1)
      .maybeSingle()
    let payrollVendorId = vendorRow?.id
    if (!payrollVendorId) {
      const { data: createdVendor, error: createVendErr } = await (supabaseAdmin as any)
        .from('vendors')
        .insert({ name: 'Payroll', type: 'vendor', active: true } as any)
        .select('*')
        .single()
      if (createVendErr) return NextResponse.json({ error: createVendErr.message }, { status: 500 })
      payrollVendorId = createdVendor.id
    }

    // Fetch employee for notes
    const { data: emp } = await (supabaseAdmin as any)
      .from('employees')
      .select('name')
      .eq('id', employee_id)
      .single()

    const notes = `Payroll - ${emp?.name || employee_id} ${week_start} → ${week_end}`
    const expenseDate = week_end
    const { error: expErr } = await (supabaseAdmin as any)
      .from('expenses')
      .insert({
        vendor_id: payrollVendorId,
        user_id: created_by_user_id || null,
        amount: Number(payload.net_pay),
        payment_type: 'check',
        date: expenseDate,
        notes,
      } as any)
    if (expErr) return NextResponse.json({ error: expErr.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
