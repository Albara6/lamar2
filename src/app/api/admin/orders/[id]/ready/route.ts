import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // Update order status to ready first, then completed
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .update({ order_status: 'ready' })
      .eq('id', params.id)
      .select('*, customer_phone')
      .single()

    if (orderError) {
      console.error('Error marking order as ready:', orderError)
      return NextResponse.json({ error: 'Failed to mark order as ready' }, { status: 500 })
    }

    // Send SMS notification via Twilio
    if (order.customer_phone) {
      try {
        await fetch('/api/notifications/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: order.customer_phone,
            message: 'Your order is ready for pickup! Thank you for choosing Crazy Chicken.'
          })
        })
      } catch (smsError) {
        console.error('Failed to send SMS notification:', smsError)
        // Continue even if SMS fails
      }
    }

    // Move order to history by marking it completed
    await supabaseAdmin
      .from('orders')
      .update({ order_status: 'completed' })
      .eq('id', params.id)

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error in POST /api/admin/orders/[id]/ready:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 