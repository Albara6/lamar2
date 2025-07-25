import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching for real-time order updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    
    // Map frontend fields to Supabase columns with proper validation
    const mappedData: any = {}
    
    if (updateData.status) {
      mappedData.order_status = updateData.status
    }
    if (updateData.payment_status) {
      mappedData.payment_status = updateData.payment_status
    }

    // Prevent mistakenly marking cash orders as paid
    // Fetch the current order to inspect payment_method
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('payment_method, payment_status')
      .eq('id', params.id)
      .single()

    if (existingOrder && existingOrder.payment_method === 'cash') {
      // Ignore any attempt to set payment_status to 'paid'
      if (mappedData.payment_status && mappedData.payment_status === 'paid') {
        delete mappedData.payment_status
      }
    }
    if (updateData.notes !== undefined) {
      mappedData.special_instructions = updateData.notes
    }
    if (updateData.total !== undefined) {
      mappedData.total_amount = updateData.total
    }
    
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .update(mappedData)
      .eq('id', params.id)
      .select(`
        *,
        order_items (
          *,
          order_item_modifiers (*)
        )
      `)
      .single()

    if (orderError) {
      console.error('Error updating order:', orderError)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    // Map back to frontend expected format
    const mappedOrder = {
      id: order.id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
      total: order.total_amount,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      status: order.order_status, // map order_status to status
      created_at: order.created_at,
      notes: order.special_instructions, // map special_instructions to notes
      rejection_reason: order.rejection_reason,
      order_items: order.order_items || []
    }

    const response = NextResponse.json({ order: mappedOrder })
    
    // Add aggressive cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error in PUT /api/admin/orders/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 