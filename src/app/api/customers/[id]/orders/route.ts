import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'active' or 'history'

    let query = supabase
      .from('orders')
      .select(`
        *,
        restaurants(name, phone, address, logo_url),
        order_items(
          *,
          order_item_modifiers(*)
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (type === 'active') {
      // Active orders: not yet picked up
      query = query.not('order_status', 'in', '("picked_up","completed")')
    } else if (type === 'history') {
      // Order history: picked up or completed
      query = query.in('order_status', ['picked_up', 'completed'])
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching customer orders:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    // Separate active and completed orders
    const activeOrders = orders?.filter(order => 
      !['picked_up', 'completed'].includes(order.order_status)
    ) || []

    const orderHistory = orders?.filter(order => 
      ['picked_up', 'completed'].includes(order.order_status)
    ) || []

    return NextResponse.json({
      success: true,
      data: {
        activeOrders,
        orderHistory,
        totalActive: activeOrders.length,
        totalHistory: orderHistory.length
      }
    })
  } catch (error) {
    console.error('Error in customer orders API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 