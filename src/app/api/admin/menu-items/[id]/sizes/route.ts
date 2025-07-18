import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching for real-time size updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Get all sizes for a menu item
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

    const response = NextResponse.json({ sizes: sizes || [] })
    
    // Add aggressive cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Failed to fetch menu item sizes:', error)
    return NextResponse.json({ error: 'Failed to fetch menu item sizes' }, { status: 500 })
  }
}

// Add a new size to a menu item
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    
    const { data: size, error } = await supabaseAdmin
      .from('menu_item_sizes')
      .insert({
        menu_item_id: params.id,
        name: body.name,
        price_modifier: body.price_modifier || 0,
        is_default: body.is_default || false,
        sort_order: body.sort_order || 0
      })
      .select()
      .single()

    if (error || !size) {
      console.error('Failed to create menu item size:', error)
      return NextResponse.json({ error: 'Failed to create menu item size' }, { status: 500 })
    }

    const response = NextResponse.json({ size })
    
    // Add aggressive cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Failed to create menu item size:', error)
    return NextResponse.json({ error: 'Failed to create menu item size' }, { status: 500 })
  }
} 