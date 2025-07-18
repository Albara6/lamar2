import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching for real-time modifier updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Get all modifier items for a modifier group
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data: modifierItems, error } = await supabaseAdmin
      .from('modifier_items')
      .select('*')
      .eq('group_id', params.id)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Failed to fetch modifier items:', error)
      return NextResponse.json({ error: 'Failed to fetch modifier items' }, { status: 500 })
    }

    const response = NextResponse.json({ modifierItems: modifierItems || [] })
    
    // Add aggressive cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Failed to fetch modifier items:', error)
    return NextResponse.json({ error: 'Failed to fetch modifier items' }, { status: 500 })
  }
}

// Add a new modifier item to a modifier group
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    
    const { data: modifierItem, error } = await supabaseAdmin
      .from('modifier_items')
      .insert({
        group_id: params.id,
        name: body.name,
        price: body.price || 0,
        is_default: body.is_default || false,
        sort_order: body.sort_order || 0
      })
      .select()
      .single()

    if (error || !modifierItem) {
      console.error('Failed to create modifier item:', error)
      return NextResponse.json({ error: 'Failed to create modifier item' }, { status: 500 })
    }

    const response = NextResponse.json({ modifierItem })
    
    // Add aggressive cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Failed to create modifier item:', error)
    return NextResponse.json({ error: 'Failed to create modifier item' }, { status: 500 })
  }
} 