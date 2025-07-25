import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering to prevent caching for real-time category updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Failed to fetch categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    const response = NextResponse.json({ categories: categories || [] })
    
    // Add aggressive cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .insert({
        id: body.id,
        name: body.name,
        // ADD: only include image fields if provided to maintain compatibility with older DB schema
        ...(body.image_url ? { image_url: body.image_url } : {}),
        ...(body.image_storage_url ? { image_storage_url: body.image_storage_url } : {}),
        display_order: body.display_order || 0
      })
      .select()
      .single()

    if (error || !category) {
      console.error('Failed to create category:', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    const response = NextResponse.json({ category })
    
    // Add aggressive cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Failed to create category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    
    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update({
        name: body.name,
        // ADD: only include image fields if provided
        ...(body.image_url ? { image_url: body.image_url } : {}),
        ...(body.image_storage_url ? { image_storage_url: body.image_storage_url } : {}),
        display_order: body.display_order
      })
      .eq('id', body.id)
      .select()
      .single()

    if (error || !category) {
      console.error('Failed to update category:', error)
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }

    const response = NextResponse.json({ category })
    
    // Add aggressive cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Failed to update category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', body.id)

    if (error) {
      console.error('Failed to delete category:', error)
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }

    const response = NextResponse.json({ success: true })
    
    // Add aggressive cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Failed to delete category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
} 