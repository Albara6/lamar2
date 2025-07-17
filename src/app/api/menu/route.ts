import { NextResponse } from 'next/server'

// Import the same mock data that the admin uses
const menuItems = [
  {
    id: '1',
    name: 'Crazy Classic Burger',
    description: 'Our signature beef patty with lettuce, tomato, onion, pickles, and our crazy sauce',
    category: 'burgers',
    base_price: 12.99,
    is_available: true,
    sort_order: 1,
    menu_item_sizes: [
      { id: '1', menu_item_id: '1', name: 'Regular', price_modifier: 0.00, is_default: true, sort_order: 1 },
      { id: '2', menu_item_id: '1', name: 'Large', price_modifier: 2.00, is_default: false, sort_order: 2 }
    ],
    menu_item_modifier_groups: [
      {
        modifier_groups: {
          id: '1',
          name: 'Sides',
          is_required: true,
          max_selections: 1,
          min_selections: 1,
          modifier_items: [
            { id: '1', group_id: '1', name: 'Crazy Fries', price: 3.99, is_default: true, sort_order: 1 },
            { id: '2', group_id: '1', name: 'Onion Rings', price: 4.49, is_default: false, sort_order: 2 },
            { id: '3', group_id: '1', name: 'Mozzarella Sticks', price: 5.99, is_default: false, sort_order: 3 }
          ]
        }
      },
      {
        modifier_groups: {
          id: '2',
          name: 'Sauces',
          is_required: false,
          max_selections: 3,
          min_selections: 0,
          modifier_items: [
            { id: '4', group_id: '2', name: 'Crazy Sauce', price: 0.00, is_default: false, sort_order: 1 },
            { id: '5', group_id: '2', name: 'BBQ Sauce', price: 0.00, is_default: false, sort_order: 2 },
            { id: '6', group_id: '2', name: 'Ranch', price: 0.00, is_default: false, sort_order: 3 }
          ]
        }
      },
      {
        modifier_groups: {
          id: '3',
          name: 'Drinks',
          is_required: true,
          max_selections: 1,
          min_selections: 1,
          modifier_items: [
            { id: '8', group_id: '3', name: 'Coca Cola', price: 2.49, is_default: true, sort_order: 1 },
            { id: '9', group_id: '3', name: 'Sprite', price: 2.49, is_default: false, sort_order: 2 },
            { id: '10', group_id: '3', name: 'Orange Soda', price: 2.49, is_default: false, sort_order: 3 },
            { id: '11', group_id: '3', name: 'Water', price: 1.99, is_default: false, sort_order: 4 }
          ]
        }
      }
    ]
  },
  {
    id: '2',
    name: 'Buffalo Wings',
    description: 'Crispy chicken wings tossed in our buffalo sauce',
    category: 'chicken',
    base_price: 13.99,
    is_available: true,
    sort_order: 2,
    menu_item_sizes: [
      { id: '3', menu_item_id: '2', name: '8 Wings', price_modifier: 0.00, is_default: true, sort_order: 1 },
      { id: '4', menu_item_id: '2', name: '12 Wings', price_modifier: 5.00, is_default: false, sort_order: 2 },
      { id: '5', menu_item_id: '2', name: '20 Wings', price_modifier: 10.00, is_default: false, sort_order: 3 }
    ],
    menu_item_modifier_groups: [
      {
        modifier_groups: {
          id: '1',
          name: 'Sides',
          is_required: true,
          max_selections: 1,
          min_selections: 1,
          modifier_items: [
            { id: '1', group_id: '1', name: 'Crazy Fries', price: 3.99, is_default: true, sort_order: 1 },
            { id: '2', group_id: '1', name: 'Onion Rings', price: 4.49, is_default: false, sort_order: 2 },
            { id: '3', group_id: '1', name: 'Mozzarella Sticks', price: 5.99, is_default: false, sort_order: 3 }
          ]
        }
      },
      {
        modifier_groups: {
          id: '2',
          name: 'Sauces',
          is_required: false,
          max_selections: 3,
          min_selections: 0,
          modifier_items: [
            { id: '4', group_id: '2', name: 'Crazy Sauce', price: 0.00, is_default: false, sort_order: 1 },
            { id: '5', group_id: '2', name: 'BBQ Sauce', price: 0.00, is_default: false, sort_order: 2 },
            { id: '6', group_id: '2', name: 'Ranch', price: 0.00, is_default: false, sort_order: 3 },
            { id: '7', group_id: '2', name: 'Buffalo Sauce', price: 0.00, is_default: false, sort_order: 4 }
          ]
        }
      },
      {
        modifier_groups: {
          id: '3',
          name: 'Drinks',
          is_required: true,
          max_selections: 1,
          min_selections: 1,
          modifier_items: [
            { id: '8', group_id: '3', name: 'Coca Cola', price: 2.49, is_default: true, sort_order: 1 },
            { id: '9', group_id: '3', name: 'Sprite', price: 2.49, is_default: false, sort_order: 2 },
            { id: '10', group_id: '3', name: 'Orange Soda', price: 2.49, is_default: false, sort_order: 3 },
            { id: '11', group_id: '3', name: 'Water', price: 1.99, is_default: false, sort_order: 4 }
          ]
        }
      }
    ]
  },
  {
    id: '3',
    name: 'Classic Philly Cheesesteak',
    description: 'Sliced ribeye with sautéed onions and melted provolone cheese',
    category: 'phillys',
    base_price: 13.99,
    is_available: true,
    sort_order: 3,
    menu_item_sizes: [
      { id: '6', menu_item_id: '3', name: '8 inch', price_modifier: 0.00, is_default: true, sort_order: 1 },
      { id: '7', menu_item_id: '3', name: '12 inch', price_modifier: 3.00, is_default: false, sort_order: 2 }
    ],
    menu_item_modifier_groups: [
      {
        modifier_groups: {
          id: '1',
          name: 'Sides',
          is_required: true,
          max_selections: 1,
          min_selections: 1,
          modifier_items: [
            { id: '1', group_id: '1', name: 'Crazy Fries', price: 3.99, is_default: true, sort_order: 1 },
            { id: '2', group_id: '1', name: 'Onion Rings', price: 4.49, is_default: false, sort_order: 2 },
            { id: '3', group_id: '1', name: 'Mozzarella Sticks', price: 5.99, is_default: false, sort_order: 3 }
          ]
        }
      },
      {
        modifier_groups: {
          id: '4',
          name: 'Philly Toppings',
          is_required: false,
          max_selections: 10,
          min_selections: 0,
          modifier_items: [
            { id: '12', group_id: '4', name: 'Onions', price: 0.00, is_default: true, sort_order: 1 },
            { id: '13', group_id: '4', name: 'Bell Peppers', price: 0.00, is_default: true, sort_order: 2 },
            { id: '14', group_id: '4', name: 'Mushrooms', price: 0.50, is_default: false, sort_order: 3 },
            { id: '15', group_id: '4', name: 'Hot Peppers', price: 0.00, is_default: false, sort_order: 4 }
          ]
        }
      },
      {
        modifier_groups: {
          id: '3',
          name: 'Drinks',
          is_required: true,
          max_selections: 1,
          min_selections: 1,
          modifier_items: [
            { id: '8', group_id: '3', name: 'Coca Cola', price: 2.49, is_default: true, sort_order: 1 },
            { id: '9', group_id: '3', name: 'Sprite', price: 2.49, is_default: false, sort_order: 2 },
            { id: '10', group_id: '3', name: 'Orange Soda', price: 2.49, is_default: false, sort_order: 3 },
            { id: '11', group_id: '3', name: 'Water', price: 1.99, is_default: false, sort_order: 4 }
          ]
        }
      }
    ]
  }
]

const businessSettings = {
  id: '1',
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