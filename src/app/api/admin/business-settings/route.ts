import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching for real-time settings updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const { data: businessSettings, error } = await supabaseAdmin
      .from('business_settings')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      console.error('Failed to fetch business settings:', error)
      return NextResponse.json({ error: 'Failed to fetch business settings' }, { status: 500 })
    }

    return NextResponse.json({ businessSettings })
  } catch (error) {
    console.error('Failed to fetch business settings:', error)
    return NextResponse.json({ error: 'Failed to fetch business settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    
    // Update business settings - since there should only be one record, update the first one
    const { data: businessSettings, error } = await supabaseAdmin
      .from('business_settings')
      .update({
        name: body.name,
        phone: body.phone,
        email: body.email,
        address: body.address,
        hours: body.hours,
        is_accepting_orders: body.is_accepting_orders,
        banner_enabled: body.banner_enabled,
        banner_text: body.banner_text
      })
      .limit(1)
      .select()
      .single()

    if (error) {
      console.error('Failed to update business settings:', error)
      return NextResponse.json({ error: 'Failed to update business settings' }, { status: 500 })
    }
    
    return NextResponse.json({ businessSettings })
  } catch (error) {
    console.error('Failed to update business settings:', error)
    return NextResponse.json({ error: 'Failed to update business settings' }, { status: 500 })
  }
} 