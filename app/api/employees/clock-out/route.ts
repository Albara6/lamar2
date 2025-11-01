import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function getEmployeeByCode(code: string) {
  const { data: employees } = await supabaseAdmin
    .from('employees')
    .select('*')
    .eq('active', true)
  for (const e of (employees as any[]) || []) {
    if (await bcrypt.compare(code, (e as any).code_hash)) return e as any
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    const pin = typeof code === 'string' ? code.trim() : ''
    if (!/^\d{4}$/.test(pin)) return NextResponse.json({ error: 'Invalid code' }, { status: 400 })

    const employee = await getEmployeeByCode(pin)
    if (!employee) return NextResponse.json({ error: 'Invalid code' }, { status: 401 })

    // Find latest open entry
    const { data: openEntries, error: fetchError } = await supabaseAdmin
      .from('time_entries')
      .select('*')
      .eq('employee_id', employee.id)
      .is('clock_out', null)
      .order('clock_in', { ascending: false })
      .limit(1)

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

    if (!openEntries || openEntries.length === 0) {
      return NextResponse.json({ error: 'No active shift' }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('time_entries')
      .update({ clock_out: new Date().toISOString() })
      .eq('id', openEntries[0].id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    return NextResponse.json({ success: true, employee: { id: employee.id, name: employee.name } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
