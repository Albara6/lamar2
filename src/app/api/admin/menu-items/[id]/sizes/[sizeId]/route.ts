import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching for real-time size updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Update a menu item size
export async function PUT(request: Request, { params }: { params: { id: string, sizeId: string } }) {
  try {
    const body = await request.json()
    
    const { data: size, error } = await supabaseAdmin
      .from('menu_item_sizes')
      .update({
        name: body.name,
        price_modifier: body.price_modifier,
        is_default: body.is_default,
        sort_order: body.sort_order
      })
      .eq('id', params.sizeId)
      .eq('menu_item_id', params.id)
      .select()
      .single()

    if (error || !size) {
      console.error('Failed to update menu item size:', error)
      return NextResponse.json({ error: 'Failed to update menu item size' }, { status: 500 })
    }

    const response = NextResponse.json({ size })
    
    // Add aggressive cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Failed to update menu item size:', error)
    return NextResponse.json({ error: 'Failed to update menu item size' }, { status: 500 })
  }
}

// Delete a menu item size
export async function DELETE(request: Request, { params }: { params: { id: string, sizeId: string } }) {
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

    const response = NextResponse.json({ success: true })
    
    // Add aggressive cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Failed to delete menu item size:', error)
    return NextResponse.json({ error: 'Failed to delete menu item size' }, { status: 500 })
  }
} 