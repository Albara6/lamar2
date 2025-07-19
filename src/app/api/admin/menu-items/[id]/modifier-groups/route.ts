import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data: menuItemModifierGroups, error } = await supabaseAdmin
      .from('menu_item_modifier_groups')
      .select(`
        *,
        modifier_groups (
          *,
          modifier_items (*)
        )
      `)
      .eq('menu_item_id', params.id)

    if (error) {
      console.error('Failed to fetch menu item modifier groups:', error)
      return NextResponse.json({ error: 'Failed to fetch menu item modifier groups' }, { status: 500 })
    }

    return NextResponse.json({ menuItemModifierGroups: menuItemModifierGroups || [] })
  } catch (error) {
    console.error('Failed to fetch menu item modifier groups:', error)
    return NextResponse.json({ error: 'Failed to fetch menu item modifier groups' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    // Handle size ID properly:
    // - If menu_item_size_id is explicitly "all", convert to null (applies to all sizes)
    // - If menu_item_size_id is a valid UUID, use it (applies to specific size)  
    // - If menu_item_size_id is undefined, empty, or null, treat as null (applies to all sizes)
    let sizeId = null
    if (body.menu_item_size_id && body.menu_item_size_id !== 'all' && body.menu_item_size_id !== '') {
      sizeId = body.menu_item_size_id
    }

    // Check if this association already exists
    const { data: existing } = await supabaseAdmin
      .from('menu_item_modifier_groups')
      .select('id')
      .eq('menu_item_id', params.id)
      .eq('menu_item_size_id', sizeId)
      .eq('modifier_group_id', body.modifier_group_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'This modifier group is already associated with this menu item' }, { status: 400 })
    }

    const { data: menuItemModifierGroup, error } = await supabaseAdmin
      .from('menu_item_modifier_groups')
      .insert({
        menu_item_id: params.id,
        menu_item_size_id: sizeId,
        modifier_group_id: body.modifier_group_id
      })
      .select(`
        *,
        modifier_groups (
          *,
          modifier_items (*)
        )
      `)
      .single()

    if (error || !menuItemModifierGroup) {
      console.error('Failed to associate modifier group with menu item:', error)
      return NextResponse.json({ error: 'Failed to associate modifier group with menu item' }, { status: 500 })
    }

    return NextResponse.json({ menuItemModifierGroup })
  } catch (error) {
    console.error('Failed to associate modifier group with menu item:', error)
    return NextResponse.json({ error: 'Failed to associate modifier group with menu item' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    // Validate required fields and ensure they're not empty strings
    if (!body.modifier_group_id || body.modifier_group_id === '') {
      return NextResponse.json({ error: 'Valid modifier_group_id is required' }, { status: 400 })
    }

    // If it's null, undefined, empty string, or "null" string, use IS NULL in query
    const isNullSize = !body.menu_item_size_id || body.menu_item_size_id === '' || body.menu_item_size_id === 'null'

    // Log the values for debugging
    console.log('Attempting to delete modifier group with:', {
      menu_item_id: params.id,
      menu_item_size_id: body.menu_item_size_id,
      isNullSize,
      modifier_group_id: body.modifier_group_id
    })

    // Build the query to check for duplicates
    let query = supabaseAdmin
      .from('menu_item_modifier_groups')
      .select('id')
      .eq('menu_item_id', params.id)
      .eq('modifier_group_id', body.modifier_group_id)

    // Use IS NULL for null values, otherwise use eq
    if (isNullSize) {
      query = query.is('menu_item_size_id', null)
    } else {
      query = query.eq('menu_item_size_id', body.menu_item_size_id)
    }

    // Get all matching associations
    const { data: existing, error: checkError } = await query

    if (checkError) {
      console.error('Error checking modifier group associations:', checkError)
      return NextResponse.json({ error: 'Failed to verify modifier group association' }, { status: 500 })
    }

    if (!existing || existing.length === 0) {
      console.log('No associations found for:', {
        menu_item_id: params.id,
        menu_item_size_id: body.menu_item_size_id,
        isNullSize,
        modifier_group_id: body.modifier_group_id
      })
      return NextResponse.json({ error: 'Modifier group is not associated with this menu item' }, { status: 404 })
    }

    console.log(`Found ${existing.length} associations to delete`)

    // Build the delete query to remove ALL matching associations
    let deleteQuery = supabaseAdmin
      .from('menu_item_modifier_groups')
      .delete()
      .eq('menu_item_id', params.id)
      .eq('modifier_group_id', body.modifier_group_id)

    // Use IS NULL for null values, otherwise use eq
    if (isNullSize) {
      deleteQuery = deleteQuery.is('menu_item_size_id', null)
    } else {
      deleteQuery = deleteQuery.eq('menu_item_size_id', body.menu_item_size_id)
    }

    const { error } = await deleteQuery

    if (error) {
      console.error('Failed to remove modifier group from menu item:', error)
      return NextResponse.json({ error: 'Failed to remove modifier group from menu item' }, { status: 500 })
    }

    return NextResponse.json({ success: true, deletedCount: existing.length })
  } catch (error) {
    console.error('Failed to remove modifier group from menu item:', error)
    return NextResponse.json({ error: 'Failed to remove modifier group from menu item' }, { status: 500 })
  }
} 