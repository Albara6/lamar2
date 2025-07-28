import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantSlug = searchParams.get('restaurant')

    if (!restaurantSlug) {
      return NextResponse.json(
        { success: false, error: 'Restaurant parameter is required' },
        { status: 400 }
      )
    }

    // Get restaurant by slug
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', restaurantSlug)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Fetch menu items for this restaurant
    const { data: menuItems, error: menuError } = await supabase
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
      .eq('restaurant_id', restaurant.id)
      .eq('is_available', true)
      .order('sort_order')

    if (menuError) {
      console.error('Menu fetch error:', menuError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch menu items' },
        { status: 500 }
      )
    }

    // Fetch categories for this restaurant
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('display_order')

    if (categoriesError) {
      console.error('Categories fetch error:', categoriesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    // Fetch business settings for this restaurant
    const { data: businessSettings, error: settingsError } = await supabase
      .from('business_settings')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .single()

    if (settingsError) {
      console.error('Settings fetch error:', settingsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch business settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        menuItems: menuItems || [],
        categories: categories || [],
        businessSettings,
        restaurant
      }
    })
  } catch (error) {
    console.error('Error in menu API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 