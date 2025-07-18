import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching for real-time modifier updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Update a modifier item
export async function PUT(request: Request, { params }: { params: { id: string, itemId: string } }) {
  try {
    const body = await request.json()
    
    const { data: modifierItem, error } = await supabaseAdmin
      .from('modifier_items')
      .update({
        name: body.name,
        price: body.price,
        is_default: body.is_default,
        sort_order: body.sort_order
      })
      .eq('id', params.itemId)
      .eq('group_id', params.id)
      .select()
      .single()

    if (error || !modifierItem) {
      console.error('Failed to update modifier item:', error)
      return NextResponse.json({ error: 'Failed to update modifier item' }, { status: 500 })
    }

    const response = NextResponse.json({ modifierItem })
    
    // Add aggressive cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Failed to update modifier item:', error)
    return NextResponse.json({ error: 'Failed to update modifier item' }, { status: 500 })
  }
}

// Delete a modifier item
export async function DELETE(request: Request, { params }: { params: { id: string, itemId: string } }) {
  try {
    const { error } = await supabaseAdmin
      .from('modifier_items')
      .delete()
      .eq('id', params.itemId)
      .eq('group_id', params.id)

    if (error) {
      console.error('Failed to delete modifier item:', error)
      return NextResponse.json({ error: 'Failed to delete modifier item' }, { status: 500 })
    }

    const response = NextResponse.json({ success: true })
    
    // Add aggressive cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Failed to delete modifier item:', error)
    return NextResponse.json({ error: 'Failed to delete modifier item' }, { status: 500 })
  }
} 