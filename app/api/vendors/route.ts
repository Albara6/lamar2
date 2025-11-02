import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'vendor' | 'deposit_source' | null

    let query = supabaseAdmin.from('vendors').select('id, name, type, active').eq('active', true)
    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query.order('name')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ vendors: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
