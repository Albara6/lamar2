import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const { customer, items, total, paymentMethod } = await request.json()

    // Generate order ID
    const orderId = uuidv4()

    // Create order in database
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
        order_status: 'pending'
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

    // Send confirmation email
    try {
      await fetch('/api/checkout/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            id: orderId,
            items,
            total,
            paymentMethod
          },
          customer
        })
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the order if email fails
    }

    return NextResponse.json({
      success: true,
      orderId,
      message: 'Order created successfully'
    })

  } catch (error: any) {
    console.error('Cash payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 