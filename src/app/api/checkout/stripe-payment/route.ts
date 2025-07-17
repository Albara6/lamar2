import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(request: Request) {
  try {
    const { customer, paymentMethod, items, total } = await request.json()

    if (!customer || !items || !total || paymentMethod !== 'stripe') {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Create or update customer in database
    const { data: dbCustomer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('phone_number', customer.phone)
      .single()

    let customerId = dbCustomer?.id

    if (!dbCustomer) {
      const { data: newCustomer, error: createError } = await supabaseAdmin
        .from('customers')
        .insert({
          phone_number: customer.phone,
          name: customer.name,
          email: customer.email,
          is_verified: true
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating customer:', createError)
        return NextResponse.json(
          { error: 'Failed to create customer' },
          { status: 500 }
        )
      }
      customerId = newCustomer.id
    } else {
      // Update existing customer with new info
      const { error: updateError } = await supabaseAdmin
        .from('customers')
        .update({
          name: customer.name,
          email: customer.email,
          is_verified: true
        })
        .eq('id', dbCustomer.id)

      if (updateError) {
        console.error('Error updating customer:', updateError)
      }
    }

    // Create order in database with pending payment status
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: customerId,
        total_amount: total,
        payment_method: 'online',
        payment_status: 'pending',
        order_status: 'pending',
        phone_verified: true,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Create order items one by one (to get order_item_id for modifiers)
    const orderItems = []
    for (const item of items) {
      const { data: orderItem, error: itemError } = await supabaseAdmin
        .from('order_items')
        .insert({
          order_id: order.id,
          menu_item_id: item.menuItem.id,
          menu_item_size_id: item.selectedSize?.id || null,
          quantity: item.quantity,
          unit_price: item.totalPrice / item.quantity,
          total_price: item.totalPrice,
          menu_item_name: item.menuItem.name,
          size_name: item.selectedSize?.name || null,
          special_instructions: item.specialInstructions || null
        })
        .select()
        .single()

      if (itemError) {
        console.error('Error creating order item:', itemError)
        continue
      }

      orderItems.push(orderItem)

      // Create order item modifiers
      if (item.selectedModifiers && item.selectedModifiers.length > 0) {
        const modifiers = item.selectedModifiers.map((modifier: any) => ({
          order_item_id: orderItem.id,
          modifier_item_id: modifier.id,
          modifier_name: modifier.name,
          price: modifier.price
        }))

        const { error: modifiersError } = await supabaseAdmin
          .from('order_item_modifiers')
          .insert(modifiers)

        if (modifiersError) {
          console.error('Error creating order modifiers:', modifiersError)
        }
      }
    }

    // Create Stripe checkout session
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${item.menuItem.name}${item.selectedSize ? ` (${item.selectedSize.name})` : ''}`,
          description: item.menuItem.description,
        },
        unit_amount: Math.round((item.totalPrice / item.quantity) * 100), // Convert to cents
      },
      quantity: item.quantity,
    }))

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customer.email,
      metadata: {
        order_id: order.id,
        customer_phone: customer.phone
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?cancelled=true`,
      payment_intent_data: {
        metadata: {
          order_id: order.id
        }
      }
    })

    // Update order with Stripe session ID
    await supabaseAdmin
      .from('orders')
      .update({ stripe_payment_intent_id: session.id })
      .eq('id', order.id)

    // Fetch full order details for confirmation page
    const { data: fullOrder, error: fetchOrderError } = await supabaseAdmin
      .from('orders')
      .select(`*, order_items(*, order_item_modifiers(*))`)
      .eq('id', order.id)
      .single()

    if (fetchOrderError) {
      console.error('Error fetching order details:', fetchOrderError)
    }

    return NextResponse.json({
      checkoutUrl: session.url,
      orderId: order.id,
      sessionId: session.id,
      order: fullOrder
    })

  } catch (error: any) {
    console.error('Stripe payment error:', error)
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    )
  }
} 