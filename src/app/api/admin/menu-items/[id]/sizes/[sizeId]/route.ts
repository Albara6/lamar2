import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PUT(
  request: Request,
  { params }: { params: { id: string; sizeId: string } }
) {
  try {
    const body = await request.json()

    // If this is marked as default, unset any existing default sizes
    if (body.is_default) {
      await supabaseAdmin
        .from('menu_item_sizes')
        .update({ is_default: false })
        .eq('menu_item_id', params.id)
    }

    const { data: size, error } = await supabaseAdmin
      .from('menu_item_sizes')
      .update({
        name: body.name,
        price_modifier: body.price_modifier,
        is_default: body.is_default,
        sort_order: body.sort_order || 0
      })
      .eq('id', params.sizeId)
      .eq('menu_item_id', params.id)
      .select()
      .single()

    if (error || !size) {
      console.error('Failed to update menu item size:', error)
      return NextResponse.json({ error: 'Failed to update menu item size' }, { status: 500 })
    }

    return NextResponse.json({ size })
  } catch (error) {
    console.error('Failed to update menu item size:', error)
    return NextResponse.json({ error: 'Failed to update menu item size' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; sizeId: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('menu_item_sizes')
      .delete()
      .eq('id', params.sizeId)
      .eq('menu_item_id', params.id)

    if (error) {
      console.error('Failed to delete menu item size:', error)
      return NextResponse.json({ error: 'Failed to delete menu item size' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete menu item size:', error)
    return NextResponse.json({ error: 'Failed to delete menu item size' }, { status: 500 })
  }
} 