import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(request: Request) {
  try {
    const { sessionId, orderId } = await request.json()

    if (!sessionId || !orderId) {
      return NextResponse.json(
        { error: 'Session ID and Order ID are required' },
        { status: 400 }
      )
    }

    // Verify the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 400 }
      )
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Update order status in database
    const { data: order, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        stripe_payment_intent_id: session.payment_intent as string,
        order_status: 'pending'
      })
      .eq('id', orderId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      )
    }

    // Get order items for email confirmation
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
    }

    // Send confirmation email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/checkout/send-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          items: orderItems?.map(item => ({
            quantity: item.quantity,
            menuItem: { name: item.menu_item_name },
            selectedSize: item.size_name ? { name: item.size_name } : null,
            selectedModifiers: [], // Could fetch these separately if needed
            totalPrice: item.total_price,
            specialInstructions: item.special_instructions
          })) || [],
          total: order.total_amount,
          paymentMethod: 'stripe'
        })
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the verification if email fails
    }

    return NextResponse.json({
      success: true,
      order: order,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total
      }
    })

  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    )
  }
} 