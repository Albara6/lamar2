import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface MenuItemSize {
  id: string
  menu_item_id: string
  name: string
  price_modifier: number
  is_default: boolean
  sort_order: number
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data: sizes, error } = await supabaseAdmin
      .from('menu_item_sizes')
      .select('*')
      .eq('menu_item_id', params.id)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Failed to fetch menu item sizes:', error)
      return NextResponse.json({ error: 'Failed to fetch menu item sizes' }, { status: 500 })
    }

    return NextResponse.json({ sizes: sizes || [] })
  } catch (error) {
    console.error('Failed to fetch menu item sizes:', error)
    return NextResponse.json({ error: 'Failed to fetch menu item sizes' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
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
      .insert({
        menu_item_id: params.id,
        name: body.name,
        price_modifier: body.price_modifier,
        is_default: body.is_default,
        sort_order: body.sort_order || 0
      })
      .select()
      .single()

    if (error || !size) {
      console.error('Failed to create menu item size:', error)
      return NextResponse.json({ error: 'Failed to create menu item size' }, { status: 500 })
    }

    return NextResponse.json({ size })
  } catch (error) {
    console.error('Failed to create menu item size:', error)
    return NextResponse.json({ error: 'Failed to create menu item size' }, { status: 500 })
  }
}

// Update a size for a menu item
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: 'Size ID is required' }, { status: 400 })
    }
    const { data: size, error } = await supabaseAdmin
      .from('menu_item_sizes')
      .update({
        name: body.name,
        price_modifier: body.price_modifier,
        is_default: body.is_default,
        sort_order: body.sort_order
      })
      .eq('id', body.id)
      .eq('menu_item_id', params.id)
      .select()
      .single()
    if (error || !size) {
      return NextResponse.json({ error: 'Failed to update size' }, { status: 500 })
    }
    return NextResponse.json({ size })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update size' }, { status: 500 })
  }
}

// Delete a size for a menu item
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: 'Size ID is required' }, { status: 400 })
    }
    const { error } = await supabaseAdmin
      .from('menu_item_sizes')
      .delete()
      .eq('id', body.id)
      .eq('menu_item_id', params.id)
    if (error) {
      return NextResponse.json({ error: 'Failed to delete size' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete size' }, { status: 500 })
  }
} 