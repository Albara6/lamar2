import { NextResponse } from 'next/server'

// Mock data for now - in production this would connect to your database
let menuItems = [
  {
    id: '1',
    name: 'Crazy Classic Burger',
    description: 'Our signature beef patty with lettuce, tomato, onion, pickles, and our crazy sauce',
    category: 'burgers',
    base_price: 12.99,
    is_available: true,
    sort_order: 1
  },
  {
    id: '2', 
    name: 'Buffalo Wings',
    description: 'Crispy chicken wings tossed in our buffalo sauce',
    category: 'chicken',
    base_price: 13.99,
    is_available: true,
    sort_order: 2
  },
  {
    id: '3',
    name: 'Classic Philly Cheesesteak', 
    description: 'Sliced ribeye with sautéed onions and melted provolone cheese',
    category: 'phillys',
    base_price: 13.99,
    is_available: true,
    sort_order: 3
  }
]

export async function GET() {
  try {
    return NextResponse.json({ menuItems })
  } catch (error) {
    console.error('Failed to fetch menu items:', error)
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const newItem = {
      id: Date.now().toString(),
      name: body.name,
      description: body.description,
      category: body.category,
      base_price: body.base_price,
      is_available: body.is_available,
      sort_order: body.sort_order || menuItems.length + 1
    }
    
    menuItems.push(newItem)
    
    return NextResponse.json({ menuItem: newItem })
  } catch (error) {
    console.error('Failed to create menu item:', error)
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
  }
} 