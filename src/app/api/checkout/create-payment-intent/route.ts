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

    // 1. Get or create customer in DB
    const { data: dbCustomer } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('phone_number', customer.phone)
      .single()

    let customerId = dbCustomer?.id

    if (!dbCustomer) {
      const { data: newCustomer, error } = await supabaseAdmin
        .from('customers')
        .insert({
          phone_number: customer.phone,
          name: customer.name,
          email: customer.email,
          is_verified: true
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to create customer', error)
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
      }

      customerId = newCustomer.id
    } else {
      // update details
      await supabaseAdmin
        .from('customers')
        .update({ name: customer.name, email: customer.email, is_verified: true })
        .eq('id', dbCustomer.id)
    }

    // 2. Create order with pending payment status
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
      console.error('Failed to create order', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // 3. Create order items and modifiers
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
        console.error('Failed to create order item', itemError)
        continue
      }

      if (item.selectedModifiers?.length) {
        const modifiers = item.selectedModifiers.map((m: any) => ({
          order_item_id: orderItem.id,
          modifier_item_id: m.id,
          modifier_name: m.name,
          price: m.price
        }))
        await supabaseAdmin.from('order_item_modifiers').insert(modifiers)
      }
    }

    // 4. Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'usd',
      metadata: {
        order_id: order.id,
        customer_phone: customer.phone
      },
      automatic_payment_methods: {
        enabled: true
      },
      receipt_email: customer.email
    })

    // store paymentIntentId on order
    await supabaseAdmin
      .from('orders')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', order.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id
    })
  } catch (error) {
    console.error('Create payment intent error', error)
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 })
  }
} 