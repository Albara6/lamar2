import { NextResponse } from 'next/server'

// Mock data for business settings
let businessSettings = {
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
    return NextResponse.json({ businessSettings })
  } catch (error) {
    console.error('Failed to fetch business settings:', error)
    return NextResponse.json({ error: 'Failed to fetch business settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    
    // Update business settings
    businessSettings = {
      ...businessSettings,
      ...body
    }
    
    return NextResponse.json({ businessSettings })
  } catch (error) {
    console.error('Failed to update business settings:', error)
    return NextResponse.json({ error: 'Failed to update business settings' }, { status: 500 })
  }
} 