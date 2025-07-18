import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { rejection_reason } = await request.json()

    // Update order status to rejected
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .update({ 
        order_status: 'rejected',
        rejection_reason
      })
      .eq('id', params.id)
      .select('*, customer_phone')
      .single()

    if (orderError) {
      console.error('Error rejecting order:', orderError)
      return NextResponse.json({ error: 'Failed to reject order' }, { status: 500 })
    }

    // Send SMS notification via Twilio
    if (order.customer_phone) {
      try {
        await fetch('/api/notifications/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: order.customer_phone,
            message: `We're sorry, but your order has been rejected. Reason: ${rejection_reason}. Please try again later.`
          })
        })
      } catch (smsError) {
        console.error('Failed to send SMS notification:', smsError)
        // Continue even if SMS fails
      }
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error in POST /api/admin/orders/[id]/reject:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 