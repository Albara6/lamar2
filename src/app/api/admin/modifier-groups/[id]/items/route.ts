import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ModifierItem {
  id: string
  group_id: string
  name: string
  price: number
  is_default: boolean
  sort_order: number
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data: items, error } = await supabaseAdmin
      .from('modifier_items')
      .select('*')
      .eq('group_id', params.id)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Failed to fetch modifier items:', error)
      return NextResponse.json({ error: 'Failed to fetch modifier items' }, { status: 500 })
    }

    return NextResponse.json({ modifierItems: items || [] })
  } catch (error) {
    console.error('Failed to fetch modifier items:', error)
    return NextResponse.json({ error: 'Failed to fetch modifier items' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    // If this is marked as default and the group is not multi-select,
    // unset any existing default items
    if (body.is_default) {
      const { data: group } = await supabaseAdmin
        .from('modifier_groups')
        .select('max_selections')
        .eq('id', params.id)
        .single()

      if (group && group.max_selections === 1) {
        await supabaseAdmin
          .from('modifier_items')
          .update({ is_default: false })
          .eq('group_id', params.id)
      }
    }

    const { data: item, error } = await supabaseAdmin
      .from('modifier_items')
      .insert({
        group_id: params.id,
        name: body.name,
        price: body.price,
        is_default: body.is_default,
        sort_order: body.sort_order || 0
      })
      .select()
      .single()

    if (error || !item) {
      console.error('Failed to create modifier item:', error)
      return NextResponse.json({ error: 'Failed to create modifier item' }, { status: 500 })
    }

    return NextResponse.json({ modifierItem: item })
  } catch (error) {
    console.error('Failed to create modifier item:', error)
    return NextResponse.json({ error: 'Failed to create modifier item' }, { status: 500 })
  }
} 