import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/customer/orders
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get orders with items and modifiers
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          menu_item:menu_items(*),
          menu_item_size:menu_item_sizes(*),
          order_item_modifiers(
            *,
            modifier_item:modifier_items(*)
          )
        )
      `)
      .eq('customer_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    return NextResponse.json({ orders })
  } catch (e) {
    console.error('Orders route error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 