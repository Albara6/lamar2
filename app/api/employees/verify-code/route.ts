import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    const pin = typeof code === 'string' ? code.trim() : ''
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    const { data: employees, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('active', true)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    for (const emp of (employees as any[]) || []) {
      if (await bcrypt.compare(pin, (emp as any).code_hash)) {
        return NextResponse.json({
          employee: { id: (emp as any).id, name: (emp as any).name }
        })
      }
    }

    return NextResponse.json({ error: 'Invalid code' }, { status: 401 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
