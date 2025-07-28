import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id

    // Fetch order with restaurant info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        restaurants(name, phone, address, supports_curbside, supports_pickup_inside)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Fetch order status history
    const { data: statusHistory, error: historyError } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (historyError) {
      console.error('Error fetching order history:', historyError)
    }

    return NextResponse.json({
      success: true,
      data: {
        order,
        statusHistory: statusHistory || [],
        estimatedReadyTime: order.estimated_ready_time,
        actualReadyTime: order.actual_ready_time
      }
    })
  } catch (error) {
    console.error('Error in order tracking API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const body = await request.json()
    const { action, parkingSpotNumber } = body

    if (action === 'arrived') {
      // Customer has arrived at the restaurant
      const { error } = await supabase
        .from('orders')
        .update({
          customer_arrival_status: 'arrived',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) {
        console.error('Error updating arrival status:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to update arrival status' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Arrival status updated successfully'
      })
    }

    if (action === 'parked' && parkingSpotNumber) {
      // Customer has parked in a specific spot (curbside only)
      const { error } = await supabase
        .from('orders')
        .update({
          customer_arrival_status: 'parked',
          parking_spot_number: parkingSpotNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('pickup_type', 'curbside')

      if (error) {
        console.error('Error updating parking info:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to update parking information' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Parking information updated successfully'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in order tracking update API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 