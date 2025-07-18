import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`*, order_items(*, order_item_modifiers(*))`)
      .eq('id', params.id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Failed to fetch order:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const updateData = await request.json()

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (orderError) {
      console.error('Error updating order:', orderError)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error in PUT /api/admin/orders/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 