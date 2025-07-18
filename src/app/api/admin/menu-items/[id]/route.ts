import { NextResponse } from 'next/server'

// This would normally import from a shared data store or database
// For now, we'll use the same mock data structure
let menuItems = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Crazy Classic Burger',
    description: 'Our signature beef patty with lettuce, tomato, onion, pickles, and our crazy sauce',
    category: 'burgers',
    base_price: 12.99,
    is_available: true,
    sort_order: 1
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002', 
    name: 'Buffalo Wings',
    description: 'Crispy chicken wings tossed in our buffalo sauce',
    category: 'chicken',
    base_price: 13.99,
    is_available: true,
    sort_order: 2
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Classic Philly Cheesesteak', 
    description: 'Sliced ribeye with sautéed onions and melted provolone cheese',
    category: 'phillys',
    base_price: 13.99,
    is_available: true,
    sort_order: 3
  }
]

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const itemIndex = menuItems.findIndex(item => item.id === params.id)
    
    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }
    
    menuItems[itemIndex] = {
      ...menuItems[itemIndex],
      name: body.name,
      description: body.description,
      category: body.category,
      base_price: body.base_price,
      is_available: body.is_available,
      sort_order: body.sort_order
    }
    
    return NextResponse.json({ menuItem: menuItems[itemIndex] })
  } catch (error) {
    console.error('Failed to update menu item:', error)
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const itemIndex = menuItems.findIndex(item => item.id === params.id)
    
    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }
    
    menuItems.splice(itemIndex, 1)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete menu item:', error)
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 })
  }
} 