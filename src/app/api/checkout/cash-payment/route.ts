import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { writeFile } from 'fs/promises'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await writeFile('/tmp/last-order-body.json', JSON.stringify(body, null, 2))
    const { customer, paymentMethod, items, total } = body

    // DEBUG: Save incoming items to a file
    await writeFile('/tmp/last-order-items.json', JSON.stringify(items, null, 2))

    // DEBUG: Log incoming items
    console.log('DEBUG: Incoming items:', JSON.stringify(items, null, 2))

    if (!customer || !items || !total || paymentMethod !== 'cash') {
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

    // Create order in database - cash orders are ready for admin immediately
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: customerId,
        total_amount: total,
        payment_method: 'cash',
        payment_status: 'pending', // Cash orders start pending, admin will collect
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

    // Create order items
    const orderItems = []
    
    console.log('Creating order items for order:', order.id)
    console.log('Items to process:', JSON.stringify(items, null, 2))
    
    for (const item of items) {
      console.log('Processing item:', item)
      
      try {
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
          console.error('Item data that failed:', item)
          continue
        }

        console.log('Created order item:', orderItem)
        orderItems.push(orderItem)

        // Create order item modifiers
        if (item.selectedModifiers && item.selectedModifiers.length > 0) {
          console.log('Creating modifiers for item:', orderItem.id)
          
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
          } else {
            console.log('Created modifiers for order item:', orderItem.id)
          }
        }
      } catch (itemCreationError) {
        console.error('Exception creating order item:', itemCreationError)
        console.error('Failed item data:', item)
      }
    }
    
    console.log('Final order items created:', orderItems.length)

    // Send confirmation email
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/checkout/send-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            id: order.id,
            items: items,
            total: total,
            paymentMethod: 'cash'
          },
          customer: {
            email: customer.email,
            name: customer.name
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Failed to send confirmation email:', error)
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the order if email fails
    }

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
      success: true,
      orderId: order.id,
      order: fullOrder,
      message: 'Order created successfully'
    })

  } catch (error: any) {
    console.error('Cash payment error:', error)
    return NextResponse.json(
      { error: 'Order creation failed' },
      { status: 500 }
    )
  }
} 