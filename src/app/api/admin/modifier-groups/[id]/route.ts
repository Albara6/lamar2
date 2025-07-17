import { NextResponse } from 'next/server'

// Mock data for modifier groups (same as in the main route)
let modifierGroups = [
  {
    id: '1',
    name: 'Sides',
    is_required: true,
    max_selections: 1,
    min_selections: 1,
    sort_order: 1,
    modifier_items: [
      { id: '1', group_id: '1', name: 'Crazy Fries', price: 3.99, is_default: true, sort_order: 1 },
      { id: '2', group_id: '1', name: 'Onion Rings', price: 4.49, is_default: false, sort_order: 2 },
      { id: '3', group_id: '1', name: 'Mozzarella Sticks', price: 5.99, is_default: false, sort_order: 3 }
    ]
  },
  {
    id: '2',
    name: 'Sauces',
    is_required: false,
    max_selections: 3,
    min_selections: 0,
    sort_order: 2,
    modifier_items: [
      { id: '4', group_id: '2', name: 'Crazy Sauce', price: 0.00, is_default: false, sort_order: 1 },
      { id: '5', group_id: '2', name: 'BBQ Sauce', price: 0.00, is_default: false, sort_order: 2 },
      { id: '6', group_id: '2', name: 'Ranch', price: 0.00, is_default: false, sort_order: 3 },
      { id: '7', group_id: '2', name: 'Buffalo Sauce', price: 0.00, is_default: false, sort_order: 4 }
    ]
  },
  {
    id: '3',
    name: 'Drinks',
    is_required: true,
    max_selections: 1,
    min_selections: 1,
    sort_order: 3,
    modifier_items: [
      { id: '8', group_id: '3', name: 'Coca Cola', price: 2.49, is_default: true, sort_order: 1 },
      { id: '9', group_id: '3', name: 'Sprite', price: 2.49, is_default: false, sort_order: 2 },
      { id: '10', group_id: '3', name: 'Orange Soda', price: 2.49, is_default: false, sort_order: 3 },
      { id: '11', group_id: '3', name: 'Water', price: 1.99, is_default: false, sort_order: 4 }
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