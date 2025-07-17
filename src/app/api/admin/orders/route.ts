import { NextResponse } from 'next/server'

// Mock data for orders
let orders = [
  {
    id: '1',
    customer_name: 'John Smith',
    customer_phone: '(555) 123-4567',
    customer_email: 'john@example.com',
    total_amount: 18.47,
    payment_method: 'online',
    payment_status: 'paid',
    order_status: 'pending',
    created_at: new Date().toISOString(),
    order_items: [
      {
        id: '1',
        menu_item_name: 'Crazy Classic Burger',
        size_name: 'Regular',
        quantity: 1,
        unit_price: 12.99,
        total_price: 12.99,
        special_instructions: 'No pickles please',
        order_item_modifiers: [
          { id: '1', modifier_name: 'Crazy Fries', price: 3.99 },
          { id: '2', modifier_name: 'Coca Cola', price: 2.49 }
        ]
      }
    ]
  },
  {
    id: '2',
    customer_name: 'Sarah Johnson',
    customer_phone: '(555) 987-6543',
    customer_email: 'sarah@example.com',
    total_amount: 27.96,
    payment_method: 'cash',
    payment_status: 'pending',
    order_status: 'accepted',
    created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    order_items: [
      {
        id: '2',
        menu_item_name: 'Buffalo Wings',
        size_name: '12 Wings',
        quantity: 1,
        unit_price: 18.99,
        total_price: 18.99,
        order_item_modifiers: [
          { id: '3', modifier_name: 'Ranch', price: 0.00 },
          { id: '4', modifier_name: 'Onion Rings', price: 4.49 },
          { id: '5', modifier_name: 'Sprite', price: 2.49 }
        ]
      },
      {
        id: '3',
        menu_item_name: 'Crazy Classic Burger',
        size_name: 'Regular',
        quantity: 1,
        unit_price: 12.99,
        total_price: 12.99,
        order_item_modifiers: [
          { id: '6', modifier_name: 'Crazy Fries', price: 3.99 },
          { id: '7', modifier_name: 'Water', price: 1.99 }
        ]
      }
    ]
  }
]

export async function GET() {
  try {
    // Sort orders by created_at descending (newest first)
    const sortedOrders = orders.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    return NextResponse.json({ orders: sortedOrders })
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
} 