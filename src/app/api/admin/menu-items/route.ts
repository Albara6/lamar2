import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching for real-time menu updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const { data: menuItems, error } = await supabaseAdmin
      .from('menu_items')
      .select(`
        *,
        menu_item_sizes(*),
        menu_item_modifier_groups(
          *,
          modifier_groups(
            *,
            modifier_items(*)
          )
        )
      `)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Failed to fetch menu items:', error)
      return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
    }

    // Map database fields to frontend expected fields
    const mappedMenuItems = (menuItems || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category_id: item.category, // map category to category_id
      image_url: item.image_url,
      price: item.base_price, // map base_price to price
      is_available: item.is_available,
      display_order: item.sort_order, // map sort_order to display_order
      menu_item_sizes: item.menu_item_sizes || [],
      menu_item_modifier_groups: item.menu_item_modifier_groups || []
    }))

    const response = NextResponse.json({ menuItems: mappedMenuItems })
    
    // Add aggressive cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Failed to fetch menu items:', error)
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { data: menuItem, error } = await supabaseAdmin
      .from('menu_items')
      .insert({
        name: body.name,
        description: body.description,
        category: body.category_id, // map category_id to category
        base_price: body.price, // map price to base_price
        image_url: body.image_url,
        is_available: body.is_available,
        sort_order: body.display_order || 0 // map display_order to sort_order
      })
      .select()
      .single()

    if (error || !menuItem) {
      console.error('Failed to create menu item:', error)
      return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
    }

    // Map back to frontend expected format
    const mappedMenuItem = {
      id: menuItem.id,
      name: menuItem.name,
      description: menuItem.description,
      category_id: menuItem.category,
      image_url: menuItem.image_url,
      price: menuItem.base_price,
      is_available: menuItem.is_available,
      display_order: menuItem.sort_order,
      menu_item_sizes: [],
      menu_item_modifier_groups: []
    }
    
    return NextResponse.json({ menuItem: mappedMenuItem })
  } catch (error) {
    console.error('Failed to create menu item:', error)
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
  }
} 