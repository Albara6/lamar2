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
    const stored = ((e as any).code_hash || '').trim()
    let ok = false
    if (/^\$2[aby]\$/.test(stored)) {
      ok = await bcrypt.compare(code, stored)
    } else if (/^\d{4}$/.test(stored)) {
      ok = code === stored
    }
    if (ok) return e as any
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { code, amount, description } = await request.json()
    const pin = typeof code === 'string' ? code.trim() : ''
    if (!/^\d{4}$/.test(pin)) return NextResponse.json({ error: 'Invalid code' }, { status: 400 })

    const amt = Number(amount)
    if (!amt || amt <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

    if (!description || typeof description !== 'string') return NextResponse.json({ error: 'Description required' }, { status: 400 })

    const employee = await getEmployeeByCode(pin)
    if (!employee) return NextResponse.json({ error: 'Invalid code' }, { status: 401 })

    const { error: insertError } = await supabaseAdmin
      .from('employee_expenses')
      .insert({ employee_id: employee.id, amount: amt, description } as any)

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    return NextResponse.json({ success: true, employee: { id: employee.id, name: employee.name } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
