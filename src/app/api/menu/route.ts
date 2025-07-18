import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering so menu updates are fetched immediately
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Fetch menu items with sizes and modifier groups from database
    const { data: menuItems, error: menuError } = await supabaseAdmin
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
      .eq('is_available', true)
      .order('sort_order', { ascending: true })

    if (menuError) {
      console.error('Failed to fetch menu items:', menuError)
      return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
    }

    // Fetch business settings
    const { data: businessSettings, error: settingsError } = await supabaseAdmin
      .from('business_settings')
      .select('*')
      .limit(1)
      .single()

    if (settingsError) {
      console.error('Failed to fetch business settings:', settingsError)
      return NextResponse.json({ error: 'Failed to fetch business settings' }, { status: 500 })
    }

    // Map database fields to frontend expected format
    const mappedMenuItems = (menuItems || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category, // keep as category for frontend compatibility
      base_price: item.base_price,
      is_available: item.is_available,
      sort_order: item.sort_order,
      image_url: item.image_url,
      menu_item_sizes: item.menu_item_sizes || [],
      menu_item_modifier_groups: item.menu_item_modifier_groups || []
    }))

    return NextResponse.json({
      menuItems: mappedMenuItems,
      businessSettings
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 