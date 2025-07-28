import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching for real-time menu updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    let { data: menuItem, error } = await supabaseAdmin
      .from('menu_items')
      .update({
        name: body.name,
        description: body.description,
        base_price: body.price, // map price to base_price
        category: body.category_id, // map category_id to category
        ...(body.image_url ? { image_url: body.image_url } : {}),
        ...(body.image_storage_url ? { image_storage_url: body.image_storage_url } : {}),
        is_available: body.is_available,
        sort_order: body.display_order // map display_order to sort_order
      })
      .eq('id', params.id)
      .select()
      .single()

    // If the update failed because the image columns are missing, add them and retry once
    if (error && error.code === 'PGRST204' && (error.message?.includes('image_url') || error.message?.includes('image_storage_url'))) {
      console.warn('image columns missing, running automatic migration for update...')
      const { error: alterErr } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: `ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url text; ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_storage_url text;`
      })
      if (alterErr) {
        console.error('Migration failed:', alterErr)
        return NextResponse.json({ error: 'Failed to migrate menu_items table' }, { status: 500 })
      }
      // Retry update once after migration
      const retry = await supabaseAdmin
        .from('menu_items')
        .update({
          name: body.name,
          description: body.description,
          base_price: body.price,
          category: body.category_id,
          ...(body.image_url ? { image_url: body.image_url } : {}),
          ...(body.image_storage_url ? { image_storage_url: body.image_storage_url } : {}),
          is_available: body.is_available,
          sort_order: body.display_order
        })
        .eq('id', params.id)
        .select()
        .single()
      if (retry.error || !retry.data) {
        console.error('Retry update failed:', retry.error)
        return NextResponse.json({ error: 'Failed to update menu item after migration' }, { status: 500 })
      }
      menuItem = retry.data
    }

    if (error || !menuItem) {
      console.error('Failed to update menu item:', error)
      return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 })
    }

    // Map back to frontend expected format
    const mappedMenuItem = {
      id: menuItem.id,
      name: menuItem.name,
      description: menuItem.description,
      category_id: menuItem.category,
      image_url: menuItem.image_url,
      image_storage_url: menuItem.image_storage_url, // new field for optimized images
      price: menuItem.base_price,
      is_available: menuItem.is_available,
      display_order: menuItem.sort_order
    }

    const response = NextResponse.json({ menuItem: mappedMenuItem })
    
    // Add aggressive cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Failed to update menu item:', error)
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin
      .from('menu_items')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Failed to delete menu item:', error)
      return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete menu item:', error)
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 })
  }
} 