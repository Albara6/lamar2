import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Restaurant } from '@/types'

export async function GET(request: NextRequest) {
  try {
    // Fetch all restaurants with their basic info
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('is_accepting_orders', true)
      .order('name')

    if (error) {
      console.error('Error fetching restaurants:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch restaurants' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { restaurants }
    })
  } catch (error) {
    console.error('Error in restaurants API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 