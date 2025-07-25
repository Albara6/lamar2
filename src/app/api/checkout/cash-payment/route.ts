import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { writeFile } from 'fs/promises'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Incoming POS order request body:', JSON.stringify(body, null, 2));
    await writeFile('/tmp/last-order-body.json', JSON.stringify(body, null, 2))
    const { customer, paymentMethod, items, total, notes, isPOSOrder, isPaid } = body

    // --------------------------------------------------------------
    // BUSINESS HOURS / ACCEPTING ORDERS CHECK (menu orders only)
    // --------------------------------------------------------------
    try {
      // Fetch the latest business settings
      const { data: bizSettings, error: bizError } = await supabaseAdmin
        .from('business_settings')
        .select('*')
        .single()

      if (bizError) {
        console.error('Failed to fetch business settings:', bizError)
      }

      if (!isPOSOrder && bizSettings) {
        const isAccepting = bizSettings.is_accepting_orders !== false

        const isWithinHours = (() => {
          if (!bizSettings.hours) return true // No hours defined – treat as always open

          // Get current time in the restaurant's local timezone (America/Chicago)
          const centralNow = new Date(
            new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })
          )

          const weekday = centralNow
            .toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Chicago' })
            .toLowerCase()

          const today = bizSettings.hours[weekday]

          if (!today || today.closed) return false

          const [openHour, openMinute] = today.open.split(':').map((v: string) => parseInt(v, 10))
          const [closeHour, closeMinute] = today.close.split(':').map((v: string) => parseInt(v, 10))

          // Current time in minutes since midnight (Central Time)
          const timeParts = new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
            timeZone: 'America/Chicago'
          })
            .formatToParts(new Date())
            .reduce<Record<string, string>>((acc, part) => {
              if (part.type === 'hour' || part.type === 'minute') acc[part.type] = part.value
              return acc
            }, {})

          const currentHour = parseInt(timeParts.hour || '0', 10)
          const currentMinute = parseInt(timeParts.minute || '0', 10)

          const currentTotal = currentHour * 60 + currentMinute
          const openTotal = openHour * 60 + openMinute
          const closeTotal = closeHour * 60 + closeMinute

          // If closeTotal < openTotal, the window spans midnight (e.g., 18:00–02:00).
          if (closeTotal < openTotal) {
            return currentTotal >= openTotal || currentTotal <= closeTotal
          }

          // Normal same-day window
          return currentTotal >= openTotal && currentTotal <= closeTotal
        })()

        if (!isAccepting || !isWithinHours) {
          return NextResponse.json(
            { error: 'Restaurant is currently closed and not accepting orders' },
            { status: 403 }
          )
        }
      }
    } catch (hoursCheckError) {
      console.error('Hours/accepting-orders check failed:', hoursCheckError)
      // Fail-safe: allow order to proceed to avoid blocking POS
    }

    // DEBUG: Save incoming items to a file
    await writeFile('/tmp/last-order-items.json', JSON.stringify(items, null, 2))

    // DEBUG: Log incoming items
    console.log('DEBUG: Incoming items:', JSON.stringify(items, null, 2))
    console.log('DEBUG: Is POS Order:', isPOSOrder)
    console.log('DEBUG: Order notes:', notes)
    console.log('DEBUG: Payment status:', isPaid ? 'PAID' : 'NOT PAID')

    if (!customer || !items || !total || paymentMethod !== 'cash') {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Handle customer creation differently for POS vs menu orders
    let customerId: string
    let posNotificationPhone: string | null = null;
    
    if (isPOSOrder) {
      // For POS orders, use a temporary customer record with a fake phone/email
      const tempPhone = `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const tempEmail = `pos.temp.${Date.now()}@local.system`
      
      // If wantsNotification and a phone is provided, use it for the order only
      if (body.wantsNotification && customer.phone) {
        posNotificationPhone = customer.phone.replace(/\D/g, '')
      }
      console.log('posNotificationPhone to be saved in order:', posNotificationPhone);
      
      try {
        const { data: newCustomer, error: createError } = await supabaseAdmin
          .from('customers')
          .insert({
            phone_number: tempPhone,
            name: customer.name,
            email: tempEmail,
            is_verified: false
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating POS customer:', createError, { phone_number: tempPhone, name: customer.name, email: tempEmail })
          return NextResponse.json(
            { error: 'Failed to create customer', details: createError },
            { status: 500 }
          )
        }
        customerId = newCustomer.id
        console.log('Created temporary POS customer:', customerId)
      } catch (err) {
        console.error('Exception during POS customer creation:', err)
        return NextResponse.json(
          { error: 'Exception during customer creation', details: err },
          { status: 500 }
        )
      }
    } else {
      // For menu orders, use the normal customer lookup/creation logic
      const { data: dbCustomer, error: customerError } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('phone_number', customer.phone || '')
        .single()

      let existingCustomerId = dbCustomer?.id

      if (!dbCustomer) {
        const { data: newCustomer, error: createError } = await supabaseAdmin
          .from('customers')
          .insert({
            phone_number: customer.phone || '',
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
        customerId = existingCustomerId
      }
    }

    // Create order in database - cash orders are ready for admin immediately
    try {
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          customer_id: customerId,
          total_amount: total,
          payment_method: 'cash',
          payment_status: (isPOSOrder && isPaid) ? 'paid' : 'pending',
          order_status: 'pending',
          phone_verified: isPOSOrder ? false : true,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: isPOSOrder ? (posNotificationPhone || null) : (customer.phone || null),
          special_instructions: notes || null
        })
        .select()
        .single()

      if (orderError) {
        console.error('Error creating order:', orderError, {
          customer_id: customerId,
          total_amount: total,
          payment_method: 'cash',
          payment_status: (isPOSOrder && isPaid) ? 'paid' : 'pending',
          order_status: 'pending',
          phone_verified: isPOSOrder ? false : true,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: isPOSOrder ? (posNotificationPhone || null) : (customer.phone || null),
          special_instructions: notes || null
        })
        return NextResponse.json(
          { error: 'Failed to create order', details: orderError },
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

      // Send confirmation email only if not a POS order and customer has real email
      if (!isPOSOrder && customer.email && customer.email !== 'pos@crazychicken.local') {
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
        message: isPOSOrder ? 'POS order sent to kitchen successfully' : 'Order created successfully'
      })
    } catch (orderCreationError) {
      console.error('Exception during order creation:', orderCreationError)
      return NextResponse.json(
        { error: 'Exception during order creation', details: orderCreationError },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Cash payment error:', error)
    return NextResponse.json(
      { error: 'Order creation failed' },
      { status: 500 }
    )
  }
} 