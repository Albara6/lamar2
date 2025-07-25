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
    // Also fetch categories in display order
    const { data: categories, error: catError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('display_order')

    if (catError) {
      console.error('Failed to fetch categories:', catError)
    }

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
    const mappedMenuItems = (menuItems || []).map(item => {
      // Sort sizes by sort_order (fallback by name)
      const sortedSizes = (item.menu_item_sizes || []).sort((a: any, b: any) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
        return a.name.localeCompare(b.name)
      })

      // Sort modifier groups and their nested items
      const sortedGroups = (item.menu_item_modifier_groups || [])
        .sort((a: any, b: any) => {
          const aOrder = a.modifier_groups?.sort_order ?? 0
          const bOrder = b.modifier_groups?.sort_order ?? 0
          if (aOrder !== bOrder) return aOrder - bOrder
          return (a.modifier_groups?.name || '').localeCompare(b.modifier_groups?.name || '')
        })
        .map((group: any) => {
          const sortedItems = (group.modifier_groups?.modifier_items || []).sort((x: any, y: any) => {
            if (x.sort_order !== y.sort_order) return x.sort_order - y.sort_order
            return x.name.localeCompare(y.name)
          })
          return {
            ...group,
            modifier_groups: {
              ...group.modifier_groups,
              modifier_items: sortedItems
            }
          }
        })

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category, // keep as category for frontend compatibility
        base_price: item.base_price,
        is_available: item.is_available,
        sort_order: item.sort_order,
        image_url: item.image_url,
        image_storage_url: item.image_storage_url, // new optimized images
        menu_item_sizes: sortedSizes,
        menu_item_modifier_groups: sortedGroups
      }
    })

    return NextResponse.json({
      menuItems: mappedMenuItems,
      businessSettings,
      categories: categories || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 