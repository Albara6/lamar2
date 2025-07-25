import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching for real-time order updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Add timestamp for debugging
    const queryTime = new Date().toISOString()
    console.log(`[${queryTime}] Fetching orders from database...`)
    
    // Fetch orders with order items and modifiers from database
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          order_item_modifiers (*)
        )
      `)
      // Include all cash orders (regardless of payment_status) **OR** any orders that are already paid
      .or('payment_method.eq.cash,payment_status.eq.paid')
      .order('created_at', { ascending: false })
    
    console.log(`[${queryTime}] Database returned ${orders?.length || 0} orders`)
    if (orders && orders.length > 0) {
      console.log(`[${queryTime}] Latest order: ${orders[0].id} - Status: ${orders[0].order_status} - Created: ${orders[0].created_at}`)
    }

    if (ordersError) {
      console.error('Orders fetch error:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Map database fields to frontend expected format
    const mappedOrders = (orders || []).map(order => ({
      id: order.id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
      total: order.total_amount, // map total_amount to total
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      status: order.order_status, // map order_status to status
      created_at: order.created_at,
      notes: order.special_instructions, // map special_instructions to notes
      rejection_reason: order.rejection_reason,
      order_items: order.order_items || []
    }))

    const response = NextResponse.json({ orders: mappedOrders })
    
    // Add aggressive cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
} 