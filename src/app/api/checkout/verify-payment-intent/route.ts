import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(request: Request) {
  try {
    const { paymentIntentId, orderId } = await request.json()

    if (!paymentIntentId || !orderId) {
      return NextResponse.json({ error: 'Missing ids' }, { status: 400 })
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const { data: order, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        stripe_payment_intent_id: paymentIntent.id,
        order_status: 'pending'
      })
      .eq('id', orderId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Failed to update order', updateError)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    // fetch order items
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    // Send confirmation email via internal route
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/checkout/send-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            id: order.id,
            items: orderItems?.map(item => ({
              quantity: item.quantity,
              menuItem: { name: item.menu_item_name },
              selectedSize: item.size_name ? { name: item.size_name } : null,
              selectedModifiers: [],
              totalPrice: item.total_price,
              specialInstructions: item.special_instructions
            })) || [],
            total: order.total_amount,
            paymentMethod: 'stripe'
          },
          customer: {
            email: order.customer_email,
            name: order.customer_name
          }
        })
      })
    } catch (err) {
      console.error('Failed to send confirmation email', err)
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Verify payment intent error', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
} 