import { NextResponse } from 'next/server'

// Mock data for modifier groups (same as in the main route)
let modifierGroups = [
  {
    id: '750e8400-e29b-41d4-a716-446655440001',
    name: 'Sides',
    is_required: true,
    max_selections: 1,
    min_selections: 1,
    sort_order: 1,
    modifier_items: [
      { id: '850e8400-e29b-41d4-a716-446655440001', group_id: '750e8400-e29b-41d4-a716-446655440001', name: 'Crazy Fries', price: 3.99, is_default: true, sort_order: 1 },
      { id: '850e8400-e29b-41d4-a716-446655440002', group_id: '750e8400-e29b-41d4-a716-446655440001', name: 'Onion Rings', price: 4.49, is_default: false, sort_order: 2 },
      { id: '850e8400-e29b-41d4-a716-446655440003', group_id: '750e8400-e29b-41d4-a716-446655440001', name: 'Mozzarella Sticks', price: 5.99, is_default: false, sort_order: 3 }
    ]
  },
  {
    id: '750e8400-e29b-41d4-a716-446655440002',
    name: 'Sauces',
    is_required: false,
    max_selections: 3,
    min_selections: 0,
    sort_order: 2,
    modifier_items: [
      { id: '850e8400-e29b-41d4-a716-446655440011', group_id: '750e8400-e29b-41d4-a716-446655440002', name: 'Crazy Sauce', price: 0.00, is_default: false, sort_order: 1 },
      { id: '850e8400-e29b-41d4-a716-446655440012', group_id: '750e8400-e29b-41d4-a716-446655440002', name: 'BBQ Sauce', price: 0.00, is_default: false, sort_order: 2 },
      { id: '850e8400-e29b-41d4-a716-446655440013', group_id: '750e8400-e29b-41d4-a716-446655440002', name: 'Ranch', price: 0.00, is_default: false, sort_order: 3 },
      { id: '850e8400-e29b-41d4-a716-446655440014', group_id: '750e8400-e29b-41d4-a716-446655440002', name: 'Buffalo Sauce', price: 0.00, is_default: false, sort_order: 4 }
    ]
  },
  {
    id: '750e8400-e29b-41d4-a716-446655440005',
    name: 'Drinks',
    is_required: true,
    max_selections: 1,
    min_selections: 1,
    sort_order: 3,
    modifier_items: [
      { id: '850e8400-e29b-41d4-a716-446655440041', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Coca Cola', price: 2.49, is_default: true, sort_order: 1 },
      { id: '850e8400-e29b-41d4-a716-446655440042', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Sprite', price: 2.49, is_default: false, sort_order: 2 },
      { id: '850e8400-e29b-41d4-a716-446655440043', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Orange Soda', price: 2.49, is_default: false, sort_order: 3 },
      { id: '850e8400-e29b-41d4-a716-446655440044', group_id: '750e8400-e29b-41d4-a716-446655440005', name: 'Water', price: 1.99, is_default: false, sort_order: 4 }
    ]
  }
]

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const groupIndex = modifierGroups.findIndex(group => group.id === params.id)
    
    if (groupIndex === -1) {
      return NextResponse.json({ error: 'Modifier group not found' }, { status: 404 })
    }
    
    modifierGroups[groupIndex] = {
      ...modifierGroups[groupIndex],
      name: body.name,
      is_required: body.is_required,
      max_selections: body.max_selections,
      min_selections: body.min_selections,
      sort_order: body.sort_order
    }
    
    return NextResponse.json({ modifierGroup: modifierGroups[groupIndex] })
  } catch (error) {
    console.error('Failed to update modifier group:', error)
    return NextResponse.json({ error: 'Failed to update modifier group' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const groupIndex = modifierGroups.findIndex(group => group.id === params.id)
    
    if (groupIndex === -1) {
      return NextResponse.json({ error: 'Modifier group not found' }, { status: 404 })
    }
    
    modifierGroups.splice(groupIndex, 1)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete modifier group:', error)
    return NextResponse.json({ error: 'Failed to delete modifier group' }, { status: 500 })
  }
} 