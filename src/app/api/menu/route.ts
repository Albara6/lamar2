import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

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

    // Helper to resolve storage paths to absolute public URLs on the fly
    const resolveImage = (storagePath: string | null, fallback: string | null) => {
      if (!storagePath) return fallback
      // If already an absolute URL just return it
      if (storagePath.startsWith('http')) return storagePath
      // Otherwise compute public URL from current Supabase project
      const { data } = supabaseAdmin.storage.from('menu-images').getPublicUrl(storagePath)
      return data.publicUrl || fallback
    }

    // Map database fields to iOS expected camelCase format
    const mappedMenuItems = (menuItems || []).map(item => {
      // Sort sizes by sort_order (fallback by name)
      const sortedSizes = (item.menu_item_sizes || [])
        .sort((a: any, b: any) => {
          if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
          return a.name.localeCompare(b.name)
        })
        .map((size: any) => ({
          id: size.id,
          menu_item_id: size.menu_item_id,
          menuItemId: size.menu_item_id, // camelCase duplicate
          name: size.name,
          price_modifier: size.price_modifier,
          priceModifier: size.price_modifier,
          is_default: size.is_default,
          isDefault: size.is_default,
          sort_order: size.sort_order,
          sortOrder: size.sort_order
        }))

      // Sort modifier groups and their nested items
      const sortedGroups = (item.menu_item_modifier_groups || [])
        .sort((a: any, b: any) => {
          const aOrder = a.modifier_groups?.sort_order ?? 0
          const bOrder = b.modifier_groups?.sort_order ?? 0
          if (aOrder !== bOrder) return aOrder - bOrder
          return (a.modifier_groups?.name || '').localeCompare(b.modifier_groups?.name || '')
        })
        .map((group: any) => {
          const sortedItems = (group.modifier_groups?.modifier_items || [])
            .sort((x: any, y: any) => {
              if (x.sort_order !== y.sort_order) return x.sort_order - y.sort_order
              return x.name.localeCompare(y.name)
            })
            .map((modItem: any) => ({
              id: modItem.id,
              groupId: modItem.group_id,
              name: modItem.name,
              price: modItem.price,
              isDefault: modItem.is_default,
              sortOrder: modItem.sort_order
            }))

          return {
            id: group.id,
            menuItemId: group.menu_item_id,
            menuItemSizeId: group.menu_item_size_id,
            modifierGroupId: group.modifier_group_id,
            modifierGroups: {
              id: group.modifier_groups.id,
              name: group.modifier_groups.name,
              isRequired: group.modifier_groups.is_required,
              maxSelections: group.modifier_groups.max_selections,
              minSelections: group.modifier_groups.min_selections,
              sortOrder: group.modifier_groups.sort_order,
              modifierItems: sortedItems
            }
          }
        })

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        base_price: item.base_price,
        basePrice: item.base_price, // camelCase duplicate
        is_available: item.is_available,
        isAvailable: item.is_available, // camelCase duplicate
        sort_order: item.sort_order,
        sortOrder: item.sort_order, // camelCase duplicate
        image_url: resolveImage(item.image_storage_url, item.image_url),
        image_storage_url: resolveImage(item.image_storage_url, item.image_url),
        imageUrl: resolveImage(item.image_storage_url, item.image_url), // maintain camelCase for iOS
        imageStorageUrl: resolveImage(item.image_storage_url, item.image_url),
        menu_item_sizes: sortedSizes,
        menuItemSizes: sortedSizes, // camelCase duplicate
        menu_item_modifier_groups: sortedGroups,
        menuItemModifierGroups: sortedGroups // camelCase duplicate
      }
    })

    // Map categories to camelCase
    const mappedCategories = (categories || []).map(cat => ({
      id: cat.id,
      name: cat.name,
      displayOrder: cat.display_order, // camelCase for iOS
      image_url: resolveImage(cat.image_storage_url, cat.image_url),
      image_storage_url: resolveImage(cat.image_storage_url, cat.image_url),
      imageUrl: resolveImage(cat.image_storage_url, cat.image_url),
      imageStorageUrl: resolveImage(cat.image_storage_url, cat.image_url)
    }))

    // Map business settings to camelCase
    const mappedBusinessSettings = {
      id: businessSettings.id,
      name: businessSettings.name,
      phone: businessSettings.phone,
      email: businessSettings.email,
      address: businessSettings.address,
      isAcceptingOrders: businessSettings.is_accepting_orders, // camelCase for iOS
      bannerEnabled: businessSettings.banner_enabled, // camelCase for iOS
      bannerText: businessSettings.banner_text // camelCase for iOS
    }

    return NextResponse.json({
      menuItems: mappedMenuItems,
      businessSettings: mappedBusinessSettings,
      categories: mappedCategories
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 