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
    
    // First get the existing business settings record to get the ID
    const { data: existingSettings, error: fetchError } = await supabaseAdmin
      .from('business_settings')
      .select('id')
      .single()

    if (fetchError) {
      console.error('Failed to fetch existing business settings:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch existing business settings' }, { status: 500 })
    }

    // Update business settings using the specific ID
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
      .eq('id', existingSettings.id)
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