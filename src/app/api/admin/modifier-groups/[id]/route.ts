import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching for real-time modifier updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { data: modifierGroup, error } = await supabaseAdmin
      .from('modifier_groups')
      .update({
        name: body.name,
        is_required: body.is_required,
        max_selections: body.max_selections,
        min_selections: body.min_selections,
        sort_order: body.sort_order
      })
      .eq('id', params.id)
      .select(`
        *,
        modifier_items(*)
      `)
      .single()

    if (error || !modifierGroup) {
      console.error('Failed to update modifier group:', error)
      return NextResponse.json({ error: 'Failed to update modifier group' }, { status: 500 })
    }

    return NextResponse.json({ modifierGroup })
  } catch (error) {
    console.error('Failed to update modifier group:', error)
    return NextResponse.json({ error: 'Failed to update modifier group' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin
      .from('modifier_groups')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Failed to delete modifier group:', error)
      return NextResponse.json({ error: 'Failed to delete modifier group' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete modifier group:', error)
    return NextResponse.json({ error: 'Failed to delete modifier group' }, { status: 500 })
  }
} 