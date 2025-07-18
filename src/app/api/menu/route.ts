import { NextResponse } from 'next/server'

// Import the same mock data that the admin uses
const menuItems = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Crazy Classic Burger',
    description: 'Our signature beef patty with lettuce, tomato, onion, pickles, and our crazy sauce',
    category: 'burgers',
    base_price: 12.99,
    is_available: true,
    sort_order: 1,
    menu_item_sizes: [
      { id: '650e8400-e29b-41d4-a716-446655440001', menu_item_id: '550e8400-e29b-41d4-a716-446655440001', name: 'Regular', price_modifier: 0.00, is_default: true, sort_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440002', menu_item_id: '550e8400-e29b-41d4-a716-446655440001', name: 'Large', price_modifier: 2.00, is_default: false, sort_order: 2 }
    ],
    menu_item_modifier_groups: [
      {
        modifier_groups: {
          id: '750e8400-e29b-41d4-a716-446655440001',
          name: 'Sides',
          is_required: true,
          max_selections: 1,
          min_selections: 1,
          modifier_items: [
            { id: '850e8400-e29b-41d4-a716-446655440001', group_id: '750e8400-e29b-41d4-a716-446655440001', name: 'Crazy Fries', price: 3.99, is_default: true, sort_order: 1 },
            { id: '850e8400-e29b-41d4-a716-446655440002', group_id: '750e8400-e29b-41d4-a716-446655440001', name: 'Onion Rings', price: 4.49, is_default: false, sort_order: 2 },
            { id: '850e8400-e29b-41d4-a716-446655440003', group_id: '750e8400-e29b-41d4-a716-446655440001', name: 'Mozzarella Sticks', price: 5.99, is_default: false, sort_order: 3 },
            { id: '850e8400-e29b-41d4-a716-446655440004', group_id: '750e8400-e29b-41d4-a716-446655440001', name: 'Coleslaw', price: 2.99, is_default: false, sort_order: 4 }
          ]
        }
      },
      {
        modifier_groups: {
          id: '750e8400-e29b-41d4-a716-446655440002',
          name: 'Sauces',
          is_required: false,
          max_selections: 3,
          min_selections: 0,
          modifier_items: [
            { id: '850e8400-e29b-41d4-a716-446655440011', group_id: '750e8400-e29b-41d4-a716-446655440002', name: 'Crazy Sauce', price: 0.00, is_default: false, sort_order: 1 },
            { id: '850e8400-e29b-41d4-a716-446655440012', group_id: '750e8400-e29b-41d4-a716-446655440002', name: 'BBQ Sauce', price: 0.00, is_default: false, sort_order: 2 },
            { id: '850e8400-e29b-41d4-a716-446655440013', group_id: '750e8400-e29b-41d4-a716-446655440002', name: 'Ranch', price: 0.00, is_default: false, sort_order: 3 },
            { id: '850e8400-e29b-41d4-a716-446655440014', group_id: '750e8400-e29b-41d4-a716-446655440002', name: 'Buffalo Sauce', price: 0.00, is_default: false, sort_order: 4 },
            { id: '850e8400-e29b-41d4-a716-446655440015', group_id: '750e8400-e29b-41d4-a716-446655440002', name: 'Honey Mustard', price: 0.00, is_default: false, sort_order: 5 }
          ]
        }
      },
      {
        modifier_groups: {
          id: '750e8400-e29b-41d4-a716-446655440005',
          name: 'Drinks',
          is_required: true,
          max_selections: 1,
          min_selections: 1,
          modifier_items: [
            { id: '850e8400-e29b-41d4-a716-446655440041', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Coca Cola', price: 2.49, is_default: true, sort_order: 1 },
            { id: '850e8400-e29b-41d4-a716-446655440042', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Pepsi', price: 2.49, is_default: false, sort_order: 2 },
            { id: '850e8400-e29b-41d4-a716-446655440043', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Sprite', price: 2.49, is_default: false, sort_order: 3 },
            { id: '850e8400-e29b-41d4-a716-446655440044', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Orange Soda', price: 2.49, is_default: false, sort_order: 4 },
            { id: '850e8400-e29b-41d4-a716-446655440045', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Water', price: 1.99, is_default: false, sort_order: 5 }
          ]
        }
      }
    ]
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    name: 'Buffalo Wings',
    description: 'Crispy chicken wings tossed in our buffalo sauce',
    category: 'chicken',
    base_price: 13.99,
    is_available: true,
    sort_order: 2,
    menu_item_sizes: [
      { id: '650e8400-e29b-41d4-a716-446655440014', menu_item_id: '550e8400-e29b-41d4-a716-446655440012', name: '8 Wings', price_modifier: 0.00, is_default: true, sort_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440015', menu_item_id: '550e8400-e29b-41d4-a716-446655440012', name: '12 Wings', price_modifier: 5.00, is_default: false, sort_order: 2 },
      { id: '650e8400-e29b-41d4-a716-446655440016', menu_item_id: '550e8400-e29b-41d4-a716-446655440012', name: '20 Wings', price_modifier: 10.00, is_default: false, sort_order: 3 }
    ],
    menu_item_modifier_groups: [
      {
        modifier_groups: {
          id: '750e8400-e29b-41d4-a716-446655440001',
          name: 'Sides',
          is_required: true,
          max_selections: 1,
          min_selections: 1,
          modifier_items: [
            { id: '850e8400-e29b-41d4-a716-446655440001', group_id: '750e8400-e29b-41d4-a716-446655440001', name: 'Crazy Fries', price: 3.99, is_default: true, sort_order: 1 },
            { id: '850e8400-e29b-41d4-a716-446655440002', group_id: '750e8400-e29b-41d4-a716-446655440001', name: 'Onion Rings', price: 4.49, is_default: false, sort_order: 2 },
            { id: '850e8400-e29b-41d4-a716-446655440003', group_id: '750e8400-e29b-41d4-a716-446655440001', name: 'Mozzarella Sticks', price: 5.99, is_default: false, sort_order: 3 },
            { id: '850e8400-e29b-41d4-a716-446655440004', group_id: '750e8400-e29b-41d4-a716-446655440001', name: 'Coleslaw', price: 2.99, is_default: false, sort_order: 4 }
          ]
        }
      },
      {
        modifier_groups: {
          id: '750e8400-e29b-41d4-a716-446655440002',
          name: 'Sauces',
          is_required: false,
          max_selections: 3,
          min_selections: 0,
          modifier_items: [
            { id: '850e8400-e29b-41d4-a716-446655440011', group_id: '750e8400-e29b-41d4-a716-446655440002', name: 'Crazy Sauce', price: 0.00, is_default: false, sort_order: 1 },
            { id: '850e8400-e29b-41d4-a716-446655440012', group_id: '750e8400-e29b-41d4-a716-446655440002', name: 'BBQ Sauce', price: 0.00, is_default: false, sort_order: 2 },
            { id: '850e8400-e29b-41d4-a716-446655440013', group_id: '750e8400-e29b-41d4-a716-446655440002', name: 'Ranch', price: 0.00, is_default: false, sort_order: 3 },
            { id: '850e8400-e29b-41d4-a716-446655440014', group_id: '750e8400-e29b-41d4-a716-446655440002', name: 'Buffalo Sauce', price: 0.00, is_default: false, sort_order: 4 },
            { id: '850e8400-e29b-41d4-a716-446655440015', group_id: '750e8400-e29b-41d4-a716-446655440002', name: 'Honey Mustard', price: 0.00, is_default: false, sort_order: 5 }
          ]
        }
      },
      {
        modifier_groups: {
          id: '750e8400-e29b-41d4-a716-446655440005',
          name: 'Drinks',
          is_required: true,
          max_selections: 1,
          min_selections: 1,
          modifier_items: [
            { id: '850e8400-e29b-41d4-a716-446655440041', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Coca Cola', price: 2.49, is_default: true, sort_order: 1 },
            { id: '850e8400-e29b-41d4-a716-446655440042', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Pepsi', price: 2.49, is_default: false, sort_order: 2 },
            { id: '850e8400-e29b-41d4-a716-446655440043', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Sprite', price: 2.49, is_default: false, sort_order: 3 },
            { id: '850e8400-e29b-41d4-a716-446655440044', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Orange Soda', price: 2.49, is_default: false, sort_order: 4 },
            { id: '850e8400-e29b-41d4-a716-446655440045', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Water', price: 1.99, is_default: false, sort_order: 5 }
          ]
        }
      }
    ]
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440021',
    name: 'Classic Philly Cheesesteak',
    description: 'Sliced ribeye with sautéed onions and melted provolone cheese',
    category: 'phillys',
    base_price: 13.99,
    is_available: true,
    sort_order: 1,
    menu_item_sizes: [
      { id: '650e8400-e29b-41d4-a716-446655440021', menu_item_id: '550e8400-e29b-41d4-a716-446655440021', name: '8 inch', price_modifier: 0.00, is_default: true, sort_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440022', menu_item_id: '550e8400-e29b-41d4-a716-446655440021', name: '12 inch', price_modifier: 3.00, is_default: false, sort_order: 2 }
    ],
    menu_item_modifier_groups: [
      {
        modifier_groups: {
          id: '750e8400-e29b-41d4-a716-446655440001',
          name: 'Sides',
          is_required: true,
          max_selections: 1,
          min_selections: 1,
          modifier_items: [
            { id: '850e8400-e29b-41d4-a716-446655440001', group_id: '750e8400-e29b-41d4-a716-446655440001', name: 'Crazy Fries', price: 3.99, is_default: true, sort_order: 1 },
            { id: '850e8400-e29b-41d4-a716-446655440002', group_id: '750e8400-e29b-41d4-a716-446655440001', name: 'Onion Rings', price: 4.49, is_default: false, sort_order: 2 },
            { id: '850e8400-e29b-41d4-a716-446655440003', group_id: '750e8400-e29b-41d4-a716-446655440001', name: 'Mozzarella Sticks', price: 5.99, is_default: false, sort_order: 3 },
            { id: '850e8400-e29b-41d4-a716-446655440004', group_id: '750e8400-e29b-41d4-a716-446655440001', name: 'Coleslaw', price: 2.99, is_default: false, sort_order: 4 }
          ]
        }
      },
      {
        modifier_groups: {
          id: '750e8400-e29b-41d4-a716-446655440003',
          name: 'Philly Toppings',
          is_required: false,
          max_selections: 10,
          min_selections: 0,
          modifier_items: [
            { id: '850e8400-e29b-41d4-a716-446655440021', group_id: '750e8400-e29b-41d4-a716-446655440003', name: 'Onions', price: 0.00, is_default: true, sort_order: 1 },
            { id: '850e8400-e29b-41d4-a716-446655440022', group_id: '750e8400-e29b-41d4-a716-446655440003', name: 'Bell Peppers', price: 0.00, is_default: true, sort_order: 2 },
            { id: '850e8400-e29b-41d4-a716-446655440023', group_id: '750e8400-e29b-41d4-a716-446655440003', name: 'Mushrooms', price: 0.50, is_default: false, sort_order: 3 },
            { id: '850e8400-e29b-41d4-a716-446655440024', group_id: '750e8400-e29b-41d4-a716-446655440003', name: 'Hot Peppers', price: 0.00, is_default: false, sort_order: 4 },
            { id: '850e8400-e29b-41d4-a716-446655440025', group_id: '750e8400-e29b-41d4-a716-446655440003', name: 'Lettuce', price: 0.00, is_default: false, sort_order: 5 },
            { id: '850e8400-e29b-41d4-a716-446655440026', group_id: '750e8400-e29b-41d4-a716-446655440003', name: 'Tomato', price: 0.00, is_default: false, sort_order: 6 }
          ]
        }
      },
      {
        modifier_groups: {
          id: '750e8400-e29b-41d4-a716-446655440004',
          name: 'Extra Cheese',
          is_required: false,
          max_selections: 1,
          min_selections: 0,
          modifier_items: [
            { id: '850e8400-e29b-41d4-a716-446655440031', group_id: '750e8400-e29b-41d4-a716-446655440004', name: 'Extra Cheese', price: 1.50, is_default: false, sort_order: 1 }
          ]
        }
      },
      {
        modifier_groups: {
          id: '750e8400-e29b-41d4-a716-446655440005',
          name: 'Drinks',
          is_required: true,
          max_selections: 1,
          min_selections: 1,
          modifier_items: [
            { id: '850e8400-e29b-41d4-a716-446655440041', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Coca Cola', price: 2.49, is_default: true, sort_order: 1 },
            { id: '850e8400-e29b-41d4-a716-446655440042', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Pepsi', price: 2.49, is_default: false, sort_order: 2 },
            { id: '850e8400-e29b-41d4-a716-446655440043', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Sprite', price: 2.49, is_default: false, sort_order: 3 },
            { id: '850e8400-e29b-41d4-a716-446655440044', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Orange Soda', price: 2.49, is_default: false, sort_order: 4 },
            { id: '850e8400-e29b-41d4-a716-446655440045', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Water', price: 1.99, is_default: false, sort_order: 5 }
          ]
        }
      }
    ]
  }
]

const businessSettings = {
  id: '550e8400-e29b-41d4-a716-446655440100',
  name: 'Crazy Chicken',
  phone: '(555) 123-CRAZY',
  email: 'info@crazychicken.com',
  address: '123 Food Street, City, State 12345',
  hours: {
    monday: { open: '11:00', close: '23:00', closed: false },
    tuesday: { open: '11:00', close: '23:00', closed: false },
    wednesday: { open: '11:00', close: '23:00', closed: false },
    thursday: { open: '11:00', close: '23:00', closed: false },
    friday: { open: '11:00', close: '23:00', closed: false },
    saturday: { open: '11:00', close: '23:00', closed: false },
    sunday: { open: '11:00', close: '23:00', closed: false }
  },
  is_accepting_orders: true,
  banner_enabled: true,
  banner_text: '🔥 Welcome to Crazy Chicken - Where Every Bite is Insanely Delicious! 🔥'
}

export async function GET() {
  try {
    // Filter only available items and sort by sort_order
    const availableItems = menuItems
      .filter(item => item.is_available)
      .sort((a, b) => a.sort_order - b.sort_order)

    return NextResponse.json({
      menuItems: availableItems,
      businessSettings
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 