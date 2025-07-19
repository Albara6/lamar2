import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PUT(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
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
      .update({
        name: body.name,
        price: body.price,
        is_default: body.is_default,
        sort_order: body.sort_order || 0
      })
      .eq('id', params.itemId)
      .eq('group_id', params.id)
      .select()
      .single()

    if (error || !item) {
      console.error('Failed to update modifier item:', error)
      return NextResponse.json({ error: 'Failed to update modifier item' }, { status: 500 })
    }

    return NextResponse.json({ modifierItem: item })
  } catch (error) {
    console.error('Failed to update modifier item:', error)
    return NextResponse.json({ error: 'Failed to update modifier item' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('modifier_items')
      .delete()
      .eq('id', params.itemId)
      .eq('group_id', params.id)

    if (error) {
      console.error('Failed to delete modifier item:', error)
      return NextResponse.json({ error: 'Failed to delete modifier item' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete modifier item:', error)
    return NextResponse.json({ error: 'Failed to delete modifier item' }, { status: 500 })
  }
} 