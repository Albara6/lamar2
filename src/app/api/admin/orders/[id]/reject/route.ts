import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching for real-time order updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { rejection_reason } = await request.json()

    // Update order status to rejected
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .update({ 
        order_status: 'rejected', // Fixed: use order_status instead of status
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
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send-sms`, {
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

    const response = NextResponse.json({ order })
    
    // Add aggressive cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error in POST /api/admin/orders/[id]/reject:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 