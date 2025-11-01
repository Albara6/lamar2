import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employee_id = searchParams.get('employee_id')
    if (!employee_id) return NextResponse.json({ error: 'employee_id required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('time_entries')
      .select('*')
      .eq('employee_id', employee_id)
      .order('clock_in', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ entries: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
