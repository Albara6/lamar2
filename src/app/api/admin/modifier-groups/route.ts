import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching for real-time modifier updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const { data: modifierGroups, error } = await supabaseAdmin
      .from('modifier_groups')
      .select(`
        *,
        modifier_items(*)
      `)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Failed to fetch modifier groups:', error)
      return NextResponse.json({ error: 'Failed to fetch modifier groups' }, { status: 500 })
    }

    return NextResponse.json({ modifierGroups: modifierGroups || [] })
  } catch (error) {
    console.error('Failed to fetch modifier groups:', error)
    return NextResponse.json({ error: 'Failed to fetch modifier groups' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { data: modifierGroup, error } = await supabaseAdmin
      .from('modifier_groups')
      .insert({
        name: body.name,
        is_required: body.is_required,
        max_selections: body.max_selections,
        min_selections: body.min_selections,
        sort_order: body.sort_order || 0
      })
      .select()
      .single()

    if (error || !modifierGroup) {
      console.error('Failed to create modifier group:', error)
      return NextResponse.json({ error: 'Failed to create modifier group' }, { status: 500 })
    }

    // Add empty modifier_items array for consistency
    const groupWithItems = {
      ...modifierGroup,
      modifier_items: []
    }
    
    return NextResponse.json({ modifierGroup: groupWithItems })
  } catch (error) {
    console.error('Failed to create modifier group:', error)
    return NextResponse.json({ error: 'Failed to create modifier group' }, { status: 500 })
  }
} 