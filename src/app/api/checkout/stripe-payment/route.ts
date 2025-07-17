import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(request: Request) {
  try {
    const { customer, items, total, paymentMethod } = await request.json()

    // Generate order ID
    const orderId = uuidv4()

    // Create Stripe line items
    const lineItems = items.map((item: any) => {
      const description = [
        item.selectedSize ? `Size: ${item.selectedSize.name}` : '',
        item.selectedModifiers.length > 0 ? `Add-ons: ${item.selectedModifiers.map((mod: any) => mod.name).join(', ')}` : '',
        item.specialInstructions ? `Note: ${item.specialInstructions}` : ''
      ].filter(Boolean).join('\n')

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.menuItem.name,
            description: description || undefined,
            images: item.menuItem.image_url ? [item.menuItem.image_url] : undefined
          },
          unit_amount: Math.round(item.totalPrice * 100 / item.quantity), // Convert to cents
        },
        quantity: item.quantity,
      }
    })

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?error=payment_cancelled`,
      customer_email: customer.email,
      metadata: {
        orderId,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email
      }
    })

    // Store pending order in database
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        id: orderId,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        phone_verified: customer.isVerified,
        total_amount: total,
        payment_method: paymentMethod,
        payment_status: 'pending',
        order_status: 'pending',
        stripe_session_id: session.id
      })

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: orderId,
      menu_item_id: item.menuItem.id,
      menu_item_size_id: item.selectedSize?.id,
      quantity: item.quantity,
      unit_price: item.totalPrice / item.quantity,
      total_price: item.totalPrice,
      special_instructions: item.specialInstructions
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items creation error:', itemsError)
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      )
    }

    // Create order item modifiers
    const orderItemModifiers = items.flatMap((item: any, index: number) => 
      item.selectedModifiers.map((modifier: any) => ({
        order_item_id: `${orderId}_${index}`,
        modifier_item_id: modifier.id,
        price: modifier.price
      }))
    )

    if (orderItemModifiers.length > 0) {
      const { error: modifiersError } = await supabaseAdmin
        .from('order_item_modifiers')
        .insert(orderItemModifiers)

      if (modifiersError) {
        console.error('Order item modifiers creation error:', modifiersError)
        return NextResponse.json(
          { error: 'Failed to create order item modifiers' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      orderId
    })

  } catch (error: any) {
    console.error('Stripe payment error:', error)
    return NextResponse.json(
      { error: 'Payment initialization failed' },
      { status: 500 }
    )
  }
} 